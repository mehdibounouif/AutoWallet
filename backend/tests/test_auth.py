from fastapi.testclient import TestClient


def test_user_registration(client: TestClient):
    payload = {
        "full_name": "Hamza Tester",
        "email": "hamza.tester@1337.ma",
        "password": "Password1337!",
        "bank_account_id": "MA64000100000001",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "hamza.tester@1337.ma"
    assert data["full_name"] == "Hamza Tester"
    assert "id" in data


def test_duplicate_registration_fails(client: TestClient):
    payload = {
        "full_name": "Duplicate User",
        "email": "dup@1337.ma",
        "password": "Password1337!",
        "bank_account_id": "MA64000100000002",
    }
    r1 = client.post("/api/auth/register", json=payload)
    assert r1.status_code == 201

    # Same email
    r2 = client.post("/api/auth/register", json=payload)
    assert r2.status_code == 400
    assert "already exists" in r2.json()["detail"].lower()


def test_login_success_and_me(client: TestClient):
    # Register
    reg_payload = {
        "full_name": "Login User",
        "email": "login@1337.ma",
        "password": "SecretPassword1337!",
        "bank_account_id": "MA64000100000003",
    }
    client.post("/api/auth/register", json=reg_payload)

    # Login
    login_resp = client.post("/api/auth/login", json={"email": "login@1337.ma", "password": "SecretPassword1337!"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    assert token is not None

    # Access /api/auth/me
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "login@1337.ma"


def test_login_invalid_password(client: TestClient):
    login_resp = client.post("/api/auth/login", json={"email": "nonexistent@1337.ma", "password": "wrong"})
    assert login_resp.status_code == 401
