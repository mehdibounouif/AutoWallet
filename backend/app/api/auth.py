from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.schemas import Token, UserLogin, UserOut, UserRegister
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.models import User

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
    return user


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    return Token(access_token=create_access_token(user_id=user.id))