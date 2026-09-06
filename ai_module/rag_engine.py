"""
Retrieval-Augmented Generation (RAG) Engine for AutoWallet.
Combines semantic vector-space TF-IDF retrieval over financial knowledge articles
with dynamic injection of the user's real-time financial ledger and rule configurations.
"""

import math
import re
from collections import Counter
from typing import Any
import numpy as np

from ai_module.knowledge_base import get_all_documents
from ai_module.schemas import KnowledgeSource


class FinancialRAGEngine:
    """
    RAG engine performing semantic retrieval and context augmentation.
    """

    def __init__(self):
        self._documents = get_all_documents()
        self._vocabulary: dict[str, int] = {}
        self._doc_vectors: np.ndarray | None = None
        self._idf: np.ndarray | None = None
        self._build_index()

    def _tokenize(self, text: str) -> list[str]:
        """Tokenize and stem/clean words."""
        cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
        tokens = [w for w in cleaned.split() if len(w) >= 2]
        return tokens

    def _build_index(self):
        """Build TF-IDF inverted index and document matrix."""
        all_tokens_list: list[list[str]] = []
        doc_freq = Counter()

        for doc in self._documents:
            # Combine title, keywords, and content for rich lexical representation
            text = f"{doc['title']} {' '.join(doc.get('keywords', []))} {doc['content']}"
            tokens = self._tokenize(text)
            all_tokens_list.append(tokens)
            doc_freq.update(set(tokens))

        vocab_tokens = [w for w, count in doc_freq.items() if count >= 1]
        self._vocabulary = {w: i for i, w in enumerate(vocab_tokens)}
        vocab_size = len(self._vocabulary)
        num_docs = len(self._documents)

        # Compute IDF
        self._idf = np.zeros(vocab_size)
        for word, idx in self._vocabulary.items():
            df = doc_freq[word]
            self._idf[idx] = math.log((num_docs + 1) / (df + 1)) + 1.0

        # Build Document TF-IDF matrix
        self._doc_vectors = np.zeros((num_docs, vocab_size))
        for doc_idx, tokens in enumerate(all_tokens_list):
            counts = Counter(tokens)
            total = len(tokens) or 1
            for word, cnt in counts.items():
                if word in self._vocabulary:
                    w_idx = self._vocabulary[word]
                    tf = cnt / total
                    self._doc_vectors[doc_idx, w_idx] = tf * self._idf[w_idx]

        # Normalize doc vectors for cosine similarity
        norms = np.linalg.norm(self._doc_vectors, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self._doc_vectors = self._doc_vectors / norms

    def retrieve(self, query: str, top_k: int = 3) -> list[KnowledgeSource]:
        """
        Retrieve the top-K most relevant knowledge passages for a user query.
        Uses cosine similarity in TF-IDF vector space with keyword boosting.
        """
        if not self._vocabulary or self._doc_vectors is None or self._idf is None:
            return []

        tokens = self._tokenize(query)
        if not tokens:
            return []

        query_counts = Counter(tokens)
        query_vec = np.zeros(len(self._vocabulary))
        total_tokens = len(tokens)

        for word, count in query_counts.items():
            if word in self._vocabulary:
                idx = self._vocabulary[word]
                tf = count / total_tokens
                query_vec[idx] = tf * self._idf[idx]

        norm = np.linalg.norm(query_vec)
        if norm > 0:
            query_vec = query_vec / norm

        # Cosine similarities
        scores = np.dot(self._doc_vectors, query_vec)

        # Keyword bonus boost for direct category/keyword exact matches
        boosted_scores = scores.copy()
        query_set = set(tokens)
        for doc_idx, doc in enumerate(self._documents):
            keywords_text = " ".join(doc.get("keywords", [])) + " " + doc["title"]
            doc_keywords = set(self._tokenize(keywords_text))
            common = query_set.intersection(doc_keywords)
            if common:
                boosted_scores[doc_idx] += len(common) * 0.25

        # Rank indices
        top_indices = np.argsort(boosted_scores)[::-1][:top_k]

        results: list[KnowledgeSource] = []
        for idx in top_indices:
            score = float(boosted_scores[idx])
            if score > 0.05:  # Minimum relevance threshold
                doc = self._documents[idx]
                results.append(
                    KnowledgeSource(
                        title=doc["title"],
                        category=doc.get("category", "finance"),
                        content=doc["content"],
                        relevance_score=round(min(1.0, max(0.1, score)), 3),
                    )
                )

        return results

    def build_augmented_context(
        self,
        query: str,
        user_wallets: list[dict[str, Any]] | None = None,
        user_rules: list[dict[str, Any]] | None = None,
        user_transactions: list[dict[str, Any]] | None = None,
        top_k: int = 3,
    ) -> tuple[str, list[KnowledgeSource]]:
        """
        Constructs the complete RAG prompt context containing both verified financial literature
        and the user's live wallet balances and rules.
        """
        sources = self.retrieve(query, top_k=top_k)

        context_lines: list[str] = [
            "=== SYSTEM KNOWLEDGE BASE (RETRIEVED ARTICLES) ==="
        ]
        if sources:
            for i, src in enumerate(sources, 1):
                context_lines.append(
                    f"[{i}] {src.title} (Category: {src.category}, Relevance: {src.relevance_score})\n"
                    f"Content: {src.content}"
                )
        else:
            context_lines.append("No specific knowledge base article matched above confidence threshold.")

        context_lines.append("\n=== USER LIVE FINANCIAL CONTEXT ===")

        if user_wallets:
            context_lines.append("Current Envelope Balances:")
            total_balance = 0.0
            for w in user_wallets:
                wtype = w.get("wallet_type", "unknown")
                bal = float(w.get("balance", 0.0))
                total_balance += bal
                context_lines.append(f"  - {wtype.capitalize()} Envelope: {bal:,.2f} MAD")
            context_lines.append(f"  Total Liquid Capital: {total_balance:,.2f} MAD")
        else:
            context_lines.append("No active wallet balances found.")

        if user_rules:
            context_lines.append("\nActive Auto-Allocation Rules (Executed in Priority Order):")
            for r in sorted(user_rules, key=lambda x: x.get("priority", 99)):
                name = r.get("name", "Unnamed Rule")
                target = r.get("target_wallet", "unknown")
                priority = r.get("priority", 1)
                rtype = r.get("rule_type", "unknown")
                condition = ""
                if r.get("condition_field"):
                    condition = f" [Condition: {r.get('condition_field')} {r.get('condition_operator')} {r.get('condition_value')} MAD]"

                if rtype == "lock_fixed":
                    detail = f"Lock fixed {r.get('fixed_amount', 0):,.2f} MAD"
                else:
                    detail = f"Divert {r.get('percentage', 0)}% of remaining pool"

                context_lines.append(f"  {priority}. {name} -> {target}: {detail}{condition}")
        else:
            context_lines.append("No active rules configured.")

        if user_transactions:
            context_lines.append(f"\nRecent Transaction Ledger (Last {len(user_transactions)} deposits):")
            for tx in user_transactions[:5]:
                amount = float(tx.get("amount", 0.0))
                ref = tx.get("reference", "N/A")
                status = tx.get("status", "processed")
                date = tx.get("created_at", "recent")
                context_lines.append(f"  - Ref: {ref} | Amount: {amount:,.2f} MAD | Status: {status} | Date: {date}")

        return "\n".join(context_lines), sources


# Global singleton instance of RAG engine
rag_engine = FinancialRAGEngine()
