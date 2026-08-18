from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.schemas import WalletOut
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Wallet

router = APIRouter(prefix="/api/wallets", tags=["wallets"])


@router.get("/", response_model=list[WalletOut])
def list_wallets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Wallet).filter(Wallet.user_id == current_user.id).all()