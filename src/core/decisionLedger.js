/**
 * HEY — Decision Ledger (Part 15, Phase C, Module 7.3)
 *
 * Every approval/rejection/supersession with date + authority.
 * Append-only. No deletion. Supersession links to previous decision.
 *
 * @module core/decisionLedger
 */

const DECISIONS = [];

/**
 * @typedef {Object} DecisionRecord
 * @property {number} seq - Monotonic sequence number
 * @property {string} type - 'approval' | 'rejection' | 'supersession'
 * @property {string} proposalId - ID of the proposal/capability
 * @property {string} scope - What this decision covers
 * @property {string} owner - Decision authority ('Sako' | 'Amad')
 * @property {string} reason - Written justification
 * @property {string[]} evidence - Evidence references
 * @property {string} at - ISO timestamp
 * @property {string} [supersedes] - Previous decision ID (for supersession)
 */

/**
 * Record a decision.
 * @param {Object} input
 * @param {'approval'|'rejection'|'supersession'} input.type
 * @param {string} input.proposalId
 * @param {string} input.scope
 * @param {'Sako'|'Amad'} input.owner
 * @param {string} input.reason
 * @param {string[]} [input.evidence=[]]
 * @param {number|string|Date} [input.at] - Decision timestamp
 * @returns {DecisionRecord} Frozen decision record
 * @throws {TypeError} If invalid input
 */
export function recordDecision({ type, proposalId, scope, owner, reason, evidence = [], at }) {
  const validTypes = ["approval", "rejection", "supersession"];
  if (!validTypes.includes(type)) {
    throw new TypeError(`type must be one of: ${validTypes.join(", ")}`);
  }
  if (!proposalId || typeof proposalId !== "string" || !proposalId.trim()) {
    throw new TypeError("proposalId is required");
  }
  if (!scope || typeof scope !== "string" || !scope.trim()) {
    throw new TypeError("scope is required");
  }
  if (!["Sako", "Amad"].includes(owner)) {
    throw new TypeError("owner must be 'Sako' or 'Amad'");
  }
  if (!reason || typeof reason !== "string" || !reason.trim()) {
    throw new TypeError("reason is required");
  }
  if (!Array.isArray(evidence)) {
    throw new TypeError("evidence must be an array");
  }

  const timestamp = at ? new Date(at).toISOString() : new Date().toISOString();
  if (isNaN(Date.parse(timestamp))) {
    throw new TypeError("at must be a valid timestamp");
  }

  const seq = DECISIONS.length + 1;
  const decision = Object.freeze({
    seq,
    type,
    proposalId: proposalId.trim(),
    scope: scope.trim(),
    owner,
    reason: reason.trim(),
    evidence: Object.freeze([...evidence.map(e => String(e).trim())]),
    at: timestamp,
    supersedes: type === "supersession" ? evidence[0] : null, // First evidence is the superseded decision ID
  });

  DECISIONS.push(decision);
  return decision;
}

/**
 * Query decisions with optional filters.
 * @param {Object} [filters]
 * @param {string} [filters.proposalId]
 * @param {'Sako'|'Amad'} [filters.owner]
 * @param {'approval'|'rejection'|'supersession'} [filters.type]
 * @param {string} [filters.since] - ISO timestamp
 * @returns {DecisionRecord[]} Frozen array of decisions
 */
export function queryDecisions({ proposalId, owner, type, since } = {}) {
  let results = [...DECISIONS];

  if (proposalId) {
    results = results.filter(d => d.proposalId === proposalId);
  }
  if (owner) {
    results = results.filter(d => d.owner === owner);
  }
  if (type) {
    results = results.filter(d => d.type === type);
  }
  if (since) {
    const sinceMs = Date.parse(since);
    if (!isNaN(sinceMs)) {
      results = results.filter(d => Date.parse(d.at) >= sinceMs);
    }
  }

  return Object.freeze(results);
}

/**
 * Get full decision history for a proposal (chronological).
 * @param {string} proposalId
 * @returns {DecisionRecord[]} Frozen array of decisions
 */
export function getDecisionHistory(proposalId) {
  const history = DECISIONS
    .filter(d => d.proposalId === proposalId)
    .sort((a, b) => a.seq - b.seq);
  return Object.freeze(history);
}

/**
 * Get all decisions (frozen copy).
 * @returns {DecisionRecord[]}
 */
export function getAllDecisions() {
  return Object.freeze([...DECISIONS]);
}

/**
 * Get the latest decision for a proposal.
 * @param {string} proposalId
 * @returns {DecisionRecord|undefined}
 */
export function getLatestDecision(proposalId) {
  const history = getDecisionHistory(proposalId);
  return history[history.length - 1];
}

/**
 * Clear all state (test helper).
 */
export function _clear() {
  DECISIONS.length = 0;
}

export default {
  recordDecision,
  queryDecisions,
  getDecisionHistory,
  getAllDecisions,
  getLatestDecision,
  _clear,
};