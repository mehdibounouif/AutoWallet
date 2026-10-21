# Frontend audit — October 21, 2026

## Current scope

The frontend includes authentication, onboarding, Home, Envelopes and details, Rules, Activity and payment details, Analytics, Assistant, Notifications, Sandbox, and Settings. This update builds on PR #60's reconciled dashboard. Backend code and QA-owned tests are unchanged.

## Latest fixes and optimizations

- Update Vite to 8.3.3 and refresh its required build dependencies; the dependency audit reports zero vulnerabilities.
- Disable all Rules amount, percentage, slider, and savings-cap inputs during saving and reconciliation.
- Protect dashboard bank linking and password recovery/reset against input changes and navigation during submission. Reset-link success copy and resends use the submitted email address.
- Separate envelope actions from descriptive content while preserving full-card pointer activation and keyboard focus. Use visible content for mobile Activity button names and include avatar initials in the account-menu name.
- Integrate main's GDPR gateway authorization and payment splits in JSON/CSV exports. Regular transaction responses still lack historical dates and allocations. Active Compose now configures the gateway origin as `https://localhost`.
- Keep security panels stable during recovery-code generation: disable competing two-factor actions until the request settles so the recovery form stays mounted and can display its new codes or error.
- Bound long payment-reference breadcrumbs within the dashboard header at tablet/desktop widths. Shared breadcrumb styles now live with the shared header; search and account controls stay on screen.
- Give signup receipt percentage chips intrinsic column space beside their run status. Large amounts wrap/stack within balances, receipts and split previews instead of widening their containers; native inputs remain bounded.
- Accept omitted zero-value wallets only when the recorded payment split is complete. Preserve explicitly returned wallet amounts and require history to reconcile with the current balance; missing or unconfirmed allocations remain unavailable.
- Improve onboarding envelope-note/badge contrast, give Analytics histogram bars valid image semantics, and make the horizontally scrolling API example a named keyboard-focusable region.
- Protect signup registration, onboarding rule saving, and final sign-in against Back/Forward navigation and reload, including requests made before a sign-in token exists. Release protection before response-driven redirects, reject duplicate submissions, preserve non-secret drafts, and offer prefilled sign-in recovery when account creation cannot be confirmed.
- Centralize readable light-theme muted text and shared status-pill foregrounds. Home and payment fallback text now use the shared theme token; obsolete dark-mode utility overrides are removed. Status pills and success notices retain readable foreground/background pairs in both themes.
- Coordinate pending payment recording, account-deletion requests, rule saves, and security/recovery flows through one router blocker. Keep pending dialogs mounted on Back/Forward and warn before reload/close; show the result and release navigation after completion. Session cleanup and account-deletion redirects remain allowed.
- Bound Activity loading placeholders to the container and wrap mobile month headings/totals, including 60-payment histories at 320px. Use existing theme tokens for Activity, Envelopes, Rules, dashboard links, Analytics and Assistant interaction colors so hover/selected states and priority badges stay readable in dark mode.
- Return keyboard focus to menu triggers after Escape without moving focus on outside clicks or interfering with modal dialogs. Correct the README's obsolete unsupported-2FA claim and document the extracted dashboard loading/navigation components.
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

- The latest read-only runtime check found no running Compose services and no backend listening at `http://127.0.0.1:8000`. An earlier runtime check found an older API missing newer routes, but that service is no longer available to inspect. Start/rebuild the intended stack or configure the correct proxy target, then verify authenticated workflows. Source/fixture checks do not confirm deployed backend behavior.
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

October 21 fix verification: lint, production build, and all 68 existing tests pass. Temporary browser checks pass for 30 combinations of five affected routes, three widths (320, 768, 1440px), and light/dark themes, with no detected page overflow, automated accessibility violations, or uncaught application errors. Six envelope interaction checks confirm keyboard focus/activation and full-card clicks. Twelve delayed-request scenarios confirm bank-link and signed-out recovery/reset input disabling, blocked internal navigation, unload protection, correct submitted-email confirmation, and guard release after success or server error. These 48 checks use simulated responses; recovery/reset backend endpoints remain absent. QA-owned files were not edited.

The latest fix checks cover 50 combinations of five affected workspace routes, five viewport widths (320–1440px), and light/dark themes. No page/container overflow, automated accessibility violations, or uncaught application exceptions were found in those cases. All five signup steps also complete at 320, 768 and 1440px with no reported layout/accessibility failures. Receipt chips no longer overlap status text at 850, 1024 or 1440px. Recovery-code generation keeps competing security controls disabled and displays the returned codes; sparse complete splits, explicitly recorded wallet amounts, missing/incomplete omitted amounts, and balance reconciliation are checked separately. Keyboard scrolling of the API example and SSE-triggered balance refresh also pass. These browser checks use controlled responses and temporary scripts outside the repository; QA-owned tests remain unchanged.

Lint, the strict production build and all 68 existing tests across 12 files pass. Temporary browser checks outside the repository verify notification loading/history/errors, selective API reads and cache refresh, pending rule-save navigation/reload protection, reset URL handling, navigation focus/titles, login failure/rate-limit states, and Clipboard API fallback.

October 19 fix verification also covers pending payment and account-deletion Back/unload protection, guard release after errors, payment-reference retention after an uncertain result, and the successful deletion sign-in redirect. Recovery-code Stay/Leave, Back, Escape, focus, and cross-tab logout pass at 320px and 1440px. Delayed-read layouts fit at 320px, 768px and 1440px; 60-payment Activity histories with long references fit at 320px, 390px, 768px, 1024px and 1440px. Dark Activity hover and desktop/mobile menu focus pass, including switching filter triggers and outside-click focus behavior. Signup still completes all five steps at 320px with controlled responses.

Signup regression checks now cover token-free registration, duplicate submits, blocked Back/unload during registration and rule authentication/writes, successful progression after a blocked Back action, failed/uncertain responses, preserved rule values, prefilled sign-in recovery, and final sign-in redirects at 320px and 1440px. No passwords are stored in local/session storage. A computed-text contrast scan across 17 workspace routes in both themes reports no failures for the visible solid-color text it checks, including processed/pending/failed payment badges and target-met text; this is not a complete accessibility certification.

Additional browser regressions pass for rapid route changes during delayed reads, uncertain rule-write reconciliation, safe removal of stale notification IDs, mobile sorting/More navigation, SSE resynchronization of payments and balances, and cross-tab logout during a blocked rule save. All 96 combinations of 24 routes, desktop/320px widths, and light/dark themes pass without horizontal page overflow or uncaught exceptions, including fallback-font layouts. The Envelopes heading now wraps safely at narrow widths.

Security regression checks also pass for TOTP/recovery-code disabling, input and duplicate-submit guards, pending navigation/reload protection, code cleanup, incorrect credentials without logout, unavailable/uncertain responses, Google-only limitations, Rules authorization retry, and expired-session redirects.

Browser checks use controlled API responses. They do not verify live payment processing, external OAuth/SMTP/AI delivery, every accessibility criterion, or exact Figma matching. QA-owned tests and test configuration are unchanged. The older 51-passing/12-failing counts and the empty-Dockerfile finding are obsolete.

### Historical CI context

PR #60 at `f8e19eb` had backend test/startup failures, including missing PostgreSQL settings and the standalone smoke-test OAuth callback setting. This is historical evidence, not a fresh CI result. Main has since added PostgreSQL examples and changed CI jobs; verify the current branch's GitHub checks separately.

## WebSocket integration boundary after the main merge

The gateway checks a cookie named `access_token` (or its configured cookie name), validates the Origin, and tracks connections per user. The browser login flow still receives a Bearer token and stores it in local storage; no server-issued WebSocket authentication cookie/ticket is provided. Active Compose sets `FRONTEND_ORIGIN` to `https://localhost`; other origins require matching configuration. Redis subscription and application-event forwarding remain empty. Complete those backend/gateway contracts before replacing the frontend's authenticated SSE payment updates. No JavaScript-readable authentication cookie or nonfunctional WebSocket transport was added as a workaround.
