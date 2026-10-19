/**
 * Acceptance tests for the api-gateway security scan findings
 * (QA report: api-gateway-security-scan, findings G1/G2/G3/G4).
 *
 * Convention (same as the backend's xfail-strict / frontend's it.fails):
 * - Tests asserting the DESIRED behavior that FAILS today are `it.fails`
 *   — the suite stays green, and flips RED the moment the fix lands,
 *   which is QA's signal to convert the test to a plain `it()` and log
 *   the closure in tests/TESTS.md §4.
 * - Tests for rejection paths that ALREADY work are plain `it()` —
 *   regression pins.
 *
 * Findings covered here:
 *   G2  origin check is fail-open when FRONTEND_ORIGIN is unset
 *       (websocket.server.ts:20 — `origin !== undefined` never rejects)
 *   G3  HTTP middleware crashes 500 on valid-signature tokens without
 *       sub/role claims (middleware/authenticate.ts non-null assertions)
 *   G4  jwt.verify accepts any HMAC algorithm (no algorithms pinning)
 *   G1  gateway-side rejection contract: upgrade without a valid
 *       access_token cookie must answer 401 (the cookie itself is a
 *       backend design gap — tracked separately, not testable here)
 */
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import request from "supertest";
import WebSocket from "ws";
import jwt from "jsonwebtoken";
import type { Server } from "http";
import app from "../src/app.js";
import { createServer } from "../src/server.js";
import { SECRET } from "./setup.js";

const CLIENT_ORIGIN = "https://frontend.local";

function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** Opens a WS client against the server and resolves how the upgrade ended:
 * "open", or the HTTP status the server answered the handshake with. */
function upgradeOutcome(server: Server, headers: Record<string, string>): Promise<string> {
  const address = server.address();
  if (!address || typeof address === "string") {
    return Promise.reject(new Error("no server address"));
  }
  const ws = new WebSocket(`ws://127.0.0.1:${address.port}/ws`, { headers });
  return new Promise<string>((resolve) => {
    ws.once("open", () => { ws.close(); resolve("open"); });
    ws.once("unexpected-response", (_req, res) => { ws.terminate(); resolve(String(res.statusCode)); });
    ws.once("error", (err: Error & { statusCode?: number }) => { ws.terminate(); resolve(String(err.statusCode ?? err.message)); });
  });
}

let server: Server;

afterEach(async () => {
  if (server?.listening) {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => { if (err) reject(err); else resolve(); });
    });
  }
});

describe("gateway security findings (G1–G4)", () => {
  beforeEach(() => {
    delete process.env.FRONTEND_ORIGIN;
  });

  afterEach(() => {
    delete process.env.FRONTEND_ORIGIN;
  });

  // ----- G3: the HTTP middleware must reject incomplete tokens, not crash -----

  it.fails("G3: a valid-signature token without sub/role answers 401, not 500", async () => {
    console.info("xfail G3 (owner: helfatih): a signed token without sub/role must answer 401 \u2014 today the middleware crashes 500 (authenticate.ts non-null assertions). Fix: typeof checks, like websocket.auth.ts.");
    const token = jwt.sign({}, SECRET); // signed, but no claims at all

    const res = await request(app)
      .post("/api/authorize")
      .set(bearer(token))
      .send({ permission: "client:access" });

    expect(res.status).toBe(401);
  });

  it.fails("G3: a valid-signature token missing only the role answers 401, not 500", async () => {
    console.info("xfail G3 (owner: helfatih): a signed token missing only role must answer 401 \u2014 today the middleware crashes 500. Fix: typeof checks, like websocket.auth.ts.");
    const token = jwt.sign({}, SECRET, { subject: "user-1" }); // sub present, role absent

    const res = await request(app)
      .post("/api/authorize")
      .set(bearer(token))
      .send({ permission: "client:access" });

    expect(res.status).toBe(401);
  });

  // ----- G4: only the pinned algorithm may verify -----

  it.fails("G4: an HS512-signed token is rejected with 401", async () => {
    console.info("xfail G4 (gateway owners): only HS256 may verify \u2014 today an HS512 token is accepted. Fix: jwt.verify(..., { algorithms: [\"HS256\"] }) at both call sites.");
    const token = jwt.sign({ role: "USER" }, SECRET, { subject: "user-1", algorithm: "HS512" });

    const res = await request(app)
      .post("/api/authorize")
      .set(bearer(token))
      .send({ permission: "client:access" });

    expect(res.status).toBe(401);
  });

  // ----- G2: the origin check must fail CLOSED -----

  it.fails("G2: with FRONTEND_ORIGIN unset, an origin-less upgrade with a VALID cookie is still rejected", async () => {
    console.info("xfail G2 (owner: fibonnacc): with FRONTEND_ORIGIN unset the origin check is accidental \u2014 origin-less clients slip through. Fix: reject all upgrades while the var is unset (fail closed).");
    server = createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const token = jwt.sign({ role: "USER" }, SECRET, { subject: "user-1" });

    // no Origin header: today this slips past the origin check entirely
    // (undefined !== undefined is false) and reaches the socket — the
    // fail-closed fix must reject it because the guard is unconfigured.
    const outcome = await upgradeOutcome(server, {
      Cookie: `access_token=${token}`,
    });

    expect(outcome).toBe("403");
  });

  // ----- G2: rejection pin that ALREADY works (regression pin) -----

  it("G2: a wrong origin with FRONTEND_ORIGIN set is rejected with 403", async () => {
    process.env.FRONTEND_ORIGIN = CLIENT_ORIGIN;
    server = createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const token = jwt.sign({ role: "USER" }, SECRET, { subject: "user-1" });

    const outcome = await upgradeOutcome(server, {
      Cookie: `access_token=${token}`,
      origin: "https://attacker.example",
    });

    expect(outcome).toBe("403");
  });

  // ----- G2: acceptance pin that ALREADY works (regression pin) -----

  it("G2: the legitimate frontend origin with FRONTEND_ORIGIN set is ACCEPTED", async () => {
    process.env.FRONTEND_ORIGIN = CLIENT_ORIGIN;
    server = createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const token = jwt.sign({ role: "USER" }, SECRET, { subject: "user-1" });

    const outcome = await upgradeOutcome(server, {
      Cookie: `access_token=${token}`,
      origin: CLIENT_ORIGIN,
    });

    expect(outcome).toBe("open");
  });

  // ----- G1: gateway-side rejection contract (already works — pin it) -----

  it("G1: an upgrade WITHOUT any auth cookie is rejected with 401", async () => {
    process.env.FRONTEND_ORIGIN = CLIENT_ORIGIN;
    server = createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

    // matching origin so the request passes the origin check and the
    // assertion exercises the AUTH layer, not the origin guard
    const outcome = await upgradeOutcome(server, { origin: CLIENT_ORIGIN });

    expect(outcome).toBe("401");
  });

  it("G1: an upgrade with a GARBAGE cookie value is rejected with 401", async () => {
    process.env.FRONTEND_ORIGIN = CLIENT_ORIGIN;
    server = createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

    const outcome = await upgradeOutcome(server, {
      Cookie: "access_token=not.a.jwt",
      origin: CLIENT_ORIGIN,
    });

    expect(outcome).toBe("401");
  });
});
