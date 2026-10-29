import { test } from "node:test";
import assert from "node:assert/strict";
import { HEY } from "../src/core/index.js";

test("HEY.precision exposes the complete pinpoint surface through the barrel", () => {
  const precision = HEY.precision;
  for (const key of [
    "createContract",
    "get",
    "update",
    "verify",
    "applyLock",
    "removeLock",
    "getLocks",
    "allLocks",
    "savePreset",
    "getPreset",
    "copyLocks",
    "inspect",
    "subscribe",
    "createVersion",
    "getVersion",
    "createBranch",
    "getBranch",
    "addVersionToBranch",
    "mergeVersions",
    "cherryPickChange",
    "compareVersions",
    "restoreVersion",
    "markApproved",
    "markFinal",
    "archiveVersion",
    "deleteVersion",
    "listVersions",
    "getVersionHistory",
    "getBranches",
    "getVersionGraph",
  ]) {
    assert.equal(typeof precision[key], "function", `missing barrel export: ${key}`);
  }
  assert.equal(precision.lockTypes.CONTENT, "content");
});

test("precision contract + lock lifecycle enforces then releases exact locks", () => {
  const targetId = `page:${Date.now()}`;
  const contract = HEY.precision.createContract({
    targetId,
    targetType: "page",
    requestedDelta: { headline: "New headline" },
    protectedState: ["headline"],
    invariantClass: "exact",
  });
  assert.ok(contract.id);
  assert.equal(contract.status, "pending");

  assert.equal(HEY.precision.get(contract.id).id, contract.id);
  const updated = HEY.precision.update(contract.id, { status: "approved" });
  assert.equal(updated.status, "approved");

  HEY.precision.applyLock({
    targetId,
    targetType: "page",
    lockType: "content",
    scope: "exact-characters",
    createdBy: "test",
  });
  HEY.precision.applyLock({
    targetId,
    targetType: "page",
    lockType: "layout",
    scope: "full",
    createdBy: "test",
  });
  const locks = HEY.precision.getLocks(targetId);
  assert.equal(locks.length, 2);
  assert.ok(HEY.precision.allLocks().length >= 2);

  HEY.precision.removeLock(targetId, "layout");
  assert.equal(HEY.precision.getLocks(targetId).length, 1);

  const preset = HEY.precision.savePreset("Pinned exact", ["content", "style"]);
  assert.equal(HEY.precision.getPreset(preset.id).lockTypes.length, 2);

  const copied = HEY.precision.copyLocks(targetId, `page2:${Date.now()}`, ["content"]);
  assert.equal(copied.length, 1);
  assert.equal(copied[0].lockType, "content");
});

test("precision versioning and branching let work be compared and restored honestly", () => {
  const before = HEY.precision.createVersion({
    targetId: `canvas:${Date.now()}`,
    metadata: { targetType: "canvas", label: "before" },
    content: { headline: "old", accent: "#112244" },
  });
  const after = HEY.precision.createVersion({
    targetId: before.targetId,
    metadata: { targetType: "canvas", label: "after" },
    content: { headline: "new", accent: "#112244" },
  });
  assert.equal(HEY.precision.getVersion(before.id).metadata.label, "before");

  const branch = HEY.precision.createBranch({ name: "explore", baseVersionId: before.id });
  assert.ok(branch.id);
  const linked = HEY.precision.addVersionToBranch(branch.id, after.id);
  assert.equal(linked.id, branch.id);
  assert.ok(HEY.precision.getBranches().some((item) => item.id === branch.id));

  const checks = HEY.precision.compareVersions(before.id, after.id);
  assert.ok(["pending", "passed"].includes(checks.verificationStatus));
  assert.ok(checks.changes.length >= 1);

  const inspection = HEY.precision.inspect({
    beforeId: before.id,
    afterId: after.id,
    targetType: "canvas",
  });
  assert.ok(inspection.id);

  HEY.precision.markApproved(after.id);
  const restored = HEY.precision.restoreVersion(before.id);
  assert.equal(restored.success, true);
});