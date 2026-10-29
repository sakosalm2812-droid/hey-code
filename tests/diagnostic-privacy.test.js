import assert from "node:assert/strict";
import test from "node:test";
import { summarizeDiagnosticData, bootLogger, getLog } from "../src/core/heyLogger.js";
import { publish } from "../src/core/eventBus.js";

test("diagnostics retain correlation and status without retaining private event content", () => {
  assert.deepEqual(summarizeDiagnosticData({ requestId: "request-1", status: "completed", verified: true,
    input: "private conversation", secret: "private key", result: { message: "private output" },
    image: "data:image/private", tool: "computer.open_url" }), {
    requestId: "request-1", status: "completed", verified: true, tool: "computer.open_url",
  });
});

test("logger migrates existing payloads and event logging excludes conversations", async () => {
  const storage = new Map([['hey_log', JSON.stringify([{ at: 'old', kind: 'execution', data: { input: 'old private data', requestId: 'request-old' } }])]]);
  globalThis.localStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) };
  const stop = bootLogger();
  try {
    assert.equal(storage.get('hey_log').includes('old private data'), false);
    publish('execution.request.started', { requestId: 'request-new', input: 'new private data' });
    await new Promise(resolve => setTimeout(resolve, 1600));
    assert.equal(JSON.stringify(getLog()).includes('new private data'), false);
    assert.equal(getLog().at(-1).data.requestId, 'request-new');
  } finally { stop(); delete globalThis.localStorage; }
});
