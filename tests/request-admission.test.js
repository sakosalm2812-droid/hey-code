import assert from "node:assert/strict";
import test from "node:test";
import { admitRequest, admissionResponse } from "../supabase/functions/_shared/requestAdmission.js";

test("server admission uses the authenticated RPC with no client identity or limit override", async () => {
  const calls = [];
  const decision = await admitRequest({ rpc: async (...args) => {
    calls.push(args);
    return { data: { allowed: true, retry_after: 0 }, error: null };
  } }, "forge");
  assert.deepEqual(calls, [["hey_admit_request", { p_endpoint: "forge" }]]);
  assert.equal(decision.allowed, true);
});

test("admission fails closed on outages and malformed decisions", async () => {
  for (const response of [{ error: new Error("private database details") }, { data: null }, { data: { allowed: "true", retry_after: 0 } }, { data: { allowed: true, retry_after: NaN } }]) {
    const decision = await admitRequest({ rpc: async () => response }, "chat");
    assert.equal(decision.allowed, false);
    assert.equal(decision.status, 503);
  }
  assert.equal((await admitRequest({ rpc: async () => { throw new Error("offline"); } }, "chat")).allowed, false);
});

test("rate-limit responses retain CORS and give Retry-After without exposing provider details", async () => {
  const decision = await admitRequest({ rpc: async () => ({ data: { allowed: false, retry_after: 42 } }) }, "vision");
  const response = admissionResponse(decision, { "Access-Control-Allow-Origin": "https://hey.example" });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "42");
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://hey.example");
  assert.equal((await response.json()).code, "RATE_LIMITED");
});
