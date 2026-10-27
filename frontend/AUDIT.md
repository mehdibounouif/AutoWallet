# Frontend audit — October 17, 2026

## Current scope

The frontend includes authentication, onboarding, Home, Envelopes and details, Rules, Activity and payment details, Analytics, Assistant, Notifications, Sandbox, and Settings. This update builds on PR #60's reconciled dashboard. Backend code and QA-owned tests are unchanged.

## Completed frontend work

- Integrated interactive analytics charts and formatted AI responses into the existing dashboard; the older `/analytics`, `/assistant`, and `/account/privacy` URLs redirect to dashboard pages.
- Preserved one shared SSE reader, validated API clients, authenticated payment refresh, reconnect/resynchronization, and cancellation on navigation.
- Connected recovery-code login using `recovery_code`, with the backend's 32-character hexadecimal format. Passwords stay in memory during the login handoff.
- Displayed recovery codes returned by 2FA activation, with copy/download and explicit dismissal. Codes are held in component memory, never local/session storage. Navigation clears them.
- Added recovery-code regeneration using the current password and authenticator code. Incorrect credentials preserve the signed-in session; unknown replacement outcomes explain how to recover. The backend requires a password, so Google-only accounts cannot use this replacement endpoint.
- Connected email verification and resend, including invalid/expired links, cooldowns, and service errors. Both `/verify-email` and the backend's `/auth/verify-email` link path work. StrictMode effect replay reuses the verification request so it does not consume a token twice.
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
- Password recovery/reset, profile/password updates, 2FA disable, session revocation, personal API keys, notification preferences, custom-rule create/delete/reorder/pause, and money transfers still need backend contracts. Their unavailable controls remain explicit.
- Google OAuth, verification/deletion emails, and external Assistant responses require working provider, SMTP and AI configuration. UI checks with fixtures do not verify provider delivery.
- Bank ID validation in the frontend accepts 3–50 digits. Ownership verification and matching backend validation remain separate backend work.
- The current backend uses floating-point money calculations. Shared previews now agree with it, but a future currency-rounding policy must change processing and previews together; displayed allocations can still reflect independent rounding to cents.
- Production frontend Docker/nginx, SPA fallback, API proxying and Compose integration now exist. The earlier note that the Dockerfile was empty is obsolete.
- PR #60's CI run at commit `f8e19eb` passed frontend build/tests but failed backend tests and backend startup checks. Logs identify missing PostgreSQL settings and a missing frontend OAuth callback setting in the standalone smoke test. Stack startup exits before e2e tests; container logs are needed for its exact cause. Those infrastructure failures are outside these frontend edits.

## Verification and limits

The previous PR #60 revision passed build, lint and all 68 existing frontend tests, plus browser checks for desktop/mobile charts, dark mode, redirects, streamed formatting and Privacy navigation. The old October 16 counts of 51 passing / 12 failing tests are superseded.

This update passes the production build, lint and all 68 existing tests across 12 files. Temporary browser checks outside the repository also pass for recovery-code login, download and regeneration, invalid credentials, memory-only secrets, both verification URLs, a single verification request under React StrictMode, expired links, resend failures and cooldown, 320px layouts, and signup preview parity. Browser checks use mocked API responses; they do not verify live backend processing or email delivery. No QA-owned tests or test configuration are edited.

## Refactor pass — October 25, 2026

The frontend was reorganised around a shared design system and a single Tailwind stylesheet:

- Removed all eight feature stylesheets (`dashboard`, `workspace`, `activity`, `envelopes`, `envelopeDetail`, `rules`, `settings`, `dialog`) and moved their rules to semantic Tailwind tokens/utilities.
- Added `components/ui` primitives (button, field/input/reveal input, card, badge, alert, empty state, page/section headers, dialog, popover, switch, skeleton, progress, OTP input, password meter, stepper, language selector).
- Extracted the application shell (`components/layout`) from `DashboardPage`; the page now owns view selection and session orchestration, while `useDashboardData`, `DashboardHeaderTools` and `LinkBankAccountPrompt` own their respective concerns.
- Split Settings into account, password, two-factor, privacy, notifications, and developer modules; Analytics, Activity, Rules, Envelopes, envelope details, Notifications, Sandbox and Assistant views were simplified and deduplicated.
- Applied the same composition pass to oversized feature views: introduced the `Page` template and extracted analytics model/sections/chart card, activity filters/table/mobile list, envelope rule/glance/history/spend dialog, rule preview/row/editor, Home model/rows/payments/skeleton, Assistant message/composer, developer and privacy cards, and the onboarding footer plus payment pipe/allocation breakdown. The largest view controllers are now under ~17 KB; the remaining large files are content data (Legal, i18n) and cohesive multi-step state machines (AuthCard, OnboardingPage, TwoFactorSettings).
- Added `auth/session.ts`, `hooks/useCopyToClipboard.ts`, `hooks/useMediaQuery.ts`, `hooks/useOnlineStatus.ts`, `utils/cn.ts`, and `utils/download.ts` to remove repeated ad-hoc logic.
- Standardised icons on `lucide-react`, replaced literal colours with tokens, and fixed all pre-existing ESLint errors (the stale theme attribute, a useless assignment, unsafe `any` lookups, and a synchronous effect setState).
- Moved all French/Arabic content into `i18n`: the full legal documents now live in `i18n/legal/{en,fr,ar}.ts`, inline translated conditionals in Home/envelope components became typed keys, and generated rule/envelope descriptions use placeholder templates in the locale files. No feature component selects copy with `lang === 'fr' | 'ar'` anymore.

Verification: `tsc -b` passes, ESLint passes with zero errors, all 13 test files (71 tests) pass, and the production build succeeds. Test assertions were not changed; only three imports were updated for the moved password-meter, OTP and language-selector components. The compiled CSS bundle is about 71 kB versus about 129 kB before the refactor. No files outside `frontend/` were modified and no runtime dependency was added.
