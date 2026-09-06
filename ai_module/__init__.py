"""
AutoWallet Artificial Intelligence Module.
Implements:
- Complete LLM System Interface (Streaming, Visual Charts, Error Handling, Fallback)
- Complete RAG System (Domain Knowledge Dataset, TF-IDF Vector Search, Context Augmentation)
- Machine Learning & Heuristic Budget Recommendation Engine
- Sliding Window Rate Limiting (Redis + Memory)
- Financial Sentiment & Anxiety Detection
"""

from ai_module.llm_interface import LLMSystemInterface, llm_interface
from ai_module.rag_engine import FinancialRAGEngine, rag_engine
from ai_module.rate_limiter import SlidingWindowRateLimiter, ai_rate_limiter, enforce_ai_rate_limit
from ai_module.recommender import FinancialRecommender, financial_recommender
from ai_module.router import router as ai_router
from ai_module.sentiment import analyze_sentiment

__all__ = [
    "ai_router",
    "llm_interface",
    "LLMSystemInterface",
    "rag_engine",
    "FinancialRAGEngine",
    "financial_recommender",
    "FinancialRecommender",
    "ai_rate_limiter",
    "SlidingWindowRateLimiter",
    "enforce_ai_rate_limit",
    "analyze_sentiment",
]
