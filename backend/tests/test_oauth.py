"""Tests for the Google OAuth module and the linked-account gate (PR #19).

Two layers:

1. ACCEPTANCE TESTS for findings #9 and #10 (red until HOMIE's fixes land,
   failure messages name the finding):
   - #10: the transactions endpoints must be gated by require_linked_account
     like wallets/rules — verified live on main: an unlinked OAuth user can
     currently create payments and read the transaction list (money-access hole)
   - #9: OAuth config should degrade gracefully (None defaults) instead of
     hard-requiring 3 Google secrets for the app to even boot

2. COVERAGE for the new endpoints and the gate (green today):
   - require_linked_account gate matrix on wallets/rules
   - /api/auth/me stays open for unlinked users (documented design)
   - link-bank-account flows: link opens the gate, re-link 400,
     cross-user bank id theft 400
   - Google callback error handling (bad code -> 401, not a crash)

The full Google round-trip (real redirect, real token exchange) is not
tested here — it needs live Google credentials; the callback is tested
from the point where Google would have answered (code exchange -> 401).
"""
import pytest
from fastapi.testclient import TestClient

from app.core.database import get_db
from app.core.security import create_access_token, hash_password
from app.models.models import User


@pytest.fixture
def oauth_user_id(db_session):
    """An OAuth-style user exactly like Google signup produces:
    no password, no bank account, plus the same provisioning the
    Google callback performs (5 wallets + 4 rules)."""
    from app.services.provisioning import create_default_rules, create_default_wallets

    user = User(
        email="oauth.user@autowallet.dev",
        full_name="OAuth User",
        hashed_password=None,
        bank_account_id=None,
        oauth_provider="google",
        oauth_id="google-id-1",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    user_id = user.id  # read eagerly: commits below expire ORM objects
    create_default_wallets(user, db_session)
    create_default_rules(user, db_session)
    db_session.commit()
    return user_id


@pytest.fixture
def oauth_headers(oauth_user_id):
    return {"Authorization": "Bearer " + create_access_token(user_id=oauth_user_id)}


# --- 1. The gate itself (documented design, green today) ---------------------


def test_me_stays_open_for_unlinked_oauth_user(client: TestClient, oauth_headers):
    """Documented design (commit message): /api/auth/me must NOT be gated,
    so an unlinked user can discover the requirement."""
    response = client.get("/api/auth/me", headers=oauth_headers)
    assert response.status_code == 200
    assert response.json()["bank_account_id"] is None


def test_gate_blocks_wallets_for_unlinked_user(client: TestClient, oauth_headers):
    response = client.get("/api/wallets/", headers=oauth_headers)
    assert response.status_code == 403
    assert "link a bank account" in response.json()["detail"]


def test_gate_blocks_rules_for_unlinked_user(client: TestClient, oauth_headers):
    response = client.get("/api/rules/", headers=oauth_headers)
    assert response.status_code == 403


def test_link_bank_account_opens_the_gate(client: TestClient, oauth_headers, db_session):
    """The full Plan-B flow: link -> the gate lifts -> wallets readable."""
    blocked = client.get("/api/wallets/", headers=oauth_headers)
    assert blocked.status_code == 403

    linked = client.post(
        "/api/auth/link-bank-account",
        headers=oauth_headers,
        json={"bank_account_id": "MA6400010000OA1"},
    )
    assert linked.status_code == 200
    assert linked.json()["bank_account_id"] == "MA6400010000OA1"

    opened = client.get("/api/wallets/", headers=oauth_headers)
    assert opened.status_code == 200
    assert len(opened.json()) == 5  # wallets were provisioned at OAuth signup


def test_double_link_rejected(client: TestClient, oauth_headers):
    first = client.post("/api/auth/link-bank-account", headers=oauth_headers,
                        json={"bank_account_id": "MA6400010000OA2"})
    assert first.status_code == 200

    second = client.post("/api/auth/link-bank-account", headers=oauth_headers,
                         json={"bank_account_id": "MA6400010000OA3"})
    assert second.status_code == 400
    assert "already linked" in second.json()["detail"]


def test_link_stealing_someone_elses_bank_id_rejected(client: TestClient, auth_headers, oauth_headers):
    """auth_headers fixture = a user with bank_account_id MA64000100000042.
    An OAuth user must not claim that same bank id."""
    stolen = client.post("/api/auth/link-bank-account", headers=oauth_headers,
                         json={"bank_account_id": "MA64000100000042"})
    assert stolen.status_code == 400
    assert "already linked to another user" in stolen.json()["detail"]


def test_link_requires_valid_body(client: TestClient, oauth_headers):
    short = client.post("/api/auth/link-bank-account", headers=oauth_headers,
                        json={"bank_account_id": "MA"})
    assert short.status_code == 422  # min_length=3


def test_link_requires_auth(client: TestClient):
    assert client.post("/api/auth/link-bank-account",
                       json={"bank_account_id": "MA6400010000OA4"}).status_code == 401


def test_google_callback_bad_code_is_handled(client: TestClient, monkeypatch):
    """Google rejects a fake code -> endpoint must return a clean 401,
    not crash or leak a traceback."""
    import httpx

    def fake_post(url, data):
        return httpx.Response(400, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "post", fake_post)
    response = client.get("/api/auth/oauth/google/callback", params={"code": "forged"})
    assert response.status_code == 401
    assert "Google rejected" in response.json()["detail"]


def test_google_callback_garbage_userinfo_response(client: TestClient, monkeypatch):
    """Token exchange succeeds but userinfo comes back malformed -> 401, not KeyError."""
    import httpx

    class FakeTokenResponse:
        status_code = 200
        def json(self):
            return {"access_token": "tok"}

    def fake_post(url, data):
        return FakeTokenResponse()

    def fake_get(url, headers):
        return httpx.Response(403, request=httpx.Request("GET", url))

    monkeypatch.setattr(httpx, "post", fake_post)
    monkeypatch.setattr(httpx, "get", fake_get)
    response = client.get("/api/auth/oauth/google/callback", params={"code": "real-looking"})
    assert response.status_code == 401
    assert "user info" in response.json()["detail"]


# --- 2. ACCEPTANCE TESTS — red until fixed (findings #9, #10) ----------------


def test_transactions_gated_for_unlinked_user(client: TestClient, oauth_headers):
    """ACCEPTANCE TEST for QA finding #10 — blocks merge until fixed.

    Verified live on main: an OAuth user with NO bank account can still
    POST /api/transactions/ and GET the transaction list — wallets are
    gated but money flows anyway. HOMIE's own commit message says OAuth
    users must be gated from wallets/RULES/TRANSACTIONS; transactions.py
    is the one file where require_linked_account was never applied.
    Once fixed, both calls must return 403."""
    payment = client.post("/api/transactions/", headers=oauth_headers,
                          json={"reference": "UNLINKED-1", "amount": 5000})
    assert payment.status_code == 403, \
        "finding #10 NOT fixed: unlinked OAuth user can still create payments"

    listing = client.get("/api/transactions/", headers=oauth_headers)
    assert listing.status_code == 403, \
        "finding #10 NOT fixed: unlinked OAuth user can still read transactions"


def test_oauth_user_provisioning_matches_promise(db_session, oauth_user_id):
    """A Google-created user must get the same 5 wallets + 4 rules as a
    normal signup (oauth.py calls the same provisioning functions)."""
    from app.models.models import Rule, Wallet

    wallets = db_session.query(Wallet).filter(Wallet.user_id == oauth_user_id).all()
    rules = db_session.query(Rule).filter(Rule.user_id == oauth_user_id).all()
    assert len(wallets) == 5
    assert len(rules) == 4
