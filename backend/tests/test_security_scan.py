"""Backend acceptance tests for the full-source security scan (QA, 2026-10-19).

Findings are numbered S1-S3 (the scan series — distinct from the earlier
#N review series). House conventions apply (see tests/TESTS.md §4):

- Each test asserts the DESIRED (post-fix) behavior and is xfail-strict
  while its finding is open — the suite stays green, and the test XPASSes
  (turning the suite RED on purpose) the moment the fix lands.
- Reason text names the finding, the owner and the exact fix location.
- Tests are self-contained: they register their OWN throwaway users so a
  currently-broken behavior (e.g. an Infinity amount poisoning wallets)
  can never leak into other tests through the session-scoped database.
"""

import uuid

import pytest
from fastapi.testclient import TestClient


def _register_and_login(client: TestClient, password: str) -> dict:
    """Create a throwaway verified-enough user and return auth headers."""
    suffix = uuid.uuid4().hex[:12]
    email = f"scan-{suffix}@autowallet.dev"
    payload = {
        "full_name": "Scan User",
        "email": email,
        "password": password,
        "bank_account_id": f"scan-{suffix}",
    }
    registered = client.post("/api/auth/register", json=payload)
    assert registered.status_code == 201, registered.text

    logged_in = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert logged_in.status_code == 200, logged_in.text
    return {"Authorization": f"Bearer {logged_in.json()['access_token']}"}


# ---------------------------------------------------------------------------
# Finding S1 — transaction amounts must be FINITE numbers
# ---------------------------------------------------------------------------

@pytest.mark.xfail(
    strict=True,
    reason="finding S1 (owner: MEHDI): the transaction amount is validated "
           "with `gt=0` only (app/api/schemas.py TransactionCreate) — "
           "`Infinity` passes that check, is stored as the transaction "
           "amount, and poisons the wallet balance permanently "
           "(inf + anything stays inf). Fix: constrain the amount to a "
           "finite range (e.g. `Field(gt=0, allow_inf_nan=False)` plus a "
           "sane upper bound).",
)
def test_a_transaction_amount_must_be_a_finite_number(client: TestClient):
    """SCENARIO:   a client POSTs a transaction with amount = Infinity
                (Python's json accepts the literal — a browser can too).
    EXPECTED:   the request is refused with 422 — an infinite amount must
                never reach the ledger."""
    headers = _register_and_login(client, "SuperSecret1337!")

    response = client.post(
        "/api/transactions/",
        headers=headers,
        json={"reference": f"inf-{uuid.uuid4().hex[:8]}", "amount": float("inf")},
    )

    assert response.status_code == 422, (
        "finding S1: an Infinite amount was accepted "
        f"({response.status_code}) — the wallet balance is now poisoned"
    )


# ---------------------------------------------------------------------------
# Finding S2 — the password-reset contract is missing on the backend
# ---------------------------------------------------------------------------

@pytest.mark.xfail(
    strict=True,
    reason="finding S2 (owner: MEHDI): the frontend's password recovery "
           "posts to /api/auth/password/forgot "
           "(ForgotPasswordCard.tsx:33) and /api/auth/password/reset "
           "(ResetPasswordCard.tsx:41) — neither endpoint exists in the "
           "backend, and the config keys frontend_password_reset_url / "
           "password_reset_ttl_seconds are dead. A user who forgets the "
           "password is locked out permanently. Fix: implement both "
           "endpoints (generic 200/202 on forgot; token-bound reset).",
)
def test_the_password_reset_contract_exists(client: TestClient):
    """SCENARIO:   the frontend's forgot-password flow, exactly as the two
                cards send it.
    EXPECTED:   both endpoints exist and route — any real answer (200/202
                for forgot; 400/401/422 for a garbage reset token) counts,
                only 404/405 means the contract is missing."""
    forgot = client.post(
        "/api/auth/password/forgot",
        json={"email": "nobody@autowallet.dev"},
    )
    assert forgot.status_code not in (404, 405), (
        "finding S2: /api/auth/password/forgot does not exist "
        f"({forgot.status_code}) — the frontend's recovery flow is dead"
    )

    reset = client.post(
        "/api/auth/password/reset",
        json={"password": "NewSecret1337!", "token": "not-a-real-token"},
    )
    assert reset.status_code not in (404, 405), (
        "finding S2: /api/auth/password/reset does not exist "
        f"({reset.status_code}) — the frontend's recovery flow is dead"
    )


# ---------------------------------------------------------------------------
# Finding S3 — passwords longer than 72 bytes are silently truncated
# ---------------------------------------------------------------------------

@pytest.mark.xfail(
    strict=True,
    reason="finding S3 (owner: MEHDI): bcrypt truncates passwords at 72 "
           "bytes (verified: passlib 1.7.4 + bcrypt 4.0.1) and "
           "UserRegister.password has no upper bound — two DIFFERENT "
           "passwords sharing their first 72 bytes are the same credential. "
           "Fix: cap the password length (`Field(max_length=72)`) so the "
           "truncation can never create a collision.",
)
def test_long_passwords_do_not_collide_via_truncation(client: TestClient):
    """SCENARIO:   a user registers with a 100-character password; later, a
                login arrives with the FIRST 72 bytes identical and a
                different tail (a different password by every definition).
    EXPECTED:   that different password must NOT authenticate. It is
                acceptable for registration to reject >72-byte passwords
                outright (422) — that is the recommended fix too."""
    email = f"trunc-{uuid.uuid4().hex[:12]}@autowallet.dev"
    long_password = "a" * 100

    registered = client.post(
        "/api/auth/register",
        json={
            "full_name": "Trunc User",
            "email": email,
            "password": long_password,
            "bank_account_id": f"trunc-{uuid.uuid4().hex[:12]}",
        },
    )

    if registered.status_code == 422:
        return  # rejected outright — the collision is impossible

    assert registered.status_code == 201, registered.text

    variant = client.post(
        "/api/auth/login",
        json={"email": email, "password": "a" * 72 + "B" * 28},
    )
    assert variant.status_code != 200, (
        "finding S3: a different password sharing the first 72 bytes "
        "authenticated — bcrypt truncation made them the same credential"
    )
