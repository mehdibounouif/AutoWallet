from urllib.parse import urlencode
import secrets

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.models import User
from app.services.provisioning import create_default_rules, create_default_wallets
from app.core.redis_client import redis_client
from app.api.schemas import OAuthExchangeRequest, Token

router = APIRouter(prefix="/api/auth/oauth/google", tags=["oauth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
OAUTH_STATE_TTL_SECONDS = 600
OAUTH_EXCHANGE_TTL_SECONDS = 120


@router.get("/login")
def google_login():
    state = secrets.token_urlsafe(32)

    redis_client.setex(
        f"oauth:state:{state}",
        OAUTH_STATE_TTL_SECONDS,
        "1",
    )

    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "state": state,
    }

    return RedirectResponse(
        f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    )

@router.get("/callback")
def google_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    # Handle Google cancellation
    if error:
        raise HTTPException(
            status_code=400,
            detail=f"Google authentication failed: {error}",
        )

    # Require state
    if not state:
        raise HTTPException(
            status_code=400,
            detail="Missing OAuth state",
        )

    # state validate:
    stored_state = redis_client.getdel(
        f"oauth:state:{state}"
    )

    if stored_state is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OAuth state",
        )

    # Require Google's code
    if not code:
        raise HTTPException(
            status_code=400,
            detail="Missing Google authorization code",
        )

    # Step 1: exchange the one-time code for real tokens (server-to-server)
    token_response = httpx.post(GOOGLE_TOKEN_URL, data={
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": settings.google_redirect_uri,
        },
        timeout=10.0,
    )

    if token_response.status_code != 200:
        raise HTTPException(
            status_code=401, 
            detail="Google rejected the authorization code"
        )

    # extract access token
    token_data = token_response.json()
    access_token = token_data.get("access_token")

    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Google did not return an access token",
        )

    # Step 2: use that token to ask Google who this actually is
    userinfo_response = httpx.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10.0,
    )
    if userinfo_response.status_code != 200:
        raise HTTPException(
            status_code=401, 
            detail="Could not fetch user info from Google"
        )

    profile = userinfo_response.json()
    google_id = profile["sub"]
    email = profile["email"]
    full_name = profile.get("name", email)

    if not google_id or not email:
        raise HTTPException(
            status_code=401,
            detail="Google profile is missing required identity information",
        )

    # Step 3: find or create the AutoWallet user
    user = db.query(User).filter(User.oauth_provider == "google", User.oauth_id == google_id).first()

    if user is None:
        user = db.query(User).filter(User.email == email).first()
        if user is not None:
            # Existing email/password account — link Google to it
            user.oauth_provider = "google"
            user.oauth_id = google_id
            db.commit()
        else:
            # Brand new user, arriving via Google, no bank account yet
            user = User(
                email=email,
                full_name=full_name,
                hashed_password=None,
                bank_account_id=None,
                oauth_provider="google",
                oauth_id=google_id,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            create_default_wallets(user, db)
            create_default_rules(user, db)
            db.commit()

    exchange_code = secrets.token_urlsafe(32)
    redis_client.setex(
        f"oauth:exchange:{exchange_code}",
        OAUTH_EXCHANGE_TTL_SECONDS,
        str(user.id),
    )

    frontend_callback = (
        f"{settings.frontend_google_callback_url}"
        f"?{urlencode({'code': exchange_code})}"
    )

    return RedirectResponse(frontend_callback)




@router.post("/exchange", response_model=Token)
def exchange_google_code(
    payload: OAuthExchangeRequest,
    db: Session = Depends(get_db),
):
    exchange_key = f"oauth:exchange:{payload.code}"

    user_id = redis_client.getdel(exchange_key)

    if user_id is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OAuth exchange code",
        )

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    return Token(
        access_token=create_access_token(
            user_id=user.id,
            role=user.role.value,
        )
    )