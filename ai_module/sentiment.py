"""
Sentiment & Financial Emotional State Analyzer.
Analyzes user financial queries, notes, and inquiries to detect stress, confidence,
and emergency signals, enabling the AI advisor to adapt tone and priority.
"""

import re
from typing import Any

# Domain lexicons with weighted scores
_STRESS_WORDS: dict[str, float] = {
    "broke": -0.8,
    "anxious": -0.7,
    "panic": -0.9,
    "debt": -0.6,
    "penalty": -0.7,
    "late": -0.5,
    "overdue": -0.7,
    "cant pay": -0.9,
    "cannot pay": -0.9,
    "empty": -0.6,
    "audit": -0.7,
    "stress": -0.7,
    "worried": -0.6,
    "struggling": -0.8,
    "behind": -0.5,
    "loss": -0.6,
    "scared": -0.8,
    "emergency": -0.8,
    "overdraft": -0.8,
}

_CONFIDENCE_WORDS: dict[str, float] = {
    "profit": 0.7,
    "surplus": 0.8,
    "growing": 0.7,
    "saved": 0.6,
    "achieved": 0.8,
    "bonus": 0.7,
    "ahead": 0.6,
    "stable": 0.6,
    "comfortable": 0.7,
    "invest": 0.5,
    "growth": 0.6,
    "success": 0.8,
    "optimal": 0.6,
    "healthy": 0.7,
}


def analyze_sentiment(text: str) -> dict[str, Any]:
    """
    Perform lexical and heuristic sentiment scoring on financial user input.
    Returns polarity (-1.0 to 1.0), stress category, and communication guidance.
    """
    lowered = text.lower()
    words = re.findall(r"\b\w+\b", lowered)

    stress_hits = 0
    confidence_hits = 0
    total_score = 0.0

    for word, weight in _STRESS_WORDS.items():
        if word in lowered:
            stress_hits += 1
            total_score += weight

    for word, weight in _CONFIDENCE_WORDS.items():
        if word in lowered:
            confidence_hits += 1
            total_score += weight

    word_count = max(len(words), 1)
    normalized_score = max(-1.0, min(1.0, total_score / (stress_hits + confidence_hits + 1)))

    if normalized_score < -0.35:
        tone_state = "stressed"
        recommended_tone = "empathetic, calming, action-oriented with immediate liquidity stabilization"
    elif normalized_score > 0.35:
        tone_state = "confident"
        recommended_tone = "encouraging, strategic, focused on long-term wealth compounding and optimization"
    else:
        tone_state = "neutral"
        recommended_tone = "objective, clear, analytical, and structured"

    financial_anxiety_detected = stress_hits > 0 and normalized_score < 0

    return {
        "polarity": round(normalized_score, 2),
        "emotional_state": tone_state,
        "stress_indicators": stress_hits,
        "confidence_indicators": confidence_hits,
        "financial_anxiety_detected": financial_anxiety_detected,
        "recommended_tone": recommended_tone,
    }
