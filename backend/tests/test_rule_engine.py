"""Tests for the rule engine (app/services/rule_engine.py).

Unlike the auth tests, these need no client, no database, no fixtures:
apply_rules() is a pure function — money in, allocation dict out.
We test it exactly as the team's excalidraw board specifies it.
"""
import pytest

from app.services.rule_engine import RuleInput, apply_rules


def make_rule(
    name,
    rule_type,
    target_wallet,
    priority,
    fixed_amount=None,
    percentage=None,
    condition_field=None,
    condition_operator=None,
    condition_value=None,
):
    """Build one RuleInput with keyword arguments (same fields as the DB rules)."""
    return RuleInput(
        name=name,
        rule_type=rule_type,
        target_wallet=target_wallet,
        priority=priority,
        fixed_amount=fixed_amount,
        percentage=percentage,
        condition_field=condition_field,
        condition_operator=condition_operator,
        condition_value=condition_value,
    )


def default_rules():
    """The same 4 starter rules every user gets on signup (provisioning.py)."""
    return [
        make_rule("Rent lock", "lock_fixed", "rent", 1, fixed_amount=3500,
                  condition_field="rent_balance", condition_operator="<", condition_value=3500),
        make_rule("Tax", "percentage_remainder", "tax", 2, percentage=15),
        make_rule("Savings (capped)", "percentage_remainder", "savings", 3, percentage=15,
                  condition_field="savings_balance", condition_operator="<", condition_value=10000),
        make_rule("Free to spend", "percentage_remainder", "free", 4, percentage=100),
    ]


EMPTY_BALANCES = {"rent_balance": 0, "savings_balance": 0}


# --- The hand-traced example from the excalidraw board -----------------------

def test_hand_traced_8500_example():
    """8,500 payment: rent 3500, tax 750, savings 637.5, free 3612.5."""
    allocations = apply_rules(8500, default_rules(), dict(EMPTY_BALANCES))

    assert allocations["rent"] == pytest.approx(3500)
    assert allocations["tax"] == pytest.approx(750)
    assert allocations["savings"] == pytest.approx(637.5)
    assert allocations["free"] == pytest.approx(3612.5)
    # conservation: every unit of the payment is accounted for
    assert sum(allocations.values()) == pytest.approx(8500)


# --- The board's condition table: true and false branches -------------------

def test_condition_true_savings_cap_still_saves():
    """Board example 1, TRUE branch: savings below cap -> rule fires normally."""
    balances = {"rent_balance": 0, "savings_balance": 5000}
    allocations = apply_rules(8500, default_rules(), balances)
    assert allocations["savings"] == pytest.approx(637.5)


def test_condition_false_savings_cap_flows_onward():
    """Board example 1, FALSE branch: savings already at cap -> rule skipped,
    and its 15% flows to the next rules (free catches it)."""
    balances = {"rent_balance": 0, "savings_balance": 10000}
    allocations = apply_rules(8500, default_rules(), balances)

    assert "savings" not in allocations
    assert allocations["free"] == pytest.approx(4250)
    assert sum(allocations.values()) == pytest.approx(8500)


def test_condition_false_rent_already_covered():
    """Board example 2, FALSE branch: rent envelope already full -> no double lock.
    The 3,500 stays in the pool for the percentage rules below."""
    balances = {"rent_balance": 3500, "savings_balance": 0}
    allocations = apply_rules(8500, default_rules(), balances)

    assert "rent" not in allocations
    assert allocations["tax"] == pytest.approx(1275)  # 15% of the FULL 8,500


def test_income_tier_tax_20_when_high_income():
    """Board example 3: two tax rules with opposite conditions —
    20% applies above the 15,000 income tier, normal 15% otherwise."""
    rules = [
        make_rule("Tax high tier", "percentage_remainder", "tax", 2, percentage=20,
                  condition_field="monthly_income", condition_operator=">", condition_value=15000),
        make_rule("Tax normal", "percentage_remainder", "tax", 3, percentage=15,
                  condition_field="monthly_income", condition_operator="<=", condition_value=15000),
        make_rule("Free", "percentage_remainder", "free", 9, percentage=100),
    ]

    high = apply_rules(10000, rules, {"monthly_income": 20000})
    assert high["tax"] == pytest.approx(2000)

    low = apply_rules(10000, rules, {"monthly_income": 12000})
    assert low["tax"] == pytest.approx(1500)


def test_emergency_override_skips_tax_and_savings():
    """Board example 4: when the main wallet is nearly empty (< 500),
    skip tax and savings entirely — everything spare goes to free-to-spend."""
    rules = [
        make_rule("Rent", "lock_fixed", "rent", 1, fixed_amount=3500,
                  condition_field="rent_balance", condition_operator="<", condition_value=3500),
        make_rule("Tax", "percentage_remainder", "tax", 2, percentage=15,
                  condition_field="main_balance", condition_operator=">=", condition_value=500),
        make_rule("Savings", "percentage_remainder", "savings", 3, percentage=15,
                  condition_field="main_balance", condition_operator=">=", condition_value=500),
        make_rule("Free", "percentage_remainder", "free", 4, percentage=100),
    ]

    broke = apply_rules(8500, rules, {"rent_balance": 0, "main_balance": 300})
    assert "tax" not in broke
    assert "savings" not in broke
    assert broke["free"] == pytest.approx(5000)

    healthy = apply_rules(8500, rules, {"rent_balance": 0, "main_balance": 1000})
    assert healthy["tax"] == pytest.approx(750)


def test_first_payment_bonus_rule():
    """Board example 5: a one-time bonus rule that only fires on the first payment."""
    rules = [
        make_rule("First payment bonus", "lock_fixed", "savings", 1, fixed_amount=500,
                  condition_field="is_first_payment", condition_operator="==", condition_value=1),
        make_rule("Tax", "percentage_remainder", "tax", 2, percentage=15),
        make_rule("Free", "percentage_remainder", "free", 3, percentage=100),
    ]

    first = apply_rules(10000, rules, {"is_first_payment": 1})
    assert first["savings"] == pytest.approx(500)

    later = apply_rules(10000, rules, {"is_first_payment": 0})
    assert "savings" not in later


# --- Edge cases: payments vs fixed locks ------------------------------------

def test_payment_smaller_than_rent_lock():
    """Only 2,000 arrives but rent wants 3,500: rent takes what exists,
    nothing crashes, and the pool is honestly empty afterwards."""
    allocations = apply_rules(2000, default_rules(), dict(EMPTY_BALANCES))
    assert allocations == pytest.approx({"rent": 2000})


def test_zero_amount_allocates_nothing():
    assert apply_rules(0, default_rules(), dict(EMPTY_BALANCES)) == {}


def test_negative_amount_allocates_nothing():
    """The API already rejects negatives with 422 — the engine must also be
    defensive in case it is ever called from another path (e.g. the webhook)."""
    assert apply_rules(-100, default_rules(), dict(EMPTY_BALANCES)) == {}


# --- Edge cases: ordering and accumulation ----------------------------------

def test_priority_order_determines_who_gets_paid_first():
    """Rules are passed out of order ON PURPOSE: the engine must sort them
    by priority itself. Lower priority number = paid first."""
    a_first = [
        make_rule("A", "lock_fixed", "rent", 1, fixed_amount=1000),
        make_rule("B", "lock_fixed", "savings", 2, fixed_amount=3000),
    ]
    assert apply_rules(3500, a_first, {}) == pytest.approx({"rent": 1000, "savings": 2500})

    b_first = [
        make_rule("A", "lock_fixed", "rent", 2, fixed_amount=1000),
        make_rule("B", "lock_fixed", "savings", 1, fixed_amount=3000),
    ]
    assert apply_rules(3500, b_first, {}) == pytest.approx({"rent": 500, "savings": 3000})


def test_rules_targeting_same_wallet_accumulate():
    rules = [
        make_rule("Rent part 1", "lock_fixed", "rent", 1, fixed_amount=1000),
        make_rule("Rent part 2", "lock_fixed", "rent", 2, fixed_amount=1000),
    ]
    assert apply_rules(5000, rules, {}) == pytest.approx({"rent": 2000, "main": 3000})


# --- Silent-failure documentation (QA warnings) ------------------------------

def test_unknown_condition_field_silently_skips_rule():
    """QA WARNING: a typo in condition_field (savingz vs savings) makes the
    rule vanish silently — no error, no allocation. Reported to the team;
    this test documents the current behavior so any change is noticed."""
    rules = [
        make_rule("Savings", "percentage_remainder", "savings", 1, percentage=15,
                  condition_field="savingz_balance",  # typo!
                  condition_operator="<", condition_value=10000),
        make_rule("Free", "percentage_remainder", "free", 2, percentage=100),
    ]
    allocations = apply_rules(1000, rules, {"savings_balance": 0})
    assert "savings" not in allocations
    assert allocations["free"] == pytest.approx(1000)


def test_unknown_condition_operator_silently_skips_rule():
    """QA WARNING: an operator outside <, <=, >, >=, == (here !=) is ignored
    silently instead of raising an error."""
    rules = [
        make_rule("Savings", "percentage_remainder", "savings", 1, percentage=15,
                  condition_field="savings_balance", condition_operator="!=",
                  condition_value=10000),
        make_rule("Free", "percentage_remainder", "free", 2, percentage=100),
    ]
    allocations = apply_rules(1000, rules, {"savings_balance": 0})
    assert "savings" not in allocations


def test_malformed_rule_values_take_nothing_without_crashing():
    """A lock_fixed rule with fixed_amount=None must not crash the payment."""
    rules = [
        make_rule("Broken lock", "lock_fixed", "rent", 1, fixed_amount=None),
        make_rule("Free", "percentage_remainder", "free", 2, percentage=100),
    ]
    allocations = apply_rules(1000, rules, {})
    assert allocations == pytest.approx({"rent": 0.0, "free": 1000.0})


# --- Remainder handling (was the xfail-tracked design gap) --------------------

def test_unallocated_remainder_goes_to_main_wallet():
    """Money not covered by any rule must end up somewhere — not disappear.
    Tracked as an xfail until PR #7 (fix/rule_engine) landed the main-wallet
    remainder fix; the marker is removed now the fix is in. Leftover 850
    from a 15% tax rule on 1,000 now lands in main."""
    rules = [make_rule("Tax", "percentage_remainder", "tax", 1, percentage=15)]
    allocations = apply_rules(1000, rules, {})

    assert allocations["main"] == pytest.approx(850)
    assert sum(allocations.values()) == pytest.approx(1000)
