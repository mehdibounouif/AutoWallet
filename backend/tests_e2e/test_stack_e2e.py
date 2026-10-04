"""STACK e2e — backend + REAL database + REAL authorization service, chained.

Run AFTER `docker compose up -d --wait` (the healthchecks gate startup).
Uses: real HTTP (httpx) for the API, `docker compose exec psql` for the
database (postgres is an internal service — no host port, by design).

The session chains one real user through the whole story:
    register -> [DB: user + 5 wallets + 4 rules exist]
    login    -> [token decodes with role claim]
    guarded  -> [authorization service grants -> 200]
    payment  -> [DB: transaction processed + the exact envelope split]
    misuse   -> [duplicate rejected, wrong password uniform]
"""
import pytest

import jwt  # PyJWT — the backend's own library

# tests_e2e is NOT a package (no __init__.py) — pytest puts this directory
# on sys.path, so the conftest helpers import directly.
from conftest import psql

# The board's canonical payment, one more time — but this time it must
# survive: real redis lock, real rule engine, real postgres, real rows.
# The REFERENCE must be unique per RUN: the postgres data persists across
# runs, so a static reference would collide with the duplicate-rejection
# check on the suite's SECOND execution.
def canonical_reference(unique_email: str) -> str:
    return "E2E-" + unique_email.split("@")[0].split("-")[1].upper()


def test_stack_is_healthy(api: httpx.Client):
    """SCENARIO: compose was started with --wait. Double-check from here.
    EXPECTED: /health 200 with the ok status."""
    r = api.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_register_persisted_to_the_real_database(api, token, unique_email):
    """SCENARIO: the session user was registered (fixture).
    EXPECTED: the user row EXISTS in the real postgres, with exactly
              5 wallets + 4 rules — provisioning parity, in the DB.
    NOTE: this test takes `token` on purpose — the fixture CHAIN is the
    execution order: token requests register+login, so by the time this
    test runs, the register has happened. Without it, this test would
    run BEFORE any register existed and lie about an empty database."""
    rows = psql(f"SELECT email FROM users WHERE email = '{unique_email}'")
    assert rows and rows[0][0] == unique_email, "user not in the real database"

    uid = psql(f"SELECT id FROM users WHERE email = '{unique_email}'")[0][0]
    wallets = psql(f"SELECT COUNT(*) FROM wallets WHERE user_id = '{uid}'")
    rules = psql(f"SELECT COUNT(*) FROM rules WHERE user_id = '{uid}'")
    assert wallets[0][0] == "5", f"expected 5 wallets in DB, got {wallets}"
    assert rules[0][0] == "4", f"expected 4 rules in DB, got {rules}"


def test_login_token_carries_the_role_claim(api, token):
    """SCENARIO: the real login token (fixture).
    EXPECTED: decoding with the running backend's secret shows the role
              claim present — finding #12's fix, proven on the wire."""
    secret = None
    for line in open("../.env", encoding="utf-8"):
        if line.startswith("SECRET_KEY="):
            secret = line.strip().split("=", 1)[1]
    # CI note: the CI job exports SECRET_KEY from the copied .env — read
    # env as fallback.
    secret = secret or __import__("os").environ["SECRET_KEY"]
    payload = jwt.decode(token, secret, algorithms=["HS256"])
    assert payload.get("role") == "user", f"role claim missing: {payload}"
    assert payload.get("sub")


def test_guarded_endpoint_through_the_real_authorization_service(api, token):
    """SCENARIO: GET /api/wallets/ with the real token.
    EXPECTED: 200 — this request crossed require_client -> the REAL
              authorization container -> authenticate + hasPermission.
              A 503 here means the auth hop is broken; 403 means the
              role/permission contract broke."""
    r = api.get("/api/wallets/", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, f"{r.status_code} {r.text[:120]}"
    assert len(r.json()) == 5


def test_payment_processed_through_the_real_stack(api, token, unique_email):
    """SCENARIO: the canonical 8,500 payment over real HTTP — real redis
              lock, real rule engine, real postgres.
    EXPECTED: 201 "processed"; the DATABASE holds the transaction and the
              EXACT envelope split (rent 3500 / tax 750 / savings 637.50 /
              free 3612.50 / main 0)."""
    reference = canonical_reference(unique_email)
    r = api.post("/api/transactions/", headers={"Authorization": f"Bearer {token}"},
                 json={"reference": reference, "amount": 8500})
    assert r.status_code == 201, f"{r.status_code} {r.text[:200]}"
    assert r.json()["status"] == "processed"

    tx = psql(f"SELECT status, amount FROM transactions WHERE reference = '{reference}'")
    assert tx and tx[0][0] == "processed" and float(tx[0][1]) == 8500.0

    uid = psql(f"SELECT id FROM users WHERE email = '{unique_email}'")[0][0]
    balances = {w: float(b) for w, b in psql(
        f"SELECT wallet_type, balance FROM wallets WHERE user_id = '{uid}'")}
    assert balances["rent"] == 3500.0
    assert balances["tax"] == 750.0
    assert balances["savings"] == 637.5
    assert balances["free"] == 3612.5
    assert balances["main"] == 0.0


def test_duplicate_reference_rejected_in_the_real_stack(api, token, unique_email):
    """SCENARIO: the same payment reference again.
    EXPECTED: 400 'already exists' — the money-safety guarantee across
              the real redis + postgres stack."""
    reference = canonical_reference(unique_email)
    r = api.post("/api/transactions/", headers={"Authorization": f"Bearer {token}"},
                 json={"reference": reference, "amount": 8500})
    assert r.status_code == 400
    assert "already exists" in r.json()["detail"]


def test_wrong_password_rejected_uniformly(api, unique_email):
    """SCENARIO: login with a wrong password.
    EXPECTED: 401 — and unknown email gives the SAME message
              (anti-enumeration), through the REAL backend."""
    wrong = api.post("/api/auth/login",
                     json={"email": unique_email, "password": "WrongPassword999!"})
    ghost = api.post("/api/auth/login",
                     json={"email": "ghost-e2e@autowallet.dev", "password": "Whatever123!"})
    assert wrong.status_code == 401
    assert ghost.status_code == 401
    assert wrong.json()["detail"] == ghost.json()["detail"]
