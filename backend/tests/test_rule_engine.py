from app.services.rule_engine import RuleInput, apply_rules


def test_rule_engine_splits_funds_correctly():
    rules = [
        RuleInput(
            name="Rent lock",
            rule_type="lock_fixed",
            target_wallet="rent",
            priority=1,
            fixed_amount=3500.0,
            condition_field="rent_balance",
            condition_operator="<",
            condition_value=3500.0,
        ),
        RuleInput(
            name="Tax",
            rule_type="percentage_remainder",
            target_wallet="tax",
            priority=2,
            percentage=15.0,
        ),
        RuleInput(
            name="Savings",
            rule_type="percentage_remainder",
            target_wallet="savings",
            priority=3,
            percentage=15.0,
            condition_field="savings_balance",
            condition_operator="<",
            condition_value=10000.0,
        ),
        RuleInput(
            name="Free to spend",
            rule_type="percentage_remainder",
            target_wallet="free",
            priority=4,
            percentage=100.0,
        ),
    ]

    # Initial balances: rent is empty, savings is empty
    balances = {"rent_balance": 0.0, "savings_balance": 0.0}
    allocations = apply_rules(8500.0, rules, balances)

    # Calculation:
    # Pool: 8500.0
    # Rent: 3500.0 -> Pool: 5000.0
    # Tax: 15% of 5000 = 750.0 -> Pool: 4250.0
    # Savings: 15% of 4250 = 637.5 -> Pool: 3612.50
    # Free: 100% of 3612.50 = 3612.50 -> Pool: 0.0
    assert allocations["rent"] == 3500.0
    assert allocations["tax"] == 750.0
    assert allocations["savings"] == 637.5
    assert allocations["free"] == 3612.5
    assert sum(allocations.values()) == 8500.0


def test_rule_engine_skips_rent_when_condition_is_met():
    rules = [
        RuleInput(
            name="Rent lock",
            rule_type="lock_fixed",
            target_wallet="rent",
            priority=1,
            fixed_amount=3500.0,
            condition_field="rent_balance",
            condition_operator="<",
            condition_value=3500.0,
        ),
        RuleInput(
            name="Free to spend",
            rule_type="percentage_remainder",
            target_wallet="free",
            priority=2,
            percentage=100.0,
        ),
    ]

    # Rent is already 3,500. Condition "rent_balance < 3500.0" is False!
    balances = {"rent_balance": 3500.0}
    allocations = apply_rules(2000.0, rules, balances)

    assert "rent" not in allocations
    assert allocations["free"] == 2000.0
