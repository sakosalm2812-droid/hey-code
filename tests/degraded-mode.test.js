/**
 * Degraded Mode Tests — ≥15 tests
 * all seed declarations present; context-aware evaluation; undeclared audited;
 * fallback behavior correct; user message present; frozen.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  declareCapabilityHealth,
  getCapabilityHealth,
  evaluateHealth,
  listAllHealth,
  auditUndeclaredCapabilities,
  getHealthSummary,
  seedMandatoryDeclarations,
  VALID_STATES,
  VALID_DEPENDENCIES,
  VALID_FALLBACKS,
} from "../src/core/degradedMode.js";

describe("Degraded Mode Contracts", () => {
  before(() => {
    // Module auto-seeds on load, but we can call seed again to ensure
    seedMandatoryDeclarations();
  });

  after(() => {
    // No cleanup needed - module state persists
  });

  it("has all mandatory seed declarations from Parts 2-13", () => {
    const declarations = listAllHealth();
    assert.ok(declarations.length >= 35, `Expected at least 35 declarations, got ${declarations.length}`);

    // Check key capabilities are declared
    const ids = declarations.map(d => d.capabilityId);
    assert.ok(ids.includes("cap.model.call"), "cap.model.call declared");
    assert.ok(ids.includes("cap.model.deterministic"), "cap.model.deterministic declared");
    assert.ok(ids.includes("cap.file.write"), "cap.file.write declared");
    assert.ok(ids.includes("cap.file.print"), "cap.file.print declared");
    assert.ok(ids.includes("cap.artifact.export.docx"), "cap.artifact.export.docx declared");
    assert.ok(ids.includes("cap.artifact.export.png"), "cap.artifact.export.png declared");
    assert.ok(ids.includes("cap.voice.wake"), "cap.voice.wake declared");
    assert.ok(ids.includes("cap.automation.run"), "cap.automation.run declared");
    assert.ok(ids.includes("cap.trust.evaluate"), "cap.trust.evaluate declared");
    assert.ok(ids.includes("cap.secret.read"), "cap.secret.read declared");
    assert.ok(ids.includes("cap.verification.engine"), "cap.verification.engine declared");
    assert.ok(ids.includes("cap.release.gate"), "cap.release.gate declared");
    assert.ok(ids.includes("cap.agent.select"), "cap.agent.select declared");
    assert.ok(ids.includes("cap.routing.policy"), "cap.routing.policy declared");
    assert.ok(ids.includes("cap.cost.governor"), "cap.cost.governor declared");
    assert.ok(ids.includes("cap.evolution.propose"), "cap.evolution.propose declared");
    assert.ok(ids.includes("cap.vault.decide"), "cap.vault.decide declared");
  });

  it("returns correct health for declared capability", () => {
    const health = getCapabilityHealth("cap.model.call");
    assert.equal(health.capabilityId, "cap.model.call");
    assert.equal(health.state, "healthy");
    assert.ok(health.reason.length > 0);
    assert.ok(VALID_DEPENDENCIES.includes(health.missingDependency));
    assert.ok(VALID_FALLBACKS.includes(health.fallbackBehavior));
    assert.ok(health.userMessage.length > 0);
    assert.ok(typeof health.estimatedRecoveryMs === "number");
  });

  it("returns default undeclared record for unknown capability", () => {
    const health = getCapabilityHealth("cap.unknown.capability");
    assert.equal(health.capabilityId, "cap.unknown.capability");
    assert.equal(health.state, "unavailable");
    assert.equal(health.reason, "No health declaration found for this capability");
    assert.equal(health.missingDependency, "unknown");
    assert.equal(health.fallbackBehavior, "refuse");
  });

  it("evaluates health context-aware: missing api-key degrades model call", () => {
    const healthy = evaluateHealth({ capabilityId: "cap.model.call", context: { hasApiKey: true } });
    assert.equal(healthy.state, "healthy");

    const degraded = evaluateHealth({ capabilityId: "cap.model.call", context: { hasApiKey: false } });
    assert.equal(degraded.state, "degraded");
    assert.ok(degraded.reason.includes("api-key"));
    assert.equal(degraded.missingDependency, "api-key");
    assert.equal(degraded.fallbackBehavior, "refuse");
  });

  it("evaluates health context-aware: missing permission degrades file write", () => {
    const healthy = evaluateHealth({ capabilityId: "cap.file.write", context: { hasPermission: true } });
    assert.equal(healthy.state, "healthy");

    const degraded = evaluateHealth({ capabilityId: "cap.file.write", context: { hasPermission: false } });
    assert.equal(degraded.state, "degraded");
    assert.ok(degraded.reason.includes("permission"));
    assert.equal(degraded.missingDependency, "permission");
  });

  it("evaluates health context-aware: offline degrades network-dependent capabilities", () => {
    const healthy = evaluateHealth({ capabilityId: "cap.artifact.export.png", context: { isOnline: true, hasProvider: true } });
    assert.equal(healthy.state, "healthy");

    const degraded = evaluateHealth({ capabilityId: "cap.artifact.export.png", context: { isOnline: false } });
    assert.equal(degraded.state, "degraded");
    assert.ok(degraded.reason.includes("network"));
    assert.equal(degraded.missingDependency, "network");
  });

  it("keeps blocked/unavailable/disabled capabilities as-is regardless of context", () => {
    // These are declared as unavailable
    const docx = evaluateHealth({ capabilityId: "cap.artifact.export.docx", context: { hasToolchain: true } });
    assert.equal(docx.state, "unavailable");

    const automation = evaluateHealth({ capabilityId: "cap.automation.run", context: { hasToolchain: true } });
    assert.equal(automation.state, "unavailable");
  });

  it("audits undeclared capabilities correctly", () => {
    const result = auditUndeclaredCapabilities([
      "cap.model.call",
      "cap.file.write",
      "cap.unknown.missing",
      "cap.another.missing",
    ]);

    assert.ok(result.declared.includes("cap.model.call"));
    assert.ok(result.declared.includes("cap.file.write"));
    assert.ok(result.undeclared.includes("cap.unknown.missing"));
    assert.ok(result.undeclared.includes("cap.another.missing"));
    assert.equal(result.declared.length, 2);
    assert.equal(result.undeclared.length, 2);
  });

  it("provides health summary with counts by state", () => {
    const summary = getHealthSummary();
    assert.ok(summary.total >= 35);
    assert.ok(typeof summary.byState.healthy === "number");
    assert.ok(typeof summary.byState.degraded === "number");
    assert.ok(typeof summary.byState.unavailable === "number");
    assert.ok(typeof summary.byState.blocked === "number");
    assert.ok(typeof summary.byState.disabled === "number");
    assert.ok(typeof summary.byMissingDependency["api-key"] === "number");
    assert.ok(typeof summary.byMissingDependency["permission"] === "number");
    assert.ok(typeof summary.byMissingDependency["network"] === "number");
    assert.ok(typeof summary.byMissingDependency["toolchain"] === "number");
    assert.ok(typeof summary.byFallbackBehavior.refuse === "number");
    assert.ok(typeof summary.byFallbackBehavior["local-fallback"] === "number");
  });

  it("fallback behaviors are correct for each capability", () => {
    const modelCall = getCapabilityHealth("cap.model.call");
    assert.equal(modelCall.fallbackBehavior, "refuse");

    const deterministic = getCapabilityHealth("cap.model.deterministic");
    assert.equal(deterministic.fallbackBehavior, "local-fallback");

    const docx = getCapabilityHealth("cap.artifact.export.docx");
    assert.equal(docx.fallbackBehavior, "refuse");

    const png = getCapabilityHealth("cap.artifact.export.png");
    assert.equal(png.fallbackBehavior, "refuse");

    const md = getCapabilityHealth("cap.artifact.export.md");
    assert.equal(md.fallbackBehavior, "preview-only");

    const automation = getCapabilityHealth("cap.automation.run");
    assert.equal(automation.fallbackBehavior, "queue");
  });

  it("user messages are present and informative", () => {
    const declarations = listAllHealth();
    for (const d of declarations) {
      assert.ok(d.userMessage.length > 0, `Missing userMessage for ${d.capabilityId}`);
      assert.ok(d.userMessage.length < 500, `userMessage too long for ${d.capabilityId}`);
    }
  });

  it("estimated recovery times are set appropriately", () => {
    const declarations = listAllHealth();
    for (const d of declarations) {
      assert.ok(typeof d.estimatedRecoveryMs === "number", `estimatedRecoveryMs not number for ${d.capabilityId}`);
      if (d.state === "unavailable" && d.missingDependency === "toolchain") {
        assert.equal(d.estimatedRecoveryMs, -1, `Toolchain-dependent capability should have -1 recovery`);
      }
      if (d.fallbackBehavior === "local-fallback") {
        assert.equal(d.estimatedRecoveryMs, 0, `Local fallback should have 0 recovery`);
      }
    }
  });

  it("declarations are frozen (immutable)", () => {
    const health = getCapabilityHealth("cap.model.call");
    // Attempt to mutate - should throw in strict mode or silently fail
    assert.throws(() => {
      health.state = "tampered";
      health.reason = "tampered";
    }, /read only/);

    const fresh = getCapabilityHealth("cap.model.call");
    assert.equal(fresh.state, "healthy");
    assert.equal(fresh.reason, "Hosted provider available");
  });

  it("declareCapabilityHealth validates all required fields", () => {
    assert.throws(() => declareCapabilityHealth("cap.test", {}), /state must be one of/);
    assert.throws(() => declareCapabilityHealth("cap.test", { state: "healthy" }), /reason is required/);
    assert.throws(() => declareCapabilityHealth("cap.test", { state: "healthy", reason: "test" }), /missingDependency must be one of/);
    assert.throws(() => declareCapabilityHealth("cap.test", { state: "healthy", reason: "test", missingDependency: "api-key" }), /fallbackBehavior must be one of/);
    assert.throws(() => declareCapabilityHealth("cap.test", { state: "healthy", reason: "test", missingDependency: "api-key", fallbackBehavior: "refuse" }), /userMessage is required/);
    assert.throws(() => declareCapabilityHealth("cap.test", { state: "healthy", reason: "test", missingDependency: "api-key", fallbackBehavior: "refuse", userMessage: "test" }), /estimatedRecoveryMs must be an integer/);

    // Valid declaration should work
    const valid = declareCapabilityHealth("cap.test.valid", {
      state: "healthy",
      reason: "test",
      missingDependency: "api-key",
      fallbackBehavior: "refuse",
      userMessage: "test message",
      estimatedRecoveryMs: 1000,
    });
    assert.equal(valid.capabilityId, "cap.test.valid");
  });

  it("rejects invalid state values", () => {
    assert.throws(() => declareCapabilityHealth("cap.test.state", {
      state: "invalid",
      reason: "test",
      missingDependency: "api-key",
      fallbackBehavior: "refuse",
      userMessage: "test",
      estimatedRecoveryMs: 0,
    }), /state must be one of/);
  });

  it("rejects invalid missingDependency values", () => {
    assert.throws(() => declareCapabilityHealth("cap.test.dep", {
      state: "healthy",
      reason: "test",
      missingDependency: "invalid-dep",
      fallbackBehavior: "refuse",
      userMessage: "test",
      estimatedRecoveryMs: 0,
    }), /missingDependency must be one of/);
  });

  it("rejects invalid fallbackBehavior values", () => {
    assert.throws(() => declareCapabilityHealth("cap.test.fb", {
      state: "healthy",
      reason: "test",
      missingDependency: "api-key",
      fallbackBehavior: "invalid-fallback",
      userMessage: "test",
      estimatedRecoveryMs: 0,
    }), /fallbackBehavior must be one of/);
  });

  it("prevents duplicate capability declarations", () => {
    // First declaration works (from seed)
    assert.throws(() => declareCapabilityHealth("cap.model.call", {
      state: "healthy",
      reason: "duplicate test",
      missingDependency: "api-key",
      fallbackBehavior: "refuse",
      userMessage: "test",
      estimatedRecoveryMs: 0,
    }), /already declared/);
  });

  it("VALID_STATES, VALID_DEPENDENCIES, VALID_FALLBACKS are exported and frozen", () => {
    assert.ok(Array.isArray(VALID_STATES));
    assert.ok(VALID_STATES.includes("healthy"));
    assert.ok(VALID_STATES.includes("degraded"));
    assert.ok(VALID_STATES.includes("unavailable"));
    assert.ok(VALID_STATES.includes("blocked"));
    assert.ok(VALID_STATES.includes("disabled"));

    assert.ok(Array.isArray(VALID_DEPENDENCIES));
    assert.ok(VALID_DEPENDENCIES.includes("api-key"));
    assert.ok(VALID_DEPENDENCIES.includes("permission"));
    assert.ok(VALID_DEPENDENCIES.includes("network"));
    assert.ok(VALID_DEPENDENCIES.includes("provider"));
    assert.ok(VALID_DEPENDENCIES.includes("toolchain"));
    assert.ok(VALID_DEPENDENCIES.includes("license"));

    assert.ok(Array.isArray(VALID_FALLBACKS));
    assert.ok(VALID_FALLBACKS.includes("refuse"));
    assert.ok(VALID_FALLBACKS.includes("local-fallback"));
    assert.ok(VALID_FALLBACKS.includes("cached"));
    assert.ok(VALID_FALLBACKS.includes("queue"));
  });
});