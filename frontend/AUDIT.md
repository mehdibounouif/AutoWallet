# Frontend audit — October 16, 2026

## Scope and result

Reviewed frontend source, imports, routes, styles, assets, dependencies, browser state, and requests against the current backend route handlers and schemas. Applied frontend cleanup while preserving the existing Analytics/live-update work. Backend code, QA test files, local design exports, and the local ZIP were not changed.

**The implemented API features are connected in code. The project is not feature-complete or deployment-ready.** Some screens are intentionally local, and some controls await backend contracts. At this audit's runtime check, `docker compose ps` listed no running services and reported an unset `FRONTEND_GOOGLE_CALLBACK_URL`. These are environment findings, not missing frontend fetch calls.

## Cleanup and fixes completed

| Finding | Change |
| --- | --- |
| Home markup, calculations, and payment rows made the dashboard shell difficult to maintain. | Extracted `HomeView.tsx` and its loading state. DashboardPage decreased from about 35.9 KB to 25.9 KB of source; this is an organization change, not a bundle-size claim. |
| Analytics, Assistant, live-payment, and Settings clients were mixed into page folders. | Grouped those clients in `src/api/` and updated their consumers. Kept the dashboard's feature aggregator/public domain types in place. |
| Wallet identifier lists and API error-detail parsing were repeated. | Added shared wallet types/validation and null-safe string/structured error parsing. Preserved domain-specific API errors and retry metadata. |
| `fetchDashboard` had no callers. | Removed the unused wrapper; retained the account and resource reads used by the dashboard. |
| Notification read state could remain stale in another open tab. | Added storage-event subscriptions, fresh reads when marking items, set-based lookup, and a memory fallback when persistence is blocked. |
| Recovery's empty-email submit remained enabled, and email validation accepted multiple @ characters. | Disabled the empty submit and tightened the shared email check. Existing validation still displays errors before malformed input is sent. |
| Analytics date validation allowed year 0000, which Python dates cannot accept. | Reject that year before making requests. |
| Home could highlight a pending or failed payment as received income. | Highlight only the latest processed payment, while retaining all statuses in recent Activity. Distinguish an empty history from a history with no processed payments. |
| Envelope summaries assumed every condition meant “below,” and comparison labels were duplicated. | Share comparison labels with the preview engine; describe the saved operator and the wallet whose balance is checked. Unknown conditions retain an explicit condition notice. |
| README used a nonexistent Compose service name and described old integration behavior; architecture.md was a stale project-wide snapshot. | Corrected startup instructions and documented current frontend organization, live SSE, API coverage, and unsupported features. |

All 73 current TypeScript source modules are reachable through static or lazy imports. All 10 source stylesheets are imported. No exact duplicate source files were found. Within individual stylesheets, no exact duplicate CSS rules with matching media/at-rule scopes were found. Those checks do not prove that every CSS declaration is necessary. No entire component or design asset was deleted merely because its filename looked obsolete. Dependency usage was reviewed against source and build configuration; no clearly unused package was identified.

## Backend endpoint coverage

| Backend endpoint | Frontend consumer | Status / limit |
| --- | --- | --- |
| `POST /api/auth/register` | Onboarding account step | Connected; existing email/account errors appear at registration. Frontend requires a 3–50 digit ID. |
| `POST /api/auth/login` | Login, two-factor, onboarding; security confirmation | Connected; two-factor and safe return paths supported. |
| `GET /api/auth/me` | Dashboard and Settings | Connected; response lacks security-status metadata. |
| `POST /api/auth/link-bank-account` | Dashboard link form | Connected; records an ID, does not verify bank ownership. |
| `GET /api/auth/oauth/google/login` | Google sign-in button | Connected through browser redirect; needs provider/environment configuration. |
| `GET /api/auth/oauth/google/callback` | Backend Google redirect handler | Indirectly used by the OAuth flow; frontend must not fetch it as a JSON API. |
| `POST /api/auth/oauth/google/exchange` | Frontend Google callback page | Connected; exchanges the code once and restores destination. |
| `POST /api/auth/2fa/setup`, `POST /api/auth/2fa/verify` | Security Settings | Connected; frontend checks existing status before setup. Backend must prevent concurrent replacement of an enabled secret. |
| `GET /api/wallets/` | Home, Envelopes, details, previews | Connected; requires backend and gateway. |
| `GET /api/transactions/`, `POST /api/transactions/` | Dashboard/Activity/details, Record payment | Connected; current response omits `created_at` and `allocations`. |
| `GET /api/rules/`, `PATCH /api/rules/onboarding` | Dashboard Rules and onboarding | Connected; only existing starter-rule values are editable. |
| `GET /api/analytics/summary`, `GET /api/analytics/timeseries` | Analytics | Connected; date, envelope, and interval filters use backend data. |
| `GET /api/analytics/export?format=csv|pdf` | Analytics downloads | Connected; validates MIME/empty responses and releases object URLs. |
| `GET /api/analytics/live` | Payment live-update hook | Connected using authenticated SSE, reconnect/backoff, and resynchronization. |
| `POST /api/ai/chat/stream` | Assistant | Connected; external answers require a configured AI provider. |
| `POST /api/ai/chat` | Optional alternative | Intentionally unused: the UI uses the streaming endpoint. |
| `GET /api/gdpr/export?format=json|csv` | Privacy and data | Connected; JSON or ZIP download; security metadata also read from JSON. |
| `POST /api/gdpr/delete-request`, `POST /api/gdpr/delete-confirm` | Account deletion dialog | Connected; handles code, cooldown, and service errors. Actual email delivery depends on SMTP. |

Health checks and the gateway's authorization endpoint are infrastructure endpoints, not missing UI features. The gateway's `/ws` is still a placeholder; current live updates use the implemented SSE contract.

## Remaining work by owner

### Frontend/backend calculation agreement

The signup payment preview rounds each allocation to cents, while `dashboardSplit.ts` and the backend rule engine retain fractional cents until display. For example, an 8,500.05 payment with Rent 3,500, Tax 15%, and Savings 15% previews Free as 3,612.53 during signup but displays 3,612.54 using the backend calculation. Agree where currency rounding occurs, then use the same rule for signup, Sandbox, actual processing, and receipts. The signup preview still has a separate fixed starter-rule calculation; this is a remaining duplication and contract discrepancy, even though the source files themselves are not duplicates.

### Backend contracts

1. Include payment timestamps and persisted allocations in transaction responses. Current historical split bars, envelope ledgers, receipt detail, and per-payment analytics cannot be complete without them. Analytics aggregate endpoints do work independently; old payments without saved allocations are not automatically backfilled by the new table.
2. Expose 2FA/sign-in status directly on an account read, and atomically reject setup that would overwrite an active authenticator. The frontend's confirmation workaround cannot protect against another client racing it.
3. Add password recovery/reset, email verification/resend, and backup-code verification. Recovery requests currently receive 404 and display unavailable messaging; no email is falsely reported as sent on 404.
4. Add profile/password updates, 2FA disable, session listing/revocation, personal API keys, and server notification/preferences endpoints if these planned Settings features are required.
5. Add custom rule creation/deletion, pause/reorder, and transfer/spend contracts before enabling those actions. Starter-rule edits already save through PATCH.
6. Review global transaction-reference uniqueness/lookup across users. The processor currently searches by reference without user scope, so different users can collide.
7. Enforce the agreed numeric bank-ID rule server-side as well; current schemas only constrain string length. Real bank ownership verification is a separate missing integration.
8. Review gateway role-check consistency: Rules uses authenticated linked-account dependencies but currently omits the gateway `require_client` guard present on other money endpoints.

### Deployment and product decisions

- Configure Google credentials and both callback URLs. The local frontend callback environment variable is currently unset.
- Supply SMTP and AI provider configuration to the backend deployment. Current Compose does not forward those settings or start a mail service.
- Implement the production frontend container/hosting, SPA route fallback, HTTPS and `/api` reverse proxy. Disable response buffering for SSE and allow long-lived streams. `frontend/Dockerfile` is still empty and its Compose service is commented out.
- Sandbox and onboarding previews do not record money. Define a separate backend test-payment contract if persistent sandbox data is wanted.
- Notification lists derive from payment reads; read IDs/theme/payment alerts are local browser preferences, not cross-device account data. Security/rule notification events require a server contract.
- Historical data limits, legal content review, and whether to move Bearer tokens from local storage to HttpOnly cookies need coordinated product/backend decisions. Arbitrary suggested-rule creation and a health score are not supported by current contracts.

## Verification and limits

- Production TypeScript/Vite build, ESLint, and whitespace validation pass.
- Current npm audit: **0 known vulnerabilities**. This is the registry scan for the installed lockfile, not a guarantee of application security.
- Source/import and duplicate scans: no unreachable TS modules, unimported source stylesheets, or exact duplicate source files.
- Browser checks: **14/14** existing regression scenarios passed using API fixtures: Settings independence, cached dashboard errors, notification pagination, password/two-factor/Google destinations, session expiry, cancellation/timeouts, rule and bank-link recovery, Assistant context, and 320px layout.
- Additional browser checks: **5/5** passed, covering cross-tab notification synchronization and merging, blocked-storage fallback, malformed error bodies and input validation, moved Analytics/Assistant clients, and **54 route/viewport combinations** at 320/768/1440px with no detected horizontal overflow or uncaught page errors.
- Follow-up audit: **2/2** focused browser scenarios passed for processed/pending/failed/empty Home states and all five rule comparisons, including conditions on another wallet and unknown operators. Build/lint passed again; the QA suite remained at **51 passed, 12 failed**, with no new failures. Backend route coverage and source reachability were rechecked against the same local revision.
- Existing unchanged QA suite: **51 passed, 12 failed** after cleanup, compared with **50 passed, 13 failed** before cleanup. Empty recovery-email submission now passes. The remaining failures are listed below; the suite is not green.
- This audit's browser checks use controlled API responses and verify frontend behavior/contracts. They do not establish current availability of the stopped local backend, Google, SMTP, or an external AI provider. Earlier Analytics integration work in this workspace also passed 12 scenarios against isolated PostgreSQL/Redis/backend/gateway services, including real CSV/PDF generation and payment events; those services were cleaned up before this audit.

### QA follow-up (test files unchanged)

| Failing expectations | Count | Required QA update |
| --- | --- | --- |
| Dashboard route/action/input expectations | 6 | Account for unavailable Move money, routed payment details, missing Rules/Activity routes in the harness, numeric bank IDs, and formatted text amount input. |
| Tests marked `it.fails` for already-fixed bank-ID/recovery validation | 3 | Convert to ordinary passing tests; the negative-case assertions now succeed. |
| Exact fetch argument assertions | 2 | Allow the AbortSignal added for cancellation/timeouts in Google exchange and onboarding login. |
| Onboarding rules Continue expects an immediate local transition | 1 | Mock and await successful login and rule PATCH before expecting the preview. |

Temporary browser audit scripts/results stay under `/tmp`; no QA-owned test or configuration file was edited.
