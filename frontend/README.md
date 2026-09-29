# AutoWallet frontend

React, TypeScript, Vite, Tailwind CSS, and React Router. The app covers email login and sign-up, Google sign-in callback, two-factor entry, password recovery screens, five onboarding steps, and a placeholder dashboard.

## Run locally

```bash
cd frontend
npm ci
npm run dev
```

The development server proxies `/api` to the FastAPI backend at `http://127.0.0.1:8000`. Run the backend separately for registration, login, two-factor verification, and Google OAuth. `npm run build` runs TypeScript and Vite; `npm run lint` runs ESLint.

## Current API integration

- Email login calls `POST /api/auth/login`. Sign-up collects details through onboarding, then calls `POST /api/auth/register` and logs the user in.
- Two-factor entry calls the login endpoint with `totp_code`. The Google button starts `/api/auth/oauth/google/login`, but the configured backend callback currently returns JSON directly to the browser. The frontend callback route is not reached by that flow.
- Password recovery screens call `/api/auth/password/forgot` and `/api/auth/password/reset`. Those endpoints are not implemented by the current backend, so they show an error until the backend adds them.
- The two-factor backup-code form has no backend verification endpoint yet, so it cannot complete sign-in.
- Email verification resend and the Privacy/Terms buttons are UI placeholders; there are no matching backend actions or content pages yet. The resend control currently only starts a countdown.
- The payment split on the final onboarding step is a local simulation. The backend currently provisions default rules; edited onboarding rule values are not submitted. The dashboard route is a placeholder.

The signup draft, including the password, is kept in session storage until registration succeeds. The two-factor flow also stores pending credentials there. API failures stay on the current screen; they do not create a session or report success.

## Integration work before release

- Complete the Google OAuth redirect contract so the backend sends the user to a frontend callback or returns a session through another supported browser flow.
- Add backend endpoints for password recovery, email verification, and backup-code sign-in before presenting those controls as available.
- Add a way to save onboarding rule changes. Registration currently creates fixed defaults, so the simulated split can differ from subsequent real payments.
- Align the optional bank-account step with registration: the backend requires `bank_account_id`, so skipping currently submits a generated `TEMP-` identifier. Entering an ID also does not verify ownership or connect to a bank.
- Replace the placeholder Privacy and Terms alerts with reviewed pages before using the signup consent checkbox for real users.
- Move pending passwords out of browser storage when the registration and two-factor API flows support a short-lived server-side challenge.
