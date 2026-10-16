from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.deps import get_current_user
from app.services.provisioning import create_default_rules, create_default_wallets

from app.api.schemas import Token, UserLogin, UserOut, UserRegister, LinkBankAccount
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.models import User

from app.core.redis_client import redis_client
from app.gdpr.email import EmailError

from app.api.schemas import TwoFactorSetupOut, TwoFactorVerify
from app.core.security import generate_totp_secret, get_totp_uri, verify_totp_code
from app.api.schemas import (
    ResendVerificationRequest,
    VerifyEmailRequest,
    MessageResponse
)
from app.services.email_verification import token_key

import logging
from app.services.email_verification import send_verification_email
logger = logging.getLogger(__name__)
from sqlalchemy.exc import SQLAlchemyError
from redis.exceptions import RedisError

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: UserRegister,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists",
        )

    if db.query(User).filter(
        User.bank_account_id == payload.bank_account_id
    ).first():
        raise HTTPException(
            status_code=400,
            detail="This bank account is already linked to another user",
        )

    user = User(
        full_name=payload.full_name,
        email=email,
        hashed_password=hash_password(payload.password),
        bank_account_id=payload.bank_account_id,
        email_verified=False,
    )

    try:
        db.add(user)
        db.flush()

        create_default_wallets(user, db)
        create_default_rules(user, db)

        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        raise

    # The account is already committed.
    # Email failure must not cancel registration.
    try:
        send_verification_email(user)

    except (EmailError, RedisError):
        logger.exception(
            "Could not initiate verification email for user %s",
            user.id,
        )

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


@router.post(
    "/email/resend",
    response_model=MessageResponse,
)
def resend_verification(
    payload: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    generic_response = MessageResponse(
        message=(
            "If the account needs verification, "
            "a verification email will be sent."
        )
    )

    email = str(payload.email).strip().lower()

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if user is None or user.email_verified:
        return generic_response

    cooldown_key = f"email_verify:cooldown:{user.id}"

    cooldown_started = redis_client.set(
        cooldown_key,
        "1",
        nx=True,
        ex=60,
    )

    if not cooldown_started:
        return generic_response

    try:
        send_verification_email(user)

    except EmailError:
        redis_client.delete(cooldown_key)

        logger.warning(
            "Verification resend failed for user %s",
            user.id,
        )

        raise HTTPException(
            status_code=503,
            detail="Email service temporarily unavailable",
        )

    return generic_response

@router.post(
    "/email/verify",
    response_model=MessageResponse,
)
def verify_email(
    payload: VerifyEmailRequest,
    db: Session = Depends(get_db),
):
    user_id = redis_client.getdel(
        token_key(payload.token)
    )

    if user_id is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification token",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid verification token",
        )

    if user.email_verified:
        return MessageResponse(
            message="Email already verified"
        )

    try:
        user.email_verified = True
        db.commit()

    except SQLAlchemyError:
        db.rollback()

        logger.exception(
            "Failed to verify email for user %s",
            user.id,
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Verification temporarily unavailable. "
                "Please request another verification link."
            ),
        )

    return MessageResponse(
        message="Email verified successfully"
    )