/**
 * Trust Kernel Tests — ≥15 tests per Part 13 §7.4
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { evaluate, getPolicy, definePolicy, getAuditTrail, clearAuditTrail, RISK_ORDER, POLICY_VERSION } from "../src/core/trustKernel.js";

function baseContext(overrides = {}) {
  return {
    userId: "user_123",
    tenantId: "tenant_1",
    role: "user",
    action: "file:write",
    resourceScope: "file:abc",
    costCents: 0,
    risk: "R2",
    userConsent: true,
    permissions: ["file:write"],
    deviceContext: { platform: "web", capabilities: [], trustLevel: "standard" },
    approvalToken: null,
    verificationEvidence: null,
    ...overrides,
  };
}

describe("Trust Kernel — Policy Evaluation", () => {
  beforeEach(() => clearAuditTrail());
  afterEach(() => clearAuditTrail());

  it("allows low-risk action with consent and permission", () => {
    const ctx = baseContext({ action: "file:write", risk: "R2", userConsent: true, permissions: ["file:write"] });
    const decision = evaluate(ctx);
    assert.equal(decision.allowed, true);
    assert.equal(decision.action, "allow");
    assert.equal(decision.reason, "allowed");
  });

  it("denies high-risk action without approval", () => {
    const ctx = baseContext({ action: "file:delete", risk: "R3", approvalToken: null, permissions: ["file:delete"] });
    const decision = evaluate(ctx);
    assert.equal(decision.allowed, false);
    assert.equal(decision.action, "require-approval");
    assert.equal(decision.reason, "approval-required");
    assert.deepEqual(decision.requiredApprovals, ["execution-approval"]);
  });

  it("allows high-risk action with valid approval token", () => {
    const ctx = baseContext({ action: "file:delete", risk: "R3", approvalToken: "approval_abc123", permissions: ["file:delete"] });
    const decision = evaluate(ctx);
    assert.equal(decision.allowed, true);
    assert.equal(decision.action, "allow");
  });

  it("refuses R4 always, even with approval", () => {
    const ctx = baseContext({ action: "permission:grant", risk: "R4", approvalToken: "approval_abc123", permissions: ["permission:grant"] });
    const decision = evaluate(ctx);
    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, "risk-R4-refused");
    assert.equal(decision.action, "deny");
  });

  it("fails closed on missing context", () => {
    const decision = evaluate(null);
    assert.equal(decision.allowed, false);
    assert.equal(decision.action, "deny");
    assert.ok(decision.reason.includes("missing-context") || decision.reason.includes("context missing"));
  });

  it("fails closed on missing action", () => {
    const ctx = baseContext({ action: "" });
    const decision = evaluate(ctx);
    assert.equal(decision.allowed, false);
    assert.ok(decision.reason.includes("missing-action") || decision.reason.includes("action missing"));
  });

  it("fails closed on unknown action", () => {
    const ctx = baseContext({ action: "unknown:action", risk: "R1" });
    const decision = evaluate(ctx);
    assert.equal(decision.allowed, false);
    assert.ok(decision.reason.includes("unknown-action"));
  });

  it("fails closed on invalid risk level", () => {
    const ctx = baseContext({ risk: "R5" });
    const decision = evaluate(ctx);
    assert.equal(decision.allowed, false);
    assert.ok(decision.reason.includes("invalid-risk") || decision.reason.includes("invalid risk"));
  });

  it("audits every decision", () => {
    evaluate(baseContext());
    evaluate(baseContext({ action: "model:call", risk: "R1", permissions: ["model:call"] }));
    const trail = getAuditTrail();
    assert.equal(trail.length, 2);
    assert.ok(trail[0].id);
    assert.ok(trail[0].at);
    assert.equal(trail[0].policyVersion, POLICY_VERSION);
  });

  it("is deterministic: same input → same output (ignoring audit IDs)", () => {
    const ctx = baseContext({ action: "model:call", risk: "R1", permissions: ["model:call"], costCents: 500 });
    const d1 = evaluate(ctx);
    const d2 = evaluate(ctx);
    // Compare everything except audit-generated fields
    const { id: _, at: __, metadata: m1 } = d1;
    const { id: _2, at: _3, metadata: m2 } = d2;
    assert.equal(d1.allowed, d2.allowed);
    assert.equal(d1.reason, d2.reason);
    assert.equal(d1.action, d2.action);
    assert.deepEqual(d1.requiredApprovals, d2.requiredApprovals);
    assert.deepEqual(d1.requiredVerifications, d2.requiredVerifications);
    assert.deepEqual(m1, m2);
    assert.equal(d1.policyVersion, d2.policyVersion);
  });

  it("refuses unknown action", () => {
    const ctx = baseContext({ action: "does:not-exist", risk: "R0" });
    const decision = evaluate(ctx);
    assert.equal(decision.allowed, false);
    assert.equal(decision.action, "deny");
  });

  it("enforces cost budget from policy", () => {
    const ctx = baseContext({ action: "model:call", risk: "R1", permissions: ["model:call"], costCents: 15000 });
    const decision = evaluate(ctx);
    assert.equal(decision.allowed, false);
    assert.ok(decision.reason.includes("cost-exceeds-policy"));
  });

  it("checks required permissions", () => {
    const ctx = baseContext({ action: "file:write", risk: "R2", userConsent: true, permissions: [] });
    const decision = evaluate(ctx);
    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, "missing-permission: file:write");
  });

  it("considers device context in metadata", () => {
    const ctx = baseContext({ deviceContext: { platform: "tauri-desktop", capabilities: ["native"], trustLevel: "high" } });
    const decision = evaluate(ctx);
    assert.equal(decision.allowed, true);
    assert.ok(decision.metadata.risk);
    assert.ok(decision.metadata.policyRisk);
  });

  it("freezes policies: cannot mutate after define", () => {
    const policy = getPolicy("file:write");
    assert.throws(() => { policy.risk = "R0"; }, TypeError);
  });

  it("validates policy definition", () => {
    assert.throws(() => definePolicy({ action: "", risk: "R1" }), TypeError);
    assert.throws(() => definePolicy({ action: "test:action", risk: "R9" }), TypeError);
    assert.throws(() => definePolicy(null), TypeError);
  });

  it("escalation: full autonomy still requires approval for R3", () => {
    const ctx = baseContext({ action: "file:delete", risk: "R3", role: "full-autonomy", approvalToken: null, permissions: ["file:delete"] });
    const decision = evaluate(ctx);
    assert.equal(decision.allowed, false);
    assert.equal(decision.action, "require-approval");
  });

  it("escalation: full autonomy refuses R4", () => {
    const ctx = baseContext({ action: "permission:grant", risk: "R4", role: "full-autonomy", approvalToken: "token", permissions: ["permission:grant"] });
    const decision = evaluate(ctx);
    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, "risk-R4-refused");
  });

  it("requires consent when policy demands it", () => {
    const ctx = baseContext({ action: "file:write", risk: "R2", userConsent: false });
    const decision = evaluate(ctx);
    assert.equal(decision.allowed, false);
    assert.equal(decision.action, "require-approval");
    assert.deepEqual(decision.requiredApprovals, ["user-consent"]);
  });

  it("requires verification when policy demands it", () => {
    const ctx = baseContext({ action: "vault:promote", risk: "R3", approvalToken: "token", permissions: ["vault:promote"], verificationEvidence: null });
    const decision = evaluate(ctx);
    assert.equal(decision.allowed, false);
    assert.equal(decision.action, "require-verification");
    assert.deepEqual(decision.requiredVerifications, ["independent-reproduction"]);
  });

  it("rejects self-verification", () => {
    const ctx = baseContext({
      action: "vault:promote",
      risk: "R3",
      approvalToken: "token",
      permissions: ["vault:promote"],
      verificationEvidence: { independentReproduction: true, verifierId: "same", implementerId: "same" }
    });
    const decision = evaluate(ctx);
    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, "self-verification-forbidden");
  });

  it("accepts valid independent verification", () => {
    const ctx = baseContext({
      action: "vault:promote",
      risk: "R3",
      approvalToken: "token",
      permissions: ["vault:promote"],
      verificationEvidence: { independentReproduction: true, verifierId: "verifier_1", implementerId: "impl_1" }
    });
    const decision = evaluate(ctx);
    assert.equal(decision.allowed, true);
  });
});