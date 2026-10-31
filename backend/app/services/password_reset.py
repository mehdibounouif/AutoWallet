import hashlib
import secrets
from urllib.parse import urlencode

from app.core.config import settings
from app.core.redis_client import redis_client
from app.gdpr.email import send_email, EmailError


def reset_token_key(token: str) -> str:
    fingerprint = hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()

    return f"password_reset:{fingerprint}"


def send_password_reset_email(user) -> None:
    token = secrets.token_urlsafe(32)

    key = reset_token_key(token)

    redis_client.setex(
        key,
        settings.password_reset_ttl_seconds,
        str(user.id),
    )

    separator = (
        "&" if "?" in settings.frontend_password_reset_url
        else "?"
    )

    reset_url = (
        f"{settings.frontend_password_reset_url}"
        f"{separator}{urlencode({'token': token})}"
    )

    try:
        send_email(
            to=user.email,
            subject="Reset your AutoWallet password",
            body=(
                "Hello,\n\n"
                "We received a request to reset your password.\n\n"
                f"Open this link to set a new password:\n{reset_url}\n\n"
                "This link expires in "
                f"{settings.password_reset_ttl_seconds // 60}"
                " minutes.\n\n"
                "If you did not request a password reset, "
                "you can ignore this email."
            ),
        )

    except EmailError:
        redis_client.delete(key)
        raise