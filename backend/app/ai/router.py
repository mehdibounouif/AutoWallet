from fastapi import APIRouter, Depends
from app.ai.schemas import ChatRequest, ChatResponse
from app.core.deps import require_linked_account
#team's login check
from app.models.models import User
#current_user.full_name.
router = APIRouter(prefix="/api/ai", tags=["ai"])

@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, current_user: User = Depends(require_linked_account)):
    # No AI yet: we send the question back, to check that everything around it works.
    return ChatResponse(answer=f"Hi {current_user.full_name}, you asked: {payload.message}")