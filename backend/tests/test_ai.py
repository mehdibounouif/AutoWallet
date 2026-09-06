import pytest
import asyncio
from fastapi.testclient import TestClient

from ai_module.llm_interface import llm_interface
from ai_module.rag_engine import rag_engine
from ai_module.rate_limiter import SlidingWindowRateLimiter, ai_rate_limiter
from ai_module.recommender import financial_recommender
from ai_module.sentiment import analyze_sentiment
from app.models.models import Rule, Wallet, WalletType


# =====================================================================
# 1. UNIT TESTS: RAG ENGINE & KNOWLEDGE BASE
# =====================================================================

def test_rag_retrieval_returns_relevant_articles():
    # Tax query should match tax regime articles
    query = "What is the tax rate for auto-entrepreneurs in Morocco?"
    results = rag_engine.retrieve(query, top_k=3)
    assert len(results) > 0
    top = results[0]
    assert "tax" in top.title.lower() or "auto-entrepreneur" in top.title.lower()
    assert top.relevance_score > 0.1
    assert "1%" in top.content or "turnover" in top.content


def test_rag_retrieval_rent_query():
    query = "How does rent lock work with condition checking?"
    results = rag_engine.retrieve(query, top_k=2)
    assert len(results) > 0
    matched_titles = [r.title.lower() for r in results]
    assert any("rent" in t or "rule" in t for t in matched_titles)


def test_rag_build_augmented_context():
    mock_wallets = [{"wallet_type": "tax", "balance": 1500.0}, {"wallet_type": "rent", "balance": 3500.0}]
    mock_rules = [{"name": "Rent lock", "priority": 1, "target_wallet": "rent", "rule_type": "lock_fixed", "fixed_amount": 3500.0}]
    mock_txs = [{"amount": 8500.0, "reference": "INV-101", "status": "processed", "created_at": "2026-09-01"}]

    context_str, sources = rag_engine.build_augmented_context(
        query="Explain my rent rule and tax balance",
        user_wallets=mock_wallets,
        user_rules=mock_rules,
        user_transactions=mock_txs,
    )
    assert "SYSTEM KNOWLEDGE BASE" in context_str
    assert "Rent Envelope: 3,500.00 MAD" in context_str
    assert "Tax Envelope: 1,500.00 MAD" in context_str
    assert "INV-101" in context_str


# =====================================================================
# 2. UNIT TESTS: SENTIMENT & FINANCIAL ANXIETY
# =====================================================================

def test_sentiment_anxiety_detection():
    stressed_text = "I am in panic, I cannot pay my rent and the tax deadline is tomorrow!"
    res = analyze_sentiment(stressed_text)
    assert res["financial_anxiety_detected"] is True
    assert res["polarity"] < 0
    assert "calming" in res["recommended_tone"].lower() or "empathetic" in res["recommended_tone"].lower()


def test_sentiment_confident_tone():
    confident_text = "I received a huge bonus and healthy profit, my savings are growing!"
    res = analyze_sentiment(confident_text)
    assert res["financial_anxiety_detected"] is False
    assert res["polarity"] > 0
    assert res["emotional_state"] == "confident"


# =====================================================================
# 3. UNIT TESTS: LLM SYSTEM INTERFACE & CHARTS
# =====================================================================

def test_ascii_budget_chart_generation():
    mock_wallets = [
        {"wallet_type": "rent", "balance": 3500.0},
        {"wallet_type": "tax", "balance": 1275.0},
        {"wallet_type": "savings", "balance": 1275.0},
        {"wallet_type": "free", "balance": 2450.0},
        {"wallet_type": "main", "balance": 0.0},
    ]
    chart = llm_interface.generate_ascii_budget_chart(mock_wallets)
    assert "AutoWallet Real-Time Envelope Distribution" in chart
    assert "Rent" in chart
    assert "Tax" in chart
    assert "3500.00 MAD" in chart
    assert "41.2%" in chart
    assert "█" in chart


@pytest.mark.anyio
async def test_llm_response_generation_offline_fallback():
    # External API key is None in test environment -> falls back safely to domain engine
    resp = await llm_interface.generate_response(
        prompt="Tell me about Moroccan freelance tax rates and how to configure my AutoWallet tax rule",
        include_context=True,
        include_chart=True,
    )
    assert resp.engine == "local_intelligent_fallback"
    assert "Tax" in resp.response or "AutoWallet" in resp.response
    assert resp.chart is not None
    assert len(resp.sources) > 0


@pytest.mark.anyio
async def test_llm_streaming_sse_chunks():
    chunks = []
    events = []
    async for event_str in llm_interface.stream_response("How to manage savings?", include_chart=True):
        events.append(event_str)
        if "event: token" in event_str:
            chunks.append(event_str)

    assert len(chunks) > 0
    assert any("event: start" in e for e in events)
    assert any("event: done" in e for e in events)
    assert any("event: chart" in e for e in events)


# =====================================================================
# 4. UNIT TESTS: SLIDING WINDOW RATE LIMITER
# =====================================================================

def test_sliding_window_rate_limiter_blocks_excessive_calls():
    limiter = SlidingWindowRateLimiter(limit=3, window_seconds=10)
    user = "test-rate-user"

    # First 3 requests should be allowed
    a1, rem1, _ = limiter.check_memory(user)
    assert a1 is True
    assert rem1 == 2

    a2, rem2, _ = limiter.check_memory(user)
    assert a2 is True
    assert rem2 == 1

    a3, rem3, _ = limiter.check_memory(user)
    assert a3 is True
    assert rem3 == 0

    # 4th request must be rejected
    a4, rem4, reset = limiter.check_memory(user)
    assert a4 is False
    assert rem4 == 0
    assert reset > 0


# =====================================================================
# 5. UNIT TESTS: RECOMMENDER ENGINE
# =====================================================================

def test_recommender_detects_high_volatility():
    # Uneven transactions: 20,000 then 2,000 then 30,000
    mock_txs = [
        {"amount": 20000.0, "reference": "1"},
        {"amount": 2000.0, "reference": "2"},
        {"amount": 30000.0, "reference": "3"},
    ]
    mock_wallets = [
        {"wallet_type": "rent", "balance": 3500.0},
        {"wallet_type": "tax", "balance": 1000.0},
        {"wallet_type": "savings", "balance": 1000.0},
    ]
    mock_rules = [
        {"target_wallet": "rent", "fixed_amount": 3500.0},
    ]

    report = financial_recommender.analyze_user_profile("user-1", mock_wallets, mock_rules, mock_txs)
    assert report.metrics["income_volatility"] > 0.45
    rec_titles = [r.title.lower() for r in report.recommendations]
    assert any("volatility" in t for t in rec_titles)


def test_recommender_savings_cap_nudge():
    mock_wallets = [
        {"wallet_type": "rent", "balance": 3500.0},
        {"wallet_type": "tax", "balance": 2000.0},
        {"wallet_type": "savings", "balance": 9500.0},  # 95% of 10k cap
    ]
    mock_rules = [
        {"target_wallet": "savings", "condition_value": 10000.0},
    ]
    report = financial_recommender.analyze_user_profile("user-2", mock_wallets, mock_rules, [])
    rec_titles = [r.title.lower() for r in report.recommendations]
    assert any("cap" in t or "growth" in t for t in rec_titles)


# =====================================================================
# 6. INTEGRATION TESTS: FASTAPI HTTP ENDPOINTS
# =====================================================================

def test_get_ai_status(client: TestClient):
    response = client.get("/api/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["streaming_supported"] is True
    assert data["rag_articles_indexed"] >= 10


def test_post_rag_query_public(client: TestClient):
    response = client.post("/api/ai/rag/query", json={"query": "auto entrepreneur maroc impots", "top_k": 2})
    assert response.status_code == 200
    data = response.json()
    assert data["total_found"] > 0
    assert len(data["results"]) <= 2


def test_ai_chat_requires_auth(client: TestClient):
    response = client.post("/api/ai/chat", json={"prompt": "Hello AI"})
    assert response.status_code == 401


def test_ai_chat_authenticated(client: TestClient, auth_headers: dict):
    response = client.post(
        "/api/ai/chat",
        headers=auth_headers,
        json={
            "prompt": "How should I structure my AutoWallet rules for taxes and rent?",
            "include_context": True,
            "include_chart": True,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert data["chart"] is not None
    assert len(data["sources"]) > 0
    assert data["engine"] in ["local_intelligent_fallback", "external_api"]


def test_ai_chat_streaming_endpoint(client: TestClient, auth_headers: dict):
    response = client.post(
        "/api/ai/chat/stream",
        headers=auth_headers,
        json={"prompt": "Explain rent lock rule", "include_chart": False},
    )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    body = response.text
    assert "event: token" in body
    assert "event: done" in body


def test_ai_recommendations_endpoint(client: TestClient, auth_headers: dict):
    response = client.get("/api/ai/recommendations", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "overall_health_score" in data
    assert "recommendations" in data
    assert isinstance(data["recommendations"], list)


def test_apply_recommendation_to_database(client: TestClient, auth_headers: dict, db_session):
    payload = {
        "recommendation_id": "rec-test-1",
        "name": "AI Optimized Tax Reserve",
        "rule_type": "percentage_remainder",
        "target_wallet": "tax",
        "priority": 2,
        "percentage": 18.0,
    }
    response = client.post("/api/ai/recommendations/apply", headers=auth_headers, json=payload)
    assert response.status_code == 201
    created = response.json()
    assert created["name"] == "AI Optimized Tax Reserve"
    assert created["percentage"] == 18.0

    # Verify directly in database
    db_rule = db_session.query(Rule).filter(Rule.id == created["id"]).first()
    assert db_rule is not None
    assert db_rule.name == "AI Optimized Tax Reserve"


def test_ai_insights_endpoint(client: TestClient, auth_headers: dict):
    response = client.get("/api/ai/insights", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "income_volatility" in data
    assert "summary" in data
    assert "wallet_breakdown" in data
