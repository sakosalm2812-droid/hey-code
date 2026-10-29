import assert from "node:assert/strict";
import test from "node:test";
import { runVerifiedStep } from "../src/core/executionLoop.js";
import { executeTask } from "../src/core/executionEngine.js";
import { registerTool, executeTool, unregisterTool } from "../src/core/toolRegistry.js";
import { publish, subscribe, clearEventListeners, getEventFailures, clearEventFailures } from "../src/core/eventBus.js";

test("unverified side effects retain their result and are never re-executed", async () => {
  let calls = 0;
  const result = await runVerifiedStep({ tool: "send", idempotent: true }, async () => {
    calls += 1;
    return { success: true, externalId: "receipt-1" };
  }, async () => ({ verified: false }));
  assert.equal(calls, 1);
  assert.equal(result.requiresReconciliation, true);
  assert.equal(result.result.externalId, "receipt-1");
});

test("autonomous task execution rejects success without verification and preserves receipts", async () => {
  let calls = 0;
  const plan = await executeTask("Send a message", async () => {
    calls += 1;
    return { success: true, externalId: "task-receipt" };
  }, { maxRetries: 3 });
  assert.equal(calls, 1);
  assert.equal(plan.status, "failed");
  assert.equal(plan.requiresReconciliation, true);
  assert.equal(plan.steps[0].result.externalId, "task-receipt");
});

test("autonomous task execution completes only with verified executor results", async () => {
  const plan = await executeTask("Understand this request", async () => ({ success: true, verified: true }));
  assert.equal(plan.status, "completed");
  assert.ok(plan.steps.every(step => step.status === "completed"));
});

test("verification crashes preserve the external receipt without repeating execution", async () => {
  let calls = 0;
  const result = await runVerifiedStep({ tool: "send", idempotent: true }, async () => {
    calls += 1;
    return { success: true, externalId: "receipt-2" };
  }, async () => { throw new Error("observer offline"); });
  assert.equal(calls, 1);
  assert.equal(result.requiresReconciliation, true);
  assert.equal(result.result.externalId, "receipt-2");
});

test("cancellation during verification cannot become a completed action", async () => {
  const controller = new AbortController();
  const result = await runVerifiedStep({ tool: "send" }, async () => ({ success: true, externalId: "receipt-cancel" }), async () => {
    controller.abort();
    return { verified: true };
  }, { signal: controller.signal });
  assert.equal(result.success, false);
  assert.equal(result.cancelled, true);
  assert.equal(result.result.externalId, "receipt-cancel");
  assert.equal(result.requiresReconciliation, true);
});

test("only explicitly repeat-safe transient failures are retried", async () => {
  for (const idempotent of [false, true]) {
    let calls = 0;
    const result = await runVerifiedStep({ tool: "fetch", idempotent }, async () => {
      calls += 1;
      return calls === 1 ? { success: false, retryable: true, error: "offline" } : { success: true, verified: true };
    });
    assert.equal(calls, idempotent ? 2 : 1);
    assert.equal(result.success, idempotent);
  }
});

test("tool registry does not repeat unsafe tools even if retry count is configured", async () => {
  let calls = 0;
  registerTool("test.repeat-safety", async () => {
    calls += 1;
    return { success: false, retryable: true, error: "connection lost" };
  }, { maxRetries: 3, capabilities: ["web.search"] });
  try {
    const result = await executeTool("test.repeat-safety", {}, { user: { id: "test-user", permissions: ["web.search"] } });
    assert.equal(result.success, false);
    assert.equal(calls, 1);
  } finally { unregisterTool("test.repeat-safety"); }
});

test("sync and async listener failures do not interrupt delivery or expose payloads", async () => {
  clearEventFailures();
  const seen = [];
  subscribe("test.event", () => { throw new Error("private secret"); });
  subscribe("test.event", async () => { throw new Error("private secret"); });
  subscribe("test.event", (payload) => seen.push(payload.id));
  assert.equal(publish("test.event", { id: 42, secret: "private secret" }), 3);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(seen, [42]);
  assert.equal(getEventFailures().length, 2);
  assert.equal(JSON.stringify(getEventFailures()).includes("private secret"), false);
  clearEventListeners("test.event");
  clearEventFailures();
});
