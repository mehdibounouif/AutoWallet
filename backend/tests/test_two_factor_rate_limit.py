"""Unit pins for the 2FA rate limiter (PR #83, finding #27's fix).

The acceptance tripwire in test_2fa.py drives /login end-to-end; these pin
the module contract directly: threshold, per-user isolation, clear-on-success,
and the Retry-After contract on 429.
"""
import pytest
from fastapi import HTTPException

from app.core import two_factor_rate_limit as limiter


def _strike(user_id: str, n: int = 1) -> None:
    for _ in range(n):
        limiter.record_failed_2fa_attempt(user_id)


def test_below_threshold_still_allows_verification():
    """SCENARIO:   one failure fewer than the threshold.
    EXPECTED:   check passes — the user is not locked out yet."""
    _strike("user-a", limiter.MAX_FAILED_ATTEMPTS - 1)

    limiter.check_2fa_rate_limit("user-a")


def test_at_threshold_check_refuses_with_429_and_retry_after():
    """SCENARIO:   the failure counter reached MAX_FAILED_ATTEMPTS.
    EXPECTED:   check raises 429 carrying Retry-After = the window."""
    _strike("user-a", limiter.MAX_FAILED_ATTEMPTS)

    with pytest.raises(HTTPException) as err:
        limiter.check_2fa_rate_limit("user-a")

    assert err.value.status_code == 429
    assert err.value.headers.get("Retry-After") == str(limiter.WINDOW_SECONDS)


def test_failures_are_isolated_per_user():
    """SCENARIO:   user-a burned the whole budget; user-b never failed.
    EXPECTED:   user-b's check passes — counters never leak across users."""
    _strike("user-a", limiter.MAX_FAILED_ATTEMPTS)

    limiter.check_2fa_rate_limit("user-b")


def test_successful_verification_clears_the_counter():
    """SCENARIO:   a user who burned the budget then verified successfully.
    EXPECTED:   clear_2fa_rate_limit resets them — the next check passes."""
    _strike("user-a", limiter.MAX_FAILED_ATTEMPTS)

    limiter.clear_2fa_rate_limit("user-a")

    limiter.check_2fa_rate_limit("user-a")
