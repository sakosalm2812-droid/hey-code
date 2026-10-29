/**
 * Tests for decisionLedger.js
 * Minimum 8 tests per spec.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  recordDecision,
  queryDecisions,
  getDecisionHistory,
  getAllDecisions,
  getLatestDecision,
  _clear,
} from "../src/core/decisionLedger.js";

describe("decisionLedger.js", () => {
  beforeEach(() => {
    _clear();
  });

  it("recordDecision creates an approval with all fields", () => {
    const decision = recordDecision({
      type: "approval",
      proposalId: "cap.test.001",
      scope: "full capability",
      owner: "Sako",
      reason: "Meets all criteria",
      evidence: ["evidence-1", "evidence-2"],
      at: "2026-10-20T10:00:00.000Z",
    });
    assert.strictEqual(decision.type, "approval");
    assert.strictEqual(decision.proposalId, "cap.test.001");
    assert.strictEqual(decision.scope, "full capability");
    assert.strictEqual(decision.owner, "Sako");
    assert.strictEqual(decision.reason, "Meets all criteria");
    assert.deepStrictEqual(decision.evidence, ["evidence-1", "evidence-2"]);
    assert.strictEqual(decision.at, "2026-10-20T10:00:00.000Z");
    assert.strictEqual(decision.seq, 1);
    assert.strictEqual(decision.supersedes, null);
  });

  it("recordDecision creates a rejection", () => {
    const decision = recordDecision({
      type: "rejection",
      proposalId: "cap.test.002",
      scope: "security concern",
      owner: "Amad",
      reason: "Fails security review",
      evidence: ["sec-audit-1"],
    });
    assert.strictEqual(decision.type, "rejection");
    assert.strictEqual(decision.owner, "Amad");
    assert.strictEqual(decision.supersedes, null);
  });

  it("recordDecision creates a supersession linking to previous decision", () => {
    // First decision
    recordDecision({
      type: "approval",
      proposalId: "cap.test.003",
      scope: "initial",
      owner: "Sako",
      reason: "Approved",
      evidence: [],
    });

    // Supersession
    const supersession = recordDecision({
      type: "supersession",
      proposalId: "cap.test.003",
      scope: "updated scope",
      owner: "Amad",
      reason: "Scope expanded",
      evidence: ["1"], // seq of previous decision
    });
    assert.strictEqual(supersession.type, "supersession");
    assert.strictEqual(supersession.supersedes, "1");
  });

  it("recordDecision validates all required fields", () => {
    assert.throws(() => recordDecision({ type: "approval", proposalId: "x", scope: "x", owner: "Sako", reason: "x", evidence: "not-array" }), /evidence must be an array/);
    assert.throws(() => recordDecision({ type: "invalid", proposalId: "x", scope: "x", owner: "Sako", reason: "x", evidence: [] }), /type must be one of/);
    assert.throws(() => recordDecision({ type: "approval", scope: "x", owner: "Sako", reason: "x", evidence: [] }), /proposalId is required/);
    assert.throws(() => recordDecision({ type: "approval", proposalId: "x", owner: "Sako", reason: "x", evidence: [] }), /scope is required/);
    assert.throws(() => recordDecision({ type: "approval", proposalId: "x", scope: "x", reason: "x", evidence: [] }), /owner must be 'Sako' or 'Amad'/);
    assert.throws(() => recordDecision({ type: "approval", proposalId: "x", scope: "x", owner: "Sako", evidence: [] }), /reason is required/);
  });

  it("queryDecisions filters by proposalId", () => {
    recordDecision({ type: "approval", proposalId: "cap.A", scope: "x", owner: "Sako", reason: "x", evidence: [] });
    recordDecision({ type: "rejection", proposalId: "cap.B", scope: "x", owner: "Amad", reason: "x", evidence: [] });
    recordDecision({ type: "approval", proposalId: "cap.A", scope: "x", owner: "Sako", reason: "x", evidence: [] });

    const results = queryDecisions({ proposalId: "cap.A" });
    assert.strictEqual(results.length, 2);
    assert.ok(results.every(d => d.proposalId === "cap.A"));
  });

  it("queryDecisions filters by owner", () => {
    recordDecision({ type: "approval", proposalId: "cap.A", scope: "x", owner: "Sako", reason: "x", evidence: [] });
    recordDecision({ type: "rejection", proposalId: "cap.B", scope: "x", owner: "Amad", reason: "x", evidence: [] });
    recordDecision({ type: "approval", proposalId: "cap.C", scope: "x", owner: "Sako", reason: "x", evidence: [] });

    const results = queryDecisions({ owner: "Sako" });
    assert.strictEqual(results.length, 2);
    assert.ok(results.every(d => d.owner === "Sako"));
  });

  it("queryDecisions filters by type", () => {
    recordDecision({ type: "approval", proposalId: "cap.A", scope: "x", owner: "Sako", reason: "x", evidence: [] });
    recordDecision({ type: "rejection", proposalId: "cap.B", scope: "x", owner: "Amad", reason: "x", evidence: [] });
    recordDecision({ type: "approval", proposalId: "cap.C", scope: "x", owner: "Sako", reason: "x", evidence: [] });

    const results = queryDecisions({ type: "approval" });
    assert.strictEqual(results.length, 2);
    assert.ok(results.every(d => d.type === "approval"));
  });

  it("queryDecisions filters by since timestamp", () => {
    recordDecision({ type: "approval", proposalId: "cap.A", scope: "x", owner: "Sako", reason: "x", evidence: [], at: "2026-10-20T10:00:00.000Z" });
    recordDecision({ type: "rejection", proposalId: "cap.B", scope: "x", owner: "Amad", reason: "x", evidence: [], at: "2026-10-20T11:00:00.000Z" });
    recordDecision({ type: "approval", proposalId: "cap.C", scope: "x", owner: "Sako", reason: "x", evidence: [], at: "2026-10-20T12:00:00.000Z" });

    const results = queryDecisions({ since: "2026-10-20T11:30:00.000Z" });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].proposalId, "cap.C");
  });

  it("getDecisionHistory returns chronological history for a proposal", () => {
    recordDecision({ type: "approval", proposalId: "cap.X", scope: "v1", owner: "Sako", reason: "v1 approved", evidence: [], at: "2026-10-20T10:00:00.000Z" });
    recordDecision({ type: "supersession", proposalId: "cap.X", scope: "v2", owner: "Amad", reason: "v2 supersedes", evidence: ["1"], at: "2026-10-20T11:00:00.000Z" });
    recordDecision({ type: "rejection", proposalId: "cap.X", scope: "v3", owner: "Sako", reason: "v3 rejected", evidence: [], at: "2026-10-20T12:00:00.000Z" });

    const history = getDecisionHistory("cap.X");
    assert.strictEqual(history.length, 3);
    assert.strictEqual(history[0].type, "approval");
    assert.strictEqual(history[1].type, "supersession");
    assert.strictEqual(history[2].type, "rejection");
    // Verify supersession link
    assert.strictEqual(history[1].supersedes, "1");
  });

  it("getAllDecisions returns all decisions in order", () => {
    recordDecision({ type: "approval", proposalId: "cap.A", scope: "x", owner: "Sako", reason: "x", evidence: [] });
    recordDecision({ type: "rejection", proposalId: "cap.B", scope: "x", owner: "Amad", reason: "x", evidence: [] });

    const all = getAllDecisions();
    assert.strictEqual(all.length, 2);
    assert.strictEqual(all[0].seq, 1);
    assert.strictEqual(all[1].seq, 2);
  });

  it("getLatestDecision returns the most recent decision for a proposal", () => {
    recordDecision({ type: "approval", proposalId: "cap.L", scope: "v1", owner: "Sako", reason: "v1", evidence: [], at: "2026-10-20T10:00:00.000Z" });
    recordDecision({ type: "rejection", proposalId: "cap.L", scope: "v2", owner: "Amad", reason: "v2", evidence: [], at: "2026-10-20T11:00:00.000Z" });

    const latest = getLatestDecision("cap.L");
    assert.ok(latest);
    assert.strictEqual(latest.type, "rejection");
    assert.strictEqual(latest.seq, 2);
  });

  it("decisions are frozen and cannot be mutated", () => {
    const decision = recordDecision({
      type: "approval",
      proposalId: "cap.test",
      scope: "x",
      owner: "Sako",
      reason: "x",
      evidence: [],
    });
    assert.throws(() => { decision.reason = "mutated"; }, /Cannot assign to read only property/);
    assert.throws(() => { decision.evidence.push("mutated"); }, /Cannot add property/);
  });

  it("queryDecisions returns frozen array", () => {
    recordDecision({ type: "approval", proposalId: "cap.A", scope: "x", owner: "Sako", reason: "x", evidence: [] });
    const results = queryDecisions({ proposalId: "cap.A" });
    assert.throws(() => { results.push({}); }, /Cannot add property/);
  });
});