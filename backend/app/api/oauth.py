from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.models import User
from app.services.provisioning import create_default_rules, create_default_wallets

router = APIRouter(prefix="/api/auth/oauth/google", tags=["oauth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


@router.get("/login")
def google_login():
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{urlencode(params)}")


@router.get("/callback")
def google_callback(code: str, db: Session = Depends(get_db)):
    # Step 1: exchange the one-time code for real tokens (server-to-server)
    token_response = httpx.post(GOOGLE_TOKEN_URL, data={
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.google_redirect_uri,
    })
    if token_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Google rejected the authorization code")

    access_token = token_response.json()["access_token"]

    # Step 2: use that token to ask Google who this actually is
    userinfo_response = httpx.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
    )
    if userinfo_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Could not fetch user info from Google")

    profile = userinfo_response.json()
    google_id = profile["sub"]
    email = profile["email"]
    full_name = profile.get("name", email)

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

    return {"access_token": create_access_token(user_id=user.id), "token_type": "bearer"}