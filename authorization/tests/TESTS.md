# Authorization service test suite — developer guide

Who this is for: the dev who owns `authorization/` (ZRAY9A) and anyone
reviewing or extending these tests. Owner: ZAKARIA (QA).
Companion doc for the backend suite: `backend/tests/TESTS.md`.

---

## 1. How to run

```bash
cd authorization
npm test                # the PIN half (tests/auth-service.test.ts) — MUST be green
npm run test:findings   # the DEMAND half (tests/findings.test.ts) — RED by design
npm run test:report     # BOTH halves, one colored line per test (the readable board)
npm run test:all        # everything raw
```

- No server, no docker, no network needed — the express app runs
  in-process (supertest starts an ephemeral listener per request).
- Baseline: `npm test` → **2 passed**; `npm run test:report` →
  **2 pins passed + 13 demands held red + 1 skipped**.
- The suite is split BY KIND on purpose:
  - `auth-service.test.ts` = pins (behavior that works today). This is
    the CI gate — a red pin is a regression, always.
  - `findings.test.ts` = demands (desired behavior blocked by a reported
    finding). These run RED on purpose — **red here is the findings
    board, not a broken build**. Read them with `npm run test:report`,
    which prints one colored line per test (`✗ DEMAND ... (finding open)`)
    and flags in bold the moment a demand starts passing (fix landed).
- Exit codes: `npm test` 0 while pins are green; `test:report` /
  `test:findings` exit non-zero while findings are open — they are
  informational, the CI gate is `npm test`.

### Seeing the real failure behind a demand

`npm run test:findings` IS the red view — each failing demand prints its
full vitest assertion (e.g. `AssertionError: expected 404 to be 200` for
finding #13), plus the SCENARIO/EXPECTED/TODAY/FIX/OWNER comment block
right above it in the source. No temporary edits needed.

---

## 2. The design rule: the REAL app, zero infrastructure

Every test drives the real `app` from `src/app.ts` — same middleware
chain, same token verification — through supertest. What is faked is
nothing; the only setup is the JWT secret (one line in `beforeAll`):

```ts
beforeAll(() => { process.env.JWT_SECRET = SECRET; });
```

One helper keeps every test readable — it models exactly what the
backend's `require_client` middleware sends:

```ts
authorizeRequest(token, permission)   // POST /api/authorize
userToken(role, options)              // sign a JWT with the shared secret
```

If you add a test, reuse these: each test should read as
*arrange token → one request → assert status + body shape*.

---

## 3. Test inventory

| # | Test | Kind | Scenario → Expected |
|---|---|---|---|
| 1 | `GET /api/health` 200 + shape | PIN | health probe → `{"service":"authorization","status":"ok"}` (compose healthcheck + CI depend on this) |
| 2 | USER + `client:access` → 200 allowed | DEMAND #13 | the backend's real call → `{"allowed":true,"user_id":"user-1","role":"USER"}` — **404 today** (route missing leading slash) |
| 3 | no Authorization header → 401 | DEMAND | guard rejects before any permission logic |
| 4 | garbage token → 401 'Invalid Token' | DEMAND | catch-block fallback branch — **also demands #16b** (fires 500 after #13 lands) |
| 5 | expired token → 401 'Token expired' | DEMAND | the dedicated expiry branch — **also demands #16b** |
| 6 | wrong-secret token → 401 | DEMAND | forged signature refused |
| 7 | bare `Bearer ` (empty token) → 401 | DEMAND | empty-string verify → catch → 401 |
| 8 | non-Bearer scheme (`Basic …`) → 401 | DEMAND | only the Bearer scheme is accepted |
| 9 | missing permission field → 400 | DEMAND | `{}` → 400 'Permission is required' (also documents the missing-`return` bug — see §5) |
| 10 | numeric permission → 400 | DEMAND | `{"permission":123}` → 400 |
| 11 | no body at all → 400 | DEMAND | valid token, no body → 400, never a permission decision |
| 12 | USER + `admin:access` → 403 | DEMAND | role outside its permission → `{"allowed":false,"error":"Permission denied"}` |
| 13 | unknown role → 403 | DEMAND | role matching no `rolePermissions` key gets nothing |
| 14 | ADMIN + `client:access` → 200 | DEMAND #14 | admins pass the wallet guard too — **403 today** once #13 lands |
| 15 | service survives malformed burst | PIN | empty body + garbage token + numeric permission, then health → still 200 'ok' |
| 16 | lower-case role claim | SKIP (tripwire) | the open casing contract — un-skip and pin after the decision (§4 casing row) |

The 401-family (tests 3-8) is deliberately separated from the
permission-family (9-14): if the whole guard collapses you'll see it in
one block, and if only the permission matrix is wrong you'll see it in
the other.

---

## 4. Findings tracked by the DEMAND tests — and the exact fixes

| Finding | Test(s) | Owner | Fix | Today → after fix |
|---|---|---|---|---|
| **#13** — route registered without leading slash (`routes/authorization.routes.ts:14`) | 2-14 | ZRAY9A | `router.post("authorize",…)` → `router.post("/authorize",…)` | 404 → the endpoint lives |
| **#16b** — `TokenExpiredError` used at `authenticate.ts:26` but dropped from the imports by fix `0a6a25a` | 4, 5 | ZRAY9A | restore the value import: `import jwt, { TokenExpiredError } from "jsonwebtoken";` (JwtPayload stays type-only) | masked by #13 now; ReferenceError→500 the moment #13 lands |
| **#14** — ADMIN lacks `client:access` (`services/authorization.service.ts`) | 14 | ZRAY9A | add `"client:access"` to the ADMIN list (design call) | 403 → 200 |
| **casing** — `rolePermissions` keys UPPER-case vs backend enum lower-case; `hasPermission` is case-sensitive | 15 (skipped) | ZRAY9A + HOMIE (decision) | either backend emits "USER"/"ADMIN", or the service upper-cases its input | after #12: everyone 403 if skipped |
| missing `return` after the 400 (routes, permission validation) | documented in test 9 | ZRAY9A | add `return` when sending the 400 | double-response error in server logs |

### The flip convention (RED = open, GREEN = fix landed)

- Every demand is a plain test in `findings.test.ts` asserting the
  DESIRED behavior. While the finding is open it fails — red, with its
  full assertion and the SCENARIO/EXPECTED/TODAY/FIX/OWNER comment above
  it. That red is information, not a broken build.
- When the owner's fix lands, the demand **turns green** in
  `npm run test:report` (printed in bold as `⚠ FLIPPED — the fix landed,
  verify & promote`). Then: verify the fix live, and move the test into
  the PIN file (`auth-service.test.ts`) so it guards the behavior
  forever.
- Tests 4 and 5 (garbage/expired token) fail for TWO stacked reasons
  (#13 then #16b) — they stay red through the first fix and only turn
  green after both land. That is intentional: they are the tripwire for
  the masked bug.

---

## 5. Failure triage — where to look first

| Symptom | Most likely cause | Where |
|---|---|---|
| ALL authorize-path tests red (not "expected fail") | the health pin or route path changed / app fails to import | `src/app.ts`, route paths |
| a demand becomes "unexpected pass" | the owner's fix landed — un-mark it (§4) | the specific test |
| token tests fail with 500 in the log + `ReferenceError` | #16b — `TokenExpiredError` not imported | `authenticate.ts:2,26` |
| validation tests return 404 instead of 400 | #13 not fixed yet | `routes/authorization.routes.ts:14` |
| everything 403 after HOMIE's role claim lands | the casing contract (§4 casing row) | `authorization.service.ts` + backend claim value |
| ERR_HTTP_HEADERS_SENT in server logs during validation tests | the missing `return` after the 400 | `routes/authorization.routes.ts` permission check |

---

## 6. Conventions for new tests

1. Name states the kind first: `PIN:` or `DEMAND #n:` — a reviewer reads
   intent from the name alone.
2. One scenario per test; body = SCENARIO / EXPECTED (+ TODAY / FIX /
   OWNER for demands), in that order.
3. Demands live in `findings.test.ts` as plain tests (the red board);
   pins live in `auth-service.test.ts`. A fixed finding is verified,
   then its demand is PROMOTED to the pin file.
4. Reuse `authorizeRequest()` / `userToken()`; shared constants live in
   `tests/setup.ts` (deliberately a non-test module — importing a test
   file from another test file re-registers its tests).
5. Run `npm test` before proposing a PR: the documented baseline is
   **2 passed** for the pin file — a red pin is not a reviewable PR.
