import { test } from "node:test";
import assert from "node:assert/strict";
import { getAuthIdentity, getAuthSessionId, sameAuthIdentity } from "../src/lib/authIdentity.js";
import { createAuthLifecycle } from "../src/lib/authLifecycle.js";

function session(userId, sessionId, tokenVersion = "one") {
  const claims = btoa(JSON.stringify({ session_id: sessionId, version: tokenVersion }));
  return { user: { id: userId }, access_token: `header.${claims}.signature` };
}

test("canonical auth identity comes from the active user and session token", () => {
  const first = getAuthIdentity(session("user-a", "session-a"));
  assert.deepEqual(first, { userId: "user-a", sessionId: "session-a" });
  assert.equal(getAuthSessionId({ access_token: "broken" }), null);
  assert.equal(getAuthIdentity(null), null);
  assert.equal(sameAuthIdentity(first, getAuthIdentity(session("user-a", "session-a", "refreshed"))), true);
  assert.equal(sameAuthIdentity(first, getAuthIdentity(session("user-a", "session-b"))), false);
  assert.equal(sameAuthIdentity(first, getAuthIdentity(session("user-b", "session-a"))), false);
});

test("account lifecycle resets scoped state when the session changes for the same user", async () => {
  let authListener;
  let resetCount = 0;
  const client = {
    auth: {
      onAuthStateChange(listener) {
        authListener = listener;
        return { data: { subscription: { unsubscribe() {} } } };
      },
      async getSession() { return { data: { session: session("user-a", "session-a") }, error: null }; },
    },
    from() {
      const query = {
        select() { return query; },
        eq() { return query; },
        async maybeSingle() { return { data: { id: "user-a", plan: "free" }, error: null }; },
      };
      return query;
    },
  };
  const lifecycle = createAuthLifecycle({
    client,
    onState() {},
    resetAccountState() { resetCount += 1; },
    async hydrate() {},
    enableSync() {},
    disableSync() {},
    defer(callback) { queueMicrotask(callback); },
  });
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
  lifecycle.start();
  await flush();
  assert.equal(resetCount, 1);

  authListener("TOKEN_REFRESHED", session("user-a", "session-a", "refreshed"));
  await flush();
  assert.equal(resetCount, 1, "routine token refresh must preserve same-session work");

  authListener("SIGNED_IN", session("user-a", "session-b"));
  await flush();
  assert.equal(resetCount, 2, "a new session must reset account-scoped work");

  authListener("SIGNED_OUT", null);
  await flush();
  assert.equal(resetCount, 3);
  lifecycle.stop();
});
