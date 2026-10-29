/**
 * HEY Verification Engine — Evidence Trace, Independent Reproduction
 *
 * Pure. No network.
 * Independent reproduction is MANDATORY for Verified status.
 * No self-verification: verifierId !== implementerId.
 * Evidence must be concrete: test results, traces, receipts.
 * Revocation is global.
 */

const VERIFICATION_VERSION = "hey-verification-engine/1";

const RECORDS = new Map();
const AUDIT_TRAIL = [];
const MAX_AUDIT = 5000;

const VALID_STATUSES = Object.freeze(["pending", "verified", "failed", "revoked"]);

/** @typedef {Object} VerificationRecord
 * @property {string} capabilityId
 * @property {string} verifierId
 * @property {string} implementerId
 * @property {Object} evidence
 * @property {boolean} independentReproduction
 * @property {string} verifiedAt
 * @property {'pending'|'verified'|'failed'|'revoked'} status
 * @property {string[]} limitations
 * @property {string} requestedAt
 * @property {string} assignedAt
 * @property {string} reproducedAt
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
    actor,
    status: record.status,
    at,
    version: VERIFICATION_VERSION,
  });
  AUDIT_TRAIL.unshift(entry);
  if (AUDIT_TRAIL.length > MAX_AUDIT) AUDIT_TRAIL.length = MAX_AUDIT;
}

/**
 * Request verification for a capability.
 * @param {{ capabilityId: string, implementerId: string, evidence: Object }} input
 * @returns {VerificationRecord} pending record
 */
function requestVerification({ capabilityId, implementerId, evidence }) {
  if (!capabilityId || typeof capabilityId !== "string") throw new TypeError("capabilityId required");
  if (!implementerId || typeof implementerId !== "string") throw new TypeError("implementerId required");
  if (!evidence || typeof evidence !== "object") throw new TypeError("evidence required");

  const record = Object.freeze({
    capabilityId,
    verifierId: null,
    implementerId,
    evidence: Object.freeze({ ...evidence }),
    independentReproduction: false,
    verifiedAt: null,
    status: "pending",
    limitations: Object.freeze([]),
    requestedAt: nowISO(),
    assignedAt: null,
    reproducedAt: null,
  });

  RECORDS.set(capabilityId, record);
  audit({ action: "request", record, actor: implementerId });
  return record;
}

/**
 * Assign a verifier. Must be different from implementer.
 * @param {VerificationRecord} record
 * @param {string} verifierId
 * @returns {VerificationRecord} updated record
 */
function assignVerifier(record, verifierId) {
  if (!record || typeof record !== "object") throw new TypeError("Record required");
  if (!verifierId || typeof verifierId !== "string") throw new TypeError("verifierId required");
  if (verifierId === record.implementerId) throw new Error("Verifier cannot be the implementer");
  if (record.status !== "pending") throw new Error(`Cannot assign verifier to ${record.status} record`);

  const updated = Object.freeze({
    ...record,
    verifierId,
    assignedAt: nowISO(),
  });
  RECORDS.set(record.capabilityId, updated);
  audit({ action: "assign-verifier", record: updated, actor: verifierId });
  return updated;
}

/**
 * Record independent reproduction evidence.
 * @param {VerificationRecord} record
 * @param {{ reproductionEvidence: Object, reproducedBy: string }} input
 * @returns {VerificationRecord} updated record
 */
function recordIndependentReproduction(record, { reproductionEvidence, reproducedBy }) {
  if (!record || typeof record !== "object") throw new TypeError("Record required");
  if (record.verifierId !== reproducedBy) throw new Error("Only assigned verifier can record reproduction");
  if (!reproductionEvidence || typeof reproductionEvidence !== "object") throw new TypeError("reproductionEvidence required");
  if (record.status !== "pending") throw new Error(`Cannot record reproduction for ${record.status} record`);

  const updated = Object.freeze({
    ...record,
    evidence: Object.freeze({
      ...record.evidence,
      independentReproduction: reproductionEvidence,
    }),
    independentReproduction: true,
    reproducedAt: nowISO(),
  });
  RECORDS.set(record.capabilityId, updated);
  audit({ action: "reproduction-recorded", record: updated, actor: reproducedBy });
  return updated;
}

/**
 * Complete verification with final status.
 * @param {VerificationRecord} record
 * @param {{ status: 'verified'|'failed', limitations?: string[] }} input
 * @returns {VerificationRecord} final record
 */
function completeVerification(record, { status, limitations = [] }) {
  if (!record || typeof record !== "object") throw new TypeError("Record required");
  if (!VALID_STATUSES.includes(status)) throw new TypeError(`Invalid status: ${status}`);
  if (status === "verified" && !record.independentReproduction) throw new Error("Independent reproduction required for verified status");
  if (status === "verified" && record.verifierId === record.implementerId) throw new Error("Self-verification forbidden");
  if (record.status !== "pending") throw new Error(`Cannot complete ${record.status} record`);

  const updated = Object.freeze({
    ...record,
    status,
    limitations: Object.freeze([...limitations]),
    verifiedAt: status === "verified" ? nowISO() : null,
  });
  RECORDS.set(record.capabilityId, updated);
  audit({ action: "complete", record: updated, actor: record.verifierId });
  return updated;
}

/**
 * Revoke verification globally.
 * @param {string} capabilityId
 * @param {{ reason: string, revokedBy: string }} input
 * @returns {VerificationRecord} revoked record
 */
function revokeVerification(capabilityId, { reason, revokedBy }) {
  const record = RECORDS.get(capabilityId);
  if (!record) throw new Error("Verification record not found");
  if (!reason || typeof reason !== "string") throw new TypeError("Reason required");
  if (!revokedBy || typeof revokedBy !== "string") throw new TypeError("revokedBy required");

  const updated = Object.freeze({
    ...record,
    status: "revoked",
    limitations: Object.freeze([...record.limitations, `revoked: ${reason}`]),
  });
  RECORDS.set(capabilityId, updated);
  audit({ action: "revoke", record: updated, actor: revokedBy });
  return updated;
}

/**
 * Get verification record.
 * @param {string} capabilityId
 * @returns {VerificationRecord|undefined}
 */
function getVerification(capabilityId) {
  return RECORDS.get(capabilityId);
}

/**
 * Assert a capability is verified with independent reproduction.
 * Throws if not verified.
 * @param {string} capabilityId
 * @returns {VerificationRecord}
 */
function assertVerified(capabilityId) {
  const record = RECORDS.get(capabilityId);
  if (!record) throw new Error(`No verification record for capability: ${capabilityId}`);
  if (record.status !== "verified") throw new Error(`Capability not verified: ${record.status}`);
  if (!record.independentReproduction) throw new Error("Capability verified without independent reproduction");
  if (record.verifierId === record.implementerId) throw new Error("Capability self-verified (forbidden)");
  return record;
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
  requestVerification,
  assignVerifier,
  recordIndependentReproduction,
  completeVerification,
  revokeVerification,
  getVerification,
  assertVerified,
  getAuditTrail,
  clearAll,
  VERIFICATION_VERSION,
  VALID_STATUSES,
};
export default {
  requestVerification,
  assignVerifier,
  recordIndependentReproduction,
  completeVerification,
  revokeVerification,
  getVerification,
  assertVerified,
  getAuditTrail,
  clearAll,
};