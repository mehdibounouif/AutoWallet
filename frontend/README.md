# AutoWallet frontend

React application built with TypeScript, Vite, Tailwind CSS, lucide-react, and React Router. The interface is available in English, French, and Arabic (including right-to-left layout). It includes authentication, onboarding, Home, Envelopes and envelope details, Rules, Activity and payment details, Analytics, Assistant, Notifications, Sandbox, and five Settings sections.

## Run locally

From the repository root, configure the existing backend environment variables, then run:

```bash
docker compose up -d --build backend bank-simulator api-gateway
npm ci --prefix frontend
npm run dev --prefix frontend
```

Open `http://localhost:5173`. Vite proxies `/api` to `http://127.0.0.1:8000`. To use another backend address:

```bash
API_PROXY_TARGET=http://127.0.0.1:8002 npm run dev --prefix frontend
```

Wallets, transactions, analytics, and Assistant require the API gateway as well as the backend. Google sign-in also requires valid provider credentials, a registered backend callback URI, and `FRONTEND_GOOGLE_CALLBACK_URL` set to the frontend origin plus `/auth/google/callback`. Restart/recreate the backend after changing its environment. Assistant replies require the backend AI provider configuration; account-deletion emails require SMTP configuration.

## Checks

```bash
npm run build --prefix frontend
npm run lint --prefix frontend
npm test --prefix frontend
npm audit --prefix frontend
```

See [AUDIT.md](AUDIT.md) for the current verification results, endpoint coverage and remaining dependencies.

## Structure and styling

The frontend uses one stylesheet (`src/index.css`) for design tokens and base rules. All component styling is Tailwind utility classes in JSX. Shared primitives live in `src/components/ui`; application chrome lives in `src/components/layout`; feature pages are grouped under `src/pages`.

See [architecture.md](architecture.md) for the file map, token conventions, data flow, and state rules. New UI should reuse the shared primitives and semantic tokens rather than adding stylesheets or literal hex colors.

## Backend connection

Authentication, registration, bank account ID linking, wallet and payment reads, payment recording, saved starter-rule edits, analytics reads/downloads, streaming Assistant, authenticator setup/verification, recovery-code login/regeneration, email verification/resend, data exports, and account deletion use the backend APIs. Live payment refresh uses authenticated **Server-Sent Events** at `/api/analytics/live`, with reconnect and resynchronization. Settings loads account data independently of payment services.

Sandbox and onboarding payment simulation calculate local previews. Payment-alert preferences and notification read IDs are browser preferences. Entering a bank account ID records that ID; it does not verify ownership or connect a real bank. Historical payment details display only data actually supplied by the API.

Password recovery and reset have frontend request handlers, but their backend routes are missing. Custom rule management, profile/password changes, session revocation, personal API keys, and disabling two-factor login also need backend support. The UI identifies unsupported actions. See the [endpoint matrix and remaining work](AUDIT.md#backend-endpoint-coverage).

Recovery codes returned after 2FA activation or regeneration are displayed once with copy/download controls and stay in component memory. The backend requires a password and authenticator code for regeneration, so Google-only accounts cannot regenerate codes with the current contract. Email links work at both `/verify-email` and `/auth/verify-email`.

Signup and two-factor passwords remain in memory; refreshing those flows requires signing in again. Non-secret signup drafts use session storage. Sign-in tokens currently use local storage. Moving tokens to HttpOnly cookies would require a coordinated backend authentication change.

Production hosting must serve the SPA fallback and proxy `/api`, including streaming responses; the frontend Dockerfile and nginx configuration now provide the production bundle and SPA/API routing.
