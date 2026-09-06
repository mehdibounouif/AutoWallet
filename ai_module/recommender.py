"""
Machine Learning & Content-Based Budget Recommendation Engine for AutoWallet.
Evaluates user transaction behavior, income volatility, envelope allocations, and savings velocity
to generate personalized, actionable rule adjustments and financial optimization strategies.
"""

import math
import uuid
from typing import Any
import numpy as np

from ai_module.schemas import AIRecommendationItem, AIRecommendationResponse


class FinancialRecommender:
    """
    Analyzes user financial telemetry and recommends rule adjustments,
    envelope rebalancing, and tax risk mitigations.
    """

    def analyze_user_profile(
        self,
        user_id: str,
        wallets: list[dict[str, Any]],
        rules: list[dict[str, Any]],
        transactions: list[dict[str, Any]],
    ) -> AIRecommendationResponse:
        """
        Produce a comprehensive recommendation report and financial health score.
        """
        # 1. Parse balances
        wallet_map: dict[str, float] = {
            w.get("wallet_type", ""): float(w.get("balance", 0.0)) for w in wallets
        }
        main_bal = wallet_map.get("main", 0.0)
        rent_bal = wallet_map.get("rent", 0.0)
        tax_bal = wallet_map.get("tax", 0.0)
        savings_bal = wallet_map.get("savings", 0.0)
        free_bal = wallet_map.get("free", 0.0)
        total_assets = sum(wallet_map.values())

        # 2. Transaction statistics
        amounts = [float(tx.get("amount", 0.0)) for tx in transactions if float(tx.get("amount", 0.0)) > 0]
        tx_count = len(amounts)

        if tx_count >= 2:
            mean_income = float(np.mean(amounts))
            std_income = float(np.std(amounts))
            volatility = float(std_income / (mean_income + 1e-6))
        elif tx_count == 1:
            mean_income = amounts[0]
            volatility = 0.25
        else:
            mean_income = 0.0
            volatility = 0.0

        # Estimated monthly fixed overhead (based on Rent rule or Rent balance)
        rent_rule = next((r for r in rules if r.get("target_wallet") == "rent"), None)
        monthly_fixed_rent = float(rent_rule.get("fixed_amount", 3500.0)) if rent_rule else 3500.0

        # Run-way coverage
        rent_coverage_months = round(rent_bal / max(monthly_fixed_rent, 1.0), 2)
        savings_runway_months = round(savings_bal / max(monthly_fixed_rent, 1.0), 2)

        # Tax reserve adequacy
        # Ideal tax reserve is roughly 15% to 20% of recent gross income
        total_recent_income = sum(amounts) if amounts else 0.0
        expected_tax_reserve = total_recent_income * 0.15
        tax_adequacy_pct = round(min(200.0, (tax_bal / max(expected_tax_reserve, 100.0)) * 100), 1)

        # 3. Calculate Health Score (0 - 100)
        health_score = 50  # base starting score

        # Rent security (+15 points if 1+ months covered)
        if rent_coverage_months >= 1.0:
            health_score += 15
        elif rent_coverage_months >= 0.5:
            health_score += 8
        else:
            health_score -= 10

        # Savings cushion (+20 points if 3+ months runway)
        if savings_runway_months >= 3.0:
            health_score += 20
        elif savings_runway_months >= 1.0:
            health_score += 10
        elif savings_runway_months < 0.3:
            health_score -= 15

        # Tax safety (+15 points if tax envelope adequate)
        if tax_adequacy_pct >= 80:
            health_score += 15
        elif tax_adequacy_pct >= 50:
            health_score += 5
        else:
            health_score -= 10

        health_score = max(5, min(100, health_score))

        if health_score >= 80:
            health_status = "excellent"
        elif health_score >= 65:
            health_status = "good"
        elif health_score >= 45:
            health_status = "fair"
        else:
            health_status = "critical"

        # 4. Generate Targeted Rule Recommendations
        recommendations: list[AIRecommendationItem] = []

        # (A) Income Volatility Recommendation
        if volatility > 0.45:
            recommendations.append(
                AIRecommendationItem(
                    id=f"rec-volatility-{uuid.uuid4().hex[:6]}",
                    category="savings",
                    title="High Income Volatility Detected: Increase Savings Buffer",
                    description=(
                        f"Your transaction volume indicates high revenue volatility (Coefficient of Variation: {volatility:.2f}). "
                        "When client payments arrive unevenly, increasing your savings allocation from 15% to 20% protects against cash droughts."
                    ),
                    impact="high",
                    metric_basis=f"Income Volatility: {volatility:.2f} (Threshold: > 0.45)",
                    suggested_rule={
                        "name": "Volatility Buffer Savings",
                        "rule_type": "percentage_remainder",
                        "target_wallet": "savings",
                        "priority": 3,
                        "percentage": 20.0,
                        "condition_field": "savings_balance",
                        "condition_operator": "<",
                        "condition_value": 20000.0,
                    },
                )
            )

        # (B) Tax Envelope Adequacy Check
        if tax_adequacy_pct < 60:
            recommendations.append(
                AIRecommendationItem(
                    id=f"rec-tax-under-{uuid.uuid4().hex[:6]}",
                    category="tax",
                    title="Tax Reserve Shortfall: Boost Tax Envelope Allocation",
                    description=(
                        f"Your current Tax balance of {tax_bal:,.2f} MAD covers only {tax_adequacy_pct}% of expected liabilities "
                        f"based on your recorded payments ({total_recent_income:,.2f} MAD). We suggest raising tax allocation to 20%."
                    ),
                    impact="high",
                    metric_basis=f"Tax Reserve Adequacy: {tax_adequacy_pct}% (Target: > 80%)",
                    suggested_rule={
                        "name": "Tax Catch-Up Rule",
                        "rule_type": "percentage_remainder",
                        "target_wallet": "tax",
                        "priority": 2,
                        "percentage": 20.0,
                        "fixed_amount": None,
                    },
                )
            )

        # (C) Savings Cap Optimization
        savings_cap_rule = next((r for r in rules if r.get("target_wallet") == "savings" and r.get("condition_value")), None)
        cap_val = float(savings_cap_rule.get("condition_value", 10000.0)) if savings_cap_rule else 10000.0
        if savings_bal >= cap_val * 0.9:
            recommendations.append(
                AIRecommendationItem(
                    id=f"rec-cap-reached-{uuid.uuid4().hex[:6]}",
                    category="rule_optimization",
                    title="Emergency Fund Near Cap: Divert Surplus into Growth",
                    description=(
                        f"Your savings envelope has reached {savings_bal:,.2f} MAD (90%+ of your {cap_val:,.2f} MAD cap). "
                        "Once this threshold is reached, automated savings skips, leaving more in Free-to-Spend or allowing a new Investment rule."
                    ),
                    impact="medium",
                    metric_basis=f"Savings Balance: {savings_bal:,.2f} / Cap: {cap_val:,.2f} MAD",
                    suggested_rule={
                        "name": "Surplus Investment Rule",
                        "rule_type": "percentage_remainder",
                        "target_wallet": "free",
                        "priority": 5,
                        "percentage": 100.0,
                    },
                )
            )

        # (D) Rent Reserve Buffer Optimization
        if rent_bal < monthly_fixed_rent * 0.8:
            recommendations.append(
                AIRecommendationItem(
                    id=f"rec-rent-safety-{uuid.uuid4().hex[:6]}",
                    category="rent",
                    title="Lock Rent Ahead of Time for Next Month",
                    description=(
                        f"Your Rent envelope currently contains {rent_bal:,.2f} MAD, which is below the monthly target of {monthly_fixed_rent:,.2f} MAD. "
                        "Ensure your priority 1 rule locks the full rent on the next incoming transaction."
                    ),
                    impact="high",
                    metric_basis=f"Rent balance: {rent_bal:,.2f} MAD vs Target: {monthly_fixed_rent:,.2f} MAD",
                    suggested_rule={
                        "name": "Priority Rent Lock",
                        "rule_type": "lock_fixed",
                        "target_wallet": "rent",
                        "priority": 1,
                        "fixed_amount": monthly_fixed_rent,
                        "condition_field": "rent_balance",
                        "condition_operator": "<",
                        "condition_value": monthly_fixed_rent,
                    },
                )
            )

        # (E) General Freelance Growth Recommendation if doing well
        if health_score >= 70 and not recommendations:
            recommendations.append(
                AIRecommendationItem(
                    id=f"rec-growth-{uuid.uuid4().hex[:6]}",
                    category="spending",
                    title="Healthy Financial Posture: Maintain Consistent Allocations",
                    description=(
                        "Your envelope ratios and reserve buffers are in strong alignment with freelance financial best practices. "
                        "All essential obligations (Rent, Tax, Savings) have active rules. Continue monitoring your quarterly turnover."
                    ),
                    impact="low",
                    metric_basis=f"Financial Health Score: {health_score}/100",
                )
            )

        metrics = {
            "income_volatility": round(volatility, 3),
            "mean_income_per_payment": round(mean_income, 2),
            "rent_coverage_months": rent_coverage_months,
            "savings_runway_months": savings_runway_months,
            "tax_reserve_adequacy_pct": tax_adequacy_pct,
            "total_liquid_assets": round(total_assets, 2),
            "payment_count": tx_count,
        }

        return AIRecommendationResponse(
            user_id=user_id,
            overall_health_score=health_score,
            health_status=health_status,
            metrics=metrics,
            recommendations=recommendations,
        )


# Global singleton instance
financial_recommender = FinancialRecommender()
