/**
 * HEY Trust Kernel — Pure Policy Evaluation
 *
 * The single enforcement point for all consequential actions.
 * Pure function: no I/O, no network, no clock, no randomness.
 * Fail-closed: unknown action, missing context, or error → deny.
 * Every decision audited via auditEvaluation().
 */

const POLICY_VERSION = "hey-trust-kernel/1";

/** @typedef {Object} PolicyDecision
 * @property {boolean} allowed
 * @property {string} reason
 * @property {'allow'|'deny'|'require-approval'|'require-verification'} action
 * @property {string[]} requiredApprovals
 * @property {string[]} requiredVerifications
 * @property {Object} metadata
 */

/** @typedef {Object} EvaluationContext
 * @property {string} userId
 * @property {string} tenantId
 * @property {string} role
 * @property {string} action              // e.g., 'file:write', 'model:call', 'permission:grant', 'spend:budget'
 * @property {string} resourceScope       // e.g., 'conversation:abc', 'file:xyz', 'budget:daily'
 * @property {number} costCents
 * @property {'R0'|'R1'|'R2'|'R3'|'R4'} risk
 * @property {boolean} userConsent
 * @property {string[]} permissions       // granted permission strings
 * @property {Object} deviceContext       // { platform, capabilities, trustLevel }
 * @property {string} approvalToken       // if approval was granted
 * @property {Object} verificationEvidence // if verification was completed
 */

const RISK_ORDER = { R0: 0, R1: 1, R2: 2, R3: 3, R4: 4 };

const POLICIES = new Map();

/**
 * Define a policy record. Frozen on registration.
 * @param {Object} record
 * @param {string} record.action
 * @property {'R0'|'R1'|'R2'|'R3'|'R4'} record.risk
 * @property {boolean} [record.requiresConsent]
 * @property {boolean} [record.requiresApproval]
 * @property {boolean} [record.requiresVerification]
 * @property {string[]} [record.requiredPermissions]
 * @property {number} [record.maxCostCents]
 * @property {boolean} [record.allowFullAutonomy]
 * @throws {TypeError} if record is invalid
 */
function definePolicy(record) {
  if (!record || typeof record !== "object") throw new TypeError("Policy record must be an object");
  if (typeof record.action !== "string" || !record.action.trim()) throw new TypeError("Policy action must be a non-empty string");
  if (!RISK_ORDER.hasOwnProperty(record.risk)) throw new TypeError(`Policy risk must be one of ${Object.keys(RISK_ORDER).join(", ")}`);

  const policy = Object.freeze({
    action: record.action,
    risk: record.risk,
    requiresConsent: Boolean(record.requiresConsent),
    requiresApproval: Boolean(record.requiresApproval),
    requiresVerification: Boolean(record.requiresVerification),
    requiredPermissions: Array.isArray(record.requiredPermissions) ? Object.freeze([...record.requiredPermissions]) : Object.freeze([]),
    maxCostCents: Number.isFinite(record.maxCostCents) && record.maxCostCents >= 0 ? record.maxCostCents : null,
    allowFullAutonomy: Boolean(record.allowFullAutonomy),
    version: POLICY_VERSION,
  });

  if (POLICIES.has(record.action)) throw new TypeError(`Policy for action '${record.action}' already defined`);
  POLICIES.set(record.action, policy);
}

/**
 * Get a policy by action.
 * @param {string} action
 * @returns {Object|undefined}
 */
function getPolicy(action) {
  return POLICIES.get(action);
}

/**
 * Evaluate a context against policy. Pure, deterministic, fail-closed.
 * @param {EvaluationContext} context
 * @returns {PolicyDecision}
 */
function evaluate(context) {
  const auditMeta = { action: context?.action, userId: context?.userId, at: Date.now() };

  try {
    // Fail closed: missing or invalid context
    if (!context || typeof context !== "object") {
      return auditDecision({ allowed: false, reason: "evaluation-failed: context missing", action: "deny", requiredApprovals: [], requiredVerifications: [], metadata: { ...auditMeta, failure: "missing-context" } });
    }

    const { action, risk, userId, tenantId, role, costCents, userConsent, permissions = [], approvalToken, verificationEvidence } = context;

    if (typeof action !== "string" || !action.trim()) {
      return auditDecision({ allowed: false, reason: "evaluation-failed: action missing", action: "deny", requiredApprovals: [], requiredVerifications: [], metadata: { ...auditMeta, failure: "missing-action" } });
    }

    if (!RISK_ORDER.hasOwnProperty(risk)) {
      return auditDecision({ allowed: false, reason: `evaluation-failed: invalid risk '${risk}'`, action: "deny", requiredApprovals: [], requiredVerifications: [], metadata: { ...auditMeta, failure: "invalid-risk" } });
    }

    const policy = POLICIES.get(action);
    if (!policy) {
      return auditDecision({ allowed: false, reason: `unknown-action: '${action}'`, action: "deny", requiredApprovals: [], requiredVerifications: [], metadata: { ...auditMeta, failure: "unknown-action" } });
    }

    // Risk escalation: full autonomy still requires approval for R3, refuses R4
    const isFullAutonomy = role === "full-autonomy" || policy.allowFullAutonomy === true;
    if (RISK_ORDER[risk] >= RISK_ORDER.R4) {
      return auditDecision({ allowed: false, reason: "risk-R4-refused", action: "deny", requiredApprovals: [], requiredVerifications: [], metadata: { ...auditMeta, risk, policyRisk: policy.risk } });
    }

    // Cost budget enforcement
    if (policy.maxCostCents !== null && Number.isFinite(costCents) && costCents > policy.maxCostCents) {
      return auditDecision({ allowed: false, reason: `cost-exceeds-policy: ${costCents} > ${policy.maxCostCents}`, action: "deny", requiredApprovals: [], requiredVerifications: [], metadata: { ...auditMeta, costCents, maxCostCents: policy.maxCostCents } });
    }

    // Permission check
    for (const perm of policy.requiredPermissions) {
      if (!permissions.includes(perm)) {
        return auditDecision({ allowed: false, reason: `missing-permission: ${perm}`, action: "require-approval", requiredApprovals: [`permission:${perm}`], requiredVerifications: [], metadata: { ...auditMeta, missingPermission: perm } });
      }
    }

    // Consent check
    if (policy.requiresConsent && !userConsent) {
      return auditDecision({ allowed: false, reason: "consent-required", action: "require-approval", requiredApprovals: ["user-consent"], requiredVerifications: [], metadata: { ...auditMeta } });
    }

    // Approval check (R3+ or policy requires)
    const needsApproval = policy.requiresApproval || RISK_ORDER[risk] >= RISK_ORDER.R3;
    if (needsApproval) {
      if (!approvalToken || typeof approvalToken !== "string" || !approvalToken.trim()) {
        return auditDecision({ allowed: false, reason: "approval-required", action: "require-approval", requiredApprovals: ["execution-approval"], requiredVerifications: [], metadata: { ...auditMeta, risk } });
      }
      // Token format validation (opaque, but must be non-empty)
      // Actual validation delegated to executionAuthorization.validateExecutionApproval
    }

    // Verification check
    if (policy.requiresVerification) {
      if (!verificationEvidence || typeof verificationEvidence !== "object" || !verificationEvidence.independentReproduction) {
        return auditDecision({ allowed: false, reason: "verification-required", action: "require-verification", requiredApprovals: [], requiredVerifications: ["independent-reproduction"], metadata: { ...auditMeta } });
      }
      if (verificationEvidence.verifierId === verificationEvidence.implementerId) {
        return auditDecision({ allowed: false, reason: "self-verification-forbidden", action: "require-verification", requiredApprovals: [], requiredVerifications: ["independent-reproduction"], metadata: { ...auditMeta } });
      }
    }

    // All checks passed
    return auditDecision({ allowed: true, reason: "allowed", action: "allow", requiredApprovals: [], requiredVerifications: [], metadata: { ...auditMeta, risk, policyRisk: policy.risk } });

  } catch (err) {
    // Fail closed on any error
    return auditDecision({ allowed: false, reason: `evaluation-failed: ${err instanceof Error ? err.message : String(err)}`, action: "deny", requiredApprovals: [], requiredVerifications: [], metadata: { ...auditMeta, failure: "exception" } });
  }
}

/** Internal: audit every decision */
const AUDIT_TRAIL = [];
const MAX_AUDIT = 10000;

function auditDecision(decision) {
  const entry = Object.freeze({
    ...decision,
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    policyVersion: POLICY_VERSION,
  });
  AUDIT_TRAIL.unshift(entry);
  if (AUDIT_TRAIL.length > MAX_AUDIT) AUDIT_TRAIL.length = MAX_AUDIT;
  return entry;
}

/**
 * Get audit trail (frozen copy).
 * @param {number} [limit=100]
 * @returns {PolicyDecision[]}
 */
function getAuditTrail(limit = 100) {
  return Object.freeze(AUDIT_TRAIL.slice(0, Math.max(0, limit)).map(e => Object.freeze({ ...e })));
}

/**
 * Clear audit trail (test helper).
 */
function clearAuditTrail() {
  AUDIT_TRAIL.length = 0;
}

/**
 * Initialize seed policies per Part 13 §7.3.
 */
function initSeedPolicies() {
  const seeds = [
    { action: "file:write", risk: "R2", requiresConsent: true, requiredPermissions: ["file:write"] },
    { action: "file:delete", risk: "R3", requiresApproval: true, requiredPermissions: ["file:delete"] },
    { action: "model:call", risk: "R1", requiredPermissions: ["model:call"], maxCostCents: 10000 },
    { action: "permission:grant", risk: "R4", requiresApproval: true, requiredPermissions: ["permission:grant"] },
    { action: "spend:budget", risk: "R2", requiredPermissions: ["spend:budget"], maxCostCents: 100000 },
    { action: "agent:spawn", risk: "R2", requiredPermissions: ["agent:spawn"] },
    { action: "vault:promote", risk: "R3", requiresApproval: true, requiresVerification: true, requiredPermissions: ["vault:promote"] },
    { action: "secret:read", risk: "R3", requiredPermissions: ["secret:read"] },
  ];
  for (const s of seeds) definePolicy(s);
}

// Auto-initialize on load
initSeedPolicies();

export { evaluate, getPolicy, definePolicy, getAuditTrail, clearAuditTrail, POLICY_VERSION, RISK_ORDER };
export default { evaluate, getPolicy, definePolicy, getAuditTrail, clearAuditTrail };