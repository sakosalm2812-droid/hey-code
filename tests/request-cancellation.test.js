import assert from "node:assert/strict";
import test from "node:test";
import { fetchWithRetry } from "../src/lib/requestTransport.js";
import { createMission, executeMission, getMission, recoverInterruptedMissions, reconcileMissionStep, setMissionState } from "../src/core/infinity/missionEngine.js";
import { writeJson } from "../src/core/infinity/storage.js";

test("lost POST responses are not automatically dispatched twice", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new TypeError("connection lost"); };
  try {
    await assert.rejects(fetchWithRetry("https://provider.example", { method: "POST" }, { retries: 3 }), /connection lost/);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});

test("caller cancellation reaches the transport and prevents retries", async () => {
  const original = globalThis.fetch;
  const controller = new AbortController();
  let calls = 0;
  globalThis.fetch = async (_url, { signal }) => {
    calls += 1;
    return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true }));
  };
  try {
    const request = fetchWithRetry("https://provider.example", { signal: controller.signal }, { idempotent: true, retries: 3 });
    controller.abort();
    await assert.rejects(request, { name: "AbortError" });
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});

test("mission cancellation aborts the runner and never records completion", async () => {
  const mission = createMission({ goal: "cancel test" });
  let signal;
  let started;
  const ready = new Promise(resolve => { started = resolve; });
  const run = executeMission(mission.id, async (_step, _mission, context) => {
    signal = context.signal;
    started();
    return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true }));
  });
  await ready;
  setMissionState(mission.id, "cancelled");
  const result = await run;
  assert.equal(signal.aborted, true);
  assert.equal(result.ok, false);
  assert.equal(getMission(mission.id).state, "cancelled");
  assert.equal(getMission(mission.id).outputs.length, 0);
});

test("restart during an external action requires reconciliation before replay", async () => {
  const mission = createMission({ goal: "restart test" });
  writeJson("hey_infinity_missions", [{ ...mission, state: "running", inFlight: { step: 0, requestId: "request-before-crash" } }]);
  recoverInterruptedMissions();
  let calls = 0;
  const result = await executeMission(mission.id, async () => { calls += 1; return { ok: true, output: "repeated" }; });
  assert.equal(result.requiresReconciliation, true);
  assert.equal(calls, 0);
  assert.equal(getMission(mission.id).state, "paused");
  assert.throws(() => reconcileMissionStep(mission.id, "completed", ""), /Record what you checked/);
  reconcileMissionStep(mission.id, "completed", "Destination receipt confirms request-before-crash completed.");
  const resumed = await executeMission(mission.id, async () => { calls += 1; return { ok: true, output: "repeated" }; });
  assert.equal(resumed.ok, true);
  assert.equal(calls, 0, "reviewed completed steps must not execute again");
  assert.equal(getMission(mission.id).reviews[0].source, "user-review");
});

test("checkpoint storage failure stops a mission before provider dispatch", async () => {
  const stored = new Map();
  let full = false;
  globalThis.window = { localStorage: {
    getItem: key => stored.get(key) || null,
    setItem: (key, value) => { if (full) throw new Error("disk full"); stored.set(key, value); },
  }, dispatchEvent() {} };
  try {
    const mission = createMission({ goal: "storage failure test" });
    full = true;
    let calls = 0;
    const result = await executeMission(mission.id, async () => { calls += 1; return { ok: true, output: "should not execute" }; });
    assert.equal(result.ok, false);
    assert.match(result.error, /checkpoint could not be saved/);
    assert.equal(calls, 0);
  } finally { delete globalThis.window; }
});
