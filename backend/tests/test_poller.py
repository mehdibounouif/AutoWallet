"""Tests for the bank-simulator polling bridge (app/workers/poller.py).

The poller runs every 60s in production: for each user it fetches the
user's simulator account and calls process_payment() for every entry.
These tests call poll_bank_simulator() DIRECTLY instead of waiting for
a real 60-second tick — same logic, same HTTP call (mocked with respx),
same DB writes, zero sleeping. The timing itself is APScheduler's job;
what happens on each tick is ours.
"""
import httpx
import pytest
import respx

from app.core.database import get_db
from app.models.models import Transaction, User, Wallet
from app.workers.poller import poll_bank_simulator

from app.core.security import create_access_token, hash_password
from app.services.provisioning import create_default_rules, create_default_wallets


def make_user(db_session, email, bank_account_id=None):
    user = User(
        email=email,
        full_name=f"User {email}",
        hashed_password=hash_password("SuperSecret1337!"),
        bank_account_id=bank_account_id,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    user_id = user.id  # read eagerly: poller commits will expire ORM objects
    create_default_wallets(user, db_session)
    create_default_rules(user, db_session)
    db_session.commit()
    return user_id


def wallet_balances(db_session, user_id):
    wallets = db_session.query(Wallet).filter(Wallet.user_id == user_id).all()
    return {w.wallet_type.value: w.balance for w in wallets}


def mock_account(simulator_url, account_id, transactions, status=200):
    """Tell respx: when the poller asks for this account, answer this."""
    route = respx.get(f"{simulator_url}/simulator/accounts/{account_id}")
    if status == 200:
        route.respond(json={"balance": sum(t["amount"] for t in transactions),
                            "transactions": transactions})
    else:
        route.respond(status_code=status)
    return route


SIMULATOR = "http://127.0.0.1:8001"


def test_poller_delivers_simulator_payment_to_wallets(db_session, poller_uses_test_db, fake_redis):
    """THE happy path: a deposit in the simulator becomes a processed
    transaction and the wallets get split by the rule engine."""
    user_id = make_user(db_session, "poller1@autowallet.dev", "ACC-POLL-1")
    with respx.mock:
        mock_account(SIMULATOR, "ACC-POLL-1",
                     [{"reference": "SIM-1", "amount": 8500}])
        poll_bank_simulator()

    tx = db_session.query(Transaction).filter(Transaction.reference == "SIM-1").first()
    assert tx is not None and tx.status.value == "processed"

    balances = wallet_balances(db_session, user_id)
    assert balances["rent"] == 3500.0
    assert balances["tax"] == 750.0
    assert balances["savings"] == 637.5
    assert balances["free"] == 3612.5
    assert sum(balances.values()) == 8500.0


def test_two_users_each_get_their_own_payments(db_session, poller_uses_test_db, fake_redis):
    a_id = make_user(db_session, "poller-a@autowallet.dev", "ACC-A")
    b_id = make_user(db_session, "poller-b@autowallet.dev", "ACC-B")
    with respx.mock:
        mock_account(SIMULATOR, "ACC-A", [{"reference": "FOR-A", "amount": 1000}])
        mock_account(SIMULATOR, "ACC-B", [{"reference": "FOR-B", "amount": 1000}])
        poll_bank_simulator()

    a_refs = {t.reference for t in db_session.query(Transaction)
              .filter(Transaction.user_id == a_id).all()}
    b_refs = {t.reference for t in db_session.query(Transaction)
              .filter(Transaction.user_id == b_id).all()}
    assert a_refs == {"FOR-A"}
    assert b_refs == {"FOR-B"}


def test_unknown_simulator_account_is_skipped_and_cycle_continues(db_session, poller_uses_test_db, fake_redis):
    """A user with no account in the simulator yet must not break the
    cycle — the poller moves on to the next user."""
    make_user(db_session, "poller-ghost@autowallet.dev", "ACC-NOPE")
    ok_user = make_user(db_session, "poller-ok@autowallet.dev", "ACC-OK")
    with respx.mock:
        mock_account(SIMULATOR, "ACC-NOPE", [], status=404)
        mock_account(SIMULATOR, "ACC-OK", [{"reference": "AFTER-404", "amount": 1000}])
        poll_bank_simulator()

    tx = db_session.query(Transaction).filter(Transaction.reference == "AFTER-404").first()
    assert tx is not None, "poller stopped after the 404 and never reached the next user"


def test_simulator_down_does_not_raise(db_session, poller_uses_test_db, fake_redis):
    """The simulator being unreachable must not blow up the poll cycle."""
    make_user(db_session, "poller-down@autowallet.dev", "ACC-DOWN")
    with respx.mock:
        respx.get(f"{SIMULATOR}/simulator/accounts/ACC-DOWN").mock(
            side_effect=httpx.ConnectError("simulator is down")
        )
        poll_bank_simulator()  # must not raise


def test_transaction_already_processed_is_not_processed_twice(db_session, poller_uses_test_db, fake_redis):
    """IDEMPOTENCY — the heart of the polling design. The poller re-reads
    the FULL history every cycle, so the duplicate check in
    process_payment is the only thing preventing double-crediting.
    Two cycles, same history: money lands exactly once."""
    user_id = make_user(db_session, "poller-dup@autowallet.dev", "ACC-DUP")
    with respx.mock:
        mock_account(SIMULATOR, "ACC-DUP", [{"reference": "TWICE", "amount": 1000}])
        poll_bank_simulator()  # cycle 1
        poll_bank_simulator()  # cycle 2 — same history still there

    count = db_session.query(Transaction).filter(Transaction.reference == "TWICE").count()
    assert count == 1, "double-crediting across cycles"

    balances = wallet_balances(db_session, user_id)
    assert sum(balances.values()) == 1000.0  # credited once, not twice


def test_reference_collision_manual_and_polled(db_session, poller_uses_test_db, fake_redis, monkeypatch):
    """HARD CASE: the same reference arrived manually (POST /transactions)
    AND sits in the simulator. The second path must not credit twice."""
    from app.services.payment_processor import process_payment
    from app.models.models import User as UserModel
    user_id = make_user(db_session, "poller-coll@autowallet.dev", "ACC-COLL")
    user = db_session.query(UserModel).filter(UserModel.id == user_id).first()

    process_payment(user, "SHARED-REF", 1000, db_session)  # manual first

    with respx.mock:
        mock_account(SIMULATOR, "ACC-COLL", [{"reference": "SHARED-REF", "amount": 1000}])
        poll_bank_simulator()  # poller sees the same reference

    balances = wallet_balances(db_session, user.id)
    assert sum(balances.values()) == 1000.0, "polled path re-credited a manual payment"


def test_malformed_simulator_response_crashes_cycle(db_session, poller_uses_test_db, fake_redis):
    """ACCEPTANCE TESTS for QA finding #5 — blocks merge until fixed.

    Two malformed shapes, both verified live (2026-09-13) to kill the
    poll cycle on main:
      1. 200 response missing the "transactions" key → KeyError
      2. 200 response with an invalid JSON body → JSONDecodeError
    Neither is caught by the outer `except httpx.RequestError`, so every
    user ordered after the bad account is starved of payments until a
    human intervenes — while /health stays green.

    Expected once fixed: the outer except also catches ValueError (or
    response.json()["transactions"] becomes .get("transactions", []))
    — the cycle survives AND the victim user after the bad account
    still gets processed."""
    make_user(db_session, "poller-bad@autowallet.dev", "ACC-BAD")
    victim_id = make_user(db_session, "poller-victim@autowallet.dev", "ACC-VICTIM")

    # shape 1: missing "transactions" key
    with respx.mock:
        respx.get(f"{SIMULATOR}/simulator/accounts/ACC-BAD").respond(json={"oops": "no key"})
        mock_account(SIMULATOR, "ACC-VICTIM", [{"reference": "AFTER-BAD-1", "amount": 100}])
        poll_bank_simulator()  # must NOT raise

    processed = db_session.query(Transaction).filter(
        Transaction.reference == "AFTER-BAD-1").first()
    assert processed is not None, \
        "finding #5 NOT fixed (missing-key case): cycle died, users after the malformed response were never paid"

    # shape 2: invalid JSON body
    with respx.mock:
        respx.get(f"{SIMULATOR}/simulator/accounts/ACC-BAD").respond(
            content="<<<not json>>>", status_code=200)
        mock_account(SIMULATOR, "ACC-VICTIM", [{"reference": "AFTER-BAD-2", "amount": 100}])
        poll_bank_simulator()  # must NOT raise

    processed = db_session.query(Transaction).filter(
        Transaction.reference == "AFTER-BAD-2").first()
    assert processed is not None, \
        "finding #5 NOT fixed (invalid-JSON case): cycle died, users after the bad response were never paid"


def test_lock_held_by_another_worker_cycle_continues(db_session, poller_uses_test_db, fake_redis):
    """ACCEPTANCE TEST for QA finding #6 (poller half) — blocks merge until fixed.

    The manual endpoint half of #6 is fixed (409 — verified), but the
    POLLER half is not: when another worker holds the user's Redis lock
    beyond blocking_timeout=5s, process_payment raises RuntimeError and
    the per-transaction except in poller.py... catches it — BUT the
    cycle must also demonstrably continue to the NEXT user. This test
    pins the full requirement, not just the catch.

    Setup: user LOCK has their lock held forever (never released);
    user AFTER-LOCK comes after them and must still get paid."""
    locked_id = make_user(db_session, "poller-lock@autowallet.dev", "ACC-LOCK")
    after_id = make_user(db_session, "poller-afterlock@autowallet.dev", "ACC-AFTERLOCK")

    held = fake_redis.lock(f"lock:user:{locked_id}", timeout=10)
    assert held.acquire(blocking=True)

    with respx.mock:
        mock_account(SIMULATOR, "ACC-LOCK", [{"reference": "STUCK", "amount": 100}])
        mock_account(SIMULATOR, "ACC-AFTERLOCK", [{"reference": "FREED", "amount": 100}])
        poll_bank_simulator()  # must NOT raise, and must not stop

    freed = db_session.query(Transaction).filter(
        Transaction.reference == "FREED").first()
    assert freed is not None, \
        "finding #6 NOT fixed (poller half): cycle stopped at the locked user; the next user was never paid"


def test_user_without_bank_account_is_never_polled(db_session, poller_uses_test_db, fake_redis):
    """OAuth-style users (bank_account_id=None) must be skipped entirely."""
    make_user(db_session, "poller-noaccount@autowallet.dev", None)
    with respx.mock:
        assert not respx.get(f"{SIMULATOR}/simulator/accounts/").called
        poll_bank_simulator()
    # no HTTP call was ever configured; poll ran with zero requests —
    # respx.mock raises on unmatched calls, so reaching here unmocked-free
    # proves the None user was skipped before any request
    assert db_session.query(Transaction).count() == 0
