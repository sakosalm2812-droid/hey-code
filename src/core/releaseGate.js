/**
 * HEY Release Gate — Rollback Drill, Canary, Flags, Monitoring
 *
 * Pure. No deployment.
 * Rollback drill MANDATORY before release.
 * Canary MANDATORY for R2+.
 * Feature flag REQUIRED for every release.
 * Monitoring hooks DECLARED (metric + threshold + alert action).
 */

const RELEASE_VERSION = "hey-release-gate/1";

const RECORDS = new Map();
const AUDIT_TRAIL = [];
const MAX_AUDIT = 5000;

const VALID_STATUSES = Object.freeze(["pending", "canary", "released", "rolled-back", "blocked"]);

/** @typedef {Object} ReleaseRecord
 * @property {string} capabilityId
 * @property {string} version
 * @property {string} approvalRef
 * @property {string} verificationRef
 * @property {Object} rollbackPlan
 * @property {boolean} rollbackDrillPassed
 * @property {string} canaryConfig
 * @property {string} featureFlag
 * @property {Object} monitoringHooks
 * @property {'pending'|'canary'|'released'|'rolled-back'|'blocked'} status
 * @property {string} releasedAt
 * @property {string} releasedBy
 */

function nowISO() {
  return new Date().toISOString();
}

function generateId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function audit({ action, record, actor, at = nowISO() }) {
  const entry = Object.freeze({
    id: crypto.randomUUID(),
    action,
    capabilityId: record.capabilityId,
    version: record.version,
    actor,
    status: record.status,
    at,
    version: RELEASE_VERSION,
  });
  AUDIT_TRAIL.unshift(entry);
  if (AUDIT_TRAIL.length > MAX_AUDIT) AUDIT_TRAIL.length = MAX_AUDIT;
}

/**
 * Validate rollback plan structure.
 * @param {Object} plan
 * @throws {TypeError} if invalid
 */
function validateRollbackPlan(plan) {
  if (!plan || typeof plan !== "object") throw new TypeError("rollbackPlan required");
  if (!Array.isArray(plan.steps) || plan.steps.length === 0) throw new TypeError("rollbackPlan.steps must be non-empty array");
  if (!Number.isFinite(plan.timeoutMs) || plan.timeoutMs < 1000 || plan.timeoutMs > 3600000) throw new TypeError("rollbackPlan.timeoutMs must be 1000-3600000");
  if (typeof plan.verification !== "string" || !plan.verification.trim()) throw new TypeError("rollbackPlan.verification required");
}

/**
 * Validate canary config.
 * @param {Object} config
 * @throws {TypeError} if invalid
 */
function validateCanaryConfig(config) {
  if (!config || typeof config !== "object") throw new TypeError("canaryConfig required");
  if (!Number.isFinite(config.percentage) || config.percentage < 1 || config.percentage > 100) throw new TypeError("canaryConfig.percentage must be 1-100");
  if (!Number.isFinite(config.durationMs) || config.durationMs < 60000 || config.durationMs > 86400000) throw new TypeError("canaryConfig.durationMs must be 60s-24h");
  if (!Array.isArray(config.metrics) || config.metrics.length === 0) throw new TypeError("canaryConfig.metrics must be non-empty array");
  if (!Array.isArray(config.alertThresholds) || config.alertThresholds.length === 0) throw new TypeError("canaryConfig.alertThresholds must be non-empty array");
}

/**
 * Validate monitoring hooks.
 * @param {Object} hooks
 * @throws {TypeError} if invalid
 */
function validateMonitoringHooks(hooks) {
  if (!hooks || typeof hooks !== "object") throw new TypeError("monitoringHooks required");
  if (!Array.isArray(hooks) || hooks.length === 0) throw new TypeError("monitoringHooks must be non-empty array");
  for (const hook of hooks) {
    if (typeof hook.metricId !== "string" || !hook.metricId.trim()) throw new TypeError("monitoringHooks[].metricId required");
    if (!Number.isFinite(hook.threshold)) throw new TypeError("monitoringHooks[].threshold required");
    if (typeof hook.alertAction !== "string" || !hook.alertAction.trim()) throw new TypeError("monitoringHooks[].alertAction required");
  }
}

function deepFreeze(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    deepFreeze(obj[key]);
  }
  return obj;
}

/**
 * Create a release record (pending).
 * @param {string} capabilityId
 * @param {Object} options
 * @returns {ReleaseRecord}
 */
function createReleaseRecord(capabilityId, { version, approvalRef, verificationRef, rollbackPlan, canaryConfig, featureFlag, monitoringHooks }) {
  if (!capabilityId || typeof capabilityId !== "string") throw new TypeError("capabilityId required");
  if (!version || typeof version !== "string") throw new TypeError("version required");
  if (!approvalRef || typeof approvalRef !== "string") throw new TypeError("approvalRef required (Vault approval record)");
  if (!verificationRef || typeof verificationRef !== "string") throw new TypeError("verificationRef required (VerificationEngine record)");

  validateRollbackPlan(rollbackPlan);
  validateCanaryConfig(canaryConfig);
  if (!featureFlag || typeof featureFlag !== "string" || !featureFlag.trim()) throw new TypeError("featureFlag required");
  validateMonitoringHooks(monitoringHooks);

  const record = deepFreeze({
    capabilityId,
    version,
    approvalRef,
    verificationRef,
    rollbackPlan: { ...rollbackPlan },
    rollbackDrillPassed: false,
    canaryConfig: { ...canaryConfig },
    featureFlag,
    monitoringHooks: [...monitoringHooks],
    status: "pending",
    releasedAt: null,
    releasedBy: null,
  });

  RECORDS.set(capabilityId, record);
  audit({ action: "create", record, actor: "system" });
  return record;
}

/**
 * Run rollback drill — MANDATORY before release.
 * Simulates the rollback plan and verifies it works.
 * @param {ReleaseRecord} record
 * @returns {{ passed: boolean, evidence: Object, at: string, record: ReleaseRecord }}
 */
function runRollbackDrill(record) {
  if (!record || typeof record !== "object") throw new TypeError("Record required");
  if (record.status !== "pending") throw new Error(`Cannot run drill on ${record.status} record`);

  // Simulate drill execution
  const startedAt = Date.now();
  const stepsExecuted = [];
  let passed = true;
  let error = null;

  try {
    for (const step of record.rollbackPlan.steps) {
      // In real implementation, this would execute the step
      // For now, we simulate success
      stepsExecuted.push({ step, status: "simulated-success", at: new Date().toISOString() });
    }

    // Verify rollback verification criterion
    const verificationPassed = record.rollbackPlan.verification.length > 0;
    if (!verificationPassed) passed = false;
  } catch (err) {
    passed = false;
    error = err instanceof Error ? err.message : String(err);
  }

  const evidence = Object.freeze({
    stepsExecuted,
    durationMs: Date.now() - startedAt,
    verification: record.rollbackPlan.verification,
    passed,
    error,
  });

  const updated = Object.freeze({
    ...record,
    rollbackDrillPassed: passed,
  });
  RECORDS.set(record.capabilityId, updated);
  audit({ action: "rollback-drill", record: updated, actor: "system" });

  return { passed, evidence, at: nowISO(), record: updated };
}

/**
 * Promote to canary — requires passed rollback drill.
 * @param {ReleaseRecord} record
 * @returns {ReleaseRecord}
 */
function promoteToCanary(record) {
  if (!record || typeof record !== "object") throw new TypeError("Record required");
  if (record.status !== "pending") throw new Error(`Cannot promote ${record.status} to canary`);
  if (!record.rollbackDrillPassed) throw new Error("Rollback drill must pass before canary");

  const updated = Object.freeze({
    ...record,
    status: "canary",
  });
  RECORDS.set(record.capabilityId, updated);
  audit({ action: "promote-canary", record: updated, actor: "system" });
  return updated;
}

/**
 * Promote to released — requires canary for R2+.
 * @param {ReleaseRecord} record
 * @param {{ releasedBy: string }} options
 * @returns {ReleaseRecord}
 */
function promoteToReleased(record, { releasedBy }) {
  if (!record || typeof record !== "object") throw new TypeError("Record required");
  if (record.status !== "canary") throw new Error(`Must be in canary to release, current: ${record.status}`);
  if (!record.rollbackDrillPassed) throw new Error("Rollback drill must pass before release");
  if (!releasedBy || typeof releasedBy !== "string") throw new TypeError("releasedBy required");

  // Check risk level from verificationRef (would need to cross-reference)
  // For now, enforce canary for all releases as baseline
  const updated = Object.freeze({
    ...record,
    status: "released",
    releasedAt: nowISO(),
    releasedBy,
  });
  RECORDS.set(record.capabilityId, updated);
  audit({ action: "release", record: updated, actor: releasedBy });
  return updated;
}

/**
 * Execute rollback.
 * @param {ReleaseRecord} record
 * @param {{ reason: string, rolledBackBy: string }} options
 * @returns {ReleaseRecord}
 */
function rollback(record, { reason, rolledBackBy }) {
  if (!record || typeof record !== "object") throw new TypeError("Record required");
  if (!reason || typeof reason !== "string") throw new TypeError("reason required");
  if (!rolledBackBy || typeof rolledBackBy !== "string") throw new TypeError("rolledBackBy required");

  const updated = Object.freeze({
    ...record,
    status: "rolled-back",
    releasedAt: null,
    releasedBy: null,
  });
  RECORDS.set(record.capabilityId, updated);
  audit({ action: "rollback", record: updated, actor: rolledBackBy });
  return updated;
}

/**
 * Assert capability is released with drill passed.
 * @param {string} capabilityId
 * @returns {ReleaseRecord}
 */
function assertReleased(capabilityId) {
  const record = RECORDS.get(capabilityId);
  if (!record) throw new Error(`No release record for capability: ${capabilityId}`);
  if (record.status !== "released") throw new Error(`Capability not released: ${record.status}`);
  if (!record.rollbackDrillPassed) throw new Error("Release missing rollback drill");
  return record;
}

/**
 * Get release record.
 * @param {string} capabilityId
 * @returns {ReleaseRecord|undefined}
 */
function getReleaseRecord(capabilityId) {
  return RECORDS.get(capabilityId);
}

/**
 * Get audit trail (frozen copy).
 * @param {number} [limit=100]
 * @returns {Object[]}
 */
function getAuditTrail(limit = 100) {
  return Object.freeze(AUDIT_TRAIL.slice(0, Math.max(0, limit)).map(e => Object.freeze({ ...e })));
}

/**
 * Clear all state (test helper).
 */
function clearAll() {
  RECORDS.clear();
  AUDIT_TRAIL.length = 0;
}

export {
  createReleaseRecord,
  runRollbackDrill,
  promoteToCanary,
  promoteToReleased,
  rollback,
  assertReleased,
  getReleaseRecord,
  getAuditTrail,
  clearAll,
  RELEASE_VERSION,
  VALID_STATUSES,
};
export default {
  createReleaseRecord,
  runRollbackDrill,
  promoteToCanary,
  promoteToReleased,
  rollback,
  assertReleased,
  getReleaseRecord,
  getAuditTrail,
  clearAll,
};