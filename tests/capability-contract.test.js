/**
 * Tests for the HEY Capability Contract (`src/core/capabilityContract.js`).
 *
 * Seven behaviours are required by the Part 2 definition of done:
 *   1. a valid record passes;
 *   2. missing `id`, bad `platform`, bad `risk`, negative `costCents` fail with
 *      a specific error each;
 *   3. duplicate ids are rejected;
 *   4. `assertExecutable` refuses an `unavailable` platform;
 *   5. `assertExecutable` refuses a missing permission;
 *   6. `assertExecutable` refuses `R3` without an approval token and allows it
 *      with one;
 *   7. frozen records cannot be mutated.
 *
 * Three additional tests cover the set summary and the throwing/composability
 * contract, because those are the two places a later part is most likely to
 * rely on behaviour this module must keep stable.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  APPROVAL_RISK_LEVELS,
  CAPABILITY_HEALTH,
  CAPABILITY_PLATFORMS,
  CAPABILITY_RISK_LEVELS,
  REQUIRED_CAPABILITY_FIELDS,
  assertExecutable,
  defineCapability,
  describeCapabilitySet,
  validateCapability,
  validateCapabilitySet,
} from "../src/core/capabilityContract.js";

/** A minimal record that satisfies every field of the contract. */
function validRecord(overrides = {}) {
  return {
    id: "cap.chat.send",
    name: "Send a chat message",
    version: 1,
    platform: "relay-required",
    inputs: ["message"],
    outputs: ["reply"],
    risk: "R1",
    permissions: [],
    execution: "provider",
    costCents: 0,
    verifiable: true,
    health: "healthy",
    ...overrides,
  };
}

// 1 ────────────────────────────────────────────────────────────────────────
test("a valid capability record passes validation", () => {
  const result = validateCapability(validRecord());

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

// 2 ────────────────────────────────────────────────────────────────────────
test("missing id, bad platform, bad risk and negative costCents each fail with a specific error", () => {
  const missingId = validateCapability(validRecord({ id: undefined }));
  assert.equal(missingId.ok, false);
  assert.ok(
    missingId.errors.some((error) => error.includes("id is required")),
    `expected an id error, got: ${missingId.errors.join(" | ")}`,
  );

  const badPlatform = validateCapability(validRecord({ platform: "satellite" }));
  assert.equal(badPlatform.ok, false);
  assert.ok(
    badPlatform.errors.some((error) => error.includes("platform must be one of")),
    `expected a platform error, got: ${badPlatform.errors.join(" | ")}`,
  );

  const badRisk = validateCapability(validRecord({ risk: "R9" }));
  assert.equal(badRisk.ok, false);
  assert.ok(
    badRisk.errors.some((error) => error.includes("risk must be one of")),
    `expected a risk error, got: ${badRisk.errors.join(" | ")}`,
  );

  const negativeCost = validateCapability(validRecord({ costCents: -5 }));
  assert.equal(negativeCost.ok, false);
  assert.ok(
    negativeCost.errors.some((error) => error.includes("costCents must be greater than or equal to 0")),
    `expected a costCents error, got: ${negativeCost.errors.join(" | ")}`,
  );
});

// 3 ────────────────────────────────────────────────────────────────────────
test("duplicate ids in a set are rejected", () => {
  const first = validRecord();
  const second = validRecord({ name: "Send a chat message, again" });

  const direct = validateCapability(second, { siblings: [first] });
  assert.equal(direct.ok, false);
  assert.ok(
    direct.errors.some((error) => error.includes("duplicate id")),
    `expected a duplicate id error, got: ${direct.errors.join(" | ")}`,
  );

  const set = validateCapabilitySet([first, second]);
  assert.equal(set.ok, false);
  assert.equal(set.perRecord[0].errors.length, 0);
  assert.ok(set.perRecord[1].errors.some((error) => error.includes("duplicate id")));

  const summary = describeCapabilitySet([first, second]);
  assert.deepEqual(summary.duplicateIds, ["cap.chat.send"]);
  assert.equal(summary.ok, false);
});

// 4 ────────────────────────────────────────────────────────────────────────
test("assertExecutable refuses an unavailable platform", () => {
  const declaredUnavailable = assertExecutable(validRecord({ platform: "unavailable" }));
  assert.equal(declaredUnavailable.allowed, false);
  assert.match(declaredUnavailable.reason, /unavailable/);

  const runtimeUnavailable = assertExecutable(validRecord(), { platform: "unavailable" });
  assert.equal(runtimeUnavailable.allowed, false);
  assert.match(runtimeUnavailable.reason, /unavailable/);

  const healthy = assertExecutable(validRecord(), { platform: "relay-required" });
  assert.equal(healthy.allowed, true);
});

// 5 ────────────────────────────────────────────────────────────────────────
test("assertExecutable refuses when a required permission is missing", () => {
  const record = validRecord({
    id: "cap.filesystem.write",
    risk: "R2",
    execution: "local",
    platform: "bridged",
    permissions: ["filesystem.write"],
  });

  const missing = assertExecutable(record, { permission: "filesystem.read" });
  assert.equal(missing.allowed, false);
  assert.match(missing.reason, /filesystem\.write/);

  const absent = assertExecutable(record);
  assert.equal(absent.allowed, false);
  assert.match(absent.reason, /missing required permission/);

  const granted = assertExecutable(record, { permission: ["filesystem.read", "filesystem.write"] });
  assert.equal(granted.allowed, true);
});

// 6 ────────────────────────────────────────────────────────────────────────
test("assertExecutable refuses R3 without an approval token and allows it with one", () => {
  const record = validRecord({
    id: "cap.filesystem.delete",
    risk: "R3",
    execution: "local",
    platform: "bridged",
    permissions: ["filesystem.delete"],
  });

  const noToken = assertExecutable(record, { permission: "filesystem.delete" });
  assert.equal(noToken.allowed, false);
  assert.match(noToken.reason, /approval token/);

  const emptyToken = assertExecutable(record, { permission: "filesystem.delete", approvalToken: "   " });
  assert.equal(emptyToken.allowed, false);

  const approved = assertExecutable(record, {
    permission: "filesystem.delete",
    approvalToken: "approval-7f3c1e9a",
  });
  assert.equal(approved.allowed, true);
  assert.match(approved.reason, /with approval/);

  assert.deepEqual(APPROVAL_RISK_LEVELS, ["R3", "R4"]);
});

// 7 ────────────────────────────────────────────────────────────────────────
test("frozen records cannot be mutated", () => {
  const source = validRecord({ permissions: ["memory.write"], inputs: ["message"] });
  const frozen = defineCapability(source);

  assert.equal(Object.isFrozen(frozen), true);
  assert.equal(Object.isFrozen(frozen.inputs), true);
  assert.equal(Object.isFrozen(frozen.permissions), true);

  assert.throws(() => {
    frozen.name = "Tampered";
  }, TypeError);
  assert.throws(() => {
    frozen.inputs.push("injected");
  }, TypeError);
  assert.throws(() => {
    frozen.permissions.push("filesystem.delete");
  }, TypeError);
  assert.throws(() => {
    frozen.risk = "R0";
  }, TypeError);

  assert.equal(frozen.name, "Send a chat message");
  assert.deepEqual(frozen.inputs, ["message"]);
  assert.deepEqual(frozen.permissions, ["memory.write"]);

  // The caller's own object is not frozen: definition copies, it does not seize.
  assert.equal(Object.isFrozen(source), false);
  source.name = "changed by caller";
  assert.equal(frozen.name, "Send a chat message");
});

// 8 ────────────────────────────────────────────────────────────────────────
test("describeCapabilitySet reports deterministic health and cost totals", () => {
  const records = [
    validRecord(),
    validRecord({
      id: "cap.filesystem.write",
      risk: "R3",
      execution: "local",
      platform: "bridged",
      costCents: 12,
      health: "degraded",
      permissions: ["filesystem.write"],
    }),
    validRecord({
      id: "cap.vision.inspect",
      risk: "R2",
      execution: "local",
      platform: "native",
      costCents: 0.5,
      health: "blocked",
      verifiable: false,
    }),
    validRecord({ id: "bad-id", name: "" }),
  ];

  const summary = describeCapabilitySet(records);

  assert.equal(summary.total, 4);
  assert.equal(summary.valid, 3);
  assert.equal(summary.invalid, 1);
  assert.equal(summary.ok, false);
  assert.deepEqual(summary.byHealth, { healthy: 1, degraded: 1, unavailable: 0, blocked: 1 });
  assert.equal(summary.byPlatform["bridged"], 1);
  assert.equal(summary.byRisk.R3, 1);
  assert.equal(summary.approvalRequired, 1);
  assert.equal(summary.verifiable, 2);
  assert.equal(summary.totalCostCents, 12.5);
  assert.equal(summary.maxCostCents, 12);
  assert.equal(summary.errors.length, 1);
  assert.equal(summary.errors[0].index, 3);

  // Every key is present even when zero, so two summaries render identically.
  for (const state of CAPABILITY_HEALTH) assert.equal(typeof summary.byHealth[state], "number");
  for (const mode of CAPABILITY_PLATFORMS) assert.equal(typeof summary.byPlatform[mode], "number");
  for (const level of CAPABILITY_RISK_LEVELS) assert.equal(typeof summary.byRisk[level], "number");

  const empty = describeCapabilitySet([]);
  assert.equal(empty.total, 0);
  assert.equal(empty.ok, true);
});

// 9 ────────────────────────────────────────────────────────────────────────
test("assertExecutable returns a refusal instead of throwing on an invalid record", () => {
  const result = assertExecutable({ id: "cap.only.an.id" });

  assert.equal(result.allowed, false);
  assert.match(result.reason, /invalid/);

  const notAnObject = assertExecutable(null);
  assert.equal(notAnObject.allowed, false);
  assert.match(notAnObject.reason, /invalid/);
});

// 10 ───────────────────────────────────────────────────────────────────────
test("defineCapability throws a TypeError carrying every error for an invalid record", () => {
  assert.throws(
    () => defineCapability(validRecord({ platform: "unknown", risk: "R99", costCents: -1 })),
    (error) => {
      assert.equal(error instanceof TypeError, true);
      assert.equal(Array.isArray(error.errors), true);
      assert.ok(error.errors.length >= 3);
      assert.match(error.message, /Invalid capability/);
      return true;
    },
  );

  const frozen = defineCapability(validRecord());
  assert.equal(Object.keys(frozen).length >= REQUIRED_CAPABILITY_FIELDS.length, true);
  assert.equal(validateCapability(frozen).ok, true);
});
