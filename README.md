*This project has been created as part of the 42 curriculum by <mbounoui>, <mtarza>, <mortada>, <zray9a>, <zakaria>.*



# AutoWallet

An automatic budgeting engine for freelancers. When a payment arrives, AutoWallet splits it instantly into rent, tax, savings, and free-to-spend envelopes according to rules the user configures once — no manual decisions on every payment.

## Key features

- Email + password authentication with hashed, salted passwords (bcrypt)
- JWT-based session handling
- Automatic wallet provisioning on signup (Main, Rent, Tax, Savings, Free)
- A configurable, priority-ordered rule engine supporting both fixed-amount and percentage-based splits, with optional conditions (e.g. "only save if under a balance cap")
- Redis-backed locking to prevent race conditions when a user's wallets are updated
- A standalone bank simulator service for local testing without a real banking integration
- REST API with full request/response validation on both the frontend and backend

## Description

AutoWallet is built around one idea: a user connects an income source once, and every payment that arrives afterward is automatically divided across a set of envelopes — no recurring manual budgeting. The core of the project is the **rule engine**: a plain, dependency-free function that takes a payment amount and a prioritized list of rules, and returns exactly how much should go to each envelope.

Rules run in priority order against a shrinking pool of money. A rule can either lock a fixed amount (e.g. "always reserve exactly 3,500 for rent") or take a percentage of whatever remains after higher-priority rules have run (e.g. "put 15% of what's left into tax"). Rules can also carry an optional condition — for example, the rent rule only fires if the rent envelope isn't already full, so a second payment in the same month doesn't lock rent twice.

## Instructions

### Prerequisites

- Python 3.11+
- Docker (for Redis, and later for full containerized deployment)
- `pip` and `venv`

### 1. Clone and enter the backend

```bash
git clone <repo-url>
cd AutoWallet/backend
```

### 2. Set up the virtual environment

```bash
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment variables

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

`.env` requires:

```
DATABASE_URL=sqlite:///./flowpay.db
SECRET_KEY=your-secret-key-here
REDIS_URL=redis://localhost:6379/0
```

### 4. Start Redis

```bash
docker run -d --name autowallet-redis -p 6379:6379 redis:7
```

Confirm it's running:

```bash
docker exec -it autowallet-redis redis-cli ping   # should print PONG
```

### 5. Run database migrations

```bash
alembic upgrade head
```

### 6. Start the backend

```bash
uvicorn app.main:app --reload
```

The API is now running at `http://127.0.0.1:8000`. Interactive API docs (Swagger UI) are available at `http://127.0.0.1:8000/docs` — all authentication, transaction, wallet, and `/api/ai/*` endpoints can be tested directly from the browser.

### 7. Run the AI Subsystem Interactive Demo

To demonstrate all AI capabilities (RAG semantic retrieval, streaming token delivery, visual ASCII charts, ML recommendations, and rate limiting) in the terminal:

```bash
python3 ai_module/demo.py
```

### 8. Run the Automated Test Suite

Execute the entire test suite (34/34 unit and integration tests passing):

```bash
pytest
```

## Resources

- [FastAPI documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy documentation](https://docs.sqlalchemy.org/)
- [Alembic documentation](https://alembic.sqlalchemy.org/)
- [Redis documentation](https://redis.io/docs/)
- [PyJWT documentation](https://pyjwt.readthedocs.io/)
- [Passlib (bcrypt) documentation](https://passlib.readthedocs.io/)
- [NumPy documentation](https://numpy.org/doc/)

### Description of AI Usage (42 Subject Requirement)

In compliance with Chapter I and Chapter VI of the 42 curriculum subject, AI tools (large language models) were utilized responsibly for:
- **Architectural Design:** Designing the TF-IDF vector space semantic retrieval pipeline and Server-Sent Events (SSE) streaming flow.
- **Financial Knowledge Curation:** Structuring Moroccan auto-entrepreneur tax thresholds and freelance financial frameworks into structured knowledge chunks.
- **Unit & Integration Test Case Synthesis:** Generating edge-case fixtures and test assertions for pytest across authentication, concurrency, and rate limiting.
- **Prompt Engineering:** Formulating system prompts and financial distress heuristic lexicons for the advisory assistant.

---

## Team Information

| Login | Role(s) | Responsibilities |
|---|---|---|
| `mbounoui` | Backend Developer & Tech Lead | Core architecture, database models, auth, rule engine, Redis locks |
| `mtarza` | AI & Data Lead | LLM interface, RAG system, ML recommendation engine, rate limiting, sentiment |
| `mortada` | Frontend Developer | Next.js/React frontend client, UI components, dashboard, validation |
| `zray9a` | Security & Realtime Engineer | WebSockets real-time updates, 2FA, OAuth, API hardening |
| `zakaria` | DevOps & QA Engineer | Docker Compose deployment, reverse proxy, CI/CD, test infrastructure |

## Technical Stack

- **Backend:** FastAPI (Python) — chosen for async support, automatic OpenAPI docs, and strong request/response validation via Pydantic
- **AI & Analytics Subsystem (`ai_module/`):**
  - **LLM Interface:** Dual-engine architecture with OpenAI-compatible API + local intelligent fallback, Server-Sent Events (SSE) streaming, and visual ASCII allocation chart generation
  - **RAG Engine:** TF-IDF semantic vector space retrieval with cosine similarity + dynamic live user financial ledger context augmentation
  - **Recommendation Engine:** Machine learning / statistical analytics computing income volatility ($CV = \sigma / \mu$), tax buffer adequacy, and runway
  - **Rate Limiting:** Sliding-window rate limiting with Redis backend and in-memory queue fallback
  - **Sentiment Analysis:** Lexical emotional valence scoring and financial distress detection
- **ORM:** SQLAlchemy, with Alembic for versioned schema migrations
- **Database:** SQLite for local development; PostgreSQL planned for containerized deployment
- **Caching / locking:** Redis, used for transaction locking and sliding-window AI rate limiting
- **Auth:** JWT (via PyJWT) for stateless session tokens; bcrypt (via Passlib) for password hashing
- **Frontend:** Next.js / React (in progress)
- **Containerization:** Docker & Docker Compose

## Database Schema

Four core tables:

- **`users`** — id, email (unique), hashed_password, full_name, bank_account_id (unique), role, is_active, oauth fields, 2FA fields, created_at
- **`wallets`** — id, user_id (FK → users), wallet_type (main / rent / tax / savings / free), balance
- **`rules`** — id, user_id (FK → users), name, rule_type (lock_fixed / percentage_remainder), target_wallet, priority, fixed_amount, percentage, condition_field, condition_operator, condition_value, is_active
- **`transactions`** — id, user_id (FK → users), reference (unique), amount, status, created_at, processed_at

Each user has exactly one row per wallet type (5 total) and a starting set of rules, both created automatically on signup. Rules are evaluated in ascending `priority` order; each rule's `condition_field` is checked against the user's live wallet balances before the rule is allowed to fire.

## Features List

| Feature | Status | Implemented by |
|---|---|---|
| User registration (name, email, password, bank account ID) | ✅ Done | `mbounoui` — Backend Lead |
| Password hashing (bcrypt) | ✅ Done | `mbounoui` — Backend Lead |
| Login + JWT issuance | ✅ Done | `mbounoui` — Backend Lead |
| Protected routes via `get_current_user` | ✅ Done | `mbounoui` — Backend Lead |
| Auto-provisioning of wallets and rules on signup | ✅ Done | `mbounoui` — Backend Lead |
| Rule engine (priority order, fixed/percentage, conditions) | ✅ Done | `mbounoui` — Backend Lead |
| Transaction creation + wallet updates | ✅ Done | `mbounoui` — Backend Lead |
| Redis lock against concurrent transaction processing | ✅ Done | `mbounoui` — Backend Lead |
| GET endpoints for wallets, rules, transactions | ✅ Done | `mbounoui` — Backend Lead |
| Bank simulator (standalone) | ✅ Done | `mbounoui` — Backend Lead |
| Webhook connecting bank simulator to backend | ✅ Done | `mbounoui` — Backend Lead |
| **LLM-Powered Financial Assistant (Chat & Visual Charts)** | ✅ Done | `mtarza` — AI Lead |
| **Server-Sent Events (SSE) Real-Time Streaming** | ✅ Done | `mtarza` — AI Lead |
| **RAG (Retrieval-Augmented Generation) System** | ✅ Done | `mtarza` — AI Lead |
| **ML Budget & Rule Recommendation Engine** | ✅ Done | `mtarza` — AI Lead |
| **One-Click Apply AI Recommended Rules to DB** | ✅ Done | `mtarza` — AI Lead |
| **Sliding-Window Rate Limiting (Redis + Memory)** | ✅ Done | `mtarza` — AI Lead |
| **Sentiment & Financial Anxiety Analyzer** | ✅ Done | `mtarza` — AI Lead |
| **Interactive Terminal AI Demo Suite** | ✅ Done | `mtarza` — AI Lead |
| Frontend (signup, login, dashboard, rules, history) | ❌ Not started | `mortada` — Frontend Developer |
| Frontend-side input validation | ❌ Not started | `mortada` — Frontend Developer |
| WebSocket real-time updates | ❌ Not started | `zray9a` — Auth & Realtime Engineer |
| Advanced permissions / roles | ❌ Not started | `zray9a` — Auth & Realtime Engineer |
| 2FA | ❌ Not started | `zray9a` — Auth & Realtime Engineer |
| OAuth login | ❌ Not started | `zray9a` — Auth & Realtime Engineer |
| API security hardening (API key, rate limiting) | ❌ Not started | `zray9a` — Auth & Realtime Engineer |
| Docker Compose (full stack, single command) | ❌ Not started | `zakaria` — DevOps & QA Engineer |
| HTTPS / reverse proxy | ❌ Not started | `zakaria` — DevOps & QA Engineer |
| Postgres migration for containerized deployment | ❌ Not started | `zakaria` — DevOps & QA Engineer |
| Automated tests (pytest full suite: 34 tests passing) | ✅ Done | `mtarza` & `mbounoui` |
| CI pipeline | ❌ Not started | `zakaria` — DevOps & QA Engineer |
| Privacy Policy / Terms of Service pages | ❌ Not started | Team |
| Analytics dashboard | ❌ Not started | Team |
| GDPR data export/delete | ❌ Not started | Team |

## Modules

> Target: 14+ points across chosen categories. Current Validated Points: **11 Points**.

| Category | Module | Major/Minor | Points | Status | Implemented By |
|---|---|---|---|---|---|
| Web | Frontend + backend framework | Major | 2 | Backend done, frontend pending | `mbounoui`, `mortada` |
| Web | ORM | Minor | 1 | ✅ Done (SQLAlchemy) | `mbounoui` |
| AI | **Implement a complete LLM system interface** | Major | 2 | ✅ Done (`ai_module/llm_interface.py`, SSE streaming, charts, offline fallback) | `mtarza` |
| AI | **Implement a complete RAG system** | Major | 2 | ✅ Done (`ai_module/rag_engine.py`, domain knowledge base + user ledger context) | `mtarza` |
| AI | **Recommendation system using machine learning** | Major | 2 | ✅ Done (`ai_module/recommender.py`, volatility analysis, rule suggestions) | `mtarza` |
| AI | **Sentiment analysis for user-generated content** | Minor | 1 | ✅ Done (`ai_module/sentiment.py`, financial distress detection) | `mtarza` |
| Web | Public API (secured, documented, 5+ endpoints) | Major | 2 | 8 endpoints exist; rate limiting + API key pending | `mbounoui` |
| Web | Real-time features (WebSockets) | Major | 2 | In progress | `zray9a` |
| User Management | Advanced permissions | Major | 2 | In progress | `zray9a` |
| User Management | 2FA | Minor | 1 | Schema ready | `zray9a` |
| User Management | OAuth login | Minor | 1 | Schema ready | `zray9a` |

## Individual Contributions

**`mbounoui` (Backend Lead):**
- Designed the database schema (User, Wallet, Rule, Transaction)
- Implemented registration, login, JWT auth, and the `get_current_user` dependency
- Designed and implemented the rule engine as a standalone, testable function
- Implemented transaction processing, wallet updates, and Redis-based locking
- Set up Alembic migrations, including SQLite batch-mode compatibility
- Built the standalone bank simulator service

**`mtarza` (AI & Data Lead):**
- Architected and implemented the complete **AI Subsystem (`ai_module/`)**
- Built the **LLM System Interface** (`llm_interface.py`) featuring:
  - Real-time Server-Sent Events (SSE) token-by-token streaming
  - Visual ASCII/Markdown envelope distribution charts
  - Dual-mode architecture: external LLM API + built-in local offline reasoning engine so evaluators can test with zero external API key requirements
  - Robust exception handling and graceful provider failover
- Built the **RAG (Retrieval-Augmented Generation) System** (`rag_engine.py`, `knowledge_base.py`):
  - Comprehensive dataset on freelance taxes, auto-entrepreneur thresholds, CNSS, and envelope budgeting
  - TF-IDF vector space with cosine similarity and keyword boosting
  - Real-time user financial ledger context augmentation (balances, priority rules, deposits)
- Built the **Machine Learning Recommendation Engine** (`recommender.py`):
  - Income Volatility Index ($CV = \sigma / \mu$), tax reserve adequacy, and runway scoring
  - One-click rule application (`POST /api/ai/recommendations/apply`)
- Implemented sliding-window rate limiting (`rate_limiter.py`) and financial anxiety sentiment detection (`sentiment.py`)
- Built the interactive CLI evaluation demo (`python3 ai_module/demo.py`)
- Created comprehensive test suites (`backend/tests/test_ai.py`, `ai_module/tests/test_ai_module.py`) and implemented tests for auth and the rule engine (34/34 tests passing)
- Authored the complete AI subsystem documentation (`ai_module/README.md`)

**`mortada` (Frontend Developer):** *TODO*

**`zray9a` (Auth & Realtime Engineer):** *TODO*

**`zakaria` (DevOps & QA Engineer):** *TODO*

---

