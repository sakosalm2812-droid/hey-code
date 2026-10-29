import { test } from "node:test";
import assert from "node:assert/strict";

import {
  exportUserData,
  downloadJsonAsFile,
  requestAccountDeletion,
  fetchCollection,
} from "../src/lib/dataControls.js";

const makeClient = (store = {}) => ({
  from: (table) => ({
    select: () => ({
      eq: (column, value) => {
        if (table === "profiles" && column === "id") {
          return {
            maybeSingle: async () =>
              store.profile
                ? { data: store.profile, error: null }
                : { data: null, error: { message: "no profile" } },
          };
        }
        return {
          then: async (resolve) =>
            resolve({
              data: (store[table] || []).filter((row) => row[column] === value),
              error: store.errors?.[table] ?? null,
            }),
        };
      },
    }),
  }),
  functions: store.functions,
});

test("exportUserData gathers account-associated collections into JSON", async () => {
  const store = {
    profile: { id: "user-1", display_name: "Ada" },
    hey_conversations: [{ id: "c1", user_id: "user-1", title: "Launch" }],
    hey_records: [{ id: "r1", user_id: "user-1", kind: "task" }],
    memory: [{ id: "m1", user_id: "user-1", memory: "Remember x" }],
  };
  const result = await exportUserData({ client: makeClient(store), userId: "user-1" });

  assert.equal(result.error, null);
  assert.equal(result.data.userId, "user-1");
  assert.equal(result.data.collections.profile.id, "user-1");
  assert.equal(result.data.collections.hey_conversations.length, 1);
  assert.equal(result.data.collections.hey_records[0].kind, "task");
  assert.equal(result.data.collections.memory.length, 1);
});

test("exportUserData keeps collecting when a table cannot be read", async () => {
  const store = {
    profile: { id: "user-1" },
    hey_records: [{ id: "r1", user_id: "user-1", kind: "note" }],
    errors: { memory: { message: "permission denied for table memory" } },
  };
  const result = await exportUserData({ client: makeClient(store), userId: "user-1" });
  assert.equal(result.error, null);
  assert.ok(result.skipped.includes("memory"));
  assert.equal(result.data.collections.hey_records.length, 1);
  assert.equal(result.data.collections.memory, undefined);
});

test("exportUserData returns an error without a user", async () => {
  const result = await exportUserData({ client: makeClient(), userId: "" });
  assert.ok(result.error);
  assert.equal(result.data, null);
});

test("fetchCollection surfaces table errors as rejections", async () => {
  const store = { errors: { broken: { message: "relation does not exist" } } };
  await assert.rejects(() => fetchCollection(makeClient(store), "broken", "user-1"), /relation does not exist/);
});

test("downloadJsonAsFile is inert outside the browser", async () => {
  const result = downloadJsonAsFile({ hello: "world" }, "hey.json");
  assert.equal(result.ok, false);
  assert.match(result.error, /not available in this environment/);
});

test("requestAccountDeletion reports service success and failure honestly", async () => {
  const ok = await requestAccountDeletion({
    client: makeClient({ functions: { invoke: async () => ({ data: { ok: true }, error: null }) } }),
    userId: "user-1",
  });
  assert.deepEqual(ok, { ok: true, error: null });

  const failed = await requestAccountDeletion({
    client: makeClient({ functions: { invoke: async () => ({ data: null, error: { message: "Unauthorized" } }) } }),
    userId: "user-1",
  });
  assert.equal(failed.ok, false);
  assert.match(failed.error, /Unauthorized/);

  const bare = await requestAccountDeletion({ client: makeClient(), userId: "user-1" });
  assert.equal(bare.ok, false);
  assert.match(bare.error, /not configured/);
});