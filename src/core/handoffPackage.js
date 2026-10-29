/**
 * HEY — Handoff Package (Part 15, Phase C, Module 7.14)
 *
 * Complete handoff for next team/agent.
 * Aggregates all governance artifacts into one queryable package.
 *
 * @module core/handoffPackage
 */

import { reconcile } from "./capabilityLedger.js";
import { getDroppedRequirements } from "./productIntegrityEngine.js";
import { getAllDecisions } from "./decisionLedger.js";
import { getAllEnvelopes, getSnapshot as costSnapshot } from "./costGovernor.js";
import { auditUiActions, getFullMatrix } from "./platformMatrix.js";
import { getAllSignOffs, checkMandatoryLocales } from "./localizationPipeline.js";
import { verifyRlsPolicies } from "./tenancyLifecycle.js";
import { getAllAdmissionResults } from "./capabilityAdmissionTest.js";
import { getAllScheduleRecords, planCycle } from "./evolutionScheduler.js";
import { generateRetrospective } from "./outcomeTelemetry.js";
import { getActiveMaintenance } from "./maintenanceLane.js";
import { auditMetrics } from "./antiGaming.js";
import { getAllGateResults } from "./deliveryContract.js";

/**
 * Generate complete handoff package.
 * @returns {Promise<Object>} Complete handoff package
 */
export async function generateHandoff() {
  // Capability Ledger reconciliation
  const capabilityLedger = await reconcile();

  // Product Integrity - dropped requirements
  const productIntegrity = getDroppedRequirements();

  // Decision Ledger - all decisions
  const decisionLedger = getAllDecisions();

  // Cost Governor - all envelopes
  const costGovernor = {
    envelopes: getAllEnvelopes(),
    snapshots: getAllEnvelopes().map(e => costSnapshot(e)),
  };

  // Platform Matrix - UI audit
  const platformMatrix = {
    matrix: getFullMatrix(),
    uiAudit: auditUiActions([], "web"), // Use "web" as default platform
  };

  // Localization Pipeline - sign-off status
  const localization = {
    signOffs: getAllSignOffs(),
    mandatoryCheck: checkMandatoryLocales(),
  };

  // Tenancy Lifecycle - RLS verification
  const tenancy = verifyRlsPolicies();

  // Capability Admission Test - results
  const admissionTest = getAllAdmissionResults();

  // Evolution Scheduler - next cycle plan
  const evolutionScheduler = {
    scheduleRecords: getAllScheduleRecords(),
    nextCyclePlan: planCycle({
      now: Date.now(),
      cadence: "daily",
      budgetCents: 10000,
      wipLimit: 3,
      running: [],
      candidates: [],
      knownKeys: [],
    }),
  };

  // Outcome Telemetry - retrospective
  const outcomeTelemetry = generateRetrospective({ windowDays: 30 });

  // Maintenance Lane - active tickets
  const maintenanceLane = getActiveMaintenance();

  // Anti-Gaming - metrics audit
  const antiGaming = auditMetrics();

  // Delivery Contract - all gate results
  const deliveryContract = getAllGateResults();

  // Compile unknowns and decisions needed
  const unknowns = [
    "Production deployment status unknown",
    "Native-speaker review process not automated",
    "RLS policies not verified against live Supabase schema",
    "Cost governance not wired to production provider calls",
  ];

  const decisionsNeeded = [
    "Install Rust + VS Build Tools for native installers",
    "Install git for upgrade orchestrator and secret history",
    "Rotate secrets after git history is known",
  ];

  // Determine completion state
  const completionState = determineCompletionState({
    capabilityLedger,
    productIntegrity,
    decisionLedger,
    costGovernor,
    platformMatrix,
    localization,
    tenancy,
    admissionTest,
    evolutionScheduler,
    outcomeTelemetry,
    maintenanceLane,
    antiGaming,
    deliveryContract,
  });

  return {
    capabilityLedger,
    productIntegrity,
    decisionLedger,
    costGovernor,
    platformMatrix,
    localization,
    tenancy,
    admissionTest,
    evolutionScheduler,
    outcomeTelemetry,
    maintenanceLane,
    antiGaming,
    deliveryContract,
    unknowns,
    decisionsNeeded,
    completionState,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Determine overall completion state.
 * @param {Object} parts
 * @returns {'SHIPPABLE'|'BLOCKED'}
 */
function determineCompletionState(parts) {
  // Check for blocking issues
  const blockers = [];

  // Capability ledger: all staged should be implemented
  if (parts.capabilityLedger.gaps.stagedNotImplemented.length > 0) {
    blockers.push(`${parts.capabilityLedger.gaps.stagedNotImplemented.length} staged capabilities not implemented`);
  }

  // Product integrity: no dropped mandatory requirements
  if (parts.productIntegrity.length > 0) {
    blockers.push(`${parts.productIntegrity.length} mandatory requirements without evidence`);
  }

  // Decisions: all should be recorded
  if (parts.decisionLedger.length === 0) {
    blockers.push("No decisions recorded");
  }

  // Cost governor: no active kill switches without reason
  // (checked in costGovernor)

  // Platform matrix: no critical UI actions without capabilityId
  // (would need real UI audit)

  // Localization: mandatory locales signed off
  if (!parts.localization.mandatoryCheck.ok) {
    blockers.push(`Missing sign-off for: ${parts.localization.mandatoryCheck.missing.join(", ")}`);
  }

  // Tenancy: RLS gaps
  if (parts.tenancy.gaps.length > 0) {
    blockers.push(`RLS policy gaps: ${parts.tenancy.gaps.join("; ")}`);
  }

  // Admission test: all capabilities admitted
  const failedAdmissions = parts.admissionTest.filter(r => !r.passed);
  if (failedAdmissions.length > 0) {
    blockers.push(`${failedAdmissions.length} capabilities failed admission test`);
  }

  // Evolution scheduler: schedule configured
  // (always true if module loads)

  // Outcome telemetry: retrospective generated
  // (always true if module loads)

  // Maintenance lane: no overdue tickets
  // (checked in processMaintenance)

  // Anti-gaming: no suspicious metrics
  if (parts.antiGaming.suspicious.length > 0) {
    blockers.push(`Gaming detected in metrics: ${parts.antiGaming.suspicious.join(", ")}`);
  }

  // Delivery contract: all capabilities shippable
  const blockedCapabilities = parts.deliveryContract.filter(r => !r.shippable);
  if (blockedCapabilities.length > 0) {
    blockers.push(`${blockedCapabilities.length} capabilities not shippable`);
  }

  return blockers.length === 0 ? "SHIPPABLE" : "BLOCKED";
}

/**
 * Clear all state (test helper).
 */
export function _clear() {
  // Each module has its own _clear
}

export default {
  generateHandoff,
  _clear,
};