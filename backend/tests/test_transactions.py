"""Tests for the transaction endpoints: creating payments, wallet updates,
duplicate protection, and the Redis lock under true concurrency."""
from concurrent.futures import ThreadPoolExecutor

from fastapi.testclient import TestClient

from app.models.models import Transaction, User, Wallet


def wallet_balances(db_session, user_id):
    """Read the user's wallet balances straight from the database."""
    wallets = db_session.query(Wallet).filter(Wallet.user_id == user_id).all()
    return {w.wallet_type.value: w.balance for w in wallets}


def test_transaction_updates_wallets(client: TestClient, auth_headers, test_user, db_session):
    """The board's 8,500 example, verified in the DATABASE, not just the response."""
    response = client.post(
        "/api/transactions/",
        headers=auth_headers,
        json={"reference": "DEP-001", "amount": 8500},
    )
    assert response.status_code == 201
    assert response.json()["status"] == "processed"

    balances = wallet_balances(db_session, test_user.id)
    assert balances["rent"] == 3500.0
    assert balances["tax"] == 750.0
    assert balances["savings"] == 637.5
    assert balances["free"] == 3612.5
    assert balances["main"] == 0.0


def test_transaction_recorded_with_status_and_timestamps(client, auth_headers, db_session):
    client.post("/api/transactions/", headers=auth_headers,
                json={"reference": "DEP-002", "amount": 1000})

    tx = db_session.query(Transaction).filter(Transaction.reference == "DEP-002").first()
    assert tx is not None
    assert tx.status.value == "processed"
    assert tx.processed_at is not None
    assert tx.amount == 1000


def test_duplicate_reference_rejected_and_balances_unchanged(client, auth_headers, test_user, db_session):
    first = client.post("/api/transactions/", headers=auth_headers,
                        json={"reference": "DUP-REF", "amount": 5000})
    assert first.status_code == 201

    before = wallet_balances(db_session, test_user.id)

    second = client.post("/api/transactions/", headers=auth_headers,
                         json={"reference": "DUP-REF", "amount": 9999})
    assert second.status_code == 400
    assert "already exists" in second.json()["detail"]

    # the money-safety guarantee: the rejected payment changed NOTHING
    after = wallet_balances(db_session, test_user.id)
    assert before == after


def test_non_positive_amounts_rejected(client, auth_headers):
    assert client.post("/api/transactions/", headers=auth_headers,
                       json={"reference": "ZERO-1", "amount": 0}).status_code == 422
    assert client.post("/api/transactions/", headers=auth_headers,
                       json={"reference": "NEG-1", "amount": -50}).status_code == 422


def test_transactions_require_auth(client: TestClient):
    assert client.post("/api/transactions/",
                       json={"reference": "NOAUTH", "amount": 100}).status_code == 401


def test_transactions_scoped_to_owner(client, auth_headers, db_session):
    """IDOR protection: user A's list must never contain user B's payments."""
    client.post("/api/transactions/", headers=auth_headers,
                json={"reference": "MINE-1", "amount": 100})

    other = User(email="other@autowallet.dev", full_name="Other User",
                 hashed_password="x", bank_account_id="MA64000100008888")
    db_session.add(other)
    db_session.commit()
    other_headers = {"Authorization": "Bearer " + __import__("app.core.security", fromlist=["create_access_token"]).create_access_token(user_id=other.id)}

    other_list = client.get("/api/transactions/", headers=other_headers).json()
    other_refs = [t["reference"] for t in other_list]
    assert "MINE-1" not in other_refs

    mine = client.get("/api/transactions/", headers=auth_headers).json()
    mine_refs = [t["reference"] for t in mine]
    assert "MINE-1" in mine_refs


def test_concurrent_payments_same_user_both_processed(client, auth_headers, test_user, db_session):
    """The real concurrency test — the reason the Redis lock exists (PR #2).

    Two payments for the same user fired at the SAME instant from two
    threads. Both must be processed, no 500s, and no money lost: the
    total across wallets must equal the total paid in.
    """
    def pay(reference, amount):
        return client.post("/api/transactions/", headers=auth_headers,
                           json={"reference": reference, "amount": amount})

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(
            lambda args: pay(*args),
            [("RACE-1", 3000), ("RACE-2", 2000)],
        ))

    statuses = [r.status_code for r in results]
    assert statuses == [201, 201], f"one or both concurrent payments failed: {statuses}"

    balances = wallet_balances(db_session, test_user.id)
    total_in_wallets = sum(balances.values())
    assert total_in_wallets == 5000.0, "money lost or duplicated during concurrent processing"


def test_conditional_rules_apply_live_through_api(client, auth_headers, test_user, db_session):
    """Savings cap enforced through the API: with savings already at the cap,
    the savings rule must skip and the money flows to free instead."""
    db_session.query(Wallet).filter(
        Wallet.user_id == test_user.id, Wallet.wallet_type == "savings"
    ).first().balance = 10000.0  # at the cap
    db_session.commit()

    client.post("/api/transactions/", headers=auth_headers,
                json={"reference": "CAPPED-1", "amount": 8500})

    balances = wallet_balances(db_session, test_user.id)
    assert balances["savings"] == 10000.0  # unchanged: cap condition skipped the rule
    assert balances["rent"] == 3500.0
    assert balances["tax"] == 750.0
    # the 15% savings would have taken flows to free instead:
    assert balances["free"] == 4250.0
    assert sum(balances.values()) == 18500.0  # 10000 pre-existing + 8500 payment
