from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.deps import get_current_user
from app.core.config import settings
from app.services.provisioning import create_default_rules, create_default_wallets

from app.api.schemas import Token, UserLogin, UserOut, UserRegister, LinkBankAccount
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.models import User

from app.api.schemas import TwoFactorSetupOut, TwoFactorVerify
from app.core.security import generate_totp_secret, get_totp_uri, verify_totp_code

from app.gdpr.email import EmailError, send_email
from urllib.parse import urlencode

from app.api.schemas import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse,
)

from app.core.redis_client import redis_client
from app.core.security import (
    generate_password_reset_token,
    hash_password_reset_token,
    hash_password,
)
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    if db.query(User).filter(User.bank_account_id == payload.bank_account_id).first():
        raise HTTPException(status_code=400, detail="This bank account is already linked to another user")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        bank_account_id=payload.bank_account_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    db.add(user)
    db.commit()
    db.refresh(user)

    create_default_wallets(user, db)
    create_default_rules(user, db)
    db.commit()

    return user


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if user.two_factor_enabled:
        if not payload.totp_code:
            raise HTTPException(status_code=401, detail="2FA code required")
        if not verify_totp_code(user.two_factor_secret, payload.totp_code):
            raise HTTPException(status_code=401, detail="Invalid 2FA code")
    return Token(access_token=create_access_token(user_id=user.id, role=user.role.value))



# get has no request body
@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/2fa/setup", response_model=TwoFactorSetupOut)
def setup_2fa(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    secret = generate_totp_secret()
    current_user.two_factor_secret = secret
    db.commit()
    return TwoFactorSetupOut(secret=secret, provisioning_uri=get_totp_uri(secret, current_user.email))


@router.post("/2fa/verify")
def verify_2fa(payload: TwoFactorVerify, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.two_factor_secret:
        raise HTTPException(status_code=400, detail="2FA setup has not been started")
    if not verify_totp_code(current_user.two_factor_secret, payload.code):
        raise HTTPException(status_code=400, detail="Invalid code")

    current_user.two_factor_enabled = True
    db.commit()
    return {"message": "2FA enabled"}

@router.post("/link-bank-account", response_model=UserOut)
def link_bank_account(
    payload: LinkBankAccount,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.bank_account_id is not None:
        raise HTTPException(status_code=400, detail="A bank account is already linked")

    if db.query(User).filter(User.bank_account_id == payload.bank_account_id).first():
        raise HTTPException(status_code=400, detail="This bank account is already linked to another user")

    current_user.bank_account_id = payload.bank_account_id
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/password/forgot",response_model=MessageResponse,)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    generic_response = MessageResponse(
        message=(
            "If an account exists for this email, "
            "a password reset link has been sent."
        )
    )

    user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if user is None:
        return generic_response

    if user.hashed_password is None:
        return generic_response

    reset_token = generate_password_reset_token()

    token_hash = hash_password_reset_token(
        reset_token
    )

    redis_client.setex(
        f"password_reset:{token_hash}",
        settings.password_reset_ttl_seconds,
        str(user.id),
    )

    query = urlencode({
        "token": reset_token,
    })

    reset_url = (
        f"{settings.frontend_password_reset_url}"
        f"?{query}"
    )

    try:
        send_email(
            to=user.email,
            subject="Reset your AutoWallet password",
            body=(
                "A password reset was requested for your AutoWallet account.\n\n"
                f"Reset your password here:\n{reset_url}\n\n"
                f"This link expires in "
                f"{settings.password_reset_ttl_seconds // 60} minutes.\n\n"
                "If you did not request this, you can ignore this email."
            ),
        )
    except EmailError:
        redis_client.delete(
            f"password_reset:{token_hash}"
        )

        raise HTTPException(
            status_code=503,
            detail="Password reset email service is temporarily unavailable.",
        )

    return generic_response


@router.post(
    "/password/reset",
    response_model=MessageResponse,
)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    token_hash = hash_password_reset_token(
        payload.token
    )

    redis_key = f"password_reset:{token_hash}"

    user_id = redis_client.getdel(redis_key)

    if user_id is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset token",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset token",
        )

    if user.hashed_password is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset token",
        )

    user.hashed_password = hash_password(
        payload.new_password
    )

    db.commit()

    return MessageResponse(
        message="Password reset successfully."
    )