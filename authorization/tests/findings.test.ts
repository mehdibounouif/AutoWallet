/**
 * Contract suite for the authorization service — the DEMAND half.
 *
 * WHY THIS FILE RUNS RED ON PURPOSE
 * ---------------------------------
 * Every test here asserts behavior that does NOT work yet because of a
 * known, REPORTED finding (report-only discipline: the owners hold the
 * fixes). This file is run with `npm run test:findings` — a red suite is
 * EXPECTED here and every red line is a finding, not a mistake:
 *
 *     npm test              -> the PIN half, must stay green (CI gate)
 *     npm run test:findings -> red = findings still open (informational)
 *     npm run test:report   -> both, with a colored one-line board
 *
 * THE FLIP SIGNAL: when the owner's fix lands, that test turns GREEN in
 * this file — that is the moment to verify the fix live and, if you want
 * it permanent, move the test into the PIN file.
 *
 * Every test states: SCENARIO / EXPECTED / TODAY / FIX / OWNER.
 *
 * FINDINGS TRACKED HERE
 * ---------------------
 *   #13   authorize route missing leading slash        1 character
 *         routes/authorization.routes.ts:14
 *         TODAY: the whole backend answers 503 on every guarded endpoint.
 *   #14   ADMIN missing "client:access"                1 line
 *         services/authorization.service.ts
 *   #16b  `TokenExpiredError` used at authenticate.ts:26
 *         but no longer imported (dropped by fix 0a6a25a).
 *         MASKED by #13 today; fires (ReferenceError -> 500) the moment
 *         #13 is fixed. Add it back as a value import.
 *   casing  rolePermissions keys are UPPER-case ("USER"/"ADMIN") and
 *         hasPermission is case-sensitive, while the backend's UserRole
 *         enum is lower-case ("user"). If HOMIE's `role` claim (#12)
 *         lands as "user", EVERY user gets 403. Contract decision pending.
 */
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

import app from "../src/app";
import { SECRET } from "./setup";

beforeAll(() => {
  process.env.JWT_SECRET = SECRET;
});

function userToken(role = "USER", options: jwt.SignOptions = { expiresIn: "1h" }) {
  return jwt.sign({ sub: "user-1", role }, SECRET, options);
}

function authorizeRequest(token: string | null, permission?: unknown) {
  const req = request(app).post("/api/authorize");
  if (token !== null) {
    req.set("Authorization", `Bearer ${token}`);
  }
  if (permission !== undefined) {
    req.send({ permission });
  }
  return req;
}

// ---------------------------------------------------------------------------
// 1. DEMAND — the real authorize path (finding #13)
// ---------------------------------------------------------------------------

describe("POST /api/authorize — the route the backend actually calls", () => {
  it("DEMAND #13: valid USER token + client:access -> 200 allowed", async () => {
    // SCENARIO: the backend's require_client middleware forwards a real
    //           request: USER token, permission "client:access".
    // EXPECTED: 200 {"allowed": true, "user_id": "user-1", "role": "USER"}
    //           — the shape auth_client.py relies on.
    // TODAY:    404 "Cannot POST /api/authorize" — the route is registered
    //           as `router.post("authorize", ...)` WITHOUT the leading
    //           slash (routes/authorization.routes.ts:14), so Express 5
    //           never matches the real path.
    // FIX:      1 character — `router.post("/authorize", ...)`.
    // OWNER:    ZRAY9A. Finding #13.
    const res = await authorizeRequest(userToken(), "client:access");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      allowed: true,
      user_id: "user-1",
      role: "USER",
    });
  });
});

// ---------------------------------------------------------------------------
// 2. DEMANDS — the auth guard (all blocked by #13 today; #16b fires on
//    the token-error paths once #13 lands)
// ---------------------------------------------------------------------------

describe("authenticate middleware — what the guard must reject", () => {
  it("DEMAND: no Authorization header -> 401 'Missing authentication token'", async () => {
    // SCENARIO: request with no credentials at all.
    // EXPECTED: 401 with the guard's own message.
    // TODAY:    404 (finding #13 — the route itself does not exist yet).
    // FIX:      #13 first, then this runs for real.
    const res = await authorizeRequest(null, "client:access");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Missing authentication token");
  });

  it("DEMAND: garbage token -> 401 'Invalid Token' (also demands #16b)", async () => {
    // SCENARIO: header present but the token is not a JWT at all.
    // EXPECTED: 401 "Invalid Token" — the catch block's fallback branch.
    // TODAY:    404 (#13). AND once #13 lands this STILL fails (500):
    //           the catch block runs `error instanceof TokenExpiredError`
    //           but fix 0a6a25a dropped TokenExpiredError from the imports
    //           -> ReferenceError. FIX: restore the value import —
    //           `import jwt, { TokenExpiredError } from "jsonwebtoken";`
    //           (JwtPayload stays type-only; it is only an `as` label.)
    // OWNER:    ZRAY9A. Findings #13 + #16b.
    const res = await authorizeRequest("not.a.jwt", "client:access");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid Token");
  });

  it("DEMAND: EXPIRED token -> 401 'Token expired' (also demands #16b)", async () => {
    // SCENARIO: a token signed correctly with the shared secret, but past
    //           its expiry — the dedicated TokenExpiredError branch.
    // EXPECTED: 401 "Token expired" (NOT the generic 'Invalid Token').
    // TODAY:    404 (#13); after #13 lands, 500 (#16b — the instanceof
    //           check throws before the branch can be chosen).
    // OWNER:    ZRAY9A. Findings #13 + #16b.
    const expired = userToken("USER", { expiresIn: "-10s" });
    const res = await authorizeRequest(expired, "client:access");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Token expired");
  });

  it("DEMAND: token signed with a DIFFERENT secret -> 401", async () => {
    // SCENARIO: a token forged with some other secret.
    // EXPECTED: 401 — signature validation refuses it.
    // TODAY:    404 (#13). FIX: #13 first.
    const forged = jwt.sign({ sub: "user-1", role: "USER" }, "wrong-secret", {
      expiresIn: "1h",
    });
    const res = await authorizeRequest(forged, "client:access");
    expect(res.status).toBe(401);
  });

  it("DEMAND: bare 'Bearer ' with no token value -> 401", async () => {
    // SCENARIO: header present, scheme correct, but empty token.
    // EXPECTED: 401 (jwt.verify("") throws -> catch -> 401).
    // TODAY:    404 (#13). FIX: #13 first.
    const res = await authorizeRequest("", "client:access");
    expect(res.status).toBe(401);
  });

  it("DEMAND: non-Bearer scheme -> 401 'Missing authentication token'", async () => {
    // SCENARIO: 'Basic <token>' instead of 'Bearer <token>'.
    // EXPECTED: 401 "Missing authentication token" — the guard only
    //           accepts the Bearer scheme.
    // TODAY:    404 (#13). FIX: #13 first.
    const res = await request(app)
      .post("/api/authorize")
      .set("Authorization", `Basic ${userToken()}`)
      .send({ permission: "client:access" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Missing authentication token");
  });
});

// ---------------------------------------------------------------------------
// 3. DEMANDS — request validation (bad permission bodies)
// ---------------------------------------------------------------------------

describe("authorize request validation", () => {
  it("DEMAND: missing permission field -> 400 'Permission is required'", async () => {
    // SCENARIO: valid token, but the body has no permission field.
    // EXPECTED: 400 with the validation message.
    // TODAY:    404 (#13).
    // NOTE for reviewers: routes/authorization.routes.ts sends the 400
    // WITHOUT `return`, so the authorize middleware still runs afterwards
    // against an undefined permission (double-response error in the
    // server log). Add `return` when the 400 is sent — reported in the PR.
    const res = await authorizeRequest(userToken(), undefined);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Permission is required");
  });

  it("DEMAND: non-string permission (number) -> 400", async () => {
    // SCENARIO: {"permission": 123} — a number instead of a string.
    // EXPECTED: 400 (the typeof check in the route).
    // TODAY:    404 (#13). FIX: #13 first.
    const res = await authorizeRequest(userToken(), 123);
    expect(res.status).toBe(400);
  });

  it("DEMAND: no body at all -> 400 (never falls through to a permission check)", async () => {
    // SCENARIO: POST with valid token and NO body.
    // EXPECTED: 400 — never a permission decision.
    // TODAY:    404 (#13). FIX: #13 first.
    const res = await authorizeRequest(userToken(), undefined);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 4. DEMANDS — the permission matrix (findings #13 + #14)
// ---------------------------------------------------------------------------

describe("authorize permission matrix — who may ask for what", () => {
  it("DEMAND: USER asking for admin:access -> 403 'Permission denied'", async () => {
    // SCENARIO: a USER token requests a permission outside its role.
    // EXPECTED: 403 {"allowed": false, "error": "Permission denied"} —
    //           the exact shape authorize.ts produces.
    // TODAY:    404 (#13). FIX: #13 first.
    const res = await authorizeRequest(userToken(), "admin:access");
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ allowed: false, error: "Permission denied" });
  });

  it("DEMAND: unknown role -> 403", async () => {
    // SCENARIO: a token whose role matches no rolePermissions key.
    // EXPECTED: 403 — unknown roles get nothing (hasPermission's guard).
    // TODAY:    404 (#13). FIX: #13 first.
    const ghost = userToken("SUPERGHOST", { expiresIn: "1h" });
    const res = await authorizeRequest(ghost, "client:access");
    expect(res.status).toBe(403);
  });

  it("DEMAND #14: ADMIN asking for client:access -> 200 (design call)", async () => {
    // SCENARIO: an ADMIN token requests the wallet guard permission.
    // EXPECTED: 200 — admins must pass the same guard as users.
    // TODAY:    404 (#13); after #13 lands, 403 "Permission denied" —
    //           ADMIN has only ["admin:access"] in
    //           services/authorization.service.ts.
    // FIX:      add "client:access" to the ADMIN list. Owner: ZRAY9A.
    const res = await authorizeRequest(userToken("ADMIN"), "client:access");
    expect(res.status).toBe(200);
    expect(res.body.allowed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. TRIPWIRE (skipped) — the open casing contract
// ---------------------------------------------------------------------------

describe.skip("role casing contract — DECISION PENDING (un-skip once decided)", () => {
  // The open design question, in one place:
  //
  //   services/authorization.service.ts:  rolePermissions keys = "USER"/"ADMIN"
  //   backend models:                     UserRole enum values = lower-case
  //   hasPermission():                    case-sensitive lookup
  //
  // When HOMIE adds the `role` claim to backend JWTs (finding #12), the
  // two sides MUST agree on the casing, or every user gets 403 with all
  // other fixes in place. Decide one of:
  //   a) contract-side: backend emits "USER"/"ADMIN" exactly -> un-skip
  //      and keep this test asserting 200 for "USER" (change the role
  //      string below to the agreed value), or
  //   b) service-side: hasPermission upper-cases its input -> un-skip and
  //      keep asserting 200 for "user" as written below.
  // Either way this test becomes the pin for the decision.
  it("lower-case role claim behavior", async () => {
    const lower = userToken("user", { expiresIn: "1h" });
    const res = await authorizeRequest(lower, "client:access");
    expect(res.status).toBe(200);
  });
});
