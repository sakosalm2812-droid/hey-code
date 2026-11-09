/**
 * HEY Foundation VerificationEngine
 *
 * Evidence-based verification with independent reproduction requirement.
 * No self-verification: verifierId !== implementerId.
 *
 * @module core/foundation/verificationContract
 */

import { deepFreeze, validators, generateId, now, FoundationError } from "./contracts.js";

/**
 * Verification statuses
 */
export const VERIFICATION_STATUS = Object.freeze([
  "pending",    // Verification requested
  "assigned",   // Verifier assigned
  "in_progress", // Reproduction in progress
  "verified",   // Independently reproduced
  "failed",     // Reproduction failed
  "revoked",    // Verification revoked
]);

/**
 * VerificationEngine class
 */
export class VerificationEngine {
  constructor(options = {}) {
    this.id = options.id || generateId("verify");
    this._records = new Map(); // capabilityId -> VerificationRecord
    this._validators = new Map(); // validatorId -> { fn, description }
    this._auditTrail = [];
    this._maxAudit = options.maxAudit || 5000;
    this._createdAt = now();
  }

  /**
   * Request verification for a capability
   * @param {Object} options
   * @param {string} options.capabilityId
   * @param {string} options.implementerId
   * @param {Object} options.evidence - Evidence provided by implementer
   * @returns {Object} Verification record
   */
  requestVerification({ capabilityId, implementerId, evidence }) {
    validators.requiredString(capabilityId, "capabilityId");
    validators.requiredString(implementerId, "implementerId");
    validators.plainObject(evidence, "evidence");

    if (this._records.has(capabilityId)) {
      const existing = this._records.get(capabilityId);
      if (existing.status === "verified") {
        throw new FoundationError("Already verified", "ALREADY_VERIFIED");
      }
      if (existing.status === "in_progress" || existing.status === "assigned") {
        throw new FoundationError("Verification in progress", "IN_PROGRESS");
      }
    }

    const record = deepFreeze({
      id: generateId("verify"),
      capabilityId,
      implementerId,
      evidence: deepFreeze(evidence),
      status: "pending",
      verifierId: null,
      reproductionEvidence: null,
      reproducedBy: null,
      limitations: [],
      requestedAt: now(),
      assignedAt: null,
      completedAt: null,
      revokedAt: null,
      revokedBy: null,
      revokeReason: null,
    });

    this._records.set(capabilityId, record);
    this._audit("request", record);
    return record;
  }

  /**
   * Assign a verifier (must be different from implementer)
   * @param {string} capabilityId
   * @param {string} verifierId
   * @returns {Object} Updated record
   */
  assignVerifier(capabilityId, verifierId) {
    validators.requiredString(capabilityId, "capabilityId");
    validators.requiredString(verifierId, "verifierId");

    const record = this._records.get(capabilityId);
    if (!record) throw new FoundationError("Verification not found", "NOT_FOUND");

    if (verifierId === record.implementerId) {
      throw new FoundationError("Verifier cannot be the implementer", "SELF_VERIFICATION");
    }

    const updated = deepFreeze({
      ...record,
      status: "assigned",
      verifierId,
      assignedAt: now(),
    });

    this._records.set(capabilityId, updated);
    this._audit("assign", updated);
    return updated;
  }

  /**
   * Record independent reproduction evidence
   * @param {string} capabilityId
   * @param {Object} options
   * @param {Object} options.reproductionEvidence - Evidence from reproduction
   * @param {string} options.reproducedBy - Verifier ID
   * @returns {Object} Updated record
   */
  recordReproduction({ capabilityId, reproductionEvidence, reproducedBy }) {
    validators.requiredString(capabilityId, "capabilityId");
    validators.plainObject(reproductionEvidence, "reproductionEvidence");
    validators.requiredString(reproducedBy, "reproducedBy");

    const record = this._records.get(capabilityId);
    if (!record) throw new FoundationError("Verification not found", "NOT_FOUND");

    if (reproducedBy === record.implementerId) {
      throw new FoundationError("Reproducer cannot be the implementer", "SELF_VERIFICATION");
    }

    if (record.verifierId && reproducedBy !== record.verifierId) {
      throw new FoundationError("Reproduction must be by assigned verifier", "WRONG_VERIFIER");
    }

    const updated = deepFreeze({
      ...record,
      status: "in_progress",
      reproductionEvidence: deepFreeze(reproductionEvidence),
      reproducedBy,
    });

    this._records.set(capabilityId, updated);
    this._audit("reproduce", updated);
    return updated;
  }

  /**
   * Complete verification with status
   * @param {string} capabilityId
   * @param {Object} options
   * @param {"verified"|"failed"} options.status
   * @param {string[]} [options.limitations] - Known limitations
   * @returns {Object} Updated record
   */
  completeVerification(capabilityId, { status, limitations = [] }) {
    validators.requiredString(capabilityId, "capabilityId");
    validators.enum(status, "status", ["verified", "failed"]);
    validators.stringArray(limitations, "limitations");

    const record = this._records.get(capabilityId);
    if (!record) throw new FoundationError("Verification not found", "NOT_FOUND");

    if (status === "verified" && !record.reproductionEvidence) {
      throw new FoundationError("Cannot verify without reproduction evidence", "NO_REPRODUCTION");
    }

    const updated = deepFreeze({
      ...record,
      status,
      limitations: limitations.map((l) => String(l).trim()).filter((l) => l),
      completedAt: now(),
    });

    this._records.set(capabilityId, updated);
    this._audit("complete", updated);
    return updated;
  }

  /**
   * Revoke a verification
   * @param {string} capabilityId
   * @param {Object} options
   * @param {string} options.reason
   * @param {string} options.revokedBy
   * @returns {Object} Updated record
   */
  revokeVerification(capabilityId, { reason, revokedBy }) {
    validators.requiredString(capabilityId, "capabilityId");
    validators.requiredString(reason, "reason");
    validators.requiredString(revokedBy, "revokedBy");

    const record = this._records.get(capabilityId);
    if (!record) throw new FoundationError("Verification not found", "NOT_FOUND");

    if (record.status !== "verified") {
      throw new FoundationError("Can only revoke verified capabilities", "NOT_VERIFIED");
    }

    const updated = deepFreeze({
      ...record,
      status: "revoked",
      revokedAt: now(),
      revokedBy,
      revokeReason: reason,
    });

    this._records.set(capabilityId, updated);
    this._audit("revoke", updated);
    return updated;
  }

  /**
   * Get verification record
   * @param {string} capabilityId
   * @returns {Object|null}
   */
  getVerification(capabilityId) {
    validators.requiredString(capabilityId, "capabilityId");
    return this._records.get(capabilityId) || null;
  }

  /**
   * Assert capability is verified (throws if not)
   * @param {string} capabilityId
   * @returns {Object} Verification record
   */
  assertVerified(capabilityId) {
    validators.requiredString(capabilityId, "capabilityId");
    const record = this._records.get(capabilityId);
    if (!record) throw new FoundationError("No verification record", "NOT_FOUND");
    if (record.status !== "verified") {
      throw new FoundationError(`Capability not verified: ${record.status}`, "NOT_VERIFIED");
    }
    return record;
  }

  /**
   * Run registered validators on a capability
   * @param {string} capabilityId
   * @param {Object} context - Context for validators
   * @returns {Object[]} Validator results
   */
  runChecks(capabilityId, context = {}) {
    validators.requiredString(capabilityId, "capabilityId");
    const record = this._records.get(capabilityId);
    if (!record) throw new FoundationError("Verification not found", "NOT_FOUND");

    const results = [];
    for (const [validatorId, validator] of this._validators) {
      try {
        const result = validator.fn(record, context);
        results.push({
          validatorId,
          passed: Boolean(result),
          details: result && typeof result === "object" ? result : { message: String(result) },
        });
      } catch (err) {
        results.push({
          validatorId,
          passed: false,
          error: err.message,
        });
      }
    }
    return deepFreeze(results);
  }

  /**
   * Register a validator function
   * @param {string} validatorId
   * @param {function} fn - (record, context) => boolean | { passed: boolean, details: Object }
   * @param {string} [description]
   * @returns {VerificationEngine} this
   */
  registerValidator(validatorId, fn, description = "") {
    validators.requiredString(validatorId, "validatorId");
    validators.isFunction(fn, "fn");

    this._validators.set(validatorId, { fn, description, registeredAt: now() });
    return this;
  }

  /**
   * Unregister a validator
   * @param {string} validatorId
   * @returns {boolean}
   */
  unregisterValidator(validatorId) {
    return this._validators.delete(validatorId);
  }

  /**
   * List validators
   * @returns {Object[]}
   */
  listValidators() {
    return deepFreeze(Array.from(this._validators.entries()).map(([id, v]) => ({
      id,
      description: v.description,
      registeredAt: v.registeredAt,
    })));
  }

  /**
   * Get audit trail
   * @param {number} [limit=100]
   * @returns {Object[]}
   */
  getAuditTrail(limit = 100) {
    return deepFreeze(this._auditTrail.slice(-limit));
  }

  /**
   * Clear all records (for testing)
   */
  clearAll() {
    this._records.clear();
    this._auditTrail.length = 0;
  }

  /**
   * Get statistics
   * @returns {Object}
   */
  getStats() {
    const statusCounts = {};
    for (const record of this._records.values()) {
      statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
    }
    return deepFreeze({
      id: this.id,
      totalRecords: this._records.size,
      statusCounts,
      validatorCount: this._validators.size,
      auditEntries: this._auditTrail.length,
      createdAt: this._createdAt,
    });
  }

  _audit(action, record) {
    this._auditTrail.push({
      action,
      capabilityId: record.capabilityId,
      status: record.status,
      verifierId: record.verifierId,
      timestamp: now(),
    });
    if (this._auditTrail.length > this._maxAudit) {
      this._auditTrail.shift();
    }
  }
}

/**
 * Create a new VerificationEngine
 * @param {Object} options
 * @param {number} [options.maxAudit=5000]
 * @returns {VerificationEngine}
 */
export function createVerificationEngine(options = {}) {
  return new VerificationEngine(options);
}

/**
 * Default singleton
 */
const defaultEngine = new VerificationEngine({ id: "default" });

export default Object.freeze({
  VerificationEngine,
  createVerificationEngine,
  defaultEngine,
  VERIFICATION_STATUS,
});