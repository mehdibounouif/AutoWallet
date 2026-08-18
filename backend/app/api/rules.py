from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.schemas import RuleOut
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Rule, User

router = APIRouter(prefix="/api/rules", tags=["rules"])


@router.get("/", response_model=list[RuleOut])
def list_rules(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Rule).filter(Rule.user_id == current_user.id).order_by(Rule.priority).all()