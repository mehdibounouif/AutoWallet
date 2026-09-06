"""
High-Performance Sliding Window Rate Limiter for AutoWallet AI System.
Enforces per-user API quotas with Redis distributed backend and robust
in-memory fallback when Redis is unreachable.
"""

import time
from collections import defaultdict, deque
from typing import Tuple
from fastapi import HTTPException, status


class SlidingWindowRateLimiter:
    """
    Sliding window rate limiter.
    Tracks timestamps within the last `window_seconds` window.
    """

    def __init__(self, limit: int = 20, window_seconds: int = 60):
        self.limit = limit
        self.window_seconds = window_seconds
        self._memory_store: dict[str, deque[float]] = defaultdict(deque)

    def check_memory(self, identifier: str) -> Tuple[bool, int, int]:
        now = time.time()
        cutoff = now - self.window_seconds
        window = self._memory_store[identifier]

        # Evict timestamps outside the window
        while window and window[0] <= cutoff:
            window.popleft()

        current_count = len(window)
        if current_count >= self.limit:
            oldest = window[0]
            reset_seconds = max(1, int(self.window_seconds - (now - oldest)))
            return False, 0, reset_seconds

        window.append(now)
        remaining = max(0, self.limit - (current_count + 1))
        reset_seconds = self.window_seconds
        return True, remaining, reset_seconds

    def check(self, identifier: str, redis_conn=None) -> Tuple[bool, int, int]:
        """
        Check and record an access attempt.
        Attempts Redis sorted-set sliding window; falls back cleanly to memory.
        """
        if redis_conn:
            try:
                now = time.time()
                key = f"ai:ratelimit:{identifier}"
                pipe = redis_conn.pipeline()
                # Remove timestamps older than window
                pipe.zremrangebyscore(key, 0, now - self.window_seconds)
                # Count remaining items in window
                pipe.zcard(key)
                # Add current timestamp
                pipe.zadd(key, {str(now): now})
                # Expire key after window
                pipe.expire(key, self.window_seconds + 5)
                results = pipe.execute()

                current_count = results[1]
                if current_count >= self.limit:
                    # Over quota: remove the newly added one
                    redis_conn.zrem(key, str(now))
                    return False, 0, self.window_seconds

                remaining = max(0, self.limit - (current_count + 1))
                return True, remaining, self.window_seconds
            except Exception:
                # Redis error: fallback transparently to memory store
                pass

        return self.check_memory(identifier)


# Global rate limiter instance
ai_rate_limiter = SlidingWindowRateLimiter(limit=20, window_seconds=60)


def enforce_ai_rate_limit(user_id: str, redis_conn=None) -> dict[str, int | bool]:
    """
    Dependency or helper to enforce rate limiting.
    Raises HTTP 429 if the user has exceeded their AI request quota.
    """
    allowed, remaining, reset_seconds = ai_rate_limiter.check(user_id, redis_conn)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "AI request quota exceeded. Please slow down.",
                "retry_after_seconds": reset_seconds,
                "limit": ai_rate_limiter.limit,
                "window_seconds": ai_rate_limiter.window_seconds,
            },
            headers={"Retry-After": str(reset_seconds)},
        )

    return {
        "allowed": True,
        "remaining": remaining,
        "reset_seconds": reset_seconds,
        "limit": ai_rate_limiter.limit,
    }
