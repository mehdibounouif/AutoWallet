import pytest
from ai_module.llm_interface import llm_interface
from ai_module.rag_engine import rag_engine
from ai_module.rate_limiter import SlidingWindowRateLimiter
from ai_module.recommender import financial_recommender
from ai_module.sentiment import analyze_sentiment


def test_rag_semantic_search():
    results = rag_engine.retrieve("auto-entrepreneur morocco impots taxes", top_k=2)
    assert len(results) > 0
    assert any("tax" in r.category.lower() or "morocco" in r.title.lower() for r in results)


def test_sentiment_stress():
    res = analyze_sentiment("I am broke and terrified about my tax debt!")
    assert res["financial_anxiety_detected"] is True
    assert res["polarity"] < 0


def test_sentiment_positive():
    res = analyze_sentiment("My profits are high and I saved a lot this month!")
    assert res["emotional_state"] == "confident"
    assert res["polarity"] > 0


def test_rate_limiter_window():
    rl = SlidingWindowRateLimiter(limit=2, window_seconds=60)
    user = "u1"
    a1, rem1, _ = rl.check_memory(user)
    assert a1 is True
    assert rem1 == 1

    a2, rem2, _ = rl.check_memory(user)
    assert a2 is True
    assert rem2 == 0

    a3, rem3, _ = rl.check_memory(user)
    assert a3 is False
    assert rem3 == 0


def test_recommender_scoring():
    wallets = [
        {"wallet_type": "rent", "balance": 3500.0},
        {"wallet_type": "tax", "balance": 2000.0},
        {"wallet_type": "savings", "balance": 15000.0},
        {"wallet_type": "free", "balance": 4000.0},
    ]
    rules = [
        {"target_wallet": "rent", "fixed_amount": 3500.0, "priority": 1},
        {"target_wallet": "tax", "percentage": 15.0, "priority": 2},
        {"target_wallet": "savings", "percentage": 15.0, "condition_value": 10000.0, "priority": 3},
    ]
    txs = [{"amount": 10000.0}, {"amount": 12000.0}]

    rep = financial_recommender.analyze_user_profile("user-scoring", wallets, rules, txs)
    assert rep.overall_health_score > 0
    assert rep.health_status in ["excellent", "good", "fair", "critical"]
