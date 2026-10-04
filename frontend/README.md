# AutoWallet frontend

React, TypeScript, Vite, Tailwind CSS, and React Router. The English-only app covers email login and sign-up, Google sign-in callback, two-factor entry, password recovery screens, five onboarding steps, Terms and Privacy information pages, and a placeholder dashboard.

## Run locally

```bash
docker compose up -d --build backend bank-simulator
npm ci --prefix frontend
npm run dev --prefix frontend
```

Open `http://localhost:5173`. The development server proxies `/api` to the FastAPI backend at `http://127.0.0.1:8000`. Set `API_PROXY_TARGET` when the backend uses another address, for example `API_PROXY_TARGET=http://127.0.0.1:8002 npm run dev --prefix frontend`. In production, the server that hosts the frontend must also forward `/api` to the backend. `npm run build` runs TypeScript and Vite; `npm run lint` runs ESLint.

## Current API integration

- Email login calls `POST /api/auth/login`. Sign-up calls `POST /api/auth/register` when the bank account step is submitted, so duplicate email and account errors appear there. The final onboarding action logs the registered user in.
- Two-factor entry calls the login endpoint with `totp_code`. The Google button starts `/api/auth/oauth/google/login`, but the configured backend callback currently returns JSON directly to the browser. The frontend callback route is not reached by that flow.
- Password recovery screens call `/api/auth/password/forgot` and `/api/auth/password/reset`. Those endpoints are not implemented by the current backend, so they show an error until the backend adds them.
- The two-factor backup-code form has no backend verification endpoint yet, so it cannot complete sign-in.
- Email verification resend is a UI placeholder; it currently only starts a countdown. Terms and Privacy links open prototype information pages. Their text needs legal review before public release.
- The payment split on the final onboarding step is a local simulation. The backend currently provisions default rules; edited onboarding rule values are not submitted. The dashboard route is a placeholder.

Signup and two-factor passwords are kept only in page memory while those flows are open. Refreshing the page loses them and returns the user to sign-up or login; after registration, a refresh returns to login. Non-secret signup draft details stay in session storage. The app removes passwords left in session storage by older frontend versions at startup. API failures stay on the current screen; they do not create a session or report success.

## Integration work before release

- Complete the Google OAuth redirect contract so the backend sends the user to a frontend callback or returns a session through another supported browser flow.
- Add backend endpoints for password recovery, email verification, and backup-code sign-in before presenting those controls as available.
- Add a way to save onboarding rule changes. Registration currently creates fixed defaults, so the simulated split can differ from subsequent real payments.
- Registration requires a bank account ID, so onboarding requires an ID between 3 and 50 characters. Entering an ID does not verify ownership or connect to a bank.
- Replace the prototype Terms and Privacy text with reviewed legal documents before public release.
- Consider a short-lived server-side challenge if the signup or two-factor flows must survive a page refresh without asking for credentials again.
