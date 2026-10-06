from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.ai.prompt import build_messages, describe_user_data
from app.ai.provider import AIError, ask_llm
from app.ai.schemas import ChatRequest, ChatResponse
from app.core.database import get_db
from app.core.deps import require_linked_account
from app.models.models import Rule, Transaction, User, Wallet

router = APIRouter(prefix="/api/ai", tags=["ai"])


def load_user_data(current_user: User = Depends(require_linked_account), db: Session = Depends(get_db)) -> str:
    """Read the user's envelopes, active rules and last 5 payments, as text for the AI."""
    wallets = db.query(Wallet).filter(Wallet.user_id == current_user.id).all()
    rules = (
        db.query(Rule)
        .filter(Rule.user_id == current_user.id, Rule.is_active == True)  # noqa: E712
        .order_by(Rule.priority)
        .all()
    )
    payments = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.created_at.desc())
        .limit(5)
        .all()
    )
    return describe_user_data(wallets, rules, payments)


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, user_data: str = Depends(load_user_data)):
    # Ask Gemini with our instructions + this user's data, and send its answer back
    try:
        answer = await ask_llm(build_messages(payload.message, user_data))
    except AIError as err:
        # Turn the provider problem into a clear HTTP error for the browser
        raise HTTPException(status_code=err.status, detail={"code": err.code, "message": err.message})
    return ChatResponse(answer=answer)
