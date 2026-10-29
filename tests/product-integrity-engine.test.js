/**
 * Tests for productIntegrityEngine.js
 * Minimum 8 tests per spec.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  registerRequirement,
  assertRequirementMet,
  getDroppedRequirements,
  getEvidence,
  getRequirement,
  getAllRequirements,
  checkCapabilityRequirements,
  _clear,
} from "../src/core/productIntegrityEngine.js";

describe("productIntegrityEngine.js", () => {
  beforeEach(() => {
    _clear();
  });

  it("registerRequirement creates a frozen requirement", () => {
    const req = registerRequirement({
      id: "REQ-001",
      source: "Part 2 DoD",
      text: "Must have capability contract",
      stage: "stage-06",
      capabilityId: "cap.part2.stage06",
      mandatory: true,
    });
    assert.strictEqual(req.id, "REQ-001");
    assert.strictEqual(req.source, "Part 2 DoD");
    assert.strictEqual(req.text, "Must have capability contract");
    assert.strictEqual(req.stage, "stage-06");
    assert.strictEqual(req.capabilityId, "cap.part2.stage06");
    assert.strictEqual(req.mandatory, true);
    assert.ok(req.registeredAt);
    // Verify frozen
    assert.throws(() => { req.id = "REQ-002"; }, /Cannot assign to read only property/);
  });

  it("registerRequirement rejects duplicate IDs", () => {
    registerRequirement({
      id: "REQ-001",
      source: "Part 2 DoD",
      text: "First",
      stage: "stage-06",
      capabilityId: "cap.part2.stage06",
      mandatory: true,
    });
    assert.throws(() => {
      registerRequirement({
        id: "REQ-001",
        source: "Part 3 DoD",
        text: "Second",
        stage: "stage-07",
        capabilityId: "cap.part3.stage07",
        mandatory: false,
      });
    }, /already registered/);
  });

  it("registerRequirement validates all required fields", () => {
    assert.throws(() => registerRequirement({ source: "x", text: "x", stage: "x", capabilityId: "x", mandatory: true }), /id is required/);
    assert.throws(() => registerRequirement({ id: "x", text: "x", stage: "x", capabilityId: "x", mandatory: true }), /source is required/);
    assert.throws(() => registerRequirement({ id: "x", source: "x", stage: "x", capabilityId: "x", mandatory: true }), /text is required/);
    assert.throws(() => registerRequirement({ id: "x", source: "x", text: "x", capabilityId: "x", mandatory: true }), /stage is required/);
    assert.throws(() => registerRequirement({ id: "x", source: "x", text: "x", stage: "x", mandatory: true }), /capabilityId is required/);
    assert.throws(() => registerRequirement({ id: "x", source: "x", text: "x", stage: "x", capabilityId: "x" }), /mandatory must be a boolean/);
  });

  it("assertRequirementMet records evidence for a requirement", () => {
    registerRequirement({
      id: "REQ-001",
      source: "Part 2 DoD",
      text: "Test requirement",
      stage: "stage-06",
      capabilityId: "cap.part2.stage06",
      mandatory: true,
    });

    const result = assertRequirementMet({
      requirementId: "REQ-001",
      evidence: "Implemented in capabilityContract.js",
      traceId: "trace-123",
    });
    assert.strictEqual(result.ok, true);

    const evidence = getEvidence("REQ-001");
    assert.strictEqual(evidence.length, 1);
    assert.strictEqual(evidence[0].requirementId, "REQ-001");
    assert.strictEqual(evidence[0].capabilityId, "cap.part2.stage06");
    assert.strictEqual(evidence[0].evidence, "Implemented in capabilityContract.js");
    assert.strictEqual(evidence[0].traceId, "trace-123");
    assert.ok(evidence[0].recordedAt);
  });

  it("assertRequirementMet fails for unregistered requirement", () => {
    const result = assertRequirementMet({
      requirementId: "REQ-999",
      evidence: "Some evidence",
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.missing.includes("Requirement REQ-999 not registered"));
  });

  it("getDroppedRequirements returns mandatory requirements with no evidence", () => {
    registerRequirement({
      id: "REQ-001",
      source: "Part 2 DoD",
      text: "Mandatory with evidence",
      stage: "stage-06",
      capabilityId: "cap.part2.stage06",
      mandatory: true,
    });
    registerRequirement({
      id: "REQ-002",
      source: "Part 2 DoD",
      text: "Mandatory without evidence",
      stage: "stage-07",
      capabilityId: "cap.part2.stage07",
      mandatory: true,
    });
    registerRequirement({
      id: "REQ-003",
      source: "Part 2 DoD",
      text: "Optional without evidence",
      stage: "stage-08",
      capabilityId: "cap.part2.stage08",
      mandatory: false,
    });

    assertRequirementMet({ requirementId: "REQ-001", evidence: "Done" });

    const dropped = getDroppedRequirements();
    assert.strictEqual(dropped.length, 1);
    assert.strictEqual(dropped[0].id, "REQ-002");
    assert.strictEqual(dropped[0].mandatory, true);
  });

  it("checkCapabilityRequirements verifies all mandatory requirements for a capability", () => {
    registerRequirement({
      id: "REQ-001",
      source: "Part 2 DoD",
      text: "Req 1",
      stage: "stage-06",
      capabilityId: "cap.test",
      mandatory: true,
    });
    registerRequirement({
      id: "REQ-002",
      source: "Part 2 DoD",
      text: "Req 2",
      stage: "stage-07",
      capabilityId: "cap.test",
      mandatory: true,
    });
    registerRequirement({
      id: "REQ-003",
      source: "Part 2 DoD",
      text: "Req 3",
      stage: "stage-08",
      capabilityId: "cap.test",
      mandatory: false,
    });

    // No evidence yet
    let check = checkCapabilityRequirements("cap.test");
    assert.strictEqual(check.ok, false);
    assert.deepStrictEqual(check.missing.sort(), ["REQ-001", "REQ-002"]);

    // Add evidence for one
    assertRequirementMet({ requirementId: "REQ-001", evidence: "Done" });
    check = checkCapabilityRequirements("cap.test");
    assert.strictEqual(check.ok, false);
    assert.deepStrictEqual(check.missing, ["REQ-002"]);

    // Add evidence for the other
    assertRequirementMet({ requirementId: "REQ-002", evidence: "Done" });
    check = checkCapabilityRequirements("cap.test");
    assert.strictEqual(check.ok, true);
    assert.deepStrictEqual(check.missing, []);
  });

  it("getAllRequirements returns all registered requirements", () => {
    registerRequirement({
      id: "REQ-001",
      source: "Part 2 DoD",
      text: "Req 1",
      stage: "stage-06",
      capabilityId: "cap.part2.stage06",
      mandatory: true,
    });
    registerRequirement({
      id: "REQ-002",
      source: "Part 3 DoD",
      text: "Req 2",
      stage: "stage-07",
      capabilityId: "cap.part3.stage07",
      mandatory: false,
    });

    const all = getAllRequirements();
    assert.strictEqual(all.length, 2);
    const ids = all.map(r => r.id).sort();
    assert.deepStrictEqual(ids, ["REQ-001", "REQ-002"]);
  });

  it("evidence is frozen and cannot be mutated", () => {
    registerRequirement({
      id: "REQ-001",
      source: "Part 2 DoD",
      text: "Test",
      stage: "stage-06",
      capabilityId: "cap.part2.stage06",
      mandatory: true,
    });
    assertRequirementMet({ requirementId: "REQ-001", evidence: "Evidence" });
    const evidence = getEvidence("REQ-001");
    assert.throws(() => { evidence[0].evidence = "Mutated"; }, /Cannot assign to read only property/);
  });

  it("requirements are frozen and cannot be mutated", () => {
    const req = registerRequirement({
      id: "REQ-001",
      source: "Part 2 DoD",
      text: "Test",
      stage: "stage-06",
      capabilityId: "cap.part2.stage06",
      mandatory: true,
    });
    assert.throws(() => { req.mandatory = false; }, /Cannot assign to read only property/);
  });
});