"""Tests for the Google OAuth module and the linked-account gate (PR #19).

Sections:
    1. Gate & link flows       (green: the documented design works today)
    2. Google callback errors  (green: hostile inputs end in clean 401s)
    3. Acceptance tests        (finding #10 legs; xfail-strict while open)
    4. Provisioning parity     (OAuth signup promises the same 5+4)

Report-only findings referenced below (owners hold the fixes):
    #9   OAuth config hard-requires 3 Google secrets — verified live via
         the compose boot crash; no automated test here (it is a
         config-boot behavior, not an endpoint).
    #10  transactions must be gated by require_linked_account like
         wallets/rules are — POST leg FIXED, GET leg REOPENED (see §3).

The full Google round-trip (real redirect, real token exchange) is not
tested here — it needs live Google credentials; the callback is tested
from the point where Google would have answered (code exchange -> 401).
"""
import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token
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


# ---------------------------------------------------------------------------
# 1. GATE & LINK FLOWS — the documented design, green today
# ---------------------------------------------------------------------------


def test_me_stays_open_for_unlinked_oauth_user(client: TestClient, oauth_headers):
    """SCENARIO:   an unlinked OAuth user opens /api/auth/me.
    EXPECTED:   200 with bank_account_id None — /me is deliberately NOT
                gated, so the user can discover the linking requirement."""
    response = client.get("/api/auth/me", headers=oauth_headers)

    assert response.status_code == 200
    assert response.json()["bank_account_id"] is None


def test_gate_blocks_wallets_for_unlinked_user(client: TestClient, oauth_headers):
    """SCENARIO:   an unlinked OAuth user lists wallets.
    EXPECTED:   403 with a detail message pointing at the link flow."""
    response = client.get("/api/wallets/", headers=oauth_headers)

    assert response.status_code == 403
    assert "link a bank account" in response.json()["detail"]


def test_gate_blocks_rules_for_unlinked_user(client: TestClient, oauth_headers):
    """SCENARIO:   an unlinked OAuth user lists rules.
    EXPECTED:   403 (same gate as wallets)."""
    response = client.get("/api/rules/", headers=oauth_headers)

    assert response.status_code == 403


def test_link_bank_account_opens_the_gate(client: TestClient, oauth_headers, db_session):
    """SCENARIO:   the full Plan-B flow — link a bank account, then retry
                the previously blocked endpoint.
    EXPECTED:   403 before linking; 200 after; the linked id is echoed;
                the 5 provisioned wallets are readable."""
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
    """SCENARIO:   linking a second bank account after one is already set.
    EXPECTED:   first link 200, second attempt 400 "already linked"."""
    first = client.post("/api/auth/link-bank-account", headers=oauth_headers,
                        json={"bank_account_id": "MA6400010000OA2"})
    assert first.status_code == 200

    second = client.post("/api/auth/link-bank-account", headers=oauth_headers,
                         json={"bank_account_id": "MA6400010000OA3"})

    assert second.status_code == 400
    assert "already linked" in second.json()["detail"]


def test_link_stealing_someone_elses_bank_id_rejected(
    client, auth_headers, oauth_headers
):
    """SCENARIO:   an OAuth user claims a bank_account_id ALREADY owned by
                another user (auth_headers fixture: MA64000100000042).
    EXPECTED:   400 "already linked to another user" — no account theft."""
    stolen = client.post("/api/auth/link-bank-account", headers=oauth_headers,
                         json={"bank_account_id": "MA64000100000042"})

    assert stolen.status_code == 400
    assert "already linked to another user" in stolen.json()["detail"]


def test_link_requires_valid_body(client: TestClient, oauth_headers):
    """SCENARIO:   linking with a too-short bank id ("MA").
    EXPECTED:   422 (min_length=3 validation)."""
    response = client.post("/api/auth/link-bank-account", headers=oauth_headers,
                           json={"bank_account_id": "MA"})

    assert response.status_code == 422


def test_link_requires_auth(client: TestClient):
    """SCENARIO:   linking with no Authorization header.
    EXPECTED:   401."""
    response = client.post("/api/auth/link-bank-account",
                           json={"bank_account_id": "MA6400010000OA4"})

    assert response.status_code == 401


# ---------------------------------------------------------------------------
# 2. GOOGLE CALLBACK ERRORS — hostile inputs end in clean 401s
# ---------------------------------------------------------------------------


def test_google_callback_bad_code_is_handled(client: TestClient, monkeypatch):
    """SCENARIO:   Google rejects the forged code (400 at token exchange).
    EXPECTED:   a clean 401 "Google rejected ..." — no crash, no traceback."""
    import httpx

    def fake_post(url, data):
        return httpx.Response(400, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "post", fake_post)
    response = client.get("/api/auth/oauth/google/callback", params={"code": "forged"})

    assert response.status_code == 401
    assert "Google rejected" in response.json()["detail"]


def test_google_callback_garbage_userinfo_response(client: TestClient, monkeypatch):
    """SCENARIO:   token exchange SUCCEEDS but the userinfo call comes back
                hostile (403/malformed).
    EXPECTED:   a clean 401 mentioning "user info" — not a KeyError/500."""
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


# ---------------------------------------------------------------------------
# 3. ACCEPTANCE TESTS — finding #10, one test per leg (owner: HOMIE)
# ---------------------------------------------------------------------------


def test_transactions_gated_for_unlinked_user(client: TestClient, oauth_headers):
    """SCENARIO:   an unlinked OAuth user POSTs a payment.
    EXPECTED:   403 — the POST leg of finding #10, VERIFIED FIXED
                (HOMIE added require_linked_account to create_transaction)."""
    payment = client.post("/api/transactions/", headers=oauth_headers,
                          json={"reference": "UNLINKED-1", "amount": 5000})

    assert payment.status_code == 403, \
        "finding #10 NOT fixed: unlinked OAuth user can still create payments"


@pytest.mark.xfail(
    strict=True,
    reason=(
        "finding #10 REOPENED — fix was partial (owner: HOMIE): "
        "require_linked_account was added to create_transaction "
        "(app/api/transactions.py:23) but NOT to list_transactions "
        "(app/api/transactions.py:38, still plain get_current_user), so an "
        "unlinked OAuth user can still READ the transaction list (200 vs 403). "
        "Unmasked by the authorization-service seam: pre-seam this leg failed "
        "with 503-outage and was indistinguishable from the fixed legs. "
        "Flips to XPASS when require_linked_account lands on list_transactions."
    ),
)
def test_transaction_list_gated_for_unlinked_user(client: TestClient, oauth_headers):
    """SCENARIO:   an unlinked OAuth user GETs the transaction list.
    EXPECTED:   403 — the GET leg of finding #10. wallets.py and rules.py
                gate their list endpoints; transactions.py must match.
                Fails today (200) because list_transactions is ungated;
                xfail-strict keeps the suite green while the bug is open."""
    listing = client.get("/api/transactions/", headers=oauth_headers)

    assert listing.status_code == 403, \
        "finding #10 REOPENED: unlinked OAuth user can still read transactions"


# ---------------------------------------------------------------------------
# 4. PROVISIONING PARITY — OAuth signup promises the same 5 + 4
# ---------------------------------------------------------------------------


def test_oauth_user_provisioning_matches_promise(db_session, oauth_user_id):
    """SCENARIO:   a user created via the Google OAuth path.
    EXPECTED:   the DB holds the same 5 wallets + 4 rules a normal signup
                gets (oauth.py calls the same provisioning functions)."""
    from app.models.models import Rule, Wallet

    wallets = db_session.query(Wallet).filter(Wallet.user_id == oauth_user_id).all()
    rules = db_session.query(Rule).filter(Rule.user_id == oauth_user_id).all()
    assert len(wallets) == 5
    assert len(rules) == 4
