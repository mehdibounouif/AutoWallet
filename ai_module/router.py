"""
FastAPI Router for AutoWallet AI Subsystem.
Exposes endpoints for AI Chat, Streaming SSE, RAG Knowledge Retrieval,
Machine Learning Recommendations, and Direct Rule Application.
"""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ai_module.llm_interface import llm_interface
from ai_module.rag_engine import rag_engine
from ai_module.rate_limiter import enforce_ai_rate_limit
from ai_module.recommender import financial_recommender
from ai_module.schemas import (
    AIChatRequest,
    AIChatResponse,
    AIFinancialInsightsResponse,
    AIRecommendationResponse,
    AIRAGQueryRequest,
    AIRAGQueryResponse,
    ApplyRecommendationRequest,
)
import sys
from pathlib import Path

_backend_path = str(Path(__file__).resolve().parent.parent / "backend")
if _backend_path not in sys.path:
    sys.path.insert(0, _backend_path)

from app.api.schemas import RuleOut
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.redis_client import redis_client
from app.models.models import Rule, RuleType, Transaction, User, Wallet, WalletType

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _extract_user_context(current_user: User, db: Session) -> tuple[list[dict], list[dict], list[dict]]:
    """Helper to load user financial context from SQL models into plain dictionaries."""
    wallets = db.query(Wallet).filter(Wallet.user_id == current_user.id).all()
    wallet_data = [
        {"id": w.id, "wallet_type": w.wallet_type.value, "balance": float(w.balance)}
        for w in wallets
    ]

    rules = (
        db.query(Rule)
        .filter(Rule.user_id == current_user.id, Rule.is_active == True)  # noqa: E712
        .order_by(Rule.priority)
        .all()
    )
    rule_data = [
        {
            "id": r.id,
            "name": r.name,
            "rule_type": r.rule_type.value,
            "target_wallet": r.target_wallet.value,
            "priority": r.priority,
            "fixed_amount": r.fixed_amount,
            "percentage": r.percentage,
            "condition_field": r.condition_field,
            "condition_operator": r.condition_operator,
            "condition_value": r.condition_value,
        }
        for r in rules
    ]

    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.created_at.desc())
        .limit(10)
        .all()
    )
    tx_data = [
        {
            "id": t.id,
            "reference": t.reference,
            "amount": float(t.amount),
            "status": t.status.value,
            "created_at": t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else "N/A",
        }
        for t in transactions
    ]

    return wallet_data, rule_data, tx_data


@router.post("/chat", response_model=AIChatResponse)
async def chat_with_assistant(
    payload: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Synchronous conversation endpoint with AutoWallet AI.
    Enforces per-user sliding window rate limiting and performs RAG context augmentation.
    """
    enforce_ai_rate_limit(current_user.id, redis_client)
    wallets, rules, txs = _extract_user_context(current_user, db)

    response = await llm_interface.generate_response(
        prompt=payload.prompt,
        user_wallets=wallets if payload.include_context else None,
        user_rules=rules if payload.include_context else None,
        user_transactions=txs if payload.include_context else None,
        include_context=payload.include_context,
        include_chart=payload.include_chart,
    )
    return response


@router.post("/chat/stream")
async def stream_chat_with_assistant(
    payload: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Real-time Server-Sent Events (SSE) streaming endpoint.
    Yields word-by-word tokens, context sources, and visual charts as they are generated.
    """
    enforce_ai_rate_limit(current_user.id, redis_client)
    wallets, rules, txs = _extract_user_context(current_user, db)

    generator = llm_interface.stream_response(
        prompt=payload.prompt,
        user_wallets=wallets if payload.include_context else None,
        user_rules=rules if payload.include_context else None,
        user_transactions=txs if payload.include_context else None,
        include_context=payload.include_context,
        include_chart=payload.include_chart,
    )
    return StreamingResponse(generator, media_type="text/event-stream")


@router.get("/recommendations", response_model=AIRecommendationResponse)
def get_personalized_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Evaluates user financial patterns using the Machine Learning recommender engine.
    Calculates health scores, income volatility, tax safety buffers, and suggested rules.
    """
    enforce_ai_rate_limit(current_user.id, redis_client)
    wallets, rules, txs = _extract_user_context(current_user, db)

    report = financial_recommender.analyze_user_profile(
        user_id=current_user.id,
        wallets=wallets,
        rules=rules,
        transactions=txs,
    )
    return report


@router.post("/recommendations/apply", response_model=RuleOut, status_code=status.HTTP_201_CREATED)
def apply_recommendation(
    payload: ApplyRecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Converts an AI-recommended rule directly into an active AutoWallet Rule in the database.
    """
    try:
        rule_type_enum = RuleType(payload.rule_type)
        target_wallet_enum = WalletType(payload.target_wallet)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid rule or wallet enum: {e}")

    new_rule = Rule(
        user_id=current_user.id,
        name=payload.name,
        rule_type=rule_type_enum,
        target_wallet=target_wallet_enum,
        priority=payload.priority,
        fixed_amount=payload.fixed_amount,
        percentage=payload.percentage,
        condition_field=payload.condition_field,
        condition_operator=payload.condition_operator,
        condition_value=payload.condition_value,
        is_active=True,
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return new_rule


@router.get("/insights", response_model=AIFinancialInsightsResponse)
def get_financial_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns predictive telemetry including income volatility, runway, and distribution metrics.
    """
    enforce_ai_rate_limit(current_user.id, redis_client)
    wallets, rules, txs = _extract_user_context(current_user, db)
    report = financial_recommender.analyze_user_profile(current_user.id, wallets, rules, txs)
    m = report.metrics

    wallet_dict = {w["wallet_type"]: w["balance"] for w in wallets}

    volatility = m["income_volatility"]
    if volatility > 0.6:
        rating = "extreme"
    elif volatility > 0.35:
        rating = "high"
    elif volatility > 0.15:
        rating = "moderate"
    else:
        rating = "low"

    summary = (
        f"Financial Health Score: {report.overall_health_score}/100 ({report.health_status.upper()}). "
        f"Income Volatility: {rating.capitalize()}. "
        f"Rent Coverage: {m['rent_coverage_months']} month(s). "
        f"Tax Reserve Adequacy: {m['tax_reserve_adequacy_pct']}%."
    )

    return AIFinancialInsightsResponse(
        user_id=current_user.id,
        income_volatility=volatility,
        income_volatility_rating=rating,
        average_payment_amount=m["mean_income_per_payment"],
        payment_count=m["payment_count"],
        savings_rate_pct=15.0,
        tax_reserve_adequacy_pct=m["tax_reserve_adequacy_pct"],
        rent_coverage_months=m["rent_coverage_months"],
        free_to_spend_burn_velocity=0.0,
        wallet_breakdown=wallet_dict,
        summary=summary,
    )


@router.post("/rag/query", response_model=AIRAGQueryResponse)
def query_knowledge_base(payload: AIRAGQueryRequest):
    """
    Direct endpoint for semantic vector search across the financial RAG dataset.
    """
    results = rag_engine.retrieve(payload.query, top_k=payload.top_k)
    return AIRAGQueryResponse(
        query=payload.query,
        results=results,
        total_found=len(results),
    )


@router.get("/status")
def get_ai_service_status():
    """
    Returns live operational status of the AI subsystem.
    """
    return {
        "status": "healthy",
        "active_engine": "external_api" if llm_interface.api_key else "local_intelligent_fallback",
        "model": llm_interface.model,
        "rag_articles_indexed": len(rag_engine._documents),
        "rate_limiting_enabled": True,
        "streaming_supported": True,
    }
