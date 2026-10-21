
from fastapi import HTTPException, status
from redis.exceptions import RedisError

from app.core.redis_client import redis_client


MAX_FAILED_ATTEMPTS = 5
WINDOW_SECONDS = 300

KEY_PREFIX = "auth:2fa:failures"


def _key(user_id: str) -> str:
    return f"{KEY_PREFIX}:{user_id}"


def check_2fa_rate_limit(user_id: str) -> None:
    """Reject verification if the user reached the limit."""
    try:
        attempts = redis_client.get(_key(user_id))

        if attempts is not None and int(attempts) >= MAX_FAILED_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed 2FA attempts. Try again later.",
                headers={"Retry-After": str(WINDOW_SECONDS)},
            )

    except RedisError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication temporarily unavailable",
        )


def record_failed_2fa_attempt(user_id: str) -> None:
    """Increment the failure counter and set its expiration."""
    try:
        key = _key(user_id)

        with redis_client.pipeline(transaction=True) as pipe:
            pipe.incr(key)
            pipe.expire(key, WINDOW_SECONDS, nx=True)
            pipe.execute()

    except RedisError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication temporarily unavailable",
        )


def clear_2fa_rate_limit(user_id: str) -> None:
    """Remove the counter after successful verification."""
    try:
        redis_client.delete(_key(user_id))

    except RedisError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication temporarily unavailable",
        )
