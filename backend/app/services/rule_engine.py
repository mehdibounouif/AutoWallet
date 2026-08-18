from dataclasses import dataclass


@dataclass
class RuleInput:
    """A plain description of one rule - no database, no ORM, just data."""
    name: str
    rule_type: str          # "lock_fixed" or "percentage_remainder"
    target_wallet: str
    priority: int
    fixed_amount: float | None = None
    percentage: float | None = None
    condition_field: str | None = None
    condition_operator: str | None = None
    condition_value: float | None = None


# THE TRANSLATOR
_OPERATORS = {
    "<": lambda a, b: a < b,
    "<=": lambda a, b: a <= b,
    ">": lambda a, b: a > b,
    ">=": lambda a, b: a >= b,
    "==": lambda a, b: a == b,
}


def _condition_met(rule: RuleInput, wallet_balances: dict[str, float]) -> bool:
    if rule.condition_field is None:
        return True  # no condition means always run

    current_value = wallet_balances.get(rule.condition_field)
    print(current_value)
    if current_value is None:
        return False  # can't check a condition we have no data for - skip to be safe

    op = _OPERATORS.get(rule.condition_operator)
    if op is None:
        return False

    return op(current_value, rule.condition_value)

def apply_rules(amount: float, rules: list[RuleInput], wallet_balances: dict[str, float]) -> dict[str, float]:
    """
    Splits `amount` across rules, in priority order (lowest number runs first).
    Returns {target_wallet: amount_allocated}. Pure function - no DB, easy to test.
    """
    pool = amount
    allocations: dict[str, float] = {}

    for rule in sorted(rules, key=lambda r: r.priority):
        if pool <= 0:
            break
        if not _condition_met(rule, wallet_balances):
            continue

        if rule.rule_type == "lock_fixed":
            take = min(rule.fixed_amount or 0.0, pool)
        else:  # percentage_remainder
            take = pool * ((rule.percentage or 0.0) / 100)

        allocations[rule.target_wallet] = allocations.get(rule.target_wallet, 0.0) + take
        pool -= take

    return allocations