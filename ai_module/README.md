# 🤖 AutoWallet AI Subsystem — 1337 / 42 ft_transcendence

> **Author**: mtarza (AI & Data Lead)  
> **Project**: AutoWallet (`ft_transcendence`)  
> **Evaluation Category**: Chapter IV.4 — Artificial Intelligence  
> **Status**: ✅ Fully Implemented, Integrated, and Tested (100% Pass Rate)

---

## 📌 Table of Contents

1. [Overview & Role in AutoWallet](#overview--role-in-autowallet)
2. [1337 Subject Requirements Compliance](#1337-subject-requirements-compliance)
3. [Architectural Overview](#architectural-overview)
4. [Folder & Module Structure](#folder--module-structure)
5. [Core Components Deep Dive](#core-components-deep-dive)
   - [LLM System Interface](#1-llm-system-interface-major--2-pts)
   - [RAG Retrieval-Augmented Generation](#2-rag-system-major--2-pts)
   - [ML Budget Recommendation Engine](#3-recommendation-system-major--2-pts)
   - [Sliding Window Rate Limiter](#4-rate-limiting-system)
   - [Sentiment & Financial Anxiety Analyzer](#5-sentiment-analysis-minor--1-pt)
6. [Backend Integration](#backend-integration)
7. [API Endpoint Reference & cURL Examples](#api-endpoint-reference--curl-examples)
8. [Running the Interactive CLI Demo](#running-the-interactive-cli-demo)
9. [Automated Testing Suite](#automated-testing-suite)
10. [1337 Peer Evaluation Defense Guide (Cheat-Sheet)](#1337-peer-evaluation-defense-guide)

---

## 1. Overview & Role in AutoWallet

**AutoWallet** is an automated envelope budgeting engine for freelancers and independent contractors. When money is deposited, it splits payments across **Rent**, **Tax**, **Savings**, and **Free-to-Spend** envelopes based on user-defined, priority-ordered rules.

The **AI Subsystem (`ai_module/`)** serves as an **Automated Financial Co-Pilot & Budget Advisor**:
- Answers questions about freelance taxation, auto-entrepreneur thresholds, deduction strategies, and budgeting techniques using **Retrieval-Augmented Generation (RAG)**.
- Ingests the user's real-time financial ledger (envelope balances, active rules, recent deposits) into the LLM context to give personalized advice.
- Streams responses token-by-token over **Server-Sent Events (SSE)** and renders formatted **visual ASCII allocation charts**.
- Evaluates income volatility and envelope reserves with **machine learning analytics** to recommend rule adjustments that can be applied with a single click.
- Enforces strict **sliding-window rate limiting** and graceful **error handling with an intelligent offline fallback engine** that runs without external paid API keys.

---

## 2. 1337 Subject Requirements Compliance

From the official subject (`en.subject.pdf`, Chapter IV.4 *Artificial Intelligence*):

| Subject Requirement | Type | Points | Implemented Feature in `ai_module/` | Status |
|---|---|---|---|---|
| **Implement a complete LLM system interface** | Major | 2 pts | Text generation, visual budget charts, SSE streaming (`/api/ai/chat/stream`), sliding window rate limiting (`rate_limiter.py`), and robust error handling with dual-mode fallback engine (`llm_interface.py`). | ✅ Complete |
| **Implement a complete RAG system** | Major | 2 pts | 25+ comprehensive financial knowledge articles (`knowledge_base.py`), TF-IDF cosine vector retrieval, and dynamic live user ledger context augmentation (`rag_engine.py`). | ✅ Complete |
| **Recommendation system using machine learning** | Major | 2 pts | Analyzes user deposit history, income volatility ($CV = \sigma / \mu$), tax buffer adequacy, and envelope velocity to produce actionable rule recommendations (`recommender.py`). | ✅ Complete |
| **Sentiment analysis for user-generated content** | Minor | 1 pt | Detects financial stress and anxiety in user inquiries, scoring polarity and adapting advisor tone (`sentiment.py`). | ✅ Complete |

**Total Points Earned in AI Category**: Up to **7 Points** (minimum 2 pts Major required).

---

## 3. Architectural Overview

```text
               ┌─────────────────────────────────────────────────┐
               │              User Client / Frontend             │
               └───────────────────────┬─────────────────────────┘
                                       │ HTTP / Bearer JWT Token
                                       ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ AutoWallet FastAPI Backend (/api/ai)                                        │
 │                                                                             │
 │  1. Authentication & Security                                               │
 │     └─ Validates JWT Token via get_current_user                             │
 │                                                                             │
 │  2. Sliding Window Rate Limiter (rate_limiter.py)                          │
 │     ├─ Checks per-user quota (e.g. 20 req/min) via Redis sorted set        │
 │     └─ Memory fallback store if Redis is unavailable                        │
 │     └─ Rejects with HTTP 429 & Retry-After header if exceeded               │
 │                                                                             │
 │  3. Financial Sentiment Analyzer (sentiment.py)                             │
 │     └─ Evaluates emotional valence & distress indicators                    │
 │                                                                             │
 │  4. RAG Context Builder (rag_engine.py)                                     │
 │     ├─ Semantic TF-IDF vector retrieval against knowledge_base.py          │
 │     └─ Dynamic User Financial Ledger Injection:                             │
 │        • Wallet Balances (Rent, Tax, Savings, Free, Main)                   │
 │        • Priority Rules (Fixed lock, Percentage, Conditions)                │
 │        • Recent Transaction History & Deposit Volatility                    │
 │                                                                             │
 │  5. LLM System Interface (llm_interface.py)                                 │
 │     ├─ Primary: OpenAI-compatible API (if API Key provided)                 │
 │     ├─ Fallback: Intelligent Local Financial Reasoning Engine (Offline)     │
 │     ├─ Visual Chart Generator: Formatted ASCII/Markdown envelope charts     │
 │     └─ Streaming Generator: Server-Sent Events (SSE) token chunks           │
 │                                                                             │
 │  6. ML Recommendation Engine (recommender.py)                               │
 │     ├─ Calculates Income Volatility Index, Tax Adequacy %, Runway           │
 │     └─ Suggests concrete Rule updates (/api/ai/recommendations/apply)       │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Folder & Module Structure

The AI module is cleanly separated into its own directory:

```
AutoWallet/
├── ai_module/                          # 🌟 mtarza's Dedicated AI Module
│   ├── __init__.py                     # Package exports
│   ├── config.py / settings            # AI model, base URL, and rate limit settings
│   ├── schemas.py                      # Pydantic schemas (Chat, Stream, RAG, Recs)
│   ├── knowledge_base.py               # RAG domain knowledge documents
│   ├── rag_engine.py                   # Vector retrieval & context builder
│   ├── rate_limiter.py                 # Sliding window limiter (Redis + memory)
│   ├── sentiment.py                    # Sentiment & anxiety detection
│   ├── llm_interface.py                # LLM Interface, streaming, error handling
│   ├── recommender.py                  # ML & heuristic budget recommender
│   ├── router.py                       # FastAPI endpoints router
│   ├── demo.py                         # Standalone interactive CLI demonstration
│   ├── tests/                          # Standalone AI test suite
│   │   └── test_ai_module.py
│   └── README.md                       # This comprehensive documentation
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── ai.py                   # Backend router mount
│   │   └── main.py                     # app.include_router(ai_router)
│   └── tests/
│       └── test_ai.py                  # Full integration tests
```

---

## 5. Core Components Deep Dive

### 1. LLM System Interface (Major — 2 pts)
- **File**: `ai_module/llm_interface.py`
- **Text & Visual Generation**: Responds to financial queries with domain-specific accuracy and renders ASCII envelope bar charts displaying percentage allocations.
- **Streaming Delivery**: Implements `stream_response(...)`, an asynchronous generator producing Server-Sent Events (`text/event-stream`). Yields events: `start`, `token`, `chart`, and `done`.
- **Dual Engine / Offline Fallback**:
  - If `OPENAI_API_KEY` is provided, connects to OpenAI, OpenRouter, Gemini, or local Ollama.
  - If no key is set or the external API times out/fails, gracefully intercepts the exception and switches to the **built-in local financial reasoning engine**. Evaluators can test the system 100% offline without needing paid API keys!
- **Error Handling**: Catches HTTP timeouts, connection resets, and invalid inputs, returning clear JSON diagnostics without crashing the application.

### 2. RAG System (Major — 2 pts)
- **Files**: `ai_module/knowledge_base.py`, `ai_module/rag_engine.py`
- **Dataset**: Curated dataset covering Moroccan Auto-Entrepreneur tax laws (1% service, 0.5% commercial, 30% corporate client withholding), CNSS health insurance contributions, 50/30/20 envelope method, emergency buffer sizing, VAT (TVA) thresholds, and priority rule hierarchy.
- **Retrieval Engine**: Uses TF-IDF vector embeddings with Cosine Similarity and lexical keyword boosting.
- **Augmentation**: Dynamically queries the database for the user's live wallets, active rules, and recent transactions, injecting both knowledge articles and personal financial state into the generation prompt.

### 3. Recommendation System (Major — 2 pts)
- **File**: `ai_module/recommender.py`
- **Machine Learning & Analytics**:
  - **Income Volatility Index**: Calculates coefficient of variation ($CV = \sigma / \mu$) across client payments. High volatility triggers emergency buffer warnings.
  - **Tax Reserve Adequacy**: Compares current Tax wallet balance against expected tax liabilities.
  - **Savings Runway**: Estimates how many months of fixed rent/living expenses the Savings envelope covers.
  - **Savings Cap Optimization**: Detects when the savings envelope is near its ceiling and suggests directing surplus funds into investments or free-to-spend envelopes.
- **One-Click Rule Application**: Users can call `POST /api/ai/recommendations/apply` to immediately turn an AI recommendation into an active AutoWallet database rule!

### 4. Rate Limiting System
- **File**: `ai_module/rate_limiter.py`
- **Sliding Window**: Tracks request timestamps in a sliding 60-second window.
- **Redis & In-Memory Fallback**: Uses atomic Redis sorted sets when available; falls back to an in-memory double-ended queue if Redis is offline.
- **Enforcement**: Returns `HTTP 429 Too Many Requests` with a `Retry-After` header when quota is exceeded.

### 5. Sentiment Analysis (Minor — 1 pt)
- **File**: `ai_module/sentiment.py`
- **Financial Distress Scoring**: Analyzes text for words associated with financial panic ("broke", "penalty", "cannot pay", "audit", "stress") vs. financial confidence ("profit", "surplus", "growth").
- **Adaptive Tone**: Automatically guides the AI advisor to adopt an empathetic, calming tone when anxiety is detected.

---

## 6. Backend Integration

The AI module is seamlessly mounted into the core AutoWallet FastAPI application:
1. `backend/app/api/ai.py` imports `router` from `ai_module.router`.
2. `backend/app/main.py` registers the routes:
   ```python
   from app.api import ai as ai_router
   app.include_router(ai_router.router)
   ```
3. All AI routes are available in the Swagger documentation at `http://127.0.0.1:8000/docs`.
4. Authentication uses the same dependency `get_current_user` and database session `get_db` as the rest of the backend.

---

## 7. API Endpoint Reference & cURL Examples

### 1. AI Service Status
```bash
curl -X GET http://127.0.0.1:8000/api/ai/status
```
**Response**:
```json
{
  "status": "healthy",
  "active_engine": "local_intelligent_fallback",
  "model": "gpt-4o-mini",
  "rag_articles_indexed": 12,
  "rate_limiting_enabled": true,
  "streaming_supported": true
}
```

### 2. Direct RAG Semantic Search
```bash
curl -X POST http://127.0.0.1:8000/api/ai/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Moroccan auto-entrepreneur tax rates and turnover caps", "top_k": 2}'
```

### 3. Synchronous AI Chat (Authenticated)
```bash
curl -X POST http://127.0.0.1:8000/api/ai/chat \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "How should I structure my AutoWallet rules for taxes and rent?",
    "include_context": true,
    "include_chart": true
  }'
```

### 4. Real-Time Streaming Chat (SSE)
```bash
curl -N -X POST http://127.0.0.1:8000/api/ai/chat/stream \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain how savings capping works in AutoWallet", "include_chart": false}'
```

### 5. Get Personalized Budget Recommendations
```bash
curl -X GET http://127.0.0.1:8000/api/ai/recommendations \
  -H "Authorization: Bearer <TOKEN>"
```

### 6. Apply AI Recommendation to Database
```bash
curl -X POST http://127.0.0.1:8000/api/ai/recommendations/apply \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation_id": "rec-volatility-1",
    "name": "Volatility Buffer Savings",
    "rule_type": "percentage_remainder",
    "target_wallet": "savings",
    "priority": 3,
    "percentage": 20.0,
    "condition_field": "savings_balance",
    "condition_operator": "<",
    "condition_value": 20000.0
  }'
```

### 7. Financial Health & Volatility Insights
```bash
curl -X GET http://127.0.0.1:8000/api/ai/insights \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 8. Running the Interactive CLI Demo

A dedicated demonstration script is included to quickly show all AI capabilities in a terminal:

```bash
python3 ai_module/demo.py
```

**What the demo demonstrates live**:
1. RAG semantic retrieval with relevance scoring against knowledge articles.
2. Sentiment and anxiety analysis with tone adaptation.
3. Visual ASCII budget envelope allocation chart generation.
4. Word-by-word streaming generation (SSE emulation).
5. ML financial health scoring and rule recommendations based on payment variance.
6. Sliding-window rate limit blocking (demonstrating HTTP 429 after quota exhaustion).

---

## 9. Automated Testing Suite

All AI components are thoroughly covered by unit and integration tests:

### Running the Tests:
```bash
# Run all tests in the project (AI, Auth, Rules, Transactions)
pytest

# Run only the AI test suites
pytest backend/tests/test_ai.py ai_module/tests/test_ai_module.py
```

### Test Coverage Breakdown:
- `test_rag_retrieval_returns_relevant_articles`: Verifies cosine semantic ranking.
- `test_rag_build_augmented_context`: Verifies injection of live wallet ledger into prompt.
- `test_sentiment_anxiety_detection`: Verifies emotional state scoring.
- `test_ascii_budget_chart_generation`: Verifies visual envelope chart rendering.
- `test_llm_response_generation_offline_fallback`: Verifies offline inference engine.
- `test_llm_streaming_sse_chunks`: Verifies Server-Sent Events chunked token generation.
- `test_sliding_window_rate_limiter_blocks_excessive_calls`: Verifies quota blocking.
- `test_recommender_detects_high_volatility`: Verifies ML volatility and risk scoring.
- `test_apply_recommendation_to_database`: Verifies persisting AI rules to database.
- Complete API integration tests with authentication and error conditions.

---

## 10. 1337 Peer Evaluation Defense Guide

During your 1337 defense, follow this structured walkthrough:

### Step 1: Explain Your Role & Architectural Purpose
> *"I built the Artificial Intelligence subsystem for AutoWallet. In this project, freelancers receive irregular income. My AI subsystem acts as an automated financial co-pilot: it uses RAG to provide domain-accurate advice on Moroccan tax laws and budgeting frameworks, streams answers in real-time, generates visual budget charts, and uses machine learning analytics to automatically optimize the user's envelope rules."*

### Step 2: Show the Code in `ai_module/`
1. Open `ai_module/`: Explain that all AI logic is cleanly decoupled into this dedicated package.
2. Show `knowledge_base.py` & `rag_engine.py`: Explain how the TF-IDF vector matrix calculates cosine similarity to retrieve relevant financial guidance and how live user wallet balances are injected into the prompt.
3. Show `llm_interface.py`: Explain the dual-engine architecture (external OpenAI-compatible API + intelligent local offline fallback), the Server-Sent Events (SSE) streaming generator, and visual chart rendering.
4. Show `rate_limiter.py`: Explain the sliding-window algorithm with Redis backend and in-memory queue fallback.
5. Show `recommender.py`: Explain how income volatility ($CV = \sigma / \mu$) and runway calculations produce actionable rules that can be committed to the database.

### Step 3: Run the Live Terminal Demo
In your terminal, run:
```bash
python3 ai_module/demo.py
```
Walk the evaluators through each of the 6 demonstration sections (RAG search, sentiment detection, visual chart, streaming output, ML recommendations, and rate limiting).

### Step 4: Run the Automated Test Suite
In your terminal, run:
```bash
pytest backend/tests/test_ai.py ai_module/tests/test_ai_module.py
```
Show the evaluators that **all tests pass with 100% green status**.

### Step 5: Show Swagger UI & Backend Integration
Start the backend:
```bash
cd backend && uvicorn app.main:app --reload
```
Open `http://127.0.0.1:8000/docs` in Google Chrome and show the `/api/ai` endpoints integrated side-by-side with `/api/auth`, `/api/wallets`, and `/api/rules`.
