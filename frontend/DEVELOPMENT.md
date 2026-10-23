# Frontend development connections

The production stack routes browser requests through Caddy at `https://localhost`.
The backend container does not publish port 8000 on your host. Vite therefore
defaults its `/api` proxy to `https://localhost` too.

## With the Docker Compose backend

Start the stack from the repository root:

```sh
docker compose up -d --build
```

If PostgreSQL reports that an existing volume needs migration, resolve that
database upgrade before continuing. Frontend configuration cannot repair it;
preserve the existing database volume.

For Vite to verify Caddy's local HTTPS certificate, copy the public root CA from
the running proxy. These commands run from the repository root:

```sh
mkdir -p frontend/.certs
docker compose cp proxy:/data/caddy/pki/authorities/local/root.crt frontend/.certs/caddy-root.crt
cd frontend
```

Create or update `frontend/.env.local` with:

```dotenv
API_PROXY_TARGET=https://localhost
API_PROXY_CA_FILE=.certs/caddy-root.crt
```

Then, from `frontend/`:

```sh
npm ci
npm run dev
```

Open the Vite URL printed in your terminal. The CA file applies only to the
development API proxy; certificate verification remains enabled. `.certs/` and
`.env.local` are ignored by Git. Copy only `root.crt`, never a certificate's
private key. If Caddy's CA is regenerated, refresh the copied certificate.
If Node already trusts that CA, `API_PROXY_CA_FILE` can be omitted.

## With a backend running directly on the host

Set the server-only proxy target in `frontend/.env.local`:

```dotenv
API_PROXY_TARGET=http://127.0.0.1:8000
```

Start the backend and its required services separately, then run `npm run dev`
from `frontend/`. Restart Vite after changing proxy settings. Shell environment
values take precedence over `.env.local`; relative CA paths resolve from the
frontend directory when using the npm scripts.

## Authentication, streams, and production

These settings affect Vite's server-side `/api` forwarding, including Bearer
authentication and SSE. They are not embedded in the browser bundle. Production
routing remains in Caddy; the Vite proxy is not used in the built application.

Google OAuth and emailed links also depend on backend callback URL settings.
The Compose verification URL currently leads to `https://localhost`, so email
links open the Docker-served frontend. For Google sign-in, use the same intended
public origin throughout the OAuth flow and configure its callbacks accordingly.

The unfinished `/ws` authentication/event contract is separate from this HTTP
proxy. Payment live updates currently use `/api/analytics/live` SSE.
