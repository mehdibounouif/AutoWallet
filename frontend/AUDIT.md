# Frontend audit — October 18, 2026

## Current scope

The frontend includes authentication, onboarding, Home, Envelopes and details, Rules, Activity and payment details, Analytics, Assistant, Notifications, Sandbox, and Settings. This update builds on PR #60's reconciled dashboard. Backend code and QA-owned tests are unchanged.

## Latest fixes and optimizations

- Guard pending starter-rule saves against router navigation and page unload. Refresh cached resources after success or uncertain outcomes before finishing the save flow; session cleanup remains allowed.
- Load payment notifications on demand from Settings, with distinct loading, failure/retry and empty states. Keep full-page read history after marking it read; the compact popover remains unread-only.
- Report login service failures, invalid credentials and rate limits separately. Respect a bounded Retry-After cooldown. Support the backend's default `/auth/reset-password` URL alongside `/reset-password`, preserving the token.
- Extract account/resource loading into `useDashboardData`, cache successful resources individually for 30 seconds, and fetch missing/stale resources needed by each page. Activity and Notifications do not require wallets or rules. Settings remains independent of money services. Forced refreshes reconcile already-loaded resources after writes/live events; token replacement discards the cache.
- Extract sidebar/mobile navigation and Analytics results from their parent views. Add current-page semantics, route titles/announcements, a skip link, route focus handling that preserves search/form focus, and explicit onboarding field-error associations.
- Add mobile Activity sorting controls, safe pruning of removed notification IDs after complete history reads, and visible Assistant clipboard errors. Clarify unavailable profile/Google-linking actions and the UTC Analytics versus local Activity date boundary.
- Enable TypeScript strict checks for application source. QA-owned test files/configuration remain unchanged.
- Preserve the integrated main changes: 2FA disabling, Rules gateway authorization, PostgreSQL example settings, and WebSocket authentication/origin/connection management. Security settings use password plus exactly one second factor to disable 2FA, reconcile already-off/uncertain outcomes, and protect pending requests and unsaved recovery codes.
- Preserve corrected Activity sorting, immutable Assistant previews, independent resource errors, combined-name validation/FastAPI field errors, shared preview calculations, 25-row Activity pagination, and the friendly route error screen.

### Remaining pagination dependency

Activity pagination currently limits rendered rows, not the API response size. The backend still returns the entire transaction list. Server pagination requires an agreed cursor/page, total/count, filter, and sorting contract, with corresponding frontend integration. No backend routes or response schemas were changed.

## Completed frontend work

- Integrated interactive analytics charts and formatted AI responses into the existing dashboard; the older `/analytics`, `/assistant`, and `/account/privacy` URLs redirect to dashboard pages.
- Preserved one shared SSE reader, validated API clients, authenticated payment refresh, reconnect/resynchronization, and cancellation on navigation.
- Connected recovery-code login using `recovery_code`, with the backend's 32-character hexadecimal format. Passwords stay in memory during the login handoff.
- Displayed recovery codes returned by 2FA activation, with copy/download and explicit dismissal. Codes are held in component memory, never local/session storage. Internal navigation and browser Back/Forward are guarded during code generation and ask for confirmation before discarding unacknowledged codes; closing/reloading the page uses a browser warning. Sign-out and session replacement clear codes without blocking account cleanup.
- Added recovery-code regeneration using the current password and authenticator code. Incorrect credentials preserve the signed-in session; unknown replacement outcomes explain how to recover. The backend requires a password, so Google-only accounts cannot use this replacement endpoint.
- Connected email verification and resend, including invalid/expired links, cooldowns, and service errors. Both `/verify-email` and the backend's `/auth/verify-email` link path work. StrictMode effect replay reuses the verification request so it does not consume a token twice.
- Added visible verification/resend links in Profile settings and after signup registration. Signup opens the verification screen in a separate tab to preserve onboarding progress and in-memory credentials. The profile does not claim a verified status that the API does not provide.
- Synchronized authentication token changes across tabs, including logout, account replacement, and browser-storage clearing. Replacing the dashboard session unmounts old account data, conversations, pending requests, and live-update subscriptions. Expired tokens still use the session-ended screen.
- Removed unused styles for the replaced analytics stacked-column implementation; histogram styles remain in use.
- Reused the Dashboard/Sandbox rule engine in signup's Try a payment preview. Starter rules use zero starting balances; fractional cents are retained during calculation and rounded for display, matching the current backend rule engine.
- Kept the existing input validation, rule saving, cross-tab notification read state, payment error handling, responsive layouts, and theme support.

## Backend endpoint coverage

| API | Frontend use |
| --- | --- |
| `POST /api/auth/register`, `/api/auth/login` | Registration, password/TOTP/recovery-code sign-in |
| `GET /api/auth/me`, `POST /api/auth/link-bank-account` | Account reads and bank ID linking |
| Google OAuth login, callback, exchange | Browser OAuth flow and one-time exchange |
| `POST /api/auth/email/verify`, `/api/auth/email/resend` | Verification link and resend screen |
| `POST /api/auth/2fa/setup`, `/api/auth/2fa/verify` | Authenticator activation and recovery-code display |
| `POST /api/auth/2fa/recovery-codes/regenerate` | Replace recovery codes in Security settings |
| `POST /api/auth/2fa/disable` | Confirm password plus TOTP or recovery code to disable 2FA |
| `GET /api/wallets/`, `GET/POST /api/transactions/` | Balances, activity and payment recording |
| `GET /api/rules/`, `PATCH /api/rules/onboarding` | Rule reads and existing starter-rule edits |
| Analytics summary, timeseries and export | Filtered charts, CSV and PDF downloads |
| `GET /api/analytics/live` | Authenticated SSE events trigger fresh dashboard/analytics reads |
| `POST /api/ai/chat/stream` | Streamed Assistant responses; non-streaming chat is intentionally unused |
| GDPR export, delete-request and delete-confirm | JSON/CSV exports and email-confirmed deletion |

Settings reads account data independently of money services. Local previews do not record payments. Themes, payment-alert preferences, and notification read IDs remain browser preferences.

## Remaining backend and deployment dependencies

- Transaction responses still omit `created_at` and persisted `allocations`; complete historical split bars, ledgers, receipts and per-payment analysis require those fields. Aggregate Analytics APIs are connected separately.
- `/api/auth/me` lacks security metadata. The current security-status workaround uses password confirmation or a user-requested JSON export. The backend rejects setup for an already-enabled authenticator; concurrency behavior remains backend-owned.
- `/api/auth/me` also omits email-verification status, so Settings offers verification/resend without showing a verified/unverified badge.
- Password recovery/reset, profile/password updates, session revocation, personal API keys, notification preferences, custom-rule create/delete/reorder/pause, and money transfers still need backend contracts. Their unavailable controls remain explicit.
- Google OAuth, verification/deletion emails, and external Assistant responses require working provider, SMTP and AI configuration. UI checks with fixtures do not verify provider delivery.
- Bank ID validation in the frontend accepts 3–50 digits. Ownership verification and matching backend validation remain separate backend work.
- The current backend uses floating-point money calculations. Shared previews now agree with it, but a future currency-rounding policy must change processing and previews together; displayed allocations can still reflect independent rounding to cents.
- Production frontend Docker/nginx, SPA fallback, API proxying and Compose integration now exist. The earlier note that the Dockerfile was empty is obsolete.
- Main now includes the restored `Allocation` model and transaction relationship. The earlier missing-model startup finding is resolved in source; deployed payment processing and Analytics still need live verification.

## Verification and limits

Lint, the strict production build and all 68 existing tests across 12 files pass. Temporary browser checks outside the repository verify notification loading/history/errors, selective API reads and cache refresh, pending rule-save navigation/reload protection, reset URL handling, navigation focus/titles, login failure/rate-limit states, and Clipboard API fallback.

Additional browser regressions pass for rapid route changes during delayed reads, uncertain rule-write reconciliation, safe removal of stale notification IDs, mobile sorting/More navigation, SSE resynchronization of payments and balances, and cross-tab logout during a blocked rule save. All 96 combinations of 24 routes, desktop/320px widths, and light/dark themes pass without horizontal page overflow or uncaught exceptions, including fallback-font layouts. The Envelopes heading now wraps safely at narrow widths.

Security regression checks also pass for TOTP/recovery-code disabling, input and duplicate-submit guards, pending navigation/reload protection, code cleanup, incorrect credentials without logout, unavailable/uncertain responses, Google-only limitations, Rules authorization retry, and expired-session redirects.

Browser checks use controlled API responses. They do not verify live payment processing, external OAuth/SMTP/AI delivery, every accessibility criterion, or exact Figma matching. QA-owned tests and test configuration are unchanged. The older 51-passing/12-failing counts and the empty-Dockerfile finding are obsolete.

### Historical CI context

PR #60 at `f8e19eb` had backend test/startup failures, including missing PostgreSQL settings and the standalone smoke-test OAuth callback setting. This is historical evidence, not a fresh CI result. Main has since added PostgreSQL examples and changed CI jobs; verify the current branch's GitHub checks separately.

## WebSocket integration boundary after the main merge

The gateway now checks a cookie named `access_token` (or its configured cookie name), validates the Origin, and tracks connections per user. The browser login flow still receives a Bearer token and stores it in local storage; no server-issued WebSocket authentication cookie/ticket is provided. The active Compose gateway configuration omits `FRONTEND_ORIGIN`, and the Redis subscriber/event forwarding remain empty. Complete those backend/gateway contracts before replacing the frontend's authenticated SSE payment updates. No JavaScript-readable authentication cookie or nonfunctional WebSocket transport was added as a workaround.
