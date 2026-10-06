from fastapi import APIRouter, Depends
from app.ai.schemas import ChatRequest, ChatResponse
from app.core.deps import require_linked_account
from app.ai.provider import ask_llm

#team's login check
from app.models.models import User
#current_user.full_name.
router = APIRouter(prefix="/api/ai", tags=["ai"])

@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, current_user: User = Depends(require_linked_account)):
    # Ask Gemini (provider.py) and send its answer back
    answer = await ask_llm([{"role": "user","content":payload.message}])
    return ChatResponse(answer=answer)
