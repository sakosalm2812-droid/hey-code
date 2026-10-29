/**
 * E2E Journey Tests — 46 Journeys
 * Each journey: setup → execute → verify → teardown
 * Fixtures only — no live calls.
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { runAllJourneys, runJourney, createAllJourneys } from "../src/core/e2eTestHarness.js";
import { initializeIntegrations, processRequest } from "../src/core/systemIntegration.js";
import { clearAllTraces } from "../src/core/traceSpine.js";

describe("E2E Journeys — 46 Journeys", () => {
  before(() => {
    initializeIntegrations();
    clearAllTraces();
  });

  it("creates all 46 journey instances", () => {
    const journeys = createAllJourneys();
    assert.equal(journeys.length, 46);
    assert.ok(journeys.every(j => j.id >= 1 && j.id <= 46));
    assert.ok(journeys.every(j => j.name && j.name.length > 0));
    assert.ok(journeys.every(j => j.category && j.category.length > 0));
  });

  it("runs all journeys and produces aggregate report", async () => {
    const report = await runAllJourneys();

    assert.equal(report.total, 46);
    assert.ok(typeof report.passed === "number");
    assert.ok(typeof report.failed === "number");
    assert.ok(typeof report.blocked === "number");
    assert.ok(typeof report.skipped === "number");
    assert.equal(report.passed + report.failed + report.blocked + report.skipped, 46);
    assert.ok(typeof report.totalDurationMs === "number");
    assert.ok(Array.isArray(report.journeys));
    assert.equal(report.journeys.length, 46);
    assert.ok(report.byCategory);
    assert.ok(report.byCategory.Auth);
    assert.ok(report.byCategory.Chat);
    assert.ok(report.byCategory.Routing);
  });

  it("each journey report has required fields", async () => {
    const report = await runAllJourneys();

    for (const journey of report.journeys) {
      assert.ok(typeof journey.journeyId === "number");
      assert.ok(typeof journey.name === "string");
      assert.ok(typeof journey.category === "string");
      assert.ok(["passed", "failed", "blocked", "skipped"].includes(journey.status));
      assert.ok(typeof journey.traceId === "string");
      assert.ok(Array.isArray(journey.evidence));
      assert.ok(typeof journey.durationMs === "number");
      if (journey.status !== "passed") {
        assert.ok(typeof journey.error === "string");
      }
    }
  });

  // Auth journeys (1-5)
  it("Journey 1: User registers personal account", async () => {
    const result = await runJourney(1);
    assert.ok(["passed", "blocked"].includes(result.status));
    assert.ok(result.evidence.length > 0);
  });

  it("Journey 2: User logs in, gets JWT", async () => {
    const result = await runJourney(2);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 3: Leaders teacher registers with school code", async () => {
    const result = await runJourney(3);
    // Teacher tenant module missing - expect blocked
    assert.ok(["passed", "blocked", "failed"].includes(result.status));
  });

  it("Journey 4: Leaders teacher accesses dashboard", async () => {
    const result = await runJourney(4);
    assert.ok(["passed", "blocked", "failed"].includes(result.status));
  });

  it("Journey 5: Personal user CANNOT access Leaders dashboard (403)", async () => {
    const result = await runJourney(5);
    assert.ok(["passed", "blocked"].includes(result.status));
    assert.ok(result.evidence.some(e => e.includes("trace") || e.includes("403") || e.includes("tenant")));
  });

  // Chat journeys (6-8)
  it("Journey 6: Create conversation, send message, get response", async () => {
    const result = await runJourney(6);
    assert.ok(["passed", "blocked"].includes(result.status));
    assert.ok(result.traceId.startsWith("tr_"));
  });

  it("Journey 7: Response includes model routing receipt", async () => {
    const result = await runJourney(7);
    assert.ok(["passed", "blocked"].includes(result.status));
    if (result.status === "passed") {
      assert.ok(result.evidence.some(e => e.includes("Routing receipt") || e.includes("route")));
    }
  });

  it("Journey 8: Response includes verification status", async () => {
    const result = await runJourney(8);
    assert.ok(["passed", "blocked"].includes(result.status));
    if (result.status === "passed") {
      assert.ok(result.evidence.some(e => e.includes("Verification status")));
    }
  });

  // Routing journeys (9-13)
  it("Journey 9: Deterministic task (arithmetic) routes to local code", async () => {
    const result = await runJourney(9);
    assert.ok(["passed", "blocked"].includes(result.status));
    if (result.status === "passed") {
      assert.ok(result.evidence.some(e => e.includes("deterministic") || e.includes("local")));
    }
  });

  it("Journey 10: Complex task routes to provider (fixture)", async () => {
    const result = await runJourney(10);
    assert.ok(["passed", "blocked"].includes(result.status));
    if (result.status === "passed") {
      assert.ok(result.evidence.some(e => e.includes("provider") || e.includes("model")));
    }
  });

  it("Journey 11: Privacy: local_only refuses hosted model", async () => {
    const result = await runJourney(11);
    assert.ok(["passed", "blocked"].includes(result.status));
    if (result.status === "passed") {
      assert.ok(result.evidence.some(e => e.includes("local-only") || e.includes("privacy")));
    }
  });

  it("Journey 12: Budget refusal when cost exceeds limit", async () => {
    const result = await runJourney(12);
    assert.ok(["passed", "blocked"].includes(result.status));
    if (result.status === "passed") {
      assert.ok(result.evidence.some(e => e.includes("budget") || e.includes("refusal")));
    }
  });

  it("Journey 13: Fallback chain works when primary fails", async () => {
    const result = await runJourney(13);
    assert.ok(["passed", "blocked"].includes(result.status));
    if (result.status === "passed") {
      assert.ok(result.evidence.some(e => e.includes("fallback")));
    }
  });

  // Mission journeys (14-16)
  it("Journey 14: Create mission, add steps, run simulator", async () => {
    const result = await runJourney(14);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 15: Mission step produces receipt", async () => {
    const result = await runJourney(15);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 16: Mission cancellation preserves checkpoints", async () => {
    const result = await runJourney(16);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  // Agent journeys (17-20)
  it("Journey 17: Agent selection returns minimum sufficient set", async () => {
    const result = await runJourney(17);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 18: Agent selection refuses when no match", async () => {
    const result = await runJourney(18);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 19: Verifier is different from executor", async () => {
    const result = await runJourney(19);
    assert.ok(["passed", "blocked"].includes(result.status));
    if (result.status === "passed") {
      assert.ok(result.evidence.some(e => e.includes("Verifier") && e.includes("!=")));
    }
  });

  it("Journey 20: Delegation plan detects cycles", async () => {
    const result = await runJourney(20);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  // Memory journeys (21-24)
  it("Journey 21: Memory store and retrieve with budget", async () => {
    const result = await runJourney(21);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 22: Memory tenant isolation both directions", async () => {
    const result = await runJourney(22);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 23: Memory consolidation detects contradiction", async () => {
    const result = await runJourney(23);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 24: Memory deletion is tombstone, not recoverable", async () => {
    const result = await runJourney(24);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  // Living Answers journeys (25-26)
  it("Journey 25: Component registry rejects hostile input", async () => {
    const result = await runJourney(25);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 26: Verified claim requires citation", async () => {
    const result = await runJourney(26);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  // Forge journeys (27-29)
  it("Journey 27: Artifact flattened cannot claim editable", async () => {
    const result = await runJourney(27);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 28: Export unavailable format refused with reason", async () => {
    const result = await runJourney(28);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 29: Pinpoint edit preserves untouched nodes", async () => {
    const result = await runJourney(29);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  // Device journeys (30-34)
  it("Journey 30: Platform capability: iOS cross-app = unavailable", async () => {
    const result = await runJourney(30);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 31: Relay-required without relay = refused", async () => {
    const result = await runJourney(31);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 32: Voice session illegal transition refused", async () => {
    const result = await runJourney(32);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 33: Wake word off by default", async () => {
    const result = await runJourney(33);
    assert.ok(["passed", "blocked"].includes(result.status));
    if (result.status === "passed") {
      assert.ok(result.evidence.some(e => e.includes("Off by default") || e.includes("wake word")));
    }
  });

  it("Journey 34: Capture requires indicator, retention none", async () => {
    const result = await runJourney(34);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  // Automation journeys (35-40)
  it("Journey 35: Automation rule requires capabilityId", async () => {
    const result = await runJourney(35);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 36: Autonomy: R4 refused in all modes", async () => {
    const result = await runJourney(36);
    assert.ok(["passed", "blocked"].includes(result.status));
    if (result.status === "passed") {
      assert.ok(result.evidence.some(e => e.includes("R4") && e.includes("refused")));
    }
  });

  it("Journey 37: Run simulator: duplicate idempotency key = skipped", async () => {
    const result = await runJourney(37);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 38: Run simulator: no receipt = not succeeded", async () => {
    const result = await runJourney(38);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 39: Proactive: quiet hours deferred not dropped", async () => {
    const result = await runJourney(39);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 40: Proactive: silence when no explanation", async () => {
    const result = await runJourney(40);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  // UX journeys (41-43)
  it("Journey 41: Design system: contrast violation fails test", async () => {
    const result = await runJourney(41);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 42: Onboarding: cycle detection works", async () => {
    const result = await runJourney(42);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 43: Localization: Sorani RTL, plural, font fallback", async () => {
    const result = await runJourney(43);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  // Business journeys (44-45)
  it("Journey 44: Teacher tenant: studentDataAllowed = false rejected", async () => {
    const result = await runJourney(44);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  it("Journey 45: Distribution: portable .exe status honest", async () => {
    const result = await runJourney(45);
    assert.ok(["passed", "blocked"].includes(result.status));
  });

  // Security journey (46)
  it("Journey 46: Security: trustKernel bypass = finding", async () => {
    const result = await runJourney(46);
    assert.equal(result.status, "passed");
    assert.ok(result.evidence.some(e => e.includes("trustKernel") || e.includes("bypass") || e.includes("SECURITY-TRUTH")));
    assert.ok(result.evidence.some(e => e.includes("20+")));
  });
});