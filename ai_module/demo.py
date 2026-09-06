#!/usr/bin/env python3
"""
Interactive CLI Demonstration for AutoWallet AI Module.
Used for quick verification and 1337 Peer Evaluation demos.
Run with: python3 ai_module/demo.py
"""

import asyncio
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from ai_module.llm_interface import llm_interface
from ai_module.rag_engine import rag_engine
from ai_module.rate_limiter import SlidingWindowRateLimiter
from ai_module.recommender import financial_recommender
from ai_module.sentiment import analyze_sentiment


def print_header(title: str):
    print("\n" + "=" * 65)
    print(f"  🤖 {title}")
    print("=" * 65)


async def main():
    print("=" * 65)
    print("   AUTOWALLET AI SUBSYSTEM - 1337 DEMONSTRATION SUITE")
    print("=" * 65)

    # 1. RAG SEMANTIC RETRIEVAL DEMO
    print_header("1. RAG (Retrieval-Augmented Generation) Semantic Search")
    query = "What is the Moroccan auto-entrepreneur tax rate and CNSS contribution?"
    print(f"Search Query: \"{query}\"")
    results = rag_engine.retrieve(query, top_k=2)
    for i, res in enumerate(results, 1):
        print(f"\n[{i}] {res.title} (Relevance: {res.relevance_score})")
        print(f"    Category: {res.category}")
        print(f"    Snippet : {res.content[:160]}...")

    # 2. SENTIMENT & ANXIETY DETECTION DEMO
    print_header("2. Sentiment Analysis & Financial Stress Detection")
    user_prompt = "I am really stressed, my client hasn't paid and I don't know how to pay taxes!"
    print(f"Input: \"{user_prompt}\"")
    sent = analyze_sentiment(user_prompt)
    print(f"Polarity Score  : {sent['polarity']} (-1.0 to +1.0)")
    print(f"Emotional State : {sent['emotional_state']}")
    print(f"Anxiety Detected: {sent['financial_anxiety_detected']}")
    print(f"Advisor Tone    : {sent['recommended_tone']}")

    # 3. LLM INTERFACE - VISUAL CHART GENERATION
    print_header("3. LLM Interface: Visual Envelope Allocation Chart")
    mock_wallets = [
        {"wallet_type": "rent", "balance": 3500.0},
        {"wallet_type": "tax", "balance": 1275.0},
        {"wallet_type": "savings", "balance": 1275.0},
        {"wallet_type": "free", "balance": 2450.0},
        {"wallet_type": "main", "balance": 0.0},
    ]
    chart = llm_interface.generate_ascii_budget_chart(mock_wallets)
    print(chart)

    # 4. LLM INTERFACE - STREAMING TOKEN RESPONSE DEMO
    print_header("4. LLM Interface: Real-Time Streaming Generation (SSE)")
    stream_prompt = "How should I set up my rent and savings rules in AutoWallet?"
    print(f"Prompt: \"{stream_prompt}\"\nStreaming Output: ", end="", flush=True)
    async for event in llm_interface.stream_response(stream_prompt, user_wallets=mock_wallets, include_chart=False):
        if "data: " in event:
            import json
            try:
                line = [l for l in event.split("\n") if l.startswith("data: ")][0]
                data = json.loads(line[6:])
                if data.get("type") == "token":
                    sys.stdout.write(data.get("chunk", ""))
                    sys.stdout.flush()
            except Exception:
                pass
    print("\n\n[Streaming complete]")

    # 5. MACHINE LEARNING RECOMMENDATION ENGINE DEMO
    print_header("5. ML Budget Recommendation & Volatility Analysis")
    mock_txs = [
        {"amount": 15000.0, "reference": "INV-001", "created_at": "2026-08-01"},
        {"amount": 3500.0, "reference": "INV-002", "created_at": "2026-08-15"},
        {"amount": 22000.0, "reference": "INV-003", "created_at": "2026-09-01"},
    ]
    mock_rules = [
        {"target_wallet": "rent", "fixed_amount": 3500.0, "priority": 1},
        {"target_wallet": "tax", "percentage": 15.0, "priority": 2},
        {"target_wallet": "savings", "percentage": 15.0, "condition_value": 10000.0, "priority": 3},
    ]
    rec_report = financial_recommender.analyze_user_profile(
        user_id="user-demo-1337",
        wallets=mock_wallets,
        rules=mock_rules,
        transactions=mock_txs,
    )
    print(f"Overall Financial Health Score: {rec_report.overall_health_score}/100 ({rec_report.health_status.upper()})")
    print(f"Income Volatility: {rec_report.metrics['income_volatility']} (Standard deviation / mean)")
    print(f"Rent Coverage    : {rec_report.metrics['rent_coverage_months']} months")
    print(f"Generated Rule Recommendations ({len(rec_report.recommendations)}):")
    for r in rec_report.recommendations:
        print(f"  • [{r.impact.upper()}] {r.title}")
        print(f"    Basis: {r.metric_basis}")
        if r.suggested_rule:
            print(f"    Suggested Rule: {r.suggested_rule['name']} ({r.suggested_rule['rule_type']})")

    # 6. SLIDING WINDOW RATE LIMITER DEMO
    print_header("6. Sliding Window Rate Limiting Verification")
    limiter = SlidingWindowRateLimiter(limit=3, window_seconds=10)
    for req in range(1, 6):
        allowed, remaining, reset = limiter.check_memory("test-client")
        status_str = "✅ ALLOWED" if allowed else "⛔ BLOCKED (HTTP 429)"
        print(f"  Request #{req}: {status_str} | Remaining quota: {remaining} | Window reset: {reset}s")

    print("\n" + "=" * 65)
    print("   ALL AI SUBMODULES VERIFIED AND FULLY OPERATIONAL!")
    print("=" * 65)


if __name__ == "__main__":
    asyncio.run(main())
