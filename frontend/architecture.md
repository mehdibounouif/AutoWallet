# Frontend architecture

Updated October 25, 2026. This document describes the current frontend; backend endpoint coverage and outstanding contracts are maintained in [AUDIT.md](AUDIT.md).

## File organization

```text
src/
  api/                  HTTP client, SSE reader, API-key/settings clients, error and wallet validation
  auth/                 Session token, validation, safe return URLs, signup drafts, pending credentials, recovery codes
  components/
    layout/             App shell, sidebar, auth top bar, auth shell, legal footer, mobile navigation
    ui/                 Buttons, fields, cards, dialog, badges, alerts, empty/skeleton/progress primitives,
                        popover, switch, OTP input, password meter, stepper, language selector, logo
  hooks/                Countdown, clipboard, media query, online status, dismissible layers, request cancellation
  i18n/                 locales (en/fr/ar), legal/ policy documents, languages.ts autonyms/Intl tags,
                        reactive lookup and locale switching
  pages/
    Auth/               Login, signup, two-factor, recovery, OAuth callback
    Dashboard/          Workspace shell + feature folders:
                          activity/    filters, desktop table, mobile list, date helpers
                          analytics/   controller, model, overview, suggestions, details, chart card
                          assistant/   message bubble and composer
                          envelope/    rule card, glance card, history, spend dialog, data helpers
                          envelopes/   envelope card and skeleton
                          home/        summary model, envelope row, payments, skeleton
                          rules/       preview, rule row, editor drawer, preview model
    Legal/              Terms and Privacy pages
    Onboarding/         Five-step controller, footer, step components and step-only inputs
    Settings/           Account/security/privacy/notifications/developer sections;
                          developer/ and privacy/ hold the extracted cards
  utils/                Class-name joining, money/date formatting, downloads
  App.tsx               Route registration and lazy page boundaries
  main.tsx              Entry point and legacy draft cleanup
  index.css             The only stylesheet: Tailwind import, design tokens, base rules, RTL rules
public/AW.svg           Public logo
tests/                  QA-owned component and domain tests
```

Build output and dependency directories are generated. `Dockerfile` builds the production bundle and serves it with nginx; Compose includes the frontend and its reverse proxy.

## Styling

Tailwind CSS v4 (through `@tailwindcss/vite`) is the only styling system. Feature stylesheets were removed; all component styling lives in JSX utilities. `src/index.css` contains:

- `@theme` tokens for action, brand, surfaces, text, feedback, envelope, radius, shadow, type and animation values.
- Base element rules (page background, focus ring, mobile input sizing, reduced motion).
- Minimal RTL rules. Layout uses logical utilities (`ms`/`me`, `start`/`end`, `text-start`/`text-end`) and directional lucide icons are mirrored.

Rules for new UI:

- Use semantic tokens (`bg-surface`, `text-muted`, `border-line`, `bg-action-primary`, `text-savings-ink`) instead of literal hex colors. Inline `style` is reserved for data-driven values such as envelope colors, chart geometry and progress widths.
- Use `components/ui` primitives instead of repeating button, input, card, alert, badge, empty-state, skeleton and dialog markup. `Button`, `Field` and `Card` have no page-specific padding baked in; each caller states its layout.
- Use `size-*` for icons, `rounded-control` for controls, `rounded-card` for surfaces, and `text-3xs`/`text-2xs` for the two dense type steps.
- Page roots use `components/ui/Page` (`wide`, `focus`, `reading`) so max-width and centering are declared once.
- Feature views are thin controllers: they own state and composition, while tables, forms, previews, histories, dialogs and skeletons live in the feature subfolder. When a return block grows past roughly 150 lines, extract a child component rather than another CSS class. Shared derived values go into a small model module (for example `analytics/analyticsModel.ts`, `home/homeModel.ts`, `rules/rulePreviewModel.ts`).
- Icons come from `lucide-react`; inline SVG is limited to charts, the split-ribbon illustration and the QR code.
- `cn()` joins conditional classes. Do not add a second styling system or a feature CSS file.

## API boundaries

- `api/request.ts` applies a timeout while preserving caller cancellation. A write timeout means the outcome is unknown; payment retries retain the same reference.
- `api/errors.ts` reads string and structured FastAPI errors safely, including missing or malformed error bodies.
- `api/walletTypes.ts` defines the shared wallet identifiers and their runtime validation.
- `api/analyticsApi.ts` validates date ranges and response shapes, and downloads CSV/PDF reports.
- `api/assistantApi.ts` handles streaming chat; `api/paymentLiveApi.ts` handles authenticated payment events and an idle watchdog. Both consume `api/sse.ts` for chunked UTF-8/CRLF event parsing and stream cleanup.
- `api/settingsApi.ts` handles Settings errors, retry metadata, and security metadata from a data export.
- `pages/Dashboard/dashboardApi.ts` remains the dashboard's typed account/resource aggregator and public domain types. It validates users, wallets, transactions, and rules before rendering. Authentication and onboarding keep their form-specific request orchestration beside their state machines.
- `auth/session.ts` is the single place that reads and writes the Bearer token key.

The development proxy forwards relative `/api` requests to the configured backend. The browser does not call Docker hostnames. Google OAuth starts with a browser navigation so the backend can set its state-binding cookie; the frontend exchanges the returned one-time code.

## Translations

All translated French/Arabic copy and every policy document live under `i18n`:

- `i18n/locales/{en,fr,ar}.ts` — UI strings, typed by `Translations`; adding a key to `en` requires the same key in `fr` and `ar`.
- `i18n/legal/{en,fr,ar}.ts` — the complete privacy and terms documents, selected by the current locale. The legal page contains no policy text.
- `i18n/languages.ts` — language autonyms and BCP-47 tags used for dates/numbers.
- Generated descriptions (rule and envelope explanations) are placeholder templates such as `ruleConditionWhile`; feature files substitute values through `translations` and never branch on `lang === 'fr' | 'ar'`.

## Layout and dashboard data flow

`components/layout/AppShell` owns the persistent chrome: sidebar (including collapse state), sticky header slot, offline banner, main column, legal footer, mobile navigation/More menu and toast. `pages/Dashboard/DashboardPage` keeps only view selection and session/resource orchestration:

- `useDashboardData` owns the account/wallets/transactions/rules read plus loading, refresh and error flags.
- `DashboardHeaderTools` owns the live-status, notification and profile popovers.
- `LinkBankAccountPrompt` owns first-run bank-ID linking.
- Views receive typed data and callbacks; the page does not render view internals.

`HomeView` owns Home balances, envelope rows, the split ribbon and recent payments. `EnvelopesView`, `EnvelopeDetailView`, `ActivityView`, `RulesView`, `AnalyticsView`, `AssistantView`, `SandboxView` and `NotificationsView` are independent feature modules. `SettingsView` is a small section router; account, security, privacy, notifications and developer sections live in separate files.

`usePaymentLiveUpdates` subscribes after a linked user is known. It resynchronizes after subscribing or reconnecting, batches bursts of payment events, backs off on disconnects, expires the session on 401, and stops while hidden, offline, or viewing Settings. Payment events trigger fresh resource reads rather than treating an event as a complete ledger. The backend has no replay cursor, so reconnecting must read current state.

`dashboardSplit.ts` is shared by signup, Sandbox and dashboard previews. It previews active rules in priority order using current balances and conditions. It is a preview, not a replacement for server processing. Historical payment bars and envelope histories require actual allocation fields and reconciled totals; absent values are not reconstructed from today's rules.

## State and lifecycle

- The URL selects the current view and detail object. Safe return URLs survive login, two-factor entry, and the Google callback.
- Recovery codes use component memory with copy/download controls; they are cleared when the Security screen unmounts. Verification consumes email tokens once per mounted screen, including StrictMode effect replay.
- Signup and two-factor passwords are page-memory data; non-secret drafts and a short-lived Google return destination use session storage.
- The Bearer token is currently stored in local storage. Backend authorization remains authoritative.
- Payment-alert preferences use an external-store subscription. Notification read IDs are scoped to the user and synchronized across tabs; unavailable storage falls back to memory for the visit.
- Dialogs share focus trapping/restoration, Escape dismissal, scroll locking, and background isolation. Menus/popovers share outside-click/Escape handling through `useDismissibleLayer`.
- Views cancel requests and streams when leaving. Object URLs are revoked when replaced or unmounted. Persistent streams have an idle timeout rather than a fixed total duration.
- `useTranslation` is subscribed at the app root and in page-level components, so switching language re-renders the visible copy. `translations` remains a proxy for module-level metadata such as envelope labels.

## Verification

Run the commands in [README.md](README.md). QA-owned tests keep their assertions; only three imports were updated when shared UI components moved from `components/common` to `components/ui`.

Current checks: TypeScript build, ESLint, the production Vite build and all 13 test files (71 tests) pass. The compiled stylesheet is about 71 kB, down from about 129 kB of global and feature CSS before the refactor.
