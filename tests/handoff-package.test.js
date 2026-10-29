/**
 * Tests for handoffPackage.js
 * Minimum 5 tests per spec.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { generateHandoff, _clear } from "../src/core/handoffPackage.js";
import { _clear as pieClear } from "../src/core/productIntegrityEngine.js";
import { _clear as dlClear } from "../src/core/decisionLedger.js";
import { _clear as cgClear } from "../src/core/costGovernor.js";
import { _clear as pmClear } from "../src/core/platformMatrix.js";
import { _clear as lpClear } from "../src/core/localizationPipeline.js";
import { _clear as tlClear } from "../src/core/tenancyLifecycle.js";
import { _clear as catClear } from "../src/core/capabilityAdmissionTest.js";
import { _clear as esClear } from "../src/core/evolutionScheduler.js";
import { _clear as otClear } from "../src/core/outcomeTelemetry.js";
import { _clear as mlClear } from "../src/core/maintenanceLane.js";
import { _clear as agClear } from "../src/core/antiGaming.js";
import { _clear as dcClear } from "../src/core/deliveryContract.js";

describe("handoffPackage.js", () => {
  beforeEach(() => {
    pieClear();
    dlClear();
    cgClear();
    pmClear();
    lpClear();
    tlClear();
    catClear();
    esClear();
    otClear();
    mlClear();
    agClear();
    dcClear();
  });

  it("generateHandoff returns complete package structure", async () => {
    const handoff = await generateHandoff();
    assert.ok(handoff.capabilityLedger);
    assert.ok(handoff.productIntegrity);
    assert.ok(handoff.decisionLedger);
    assert.ok(handoff.costGovernor);
    assert.ok(handoff.platformMatrix);
    assert.ok(handoff.localization);
    assert.ok(handoff.tenancy);
    assert.ok(handoff.admissionTest);
    assert.ok(handoff.evolutionScheduler);
    assert.ok(handoff.outcomeTelemetry);
    assert.ok(handoff.maintenanceLane);
    assert.ok(handoff.antiGaming);
    assert.ok(handoff.deliveryContract);
    assert.ok(Array.isArray(handoff.unknowns));
    assert.ok(Array.isArray(handoff.decisionsNeeded));
    assert.ok(["SHIPPABLE", "BLOCKED"].includes(handoff.completionState));
    assert.ok(handoff.generatedAt);
  });

  it("completionState is BLOCKED when mandatory locales not signed off", async () => {
    // Don't sign off mandatory locales
    const handoff = await generateHandoff();
    assert.strictEqual(handoff.completionState, "BLOCKED");
  });

  it("completionState includes blockers for dropped requirements", async () => {
    const { registerRequirement } = await import("../src/core/productIntegrityEngine.js");
    registerRequirement({
      id: "REQ-dropped",
      source: "Test",
      text: "Dropped requirement",
      stage: "stage-01",
      capabilityId: "cap.dropped",
      mandatory: true,
    });
    const handoff = await generateHandoff();
    assert.strictEqual(handoff.completionState, "BLOCKED");
    assert.ok(handoff.unknowns.length > 0);
    assert.ok(handoff.decisionsNeeded.length > 0);
  });

  it("handoff includes all governance modules data", async () => {
    const handoff = await generateHandoff();
    // Check capability ledger has reconciliation data
    assert.ok(typeof handoff.capabilityLedger.approved === "number");
    assert.ok(typeof handoff.capabilityLedger.catalogued === "number");
    assert.ok(typeof handoff.capabilityLedger.staged === "number");
    assert.ok(typeof handoff.capabilityLedger.implemented === "number");
    assert.ok(handoff.capabilityLedger.gaps);

    // Check product integrity has dropped requirements
    assert.ok(Array.isArray(handoff.productIntegrity));

    // Check decision ledger
    assert.ok(Array.isArray(handoff.decisionLedger));

    // Check cost governor
    assert.ok(handoff.costGovernor.envelopes);
    assert.ok(handoff.costGovernor.snapshots);

    // Check platform matrix
    assert.ok(handoff.platformMatrix.matrix);
    assert.ok(handoff.platformMatrix.uiAudit);

    // Check localization
    assert.ok(handoff.localization.signOffs);
    assert.ok(handoff.localization.mandatoryCheck);

    // Check tenancy
    assert.ok(handoff.tenancy.policies);
    assert.ok(handoff.tenancy.gaps);

    // Check admission test
    assert.ok(Array.isArray(handoff.admissionTest));

    // Check evolution scheduler
    assert.ok(handoff.evolutionScheduler.scheduleRecords);
    assert.ok(handoff.evolutionScheduler.nextCyclePlan);

    // Check outcome telemetry
    assert.ok(handoff.outcomeTelemetry.insights);
    assert.ok(handoff.outcomeTelemetry.proposedResearch);
    assert.ok(handoff.outcomeTelemetry.capabilityGaps);

    // Check maintenance lane
    assert.ok(Array.isArray(handoff.maintenanceLane));

    // Check anti-gaming
    assert.ok(handoff.antiGaming.clean);
    assert.ok(handoff.antiGaming.suspicious);

    // Check delivery contract
    assert.ok(Array.isArray(handoff.deliveryContract));
  });

  it("handoff generatedAt is valid ISO timestamp", async () => {
    const handoff = await generateHandoff();
    const date = new Date(handoff.generatedAt);
    assert.ok(!isNaN(date.getTime()));
  });
});