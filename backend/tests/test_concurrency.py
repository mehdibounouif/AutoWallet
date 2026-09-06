from fastapi.testclient import TestClient
from app.models.models import Transaction, Wallet


def test_transaction_execution_updates_wallets(client: TestClient, auth_headers: dict, test_user, db_session):
    payload = {
        "reference": "DEP-TX-9999",
        "amount": 8500.0,
    }
    response = client.post("/api/transactions/", headers=auth_headers, json=payload)
    assert response.status_code == 201
    tx_data = response.json()
    assert tx_data["reference"] == "DEP-TX-9999"
    assert tx_data["status"] == "processed"

    # Verify wallet balances updated
    wallets = db_session.query(Wallet).filter(Wallet.user_id == test_user.id).all()
    wallet_balances = {w.wallet_type.value: w.balance for w in wallets}
    assert wallet_balances["rent"] == 3500.0
    assert wallet_balances["tax"] == 750.0
    assert wallet_balances["savings"] == 637.5
    assert wallet_balances["free"] == 3612.5


def test_duplicate_transaction_reference_rejected(client: TestClient, auth_headers: dict):
    payload = {
        "reference": "DEP-TX-DUP",
        "amount": 1000.0,
    }
    r1 = client.post("/api/transactions/", headers=auth_headers, json=payload)
    assert r1.status_code == 201

    # Same reference
    r2 = client.post("/api/transactions/", headers=auth_headers, json=payload)
    assert r2.status_code == 400
    assert "already exists" in r2.json()["detail"].lower()
