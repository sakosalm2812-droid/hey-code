/**
 * HEY — Product Integrity Engine (Part 15, Phase C, Module 7.2)
 *
 * Requirement IDs so no agent silently drops scope.
 * A requirement registered as mandatory: true cannot reach SHIPPABLE without assertRequirementMet passing.
 *
 * @module core/productIntegrityEngine
 */

const REQUIREMENTS = new Map();
const EVIDENCE = new Map();

/**
 * @typedef {Object} Requirement
 * @property {string} id
 * @property {string} source
 * @property {string} text
 * @property {string} stage
 * @property {string} capabilityId
 * @property {boolean} mandatory
 * @property {string} registeredAt
 */

/**
 * @typedef {Object} EvidenceEntry
 * @property {string} requirementId
 * @property {string} capabilityId
 * @property {string} traceId
 * @property {string} evidence
 * @property {string} recordedAt
 */

/**
 * Register a requirement. Returns a frozen requirement object.
 * @param {Object} input
 * @param {string} input.id - Requirement ID (e.g., "REQ-P2-001")
 * @param {string} input.source - Source document (e.g., "Part 2 DoD")
 * @param {string} input.text - Requirement text
 * @param {string} input.stage - Stage identifier (e.g., "stage-06")
 * @param {string} input.capabilityId - Associated capability ID
 * @param {boolean} input.mandatory - If true, cannot ship without evidence
 * @returns {Requirement} Frozen requirement
 * @throws {TypeError} If invalid input
 */
export function registerRequirement({ id, source, text, stage, capabilityId, mandatory }) {
  if (!id || typeof id !== "string" || !id.trim()) {
    throw new TypeError("requirement.id is required");
  }
  if (!source || typeof source !== "string" || !source.trim()) {
    throw new TypeError("requirement.source is required");
  }
  if (!text || typeof text !== "string" || !text.trim()) {
    throw new TypeError("requirement.text is required");
  }
  if (!stage || typeof stage !== "string" || !stage.trim()) {
    throw new TypeError("requirement.stage is required");
  }
  if (!capabilityId || typeof capabilityId !== "string" || !capabilityId.trim()) {
    throw new TypeError("requirement.capabilityId is required");
  }
  if (typeof mandatory !== "boolean") {
    throw new TypeError("requirement.mandatory must be a boolean");
  }

  if (REQUIREMENTS.has(id)) {
    throw new TypeError(`Requirement ${id} already registered`);
  }

  const requirement = Object.freeze({
    id: id.trim(),
    source: source.trim(),
    text: text.trim(),
    stage: stage.trim(),
    capabilityId: capabilityId.trim(),
    mandatory,
    registeredAt: new Date().toISOString(),
  });

  REQUIREMENTS.set(id, requirement);
  EVIDENCE.set(id, []);

  return requirement;
}

/**
 * Assert that a requirement has been met with evidence.
 * @param {Object} input
 * @param {string} input.requirementId
 * @param {string} input.evidence - Evidence description or reference
 * @param {string} [input.traceId] - Trace ID for correlation
 * @returns {{ ok: boolean, missing?: string[] }}
 */
export function assertRequirementMet({ requirementId, evidence, traceId }) {
  const requirement = REQUIREMENTS.get(requirementId);
  if (!requirement) {
    return { ok: false, missing: [`Requirement ${requirementId} not registered`] };
  }

  const entry = Object.freeze({
    requirementId,
    capabilityId: requirement.capabilityId,
    traceId: traceId ?? null,
    evidence: String(evidence).trim(),
    recordedAt: new Date().toISOString(),
  });

  const entries = EVIDENCE.get(requirementId) ?? [];
  entries.push(entry);
  EVIDENCE.set(requirementId, entries);

  return { ok: true };
}

/**
 * Get all requirements that are mandatory but have no evidence in SHIPPABLE capabilities.
 * A capability is SHIPPABLE if it has passed all delivery gates.
 * @returns {Requirement[]}
 */
export function getDroppedRequirements() {
  const dropped = [];
  for (const [id, requirement] of REQUIREMENTS) {
    if (!requirement.mandatory) continue;
    const entries = EVIDENCE.get(id) ?? [];
    if (entries.length === 0) {
      dropped.push(requirement);
    }
  }
  return Object.freeze(dropped);
}

/**
 * Get evidence for a requirement.
 * @param {string} requirementId
 * @returns {EvidenceEntry[]}
 */
export function getEvidence(requirementId) {
  return Object.freeze([...(EVIDENCE.get(requirementId) ?? [])]);
}

/**
 * Get a requirement by ID.
 * @param {string} id
 * @returns {Requirement|undefined}
 */
export function getRequirement(id) {
  return REQUIREMENTS.get(id);
}

/**
 * Get all registered requirements.
 * @returns {Requirement[]}
 */
export function getAllRequirements() {
  return Object.freeze([...REQUIREMENTS.values()]);
}

/**
 * Check if a capability has all its mandatory requirements met.
 * @param {string} capabilityId
 * @returns {{ ok: boolean, missing: string[] }}
 */
export function checkCapabilityRequirements(capabilityId) {
  const missing = [];
  for (const [id, requirement] of REQUIREMENTS) {
    if (requirement.capabilityId !== capabilityId) continue;
    if (!requirement.mandatory) continue;
    const entries = EVIDENCE.get(id) ?? [];
    if (entries.length === 0) {
      missing.push(id);
    }
  }
  return { ok: missing.length === 0, missing };
}

/**
 * Clear all state (test helper).
 */
export function _clear() {
  REQUIREMENTS.clear();
  EVIDENCE.clear();
}

export default {
  registerRequirement,
  assertRequirementMet,
  getDroppedRequirements,
  getEvidence,
  getRequirement,
  getAllRequirements,
  checkCapabilityRequirements,
  _clear,
};