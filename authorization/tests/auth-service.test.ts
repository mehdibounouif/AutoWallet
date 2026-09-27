/**
 * Contract suite for the authorization service (authorization/src) —
 * the PIN half: behavior that works today and must stay working.
 *
 * The DEMAND half (open findings, currently failing) lives in
 * findings.test.ts — see tests/TESTS.md for the two-file design.
 *
 * HOW TO READ THIS FILE
 * ---------------------
 * The REAL express app runs in-process (no server, no network): supertest
 * drives `app` directly, and every token is signed with the same
 * jsonwebtoken library the service uses. If a test fails here, the bug is
 * in the service — there is no test infrastructure to blame.
 */
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";

import app from "../src/app";
import { SECRET } from "./setup";

// authenticate.ts reads the secret from the environment at request time,
// so it must be set before any request is made.
beforeAll(() => {
  process.env.JWT_SECRET = SECRET;
});



// ---------------------------------------------------------------------------
// 1. PIN — health endpoint
// ---------------------------------------------------------------------------

describe("GET /api/health", () => {
  it("PIN: answers 200 with the service identity shape", async () => {
    // SCENARIO: anyone probes the health endpoint.
    // EXPECTED: 200 and exactly this shape — CI and the compose
    // healthcheck both depend on it.
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      service: "authorization",
      status: "ok",
    });
  });
});

// ---------------------------------------------------------------------------
// 2. PIN — the service must survive hostile input
// ---------------------------------------------------------------------------

describe("service survival", () => {
  it("PIN: stays healthy after malformed authorize requests", async () => {
    // SCENARIO: a burst of malformed authorize calls (empty body, garbage
    //           token, numeric permission) followed by a health probe.
    // EXPECTED: the service is still up and healthy afterwards — no
    //           request shape may crash or wedge it.
    const burst = request(app).post("/api/authorize").send({});
    const burst2 = request(app)
      .post("/api/authorize")
      .set("Authorization", "Bearer not.a.jwt")
      .send({ permission: 1 });
    await Promise.all([burst, burst2]);

    const health = await request(app).get("/api/health");
    expect(health.status).toBe(200);
    expect(health.body.status).toBe("ok");
  });
});
