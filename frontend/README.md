# AutoWallet frontend

React, TypeScript, Vite, Tailwind CSS, and React Router. The English-only app covers email login and sign-up, Google sign-in callback, two-factor entry, password recovery screens, five onboarding steps, Terms and Privacy information pages, and a dashboard backed by the existing API.

## Run locally

```bash
docker compose up -d --build backend bank-simulator authorization
npm ci --prefix frontend
npm run dev --prefix frontend
```

Open `http://localhost:5173`. The development server proxies `/api` to the FastAPI backend at `http://127.0.0.1:8000`. Set `API_PROXY_TARGET` when the backend uses another address, for example `API_PROXY_TARGET=http://127.0.0.1:8002 npm run dev --prefix frontend`. In production, the server that hosts the frontend must also forward `/api` to the backend. `npm run build` runs TypeScript and Vite; `npm run lint` runs ESLint.

## Current API integration

- Email login calls `POST /api/auth/login`. Sign-up calls `POST /api/auth/register` when the bank account step is submitted, so duplicate email and account errors appear there. The final onboarding action logs the registered user in.
- Two-factor entry calls the login endpoint with `totp_code` and preserves the requested destination. The Google button starts `/api/auth/oauth/google/login`; the backend redirects to the frontend callback with a one-time code, which is exchanged through `/api/auth/oauth/google/exchange`.
- Password recovery screens call `/api/auth/password/forgot` and `/api/auth/password/reset`. Those endpoints are not implemented by the current backend, so they show an error until the backend adds them.
- The two-factor backup-code form has no backend verification endpoint yet, so it cannot complete sign-in.
- Email verification sending is marked as unavailable until the backend supports it. Terms and Privacy links open prototype information pages. Their text needs legal review before public release.
- The payment split on the final onboarding step is a local simulation. Edited onboarding rule values are saved through `PATCH /api/rules/onboarding` before moving to that step.
- The protected `/dashboard` route loads `/api/auth/me`, `/api/wallets/`, `/api/transactions/`, and `/api/rules/`. Its Home screen follows the Figma free-to-spend, set-aside, payment-ribbon, and recent-payments layout. Users can record a payment through `POST /api/transactions/`, preview a split locally using their current rules, and link a bank account ID if needed. `/maintenance` redirects to `/dashboard` for older links.
- Wallet and transaction reads require the `authorization` service in Docker Compose. The transaction API does not yet return payment dates or allocation breakdowns. The dashboard shows a clearly labeled next-payment preview when a historical split is unavailable, and it only shows dates and historical split bars when those fields are supplied. It refreshes after recording a payment, when the browser reconnects, and when the tab becomes visible; WebSocket events are not connected yet.

Signup and two-factor passwords are kept only in page memory while those flows are open. Refreshing the page loses them and returns the user to sign-up or login; after registration, a refresh returns to login. Non-secret signup draft details stay in session storage. The app removes passwords left in session storage by older frontend versions at startup. API failures stay on the current screen; they do not create a session or report success.

## Integration work before release

- Verify Google OAuth provider credentials and deployed callback URLs in the target environment.
- Add backend endpoints for password recovery, email verification, and backup-code sign-in before presenting those controls as available.
- Add endpoints for creating, deleting, pausing, and reordering individual rules. Edited starter-rule values already save through `PATCH /api/rules/onboarding`.
- Registration requires a bank account ID, so onboarding requires an ID containing 3 to 50 digits. Entering an ID does not verify ownership or connect to a bank.
- Replace the prototype Terms and Privacy text with reviewed legal documents before public release.
- Consider a short-lived server-side challenge if the signup or two-factor flows must survive a page refresh without asking for credentials again.

The dashboard also includes Envelopes at `/app/envelopes`, envelope details at `/app/envelopes/:walletType`, Rules at `/app/rules`, and Activity at `/app/activity`. See [AUDIT.md](AUDIT.md) for the frontend audit, mobile checks, and remaining work.
