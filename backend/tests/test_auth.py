"""Tests for the authentication endpoints: register, login, /me, and 2FA."""
import pyotp
from fastapi.testclient import TestClient

from app.models.models import Rule, User, Wallet


def register_payload(
    email="new.user@autowallet.dev",
    bank_account_id="MA64000100009999",
    password="SuperSecret1337!",
):
    """Build a valid registration body; tests override the unique fields."""
    return {
        "full_name": "New User",
        "email": email,
        "password": password,
        "bank_account_id": bank_account_id,
    }


def test_register_new_user(client: TestClient):
    response = client.post("/api/auth/register", json=register_payload())
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new.user@autowallet.dev"
    assert data["full_name"] == "New User"
    assert "id" in data


def test_register_response_leaks_no_password(client: TestClient):
    response = client.post("/api/auth/register", json=register_payload())
    assert response.status_code == 201
    assert "password" not in response.json()
    assert "hashed_password" not in response.json()


def test_register_duplicate_email_fails(client: TestClient):
    payload = register_payload(email="dup@autowallet.dev")
    first = client.post("/api/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/api/auth/register", json=payload)
    assert second.status_code == 400
    assert "already exists" in second.json()["detail"]


def test_register_duplicate_bank_account_fails(client: TestClient):
    payload = register_payload(email="first@autowallet.dev", bank_account_id="MA64000100007777")
    assert client.post("/api/auth/register", json=payload).status_code == 201

    other = register_payload(email="second@autowallet.dev", bank_account_id="MA64000100007777")
    response = client.post("/api/auth/register", json=other)
    assert response.status_code == 400
    assert "already linked" in response.json()["detail"]


def test_register_invalid_email_rejected(client: TestClient):
    payload = register_payload(email="not-an-email")
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


def test_register_short_password_rejected(client: TestClient):
    payload = register_payload(email="shortpw@autowallet.dev", password="abc")
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


def test_register_provisions_wallets_and_rules(client: TestClient, db_session):
    payload = register_payload(email="provisioned@autowallet.dev")
    assert client.post("/api/auth/register", json=payload).status_code == 201

    user = db_session.query(User).filter(User.email == payload["email"]).first()
    assert user is not None

    wallets = db_session.query(Wallet).filter(Wallet.user_id == user.id).all()
    rules = db_session.query(Rule).filter(Rule.user_id == user.id).all()
    assert len(wallets) == 5
    assert len(rules) == 4


def test_login_success_returns_token(client: TestClient):
    payload = register_payload(email="login-ok@autowallet.dev")
    client.post("/api/auth/register", json=payload)

    response = client.post(
        "/api/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["token_type"] == "bearer"


def test_login_wrong_password_rejected(client: TestClient):
    payload = register_payload(email="login-bad@autowallet.dev")
    client.post("/api/auth/register", json=payload)

    response = client.post(
        "/api/auth/login",
        json={"email": payload["email"], "password": "WrongPassword999!"},
    )
    assert response.status_code == 401


def test_login_error_does_not_reveal_which_part_is_wrong(client: TestClient):
    """Wrong password and unknown email must return the same error message,
    so an attacker cannot probe which emails are registered."""
    payload = register_payload(email="enumerate@autowallet.dev")
    client.post("/api/auth/register", json=payload)

    wrong_password = client.post(
        "/api/auth/login",
        json={"email": payload["email"], "password": "WrongPassword999!"},
    )
    unknown_email = client.post(
        "/api/auth/login",
        json={"email": "ghost@autowallet.dev", "password": "Whatever123!"},
    )
    assert wrong_password.status_code == 401
    assert unknown_email.status_code == 401
    assert wrong_password.json()["detail"] == unknown_email.json()["detail"]


def test_me_with_valid_token(client: TestClient, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "zakaria.test@autowallet.dev"


def test_me_without_token_rejected(client: TestClient):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_with_garbage_token_rejected(client: TestClient):
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer not.a.jwt"})
    assert response.status_code == 401


def test_2fa_full_flow(client: TestClient, auth_headers, test_user):
    # 1. Ask the backend to generate a 2FA secret
    setup = client.post("/api/auth/2fa/setup", headers=auth_headers)
    assert setup.status_code == 200
    secret = setup.json()["secret"]
    assert setup.json()["provisioning_uri"]

    # 2. Verify with a real, currently-valid code (like scanning a QR app)
    code = pyotp.TOTP(secret).now()
    verify = client.post("/api/auth/2fa/verify", headers=auth_headers, json={"code": code})
    assert verify.status_code == 200

    login_body = {"email": test_user.email, "password": "SuperSecret1337!"}

    # 3. Login without a code now fails
    no_code = client.post("/api/auth/login", json=login_body)
    assert no_code.status_code == 401
    assert "2FA code required" in no_code.json()["detail"]

    # 4. Login with a wrong code fails
    bad_code = client.post("/api/auth/login", json={**login_body, "totp_code": "000000"})
    assert bad_code.status_code == 401

    # 5. Login with a fresh valid code succeeds
    good_code = client.post(
        "/api/auth/login", json={**login_body, "totp_code": pyotp.TOTP(secret).now()}
    )
    assert good_code.status_code == 200
    assert good_code.json()["access_token"]


def test_2fa_setup_requires_login(client: TestClient):
    response = client.post("/api/auth/2fa/setup")
    assert response.status_code == 401
