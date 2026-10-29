/**
 * Tests for capabilityLedger.js
 * Minimum 10 tests per spec.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { reconcile, queryCapability, getStagedCapabilities, getImplementedCapabilities, loadHistoricalCatalogue } from "../src/core/capabilityLedger.js";
import { createVault } from "../src/core/capabilityVault.js";
import { getFullMatrix } from "../src/core/platformCapabilities.js";

describe("capabilityLedger.js", () => {
  it("reconcile() returns the four counts and gaps object", async () => {
    const result = await reconcile();
    assert.ok(typeof result.approved === "number", "approved is a number");
    assert.ok(typeof result.catalogued === "number", "catalogued is a number");
    assert.ok(typeof result.staged === "number", "staged is a number");
    assert.ok(typeof result.implemented === "number", "implemented is a number");
    assert.ok(result.gaps && typeof result.gaps === "object", "gaps object exists");
    assert.ok(Array.isArray(result.gaps.approvedNotCatalogued), "approvedNotCatalogued is array");
    assert.ok(Array.isArray(result.gaps.cataloguedNotStaged), "cataloguedNotStaged is array");
    assert.ok(Array.isArray(result.gaps.stagedNotImplemented), "stagedNotImplemented is array");
    assert.ok(Array.isArray(result.gaps.implementedNotVerified), "implementedNotVerified is array");
  });

  it("staged count is exactly 78 (15-part program)", () => {
    const staged = getStagedCapabilities();
    assert.strictEqual(staged.length, 78, "exactly 78 staged capabilities");
    // Verify format
    for (const id of staged) {
      assert.ok(id.startsWith("cap.part"), `staged ID format: ${id}`);
    }
    // Verify distribution across parts
    const partCounts = {};
    for (const id of staged) {
      const part = id.match(/cap\.part(\d+)/)[1];
      partCounts[part] = (partCounts[part] || 0) + 1;
    }
    assert.strictEqual(partCounts["2"], 5);
    assert.strictEqual(partCounts["3"], 5);
    assert.strictEqual(partCounts["4"], 5);
    assert.strictEqual(partCounts["5"], 8);
    assert.strictEqual(partCounts["6"], 8);
    assert.strictEqual(partCounts["7"], 5);
    assert.strictEqual(partCounts["8"], 5);
    assert.strictEqual(partCounts["9"], 5);
    assert.strictEqual(partCounts["10"], 5);
    assert.strictEqual(partCounts["11"], 5);
    assert.strictEqual(partCounts["12"], 4);
    assert.strictEqual(partCounts["13"], 4);
    assert.strictEqual(partCounts["14"], 6);
    assert.strictEqual(partCounts["15"], 8);
  });

  it("implemented capabilities derive from platformCapabilities matrix", () => {
    const implemented = getImplementedCapabilities();
    const matrix = getFullMatrix();
    assert.strictEqual(implemented.length, Object.keys(matrix).length, "implemented matches matrix keys");
    for (const id of implemented) {
      assert.ok(matrix[id], `implemented capability ${id} exists in matrix`);
    }
  });

  it("queryCapability returns evidence chain for known capability", async () => {
    // Use a staged capability ID since those are guaranteed to have program evidence
    const staged = getStagedCapabilities();
    const firstStaged = staged[0];
    const result = await queryCapability(firstStaged);
    assert.strictEqual(typeof result.approved, "boolean");
    assert.strictEqual(typeof result.catalogued, "boolean");
    assert.strictEqual(typeof result.staged, "boolean");
    assert.strictEqual(typeof result.implemented, "boolean");
    assert.strictEqual(typeof result.verified, "boolean");
    assert.strictEqual(typeof result.released, "boolean");
    assert.ok(Array.isArray(result.evidence), "evidence is array");
    // Should have staged evidence since we queried a staged capability
    const stagedEvidence = result.evidence.find(e => e.source === "program");
    assert.ok(stagedEvidence, "has program evidence for staged capability");
    assert.strictEqual(result.staged, true, "staged should be true for staged capability");
  });

  it("queryCapability returns false for unknown capability", async () => {
    const result = await queryCapability("cap.unknown.nonexistent");
    assert.strictEqual(result.approved, false);
    assert.strictEqual(result.catalogued, false);
    assert.strictEqual(result.staged, false);
    assert.strictEqual(result.implemented, false);
    assert.strictEqual(result.verified, false);
    assert.strictEqual(result.released, false);
    assert.ok(Array.isArray(result.evidence));
    assert.strictEqual(result.evidence.length, 0);
  });

  it("reconcile is deterministic — two calls return identical counts", async () => {
    const r1 = await reconcile();
    const r2 = await reconcile();
    assert.strictEqual(r1.approved, r2.approved);
    assert.strictEqual(r1.catalogued, r2.catalogued);
    assert.strictEqual(r1.staged, r2.staged);
    assert.strictEqual(r1.implemented, r2.implemented);
    // Gaps should be identical
    assert.deepStrictEqual(r1.gaps, r2.gaps);
  });

  it("loadHistoricalCatalogue derives from Vault records at Proposed+", async () => {
    const vault = createVault();
    // Add a record at Candidate (should NOT be catalogued)
    const candidate = vault.addRecord({
      id: "cap.test.candidate",
      title: "Candidate Only",
      category: "test",
      problem: "test",
      intendedOutcome: "test",
      dedupeKey: "cap.test.candidate",
      evidence: [{ url: "https://example.com", retrievedAt: new Date().toISOString(), kind: "primary" }],
      risk: "R0",
      changePlan: { components: [], newApis: [], changedApis: [], schemaChanges: [], permissionChanges: [], migrations: [], rollbackSteps: ["revert"] },
      killCriteria: { metric: "test", baseline: 0, threshold: 1, windowDays: 30, owner: "Sako" },
      cost: { perUseCents: 0, worstCaseCents: 0 },
    });
    assert.ok(candidate.ok);

    // Add a record and advance it to Proposed (should BE catalogued)
    const proposed = vault.addRecord({
      id: "cap.test.proposed",
      title: "Proposed Record",
      category: "test",
      problem: "test",
      intendedOutcome: "test",
      dedupeKey: "cap.test.proposed",
      evidence: [{ url: "https://example.com", retrievedAt: new Date().toISOString(), kind: "primary" }],
      risk: "R0",
      changePlan: { components: [], newApis: [], changedApis: [], schemaChanges: [], permissionChanges: [], migrations: [], rollbackSteps: ["revert"] },
      killCriteria: { metric: "test", baseline: 0, threshold: 1, windowDays: 30, owner: "Sako" },
      cost: { perUseCents: 0, worstCaseCents: 0 },
    });
    assert.ok(proposed.ok);

    // Advance through lifecycle: Candidate -> Validated -> Reviewed -> Proposed
    let advance = vault.advance("cap.test.proposed", "Validated", { actor: "Sako", evidence: { primarySource: "test", freshnessDate: new Date().toISOString(), dedupeKey: "cap.test.proposed" }, now: Date.now() });
    assert.ok(advance.ok);

    advance = vault.advance("cap.test.proposed", "Reviewed", { actor: "Sako", evidence: { flawHunterFindings: [{ finding: "test", severity: "low" }], solutionTwinRecommendation: { recommendation: "test" } }, now: Date.now() });
    assert.ok(advance.ok);

    advance = vault.advance("cap.test.proposed", "Proposed", { actor: "Sako", evidence: { changePlan: { components: [], newApis: [], changedApis: [], schemaChanges: [], permissionChanges: [], migrations: [], rollbackSteps: ["revert"] }, killCriteria: { metric: "test", baseline: 0, threshold: 1, windowDays: 30, owner: "Sako" }, cost: { perUseCents: 0, worstCaseCents: 0 } }, now: Date.now() });
    assert.ok(advance.ok);

    // Verify the record is now in Proposed state
    const finalRecord = vault.getRecord("cap.test.proposed");
    assert.strictEqual(finalRecord.state, "Proposed", "Record should be in Proposed state");

    const catalogue = await loadHistoricalCatalogue(vault);
    assert.ok(catalogue.includes("cap.test.proposed"), "Proposed record is catalogued");
    assert.ok(!catalogue.includes("cap.test.candidate"), "Candidate record is NOT catalogued");
  });

  it("queryCapability includes vault decision evidence when record exists", async () => {
    const vault = createVault();
    const added = vault.addRecord({
      id: "cap.test.evidence",
      title: "Evidence Test",
      category: "test",
      problem: "test",
      intendedOutcome: "test",
      dedupeKey: "cap.test.evidence",
      evidence: [{ url: "https://example.com", retrievedAt: new Date().toISOString(), kind: "primary" }],
      risk: "R0",
      changePlan: { components: [], newApis: [], changedApis: [], schemaChanges: [], permissionChanges: [], migrations: [], rollbackSteps: ["revert"] },
      killCriteria: { metric: "test", baseline: 0, threshold: 1, windowDays: 30, owner: "Sako" },
      cost: { perUseCents: 0, worstCaseCents: 0 },
    });
    assert.ok(added.ok);

    // Advance through lifecycle to Proposed state
    let advance = vault.advance("cap.test.evidence", "Validated", { actor: "Sako", evidence: { primarySource: "test", freshnessDate: new Date().toISOString(), dedupeKey: "cap.test.evidence" }, now: Date.now() });
    assert.ok(advance.ok);

    advance = vault.advance("cap.test.evidence", "Reviewed", { actor: "Sako", evidence: { flawHunterFindings: [{ finding: "test", severity: "low" }], solutionTwinRecommendation: { recommendation: "test" } }, now: Date.now() });
    assert.ok(advance.ok);

    advance = vault.advance("cap.test.evidence", "Proposed", { actor: "Sako", evidence: { changePlan: { components: [], newApis: [], changedApis: [], schemaChanges: [], permissionChanges: [], migrations: [], rollbackSteps: ["revert"] }, killCriteria: { metric: "test", baseline: 0, threshold: 1, windowDays: 30, owner: "Sako" }, cost: { perUseCents: 0, worstCaseCents: 0 } }, now: Date.now() });
    assert.ok(advance.ok);

    // Now decide to keep (requires Proposed state)
    const decided = vault.decide("cap.test.evidence", { decision: "keep", ownerId: "Sako", note: "approved" });
    assert.ok(decided.ok);

    const result = await queryCapability("cap.test.evidence", vault);
    const vaultEvidence = result.evidence.find(e => e.source === "vault-decision" && e.type === "decision");
    assert.ok(vaultEvidence, "has vault decision evidence");
    assert.strictEqual(vaultEvidence.ownerId, "Sako");
    assert.strictEqual(vaultEvidence.decision, "keep");
  });

  it("reconcile gaps are correctly computed as set differences", async () => {
    const result = await reconcile();
    // approvedNotCatalogued = approved \ catalogued
    for (const id of result.gaps.approvedNotCatalogued) {
      const approved = result._detail.approvedIds.includes(id);
      const catalogued = result._detail.cataloguedIds.includes(id);
      assert.ok(approved, `${id} should be in approved`);
      assert.ok(!catalogued, `${id} should NOT be in catalogued`);
    }
    // cataloguedNotStaged = catalogued \ staged
    for (const id of result.gaps.cataloguedNotStaged) {
      const catalogued = result._detail.cataloguedIds.includes(id);
      const staged = result._detail.stagedIds.includes(id);
      assert.ok(catalogued, `${id} should be in catalogued`);
      assert.ok(!staged, `${id} should NOT be in staged`);
    }
    // stagedNotImplemented = staged \ implemented
    for (const id of result.gaps.stagedNotImplemented) {
      const staged = result._detail.stagedIds.includes(id);
      const implemented = result._detail.implementedIds.includes(id);
      assert.ok(staged, `${id} should be in staged`);
      assert.ok(!implemented, `${id} should NOT be in implemented`);
    }
    // implementedNotVerified = implemented \ verified
    for (const id of result.gaps.implementedNotVerified) {
      const implemented = result._detail.implementedIds.includes(id);
      const verified = result._detail.verifiedIds.includes(id);
      assert.ok(implemented, `${id} should be in implemented`);
      assert.ok(!verified, `${id} should NOT be in verified`);
    }
  });

  it("getLastReconciliationDetail returns the detail object", async () => {
    const detail = await import("../src/core/capabilityLedger.js").then(m => m.getLastReconciliationDetail());
    assert.ok(detail && typeof detail === "object");
    assert.ok(Array.isArray(detail.approvedIds));
    assert.ok(Array.isArray(detail.cataloguedIds));
    assert.ok(Array.isArray(detail.stagedIds));
    assert.ok(Array.isArray(detail.implementedIds));
    assert.ok(Array.isArray(detail.verifiedIds));
    assert.ok(Array.isArray(detail.releasedIds));
  });
});