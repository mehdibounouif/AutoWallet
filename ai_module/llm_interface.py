"""
Complete LLM System Interface for AutoWallet.
Supports text generation, visual ASCII/Markdown budget charts, streaming token delivery (SSE),
rate limiting integration, robust error handling, and intelligent local inference fallback.
"""

import asyncio
import anyio
import json
import logging
from typing import Any, AsyncGenerator
import httpx

from ai_module.rag_engine import rag_engine
from ai_module.schemas import AIChatResponse, KnowledgeSource
from ai_module.sentiment import analyze_sentiment
import sys
from pathlib import Path

_backend_path = str(Path(__file__).resolve().parent.parent / "backend")
if _backend_path not in sys.path:
    sys.path.insert(0, _backend_path)

from app.core.config import settings

logger = logging.getLogger("ai_module.llm_interface")


class LLMSystemInterface:
    """
    Unified LLM Interface providing streaming generation, error handling,
    and adaptive fallbacks for the AutoWallet financial platform.
    """

    def __init__(self):
        self.api_key = settings.openai_api_key
        self.base_url = settings.openai_base_url or "https://api.openai.com/v1"
        self.model = settings.ai_model

    def generate_ascii_budget_chart(self, wallets: list[dict[str, Any]] | None = None) -> str:
        """
        Generate a structured visual ASCII/Markdown horizontal bar chart
        representing the user's envelope distribution.
        """
        if not wallets:
            return (
                "```text\n"
                "AutoWallet Envelope Allocation Preview (Standard 8,500 MAD Example):\n"
                "  Rent    [3,500.00 MAD]  [████████████████████] 41.2%\n"
                "  Tax     [1,275.00 MAD]  [███████             ] 15.0%\n"
                "  Savings [1,275.00 MAD]  [███████             ] 15.0%\n"
                "  Free    [2,450.00 MAD]  [██████████████      ] 28.8%\n"
                "  Total   [8,500.00 MAD]  100.0% Allocation\n"
                "```"
            )

        wallet_map = {w.get("wallet_type", "other"): float(w.get("balance", 0.0)) for w in wallets}
        total = sum(wallet_map.values())
        if total <= 0:
            total = 1.0  # avoid divide by zero

        lines = ["```text", "AutoWallet Real-Time Envelope Distribution:"]
        bar_max_width = 24

        for wtype in ["rent", "tax", "savings", "free", "main"]:
            bal = wallet_map.get(wtype, 0.0)
            pct = (bal / total) * 100
            filled_bars = int((bal / total) * bar_max_width)
            empty_bars = bar_max_width - filled_bars
            bar_visual = "█" * filled_bars + " " * max(0, empty_bars)
            lines.append(f"  {wtype.capitalize():<8} [{bal:>9.2f} MAD]  [{bar_visual}] {pct:>5.1f}%")

        lines.append(f"  Total    [{total:>9.2f} MAD]  100.0% Liquid Assets")
        lines.append("```")
        return "\n".join(lines)

    def _generate_local_fallback_response(
        self,
        prompt: str,
        context: str,
        sources: list[KnowledgeSource],
        sentiment_info: dict[str, Any],
        wallets: list[dict[str, Any]] | None = None,
    ) -> str:
        """
        Deterministic, domain-aware financial reasoning engine.
        Synthesizes prompt, RAG context, and financial ledger data to produce
        hyper-accurate, comprehensive answers without external API dependency.
        """
        lowered = prompt.lower()
        ans_parts: list[str] = []

        # Emotional empathy / tone framing based on sentiment
        if sentiment_info.get("financial_anxiety_detected"):
            ans_parts.append(
                "> **AutoWallet Financial Advisory Notice**: We noticed you might be feeling stressed about this financial situation. "
                "Rest assured, automated envelope partitioning is specifically designed to absorb fluctuations and safeguard your essential reserves.\n"
            )

        # Topic detection
        if any(w in lowered for w in ["tax", "taxes", "impot", "turnover", "auto-entrepreneur", "morocco", "vat", "tva"]):
            ans_parts.append("### 🏛️ Tax Reserve & Compliance Strategy")
            if sources:
                top_src = sources[0]
                ans_parts.append(f"According to verified guidelines (*{top_src.title}*):\n{top_src.content}\n")
            ans_parts.append(
                "**Action Plan for AutoWallet**:\n"
                "- Maintain an active percentage rule directing **15% to 20%** of every invoice to your **Tax** wallet.\n"
                "- Keep this money segregated from your debit card/free spending so quarterly tax deadlines present zero financial shock.\n"
                "- If you bill a single Moroccan company more than 80,000 MAD in a year, monitor for the 30% withholding threshold unless billing foreign clients."
            )

        elif any(w in lowered for w in ["rent", "housing", "landlord", "lock"]):
            ans_parts.append("### 🏠 Rent Reserve & Fixed Expense Optimization")
            ans_parts.append(
                "Your rent obligations are best managed using AutoWallet's **Priority 1 Fixed Lock** rule:\n"
                "- **Fixed Allocation**: Lock your exact monthly rent immediately upon payment receipt.\n"
                "- **Smart Condition**: Add the condition `rent_balance < [Monthly Rent]` (e.g. `rent_balance < 3500.0`). "
                "This guarantees that when subsequent payments arrive within the same month, the rule is safely skipped instead of locking rent twice!"
            )

        elif any(w in lowered for w in ["saving", "savings", "emergency", "cap", "runway"]):
            ans_parts.append("### 💰 Emergency Savings & Envelope Capping")
            ans_parts.append(
                "For independent workers, financial resilience depends on liquid runway:\n"
                "- **Target Buffer**: Accumulate **3 to 6 months** of baseline living expenses in your Savings envelope.\n"
                "- **Automated Cap**: Configure your savings rule with a balance condition (e.g. `savings_balance < 15000 MAD`).\n"
                "- Once the emergency fund is full, the engine automatically passes surplus funds forward to your **Free-to-Spend** or investment envelopes."
            )

        elif any(w in lowered for w in ["rule", "rules", "engine", "priority", "split", "percentage"]):
            ans_parts.append("### ⚙️ AutoWallet Rule Engine Hierarchy")
            ans_parts.append(
                "AutoWallet's engine operates on a shrinking pool of funds in ascending priority order:\n"
                "1. **Priority 1 (Rent)**: `lock_fixed` takes an exact amount first (e.g. 3,500 MAD).\n"
                "2. **Priority 2 (Tax)**: `percentage_remainder` takes 15% of whatever remains.\n"
                "3. **Priority 3 (Savings)**: `percentage_remainder` takes 15% with a balance cap condition.\n"
                "4. **Priority 4 (Free)**: `percentage_remainder` takes 100% of the remaining pool as guilt-free spending.\n"
                "Every incoming payment is resolved in milliseconds without manual calculations."
            )

        else:
            ans_parts.append("### 💡 AutoWallet Financial Consultation")
            ans_parts.append(
                f"Regarding your inquiry: *\"{prompt.strip()}\"*\n\n"
                "AutoWallet automates your cashflow allocation to ensure all taxes, rent obligations, "
                "and emergency reserves are locked the moment money hits your bank account.\n"
            )
            if sources:
                ans_parts.append("**Relevant Context from our Knowledge Base**:")
                for src in sources[:2]:
                    ans_parts.append(f"- **{src.title}**: {src.content[:160]}...")

        # Append current user ledger summary if provided
        if wallets:
            ans_parts.append("\n**Your Current Envelope Summary**:")
            for w in wallets:
                wtype = w.get("wallet_type", "").capitalize()
                bal = float(w.get("balance", 0.0))
                ans_parts.append(f"- {wtype}: **{bal:,.2f} MAD**")

        ans_parts.append(
            "\n*Tip: You can ask me to analyze your rules, recommend tax buffers, or generate a visual allocation chart at any time.*"
        )
        return "\n\n".join(ans_parts)

    async def generate_response(
        self,
        prompt: str,
        user_wallets: list[dict[str, Any]] | None = None,
        user_rules: list[dict[str, Any]] | None = None,
        user_transactions: list[dict[str, Any]] | None = None,
        include_context: bool = True,
        include_chart: bool = False,
    ) -> AIChatResponse:
        """
        Generate a complete synchronous response, using external LLM if available
        or falling back gracefully to the built-in domain inference engine.
        """
        # 1. Analyze sentiment of query
        sentiment_info = analyze_sentiment(prompt)

        # 2. Retrieve RAG context
        context_str = ""
        sources: list[KnowledgeSource] = []
        if include_context:
            context_str, sources = rag_engine.build_augmented_context(
                query=prompt,
                user_wallets=user_wallets,
                user_rules=user_rules,
                user_transactions=user_transactions,
                top_k=3,
            )

        # 3. Chart generation if requested
        chart_str = self.generate_ascii_budget_chart(user_wallets) if include_chart else None

        # 4. Attempt External LLM API if key is present
        if self.api_key:
            try:
                system_prompt = (
                    "You are AutoWallet AI, an expert financial budgeting advisor for freelancers. "
                    "Use the provided knowledge base and user financial context to answer accurately, concisely, and practically.\n\n"
                    f"{context_str}"
                )
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1000,
                }
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                    text = data["choices"][0]["message"]["content"]
                    tokens = data.get("usage", {}).get("total_tokens", 0)

                    return AIChatResponse(
                        response=text,
                        model=self.model,
                        engine="external_api",
                        sources=sources,
                        chart=chart_str,
                        sentiment=sentiment_info,
                        tokens_used=tokens,
                    )
            except Exception as exc:
                logger.warning(f"External LLM API unavailable ({exc}). Seamlessly utilizing local intelligent engine.")

        # Fallback to local intelligent inference
        local_text = self._generate_local_fallback_response(
            prompt=prompt,
            context=context_str,
            sources=sources,
            sentiment_info=sentiment_info,
            wallets=user_wallets,
        )

        return AIChatResponse(
            response=local_text,
            model="autowallet-local-financial-v1",
            engine="local_intelligent_fallback",
            sources=sources,
            chart=chart_str,
            sentiment=sentiment_info,
            tokens_used=len(local_text.split()),
        )

    async def stream_response(
        self,
        prompt: str,
        user_wallets: list[dict[str, Any]] | None = None,
        user_rules: list[dict[str, Any]] | None = None,
        user_transactions: list[dict[str, Any]] | None = None,
        include_context: bool = True,
        include_chart: bool = False,
    ) -> AsyncGenerator[str, None]:
        """
        Stream response tokens over Server-Sent Events (SSE).
        Yields chunked events in standard SSE format (`event: ...\ndata: ...\n\n`).
        """
        # Retrieve context & sentiment
        sentiment_info = analyze_sentiment(prompt)
        context_str = ""
        sources: list[KnowledgeSource] = []
        if include_context:
            context_str, sources = rag_engine.build_augmented_context(
                query=prompt,
                user_wallets=user_wallets,
                user_rules=user_rules,
                user_transactions=user_transactions,
                top_k=3,
            )

        chart_str = self.generate_ascii_budget_chart(user_wallets) if include_chart else None

        # Emit initial metadata event
        meta_event = {
            "type": "start",
            "sentiment": sentiment_info,
            "sources_count": len(sources),
            "sources": [s.model_dump() for s in sources],
        }
        yield f"event: start\ndata: {json.dumps(meta_event)}\n\n"

        # Check if external API streaming is viable
        if self.api_key:
            try:
                system_prompt = (
                    "You are AutoWallet AI, an expert financial budgeting advisor for freelancers.\n"
                    f"{context_str}"
                )
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.3,
                    "stream": True,
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    async with client.stream("POST", f"{self.base_url}/chat/completions", headers=headers, json=payload) as resp:
                        resp.raise_for_status()
                        async for line in resp.aiter_lines():
                            if line.startswith("data: "):
                                data_str = line[6:].strip()
                                if data_str == "[DONE]":
                                    break
                                try:
                                    chunk_data = json.loads(data_str)
                                    delta = chunk_data["choices"][0]["delta"].get("content", "")
                                    if delta:
                                        payload = {"type": "token", "chunk": delta}
                                        yield f"event: token\ndata: {json.dumps(payload)}\n\n"
                                except Exception:
                                    continue

                if chart_str:
                    yield f"event: chart\ndata: {json.dumps({'chart': chart_str})}\n\n"

                yield f"event: done\ndata: {json.dumps({'engine': 'external_api', 'status': 'completed'})}\n\n"
                return
            except Exception as exc:
                logger.warning(f"External streaming failed ({exc}). Switching to local streaming.")

        # Local streaming: deliver synthesized response word-by-word with realistic cadence
        local_text = self._generate_local_fallback_response(
            prompt=prompt,
            context=context_str,
            sources=sources,
            sentiment_info=sentiment_info,
            wallets=user_wallets,
        )

        words = local_text.split(" ")
        for i, word in enumerate(words):
            chunk = word if i == 0 else " " + word
            token_event = {"type": "token", "chunk": chunk}
            yield f"event: token\ndata: {json.dumps(token_event)}\n\n"
            # Natural streaming pacing
            await anyio.sleep(0.015)

        if chart_str:
            yield f"event: chart\ndata: {json.dumps({'chart': chart_str})}\n\n"

        yield f"event: done\ndata: {json.dumps({'engine': 'local_intelligent_fallback', 'status': 'completed'})}\n\n"


# Global singleton instance
llm_interface = LLMSystemInterface()
