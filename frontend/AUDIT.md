# Frontend audit — October 22, 2026

## Scope and repository state

Audited commit `f1699be` on `feature/frontend-form-accessibility-docs`, after fetching origin and fast-forwarding to the current `origin/main`. PR #113 is already merged; its conflict resolution is included. No new conflict remains.

This audit covers the React routes, API clients, response schemas, authentication and onboarding, dashboard data loading, payment previews, Settings, real-time transport, responsive layouts, accessibility automation, dependencies, file reachability, and production/development routing.

The initial audit updated this document. The subsequent frontend fix pass addresses F1–F4 below in application code and development configuration. Backend source, QA-owned tests, and test configuration were not edited. The existing local README, presentation, and design files were preserved.

## English copy and shared styling follow-up

The later refactor was performed in two passes: English copy first, shared styling
second. Page-specific text now lives in the component that renders it; reused
validation and service messages live in `src/content/messages.ts`. Runtime
translation imports, translation props, the locale file, and the translation type
were removed. `src/i18n/index.ts` temporarily retains only 24 compatibility strings
for the unchanged QA-owned tests. Application code does not import it.

`src/components/ui/` now owns the Tailwind styles for buttons, text inputs, workspace
cards, notices, and authentication panels. Links reuse the same style helpers.
Shared dialogs use Tailwind utilities directly. Semantic color utilities replace
repeated color literals, and workspace tokens preserve light/dark behavior,
including portal dialogs. Duplicate control CSS and obsolete theme overrides were
removed. Page composition, tables, charts, and payment-graphic CSS remain.

Validation messages remain associated with their inputs, and shared inputs use
`aria-invalid` for error styling. `STYLING.md` explains these conventions and the
temporary QA compatibility adapter. Backend API clients and real-time transports
were not changed by this refactor. The backend dependencies below still apply.

Verification after the refactor:

- Lint and production build pass; all 68 existing tests pass without editing QA tests.
- 224 browser screen checks cover 28 routes at 320, 390, 768, and 1440 pixels in
  light and dark themes, with no page overflow or automated accessibility violations.
- 34 additional browser checks cover large amounts and long references, Activity
  without metadata, both second-factor methods, shared retry cooldowns, pending
  navigation, success/error completion, dialog accessibility, validation focus,
  keyboard payment submission, API payloads, and onboarding footer navigation.
- These browser checks use controlled API responses. They verify frontend behavior
  and request contracts; they do not establish that the current Compose database
  or unfinished backend services are operational.
- The README, presentation, backend source, and QA tests remain unchanged by this
  refactor.

### Later local connection verification

The normal Compose stack subsequently started successfully with PostgreSQL 18;
the database, backend, gateway, and frontend reported healthy. This verifies
current startup, not preservation or migration of the earlier PostgreSQL 16 data.

The login endpoint responded through Caddy at `https://localhost`. Vite on port
5173 initially returned HTTP 502 because Caddy's local certificate was not trusted.
Configuring `API_PROXY_CA_FILE` with Caddy's public root certificate restored API
forwarding. An empty login POST through Vite then returned the backend's expected
HTTP 422 missing-field response. No real credentials were used for this check.
The machine-specific `.env.local` and certificate remain ignored by Git; the
portable configuration and setup instructions are included in the frontend.

## Recent upstream changes

- Login now limits failed second-factor attempts using Redis: five failures within the configured window result in HTTP 429 with `Retry-After: 300`. An initial password-only request still returns `401 / 2FA code required`, preserving the frontend handoff.
- Compose now supplies Mailpit SMTP settings and the verification URL `https://localhost/auth/verify-email`.
- Infrastructure cleanup makes Caddy responsible for `/api/*` and `/ws`; frontend nginx serves the SPA and assets.
- Compose upgrades PostgreSQL to 18 with a changed volume mount layout, Redis to 8.10, and pins Mailpit. Backend development dependencies and CI tests were adjusted.
- These commits add no new browser-facing API route or usable WebSocket application event. The frontend's existing route coverage still applies.

## Frontend findings resolved in the working tree

### F1 — Shared 2FA retry cooldown

`src/pages/Auth/TwoFactorCard.tsx` now honors HTTP 429 and the backend's numeric `Retry-After`, with a 60-second fallback and 900-second upper bound. Both TOTP and recovery-code controls display the remaining wait and disable submissions, including OTP auto-submit. Switching methods preserves the same cooldown. The existing countdown hook is reused.

Verified at 320px and 1440px: retries do not issue requests while waiting; the recovery-code modal retains the cooldown; expiry re-enables sign-in; successful sign-in reaches the dashboard. Missing, invalid, zero, fractional, and excessive Retry-After values were checked.

### F2 — Pending second-factor sign-in protection

Both sign-in methods register the shared navigation guard, including when signed out. Back navigation and unload are protected while verification is pending, with the notice visible inside the recovery modal when it is open. A synchronous pending predicate releases protection before successful token installation and navigation. Errors release the guard and keep the result visible; uncertain recovery-code outcomes retain their explanatory message.

Verified both methods at 320px and 1440px with successful, invalid-credential, service-error, and interrupted responses. Back remained on the verification screen during requests, unload warnings were active, success redirects worked after blocked navigation, and warnings were removed after completion.

### F3 — Activity filters reflect available metadata

`src/pages/Dashboard/ActivityView.tsx` now requires received dates for every payment before enabling date filtering, and complete recorded splits for every payment before enabling envelope filtering. Visible notices report missing-data counts. Mixed histories are treated as incomplete rather than silently omitting unknown payments.

When refreshed data becomes incomplete, only the affected date/envelope selections and menu are cleared. Search, amount, and status filters remain available. Empty histories have disabled metadata filters without misleading missing-data messages. Complete sparse splits remain supported by the shared split-completeness helper.

Verified empty, complete, missing, and mixed histories in light/dark themes at 320px and 1440px, including a refresh from complete to incomplete data. These states did not produce page overflow or automated accessibility violations.

### F4 — Development proxy configuration matches Compose

`vite.config.ts` now defaults `/api` to Caddy at `https://localhost`, reads server-only `API_PROXY_` settings from Vite environment files or the shell, and accepts `API_PROXY_CA_FILE` for a trusted local public CA. HTTPS certificate verification remains enabled. A direct host backend is supported with `API_PROXY_TARGET=http://127.0.0.1:8000`.

[DEVELOPMENT.md](DEVELOPMENT.md) documents copying Caddy's public root certificate, setting `.env.local`, starting Vite, and choosing the direct-host alternative. `.env.example` provides the supported settings. Local certificate files are ignored through `.certs/`.

Temporary HTTP and HTTPS servers verified forwarding of the request method, JSON body, Bearer authorization, and SSE. A trusted test certificate succeeded; an untrusted certificate was rejected. These checks exercise the actual Vite configuration. The initial database startup failure was separate from proxy configuration; the later local connection verification above records the now-running stack. A local Caddy CA must be trusted by Node or supplied through `API_PROXY_CA_FILE` as documented.

### Fix verification

- Lint, production build, and all 68 existing tests pass.
- 59 focused browser checks pass: 36 layout/accessibility checks and 23 behavior checks, covering the flows above. Controlled responses were used; the backend was not modified.
- Three proxy scenarios pass: HTTP forwarding, trusted HTTPS forwarding, and untrusted HTTPS rejection. Both successful transports preserve authentication and SSE.
- Temporary verification scripts are outside the repository; QA-owned tests remain unchanged.
- Prior audit results below describe the original base revision. The focused checks in this section cover the subsequent frontend fixes.

## Backend and deployment dependencies

### B1 — Initial PostgreSQL volume startup failure (historical)

`docker compose up -d --build` built the backend, gateway, simulator, and frontend successfully. PostgreSQL then exited because the existing data volume uses the earlier layout/version. Its log reports existing data at `/var/lib/postgresql` and requires an appropriate upgrade/migration for PostgreSQL 18. Dependent backend/frontend services could not start.

**Owner:** infrastructure/database. The old volume was confirmed as PostgreSQL 16. The normal stack now runs PostgreSQL 18, but preservation of the previous data has not been verified. Any remaining old data requires a backup and compatible migration or restore; do not delete an existing volume as a shortcut.

A separate Compose project with a fresh disposable PostgreSQL 18 volume started successfully and was used for live integration verification. The original volume was preserved. Temporary audit containers/volumes were removed afterward; services started during the normal-stack attempt were stopped again. Rebuilt images and recreated stopped containers remain locally.

### B2 — WebSocket transport is incomplete

`api-gateway/src/websocket/websocket.server.ts` exposes `/ws`, validates Origin, authenticates a cookie, and manages connections. However:

- `api-gateway/src/redis/subscriber.ts` is empty.
- `api-gateway/src/websocket/event.handler.ts` is empty.
- The socket sends a connection greeting and `test.ack`; payment, wallet, rule, and security events are not forwarded.
- The frontend login uses a Bearer token in local storage. No server-issued WebSocket cookie or connection ticket is supplied by that flow.
- A real browser with a valid frontend login was rejected by `/ws` in the isolated stack, where Origin was configured to match the audit browser.

**Owners:** gateway/WebSocket plus authentication, followed by frontend integration. Define and implement the authentication handshake, user-scoped Redis subscription/event forwarding, payload schema, and reconnect/resynchronization contract. Do not make a JavaScript-written auth cookie the workaround.

Current live payments use authenticated **SSE**, not WebSocket. This works and does not need to be removed before a replacement is ready. There are no implemented WebSocket business events that the frontend has overlooked.

### B3 — Transaction details remain incomplete

`backend/app/api/schemas.py::TransactionOut` still omits transaction dates and persisted allocations, although processing stores allocations and GDPR/Analytics exports expose them. Live `GET /api/transactions/` confirmed the four-field response.

**Owner:** backend. Add `created_at` with an explicit timezone and the actual allocation mapping; keep user ownership checks and stable ordering. Agree on server pagination/filtering/sorting before histories become large.

**Affected frontend:** Activity dates/envelope filters, Home's recorded split, Payment details/receipts, envelope ledgers, last-payment Assistant charts, and Analytics payment-size/variability charts. The frontend deliberately avoids reconstructing historical splits from current rules. Aggregate Analytics totals and allocation charts work independently.

### B4 — Account/security metadata and account operations

Live `GET /api/auth/me` still returns only `id`, `full_name`, `email`, and `bank_account_id`.

**Owner:** backend. Expose supported metadata such as `two_factor_enabled`, `email_verified`, and sign-in method. Currently Settings uses password confirmation or a user-requested GDPR JSON export to discover some security information; it cannot reliably show verification status directly.

Remaining contracts include profile updates, password changes, session listing/revocation, Google-account linking, and personal API-key creation/listing/revocation. Corresponding unavailable controls are explicit. Google-only accounts also need an agreed reauthentication method for disabling 2FA or regenerating recovery codes, because those routes currently require a password.

### B5 — Password recovery/reset routes are still absent

The frontend has forms for `POST /api/auth/password/forgot` and `POST /api/auth/password/reset`, including pending-state protection and `/auth/reset-password` routing. Both API paths returned HTTP 404 in the current isolated backend. Configuration fields for a reset URL/TTL do not implement these routes.

**Owner:** authentication/backend. Implement the request/response and token contracts, SMTP delivery, expiry/single use, rate limiting, and account-enumeration-safe behavior. Then verify the full frontend email-to-reset flow.

### B6 — OAuth and AI configuration remain incomplete

- `FRONTEND_GOOGLE_CALLBACK_URL` is unset in the active Compose environment. The backend constructs its final OAuth redirect from this setting. Configure the actual frontend callback and the provider redirect consistently; external Google completion was not exercised in this audit.
- Current Compose does not forward AI provider configuration to the backend. Both chat endpoints returned the expected “not configured” HTTP 503 in the live check. Wire the agreed provider settings/key before expecting generated answers. Local Assistant previews/charts are separate features.
- Mailpit SMTP integration is now working in the isolated stack: registration verification and GDPR deletion email delivery were tested. External production email delivery remains a separate deployment check.

### B7 — Planned product operations have no backend contract yet

| Feature | Current frontend state | Work needed |
| --- | --- | --- |
| Custom rules, duplication, pause, deletion, reordering | Existing starter-rule edits work; other controls are disabled | Rules API and validation, then frontend mutations |
| Transfers, spending, marking rent paid | Clearly unavailable actions | Money-operation endpoints, accounting rules, transaction history/events |
| Notification preferences/read status across devices | Browser-local preferences/read IDs; notifications derived from payments | Notification storage/API/events |
| Financial health score | Explicit unavailable state | Agreed calculation and data contract |
| Currency precision and amount ceilings | Shared frontend preview matches current floating-point engine | Joint backend/frontend policy for rounding, precision, and supported limits |

## Endpoint coverage

These are source-verified connections. Live evidence is identified separately; it is not a claim that every UI variation or external provider was tested.

| Backend route | Frontend consumer | Verification/status |
| --- | --- | --- |
| `POST /api/auth/register` | Onboarding account step | Live success and duplicate email/bank rejection; complete fixture signup flow |
| `POST /api/auth/login` | Login, 2FA, onboarding, Settings confirmation | Live password/TOTP/recovery login; 429 contract verified; F1/F2 subsequently fixed |
| `GET /api/auth/me` | Dashboard and Settings account loader | Live; metadata limits apply |
| `POST /api/auth/link-bank-account` | Dashboard account-link form | Source and existing component test; success not repeated live |
| `GET /api/auth/oauth/google/login` | Google sign-in button | Source; provider configuration required |
| `GET /api/auth/oauth/google/callback` | Provider-to-backend callback | Server-side part of browser OAuth; external flow not completed |
| `POST /api/auth/oauth/google/exchange` | `GoogleCallbackPage` | Source and existing tests; external callback configuration required |
| `POST /api/auth/email/verify` | `VerifyEmailCard`, including `/auth/verify-email` | Real Mailpit link opened in browser; frontend submission succeeded |
| `POST /api/auth/email/resend` | Verification/resend form | Source and live generic response; delivery tested through registration |
| `POST /api/auth/2fa/setup` | Security Settings | Live API setup |
| `POST /api/auth/2fa/verify` | Security Settings and recovery-code display | Live activation returned recovery codes |
| `POST /api/auth/2fa/recovery-codes/regenerate` | Recovery Codes panel | Live replacement succeeded |
| `POST /api/auth/2fa/disable` | Disable 2FA form | Live disable succeeded |
| `GET /api/wallets/` | Dashboard, Envelopes, previews, Analytics/Assistant context | Live balance reads and browser SSE refresh |
| `GET /api/rules/` | Rules and shared preview engine | Live reads |
| `PATCH /api/rules/onboarding` | Onboarding and Rules editor | Live save succeeded |
| `GET /api/transactions/` | Home, Activity, details, notifications, chart context | Live; missing metadata confirmed |
| `POST /api/transactions/` | Record Payment dialog | Live payment processing; resulting UI refresh verified |
| `GET /api/analytics/summary` | Analytics overview | Live API and rendered report |
| `GET /api/analytics/timeseries` | Analytics charts | Live API and rendered report |
| `GET /api/analytics/export?format=csv|pdf` | Analytics export controls | Both live formats returned successfully |
| `GET /api/analytics/live` | Shared payment-update subscription | Real browser payment-triggered refresh |
| `POST /api/ai/chat/stream` | Assistant | Connected; live 503 confirms missing provider configuration |
| `POST /api/ai/chat` | No frontend consumer | Intentional alternative; frontend uses streaming version |
| `GET /api/gdpr/export?format=json|csv` | Privacy Settings | Live JSON/CSV ZIP; persisted splits available in export |
| `POST /api/gdpr/delete-request` | Privacy deletion dialog | Live request and Mailpit delivery |
| `POST /api/gdpr/delete-confirm` | Privacy deletion dialog | Live deletion of disposable audit account |

Backend health checks, gateway authorization/health, and bank-simulator routes are infrastructure/service interfaces. They do not each need a frontend component. Password-recovery routes listed in B5 are frontend calls without backend implementations, not connected working endpoints.

## Real-time coverage

The backend publishes `payment.processed` to `events:user:{user_id}`. `/api/analytics/live` sends `ready` and `payment` SSE events. `api/paymentLiveApi.ts` validates the payload, and `usePaymentLiveUpdates` batches refreshes, retries with backoff, resynchronizes after reconnect, and suspends while hidden/offline or viewing Settings.

| Component | Current refresh path | Boundary |
| --- | --- | --- |
| Home balances and recent payments | SSE triggers account/resource reload | Recorded split still depends on transaction metadata |
| Envelopes and envelope details | Same reload refreshes wallets/rules/history | Ledger requires persisted per-payment allocations |
| Activity and payment details | Same reload refreshes transactions | Dates/splits absent in current response |
| Payment notifications and badge | Derived from refreshed transaction history | Read state is browser-local; Settings pauses SSE |
| Analytics | Refreshed dashboard data triggers summary/timeseries reads | Payment-size details require dated transactions |
| Sandbox and Assistant account context | Updated wallet/rule props | Existing Assistant preview messages deliberately retain their original snapshot |
| Assistant answer generation | Separate POST SSE stream | Provider not configured in current Compose |
| Rule/profile/security changes elsewhere | No dedicated live event | Own writes refresh/reconcile; unrelated external edits need refresh/new events |

Real proof: posting an 8,500 MAD payment through the isolated backend changed the signed-in browser's free balance from 0.00 to 4,680.00 MAD without manual refresh, using the edited starter rules.

## Organization, redundancy, and performance

- All 100 files under `src` were reachable from the application entry point in the static relative-import scan. No identical source files were found by file hashing.
- ESLint and TypeScript strict/unused-local/unused-parameter checks passed. These checks do not prove every CSS selector or exported symbol is used in every state; no confirmed unused source file warrants deletion from this audit.
- `react-is` is required as a Recharts peer dependency even though application files do not import it directly. It should not be removed based on a text search.
- HTTP timeout/error parsing, wallet types, SSE parsing, money/date formatting, previews, dialogs, and pending navigation already have shared helpers. After the follow-up refactor, application copy is directly in components, with a small shared message module. The remaining `i18n` export serves only the existing QA tests.
- Route-based loading separates Analytics, Assistant, Settings, onboarding, and secondary auth pages. Build output is approximately 110 KB gzip for the main JS chunk, 29 KB for the dashboard, and 119 KB for the lazy Analytics chunk. There was no build size warning.
- The dashboard loads resources according to the current page and caches successful reads for 30 seconds. Settings does not depend on wallet/rule/transaction services to render.
- Activity renders 25 rows per page, but still downloads/filter-sorts the complete API history. Server pagination is the meaningful scaling improvement; changing the UI page size alone does not solve network/memory growth.
- `OnboardingPage.tsx` remains the largest controller (625 lines). Extracting its request orchestration from rendering is an optional maintainability improvement, with behavior preserved. No rewrite is needed for correctness solely because of file size.
- Session-token reads remain scattered despite `auth/session.ts`. Reusing its accessor is a small consistency improvement, not a demonstrated normal-browser failure.

## Verification performed on the audited base revision

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run build` | Passed, including strict TypeScript checks |
| `npm test` | 68/68 tests across 12 files passed |
| `npm audit --json` | Zero reported vulnerabilities |
| Production Docker builds | Backend, gateway, simulator, frontend built successfully |
| Normal local Compose startup | Failed on existing PostgreSQL volume; B1 |
| Isolated Compose startup | Healthy with fresh temporary database |
| Live HTTP checks | 35/35 expected statuses, including intentional 400/401/404/503 cases |
| Browser real integration | Login/dashboard, real SSE balance update, Activity fallback, Analytics report, email verification passed; no uncaught browser exceptions |
| Standard route/layout matrix | 26 routes × 4 widths × 2 themes = 208 cases; no page overflow, automated WCAG-tagged axe violations, or uncaught page exceptions |
| Large-value layout matrix | 5 financial routes × 3 widths × 2 themes = 30 cases; large balances and long references stayed within page bounds, no detected axe violations |
| Onboarding | All 5 steps plus simulated-result state at 320/768/1440px: 18 layout checks passed; 3 storage checks found no password in local/session storage |
| Targeted regressions | Initial audit reproduced F1/F2/F3; subsequent fixes verified separately above |
| Local documents | README and presentation hashes unchanged; design files preserved |

Widths used for the standard matrix: 320, 390, 768, and 1440px. Themes: light and dark. Financial large-value cases used 320, 768, and 1440px. Browser checks used Chromium, reduced motion, and blocked external fonts to exercise fallback fonts. Selected mobile screenshots were visually inspected. These checks do not establish exact Figma matching, Safari/Firefox behavior, all assistive-technology behavior, or every modal/error/input combination.

Layout and targeted regression scripts use controlled responses. Live checks use a separate stack and disposable accounts. Security endpoints were exercised directly; the full recovery-code display/copy/download UI was reviewed in source rather than repeated against the live backend. Google consent/callback completion and external AI/production SMTP delivery remain unverified.

Temporary scripts and detailed results are in `/tmp/autowallet-audit-oct22/` for this session, including `layout-results.json`, `edge-results.json`, `signup-results.json`, `filter-results.json`, and `live-results.json`. They are outside QA-owned files and are not part of the commit. Temporary stack resources were removed and the audit dev server stopped.

## Remaining work

1. Confirm preservation or migration of any required PostgreSQL 16 data. The current PostgreSQL 18 stack and local Vite connection are running; other developers should configure their connection using DEVELOPMENT.md.
2. Add transaction dates and persisted allocations on the backend; the frontend now disables filters that lack this information.
3. Configure OAuth/AI and implement password recovery/reset.
4. Finish WebSocket authentication/event forwarding before adding the frontend consumer.
5. Plan the remaining product contracts and server pagination; keep optional refactoring separate from functional fixes.
