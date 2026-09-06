from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field


class AIChatRequest(BaseModel):
    """User prompt request for the AI Financial Assistant."""
    prompt: str = Field(..., min_length=1, max_length=2000, description="The user question or instruction")
    stream: bool = Field(default=False, description="Whether to stream response tokens")
    include_context: bool = Field(default=True, description="Whether to inject user live financial context (wallets, rules, transactions)")
    include_chart: bool = Field(default=False, description="Whether to generate a visual ASCII/Markdown budget allocation chart")


class KnowledgeSource(BaseModel):
    """Retrieved reference passage from the financial RAG dataset."""
    title: str
    category: str
    content: str
    relevance_score: float


class AIChatResponse(BaseModel):
    """Synchronous response from the AI assistant."""
    response: str
    model: str
    engine: Literal["external_api", "local_intelligent_fallback"]
    sources: list[KnowledgeSource] = []
    chart: str | None = None
    sentiment: dict[str, Any] | None = None
    tokens_used: int = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AIRAGQueryRequest(BaseModel):
    """Direct query for RAG semantic search."""
    query: str = Field(..., min_length=2, max_length=500)
    top_k: int = Field(default=3, ge=1, le=10)


class AIRAGQueryResponse(BaseModel):
    """RAG semantic search result."""
    query: str
    results: list[KnowledgeSource]
    total_found: int


class AIRecommendationItem(BaseModel):
    """Actionable budgeting or rule recommendation."""
    id: str
    category: str  # "tax", "savings", "rent", "spending", "rule_optimization"
    title: str
    description: str
    impact: Literal["high", "medium", "low"]
    suggested_rule: dict[str, Any] | None = None
    metric_basis: str | None = None


class AIRecommendationResponse(BaseModel):
    """Personalized recommendations for the user."""
    user_id: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    overall_health_score: int = Field(..., ge=0, le=100, description="Score out of 100")
    health_status: Literal["critical", "fair", "good", "excellent"]
    metrics: dict[str, Any]
    recommendations: list[AIRecommendationItem]


class ApplyRecommendationRequest(BaseModel):
    """Request to convert an AI recommendation into an actual AutoWallet Rule."""
    recommendation_id: str
    name: str = Field(..., min_length=2, max_length=100)
    rule_type: str = Field(..., description="'lock_fixed' or 'percentage_remainder'")
    target_wallet: str = Field(..., description="'rent', 'tax', 'savings', or 'free'")
    priority: int = Field(..., ge=1, le=100)
    fixed_amount: float | None = None
    percentage: float | None = None
    condition_field: str | None = None
    condition_operator: str | None = None
    condition_value: float | None = None


class AIFinancialInsightsResponse(BaseModel):
    """Deep analytics and predictive indicators for the user."""
    user_id: str
    income_volatility: float
    income_volatility_rating: Literal["low", "moderate", "high", "extreme"]
    average_payment_amount: float
    payment_count: int
    savings_rate_pct: float
    tax_reserve_adequacy_pct: float
    rent_coverage_months: float
    free_to_spend_burn_velocity: float
    wallet_breakdown: dict[str, float]
    summary: str


class AIRateLimitStatus(BaseModel):
    """Current rate limit quota for the requesting user."""
    allowed: bool
    limit: int
    remaining: int
    reset_seconds: int
