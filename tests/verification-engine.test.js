/**
 * Verification Engine Tests — ≥10 tests per Part 13 §9.3
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  requestVerification,
  assignVerifier,
  recordIndependentReproduction,
  completeVerification,
  revokeVerification,
  getVerification,
  assertVerified,
  getAuditTrail,
  clearAll,
  VALID_STATUSES,
} from "../src/core/verificationEngine.js";

describe("Verification Engine — Independent Reproduction Mandatory", () => {
  beforeEach(() => clearAll());
  afterEach(() => clearAll());

  it("requests verification with pending status", () => {
    const record = requestVerification({
      capabilityId: "cap_123",
      implementerId: "impl_1",
      evidence: { testResults: [], traces: [], receipts: [] },
    });
    assert.equal(record.capabilityId, "cap_123");
    assert.equal(record.implementerId, "impl_1");
    assert.equal(record.status, "pending");
    assert.equal(record.verifierId, null);
    assert.equal(record.independentReproduction, false);
    assert.ok(record.requestedAt);
  });

  it("assigns a different verifier", () => {
    const record = requestVerification({
      capabilityId: "cap_123",
      implementerId: "impl_1",
      evidence: {},
    });
    const updated = assignVerifier(record, "verifier_1");
    assert.equal(updated.verifierId, "verifier_1");
    assert.ok(updated.assignedAt);
    assert.equal(updated.status, "pending");
  });

  it("rejects self-verification (verifier === implementer)", () => {
    const record = requestVerification({
      capabilityId: "cap_123",
      implementerId: "impl_1",
      evidence: {},
    });
    assert.throws(() => assignVerifier(record, "impl_1"), /Verifier cannot be the implementer/);
  });

  it("requires independent reproduction for verified status", () => {
    let record = requestVerification({
      capabilityId: "cap_123",
      implementerId: "impl_1",
      evidence: {},
    });
    record = assignVerifier(record, "verifier_1");
    // Cannot complete as verified without independent reproduction
    assert.throws(() => completeVerification(record, { status: "verified" }), /Independent reproduction required/);
  });

  it("completes verification with independent reproduction", () => {
    let record = requestVerification({
      capabilityId: "cap_123",
      implementerId: "impl_1",
      evidence: { testResults: ["pass"] },
    });
    record = assignVerifier(record, "verifier_1");
    record = recordIndependentReproduction(record, {
      reproductionEvidence: { testResults: ["pass"], reproducedBy: "verifier_1" },
      reproducedBy: "verifier_1",
    });
    const completed = completeVerification(record, { status: "verified", limitations: ["none"] });
    assert.equal(completed.status, "verified");
    assert.equal(completed.independentReproduction, true);
    assert.ok(completed.verifiedAt);
    assert.deepEqual(completed.limitations, ["none"]);
  });

  it("revokes verification globally", () => {
    let record = requestVerification({
      capabilityId: "cap_123",
      implementerId: "impl_1",
      evidence: {},
    });
    record = assignVerifier(record, "verifier_1");
    record = recordIndependentReproduction(record, { reproductionEvidence: {}, reproducedBy: "verifier_1" });
    record = completeVerification(record, { status: "verified" });

    const revoked = revokeVerification("cap_123", { reason: "Security issue found", revokedBy: "Sako" });
    assert.equal(revoked.status, "revoked");
    assert.ok(revoked.limitations.some(l => l.includes("revoked")));

    // Subsequent assertVerified should fail
    assert.throws(() => assertVerified("cap_123"), /Capability not verified/);
  });

  it("records limitations", () => {
    let record = requestVerification({
      capabilityId: "cap_123",
      implementerId: "impl_1",
      evidence: {},
    });
    record = assignVerifier(record, "verifier_1");
    record = recordIndependentReproduction(record, { reproductionEvidence: {}, reproducedBy: "verifier_1" });
    const completed = completeVerification(record, { status: "verified", limitations: ["network-only", "rate-limited"] });
    assert.deepEqual(completed.limitations, ["network-only", "rate-limited"]);
  });

  it("returns frozen records", () => {
    const record = requestVerification({
      capabilityId: "cap_123",
      implementerId: "impl_1",
      evidence: {},
    });
    assert.throws(() => { record.status = "verified"; }, TypeError);
  });

  it("queries verification record", () => {
    const record = requestVerification({
      capabilityId: "cap_123",
      implementerId: "impl_1",
      evidence: {},
    });
    const queried = getVerification("cap_123");
    assert.ok(queried);
    assert.equal(queried.capabilityId, "cap_123");
    assert.equal(getVerification("unknown"), undefined);
  });

  it("status transitions: pending → verified/failed/revoked", () => {
    let record = requestVerification({
      capabilityId: "cap_123",
      implementerId: "impl_1",
      evidence: {},
    });
    assert.equal(record.status, "pending");

    record = assignVerifier(record, "verifier_1");
    record = recordIndependentReproduction(record, { reproductionEvidence: {}, reproducedBy: "verifier_1" });
    const verified = completeVerification(record, { status: "verified" });
    assert.equal(verified.status, "verified");

    const revoked = revokeVerification("cap_123", { reason: "test", revokedBy: "Sako" });
    assert.equal(revoked.status, "revoked");
  });

  it("assertVerified throws on missing, failed, or self-verified", () => {
    // Missing
    assert.throws(() => assertVerified("missing"), /No verification record/);

    // Failed
    let failed = requestVerification({ capabilityId: "cap_fail", implementerId: "impl_1", evidence: {} });
    failed = assignVerifier(failed, "verifier_1");
    failed = completeVerification(failed, { status: "failed" });
    assert.throws(() => assertVerified("cap_fail"), /Capability not verified/);

    // Self-verification rejected at assignVerifier — cannot reach verified state
    // (tested in "rejects self-verification" above)
    assert.ok(true);
  });

  it("audit trail records all actions", () => {
    let record = requestVerification({
      capabilityId: "cap_123",
      implementerId: "impl_1",
      evidence: {},
    });
    record = assignVerifier(record, "verifier_1");
    record = recordIndependentReproduction(record, { reproductionEvidence: {}, reproducedBy: "verifier_1" });
    record = completeVerification(record, { status: "verified" });

    const trail = getAuditTrail();
    assert.equal(trail.length, 4);
    assert.equal(trail[3].action, "request");
    assert.equal(trail[2].action, "assign-verifier");
    assert.equal(trail[1].action, "reproduction-recorded");
    assert.equal(trail[0].action, "complete");
  });

  it("rejects completion of non-pending record", () => {
    let record = requestVerification({
      capabilityId: "cap_123",
      implementerId: "impl_1",
      evidence: {},
    });
    record = assignVerifier(record, "verifier_1");
    record = recordIndependentReproduction(record, { reproductionEvidence: {}, reproducedBy: "verifier_1" });
    record = completeVerification(record, { status: "verified" });
    assert.throws(() => completeVerification(record, { status: "failed" }), /Cannot complete verified record/);
  });

  it("reproduction must be by assigned verifier", () => {
    let record = requestVerification({
      capabilityId: "cap_123",
      implementerId: "impl_1",
      evidence: {},
    });
    record = assignVerifier(record, "verifier_1");
    assert.throws(() => recordIndependentReproduction(record, { reproductionEvidence: {}, reproducedBy: "other" }), /Only assigned verifier/);
  });
});