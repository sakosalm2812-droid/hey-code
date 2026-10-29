export const EXECUTION_AUTHORIZATION_SCHEMA = "hey.execution-authorization/v1";
export const EXECUTION_POLICY_VERSION = "hey-execution-policy/1";
export const EXECUTION_APPROVAL_TTL_MS = 2 * 60 * 1000;

const pendingRequests = new Map();
const issuedApprovals = new Map();
const MAX_PENDING_RECORDS = 256;

function cloneJson(value, path = "binding") {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map((item, index) => cloneJson(item, `${path}[${index}]`));
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError(`${path} must contain only plain JSON values.`);
  }
  const result = {};
  for (const key of Object.keys(value).sort()) {
    if (value[key] === undefined) throw new TypeError(`${path}.${key} cannot be undefined.`);
    result[key] = cloneJson(value[key], `${path}.${key}`);
  }
  return result;
}

export function stableExecutionBinding(binding) {
  return JSON.stringify(cloneJson(binding));
}

function createId(prefix) {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new Error("Secure random identifiers are unavailable in this runtime.");
  }
  return `${prefix}_${globalThis.crypto.randomUUID()}`;
}

function trimMap(map, now) {
  for (const [id, item] of map) {
    if (item.expiresAt <= now) map.delete(id);
  }
  while (map.size >= MAX_PENDING_RECORDS) map.delete(map.keys().next().value);
}

function targetFromParameters(parameters) {
  for (const key of ["target", "url", "path", "app", "deviceId", "resourceId"]) {
    if (parameters?.[key] !== undefined && parameters[key] !== null) return parameters[key];
  }
  return null;
}

export function createExecutionBinding(input = {}) {
  const userId = String(input.actor?.userId || input.actor?.id || "").trim();
  if (!userId) throw new TypeError("An authenticated actor is required for an execution binding.");
  const actionId = String(input.action?.id || input.action?.capability || "").trim();
  const capability = String(input.action?.capability || input.permission || "").trim();
  const permission = String(input.permission || "").trim();
  if (!actionId || !capability || !permission) throw new TypeError("Action, capability, and permission are required.");

  const parameters = cloneJson(input.action.parameters || {}, "parameters");
  const binding = {
    schema: EXECUTION_AUTHORIZATION_SCHEMA,
    actor: {
      userId,
      sessionId: input.actor?.sessionId ? String(input.actor.sessionId) : null,
    },
    action: { id: actionId, capability },
    target: cloneJson(input.target === undefined ? targetFromParameters(parameters) : input.target, "target"),
    parameters,
    scope: String(input.scope || "account"),
    riskLevel: String(input.riskLevel || "low"),
    permission,
    permissionContext: cloneJson(input.permissionContext || {}, "permissionContext"),
    policyVersion: String(input.policyVersion || EXECUTION_POLICY_VERSION),
    environment: String(input.environment || "browser"),
    workflow: input.workflow ? cloneJson(input.workflow, "workflow") : null,
    requiresConfirmation: input.requiresConfirmation === true,
  };
  return cloneJson(binding);
}

export function createExecutionApprovalRequest(binding, { now = Date.now(), ttlMs = EXECUTION_APPROVAL_TTL_MS } = {}) {
  trimMap(pendingRequests, now);
  const canonicalBinding = cloneJson(binding);
  const request = {
    schema: EXECUTION_AUTHORIZATION_SCHEMA,
    requestId: createId("approval_request"),
    binding: canonicalBinding,
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + Math.max(1, ttlMs)).toISOString(),
  };
  pendingRequests.set(request.requestId, {
    bindingKey: stableExecutionBinding(canonicalBinding),
    expiresAt: now + Math.max(1, ttlMs),
  });
  return request;
}

export function issueExecutionApproval(request, { nativeApproval = null, actorId = null, sessionId = undefined, environment = undefined, now = Date.now() } = {}) {
  const pending = pendingRequests.get(request?.requestId);
  if (!pending || pending.expiresAt <= now) throw new Error("This approval request expired. Review the action again.");
  if (request.schema !== EXECUTION_AUTHORIZATION_SCHEMA || stableExecutionBinding(request.binding) !== pending.bindingKey) {
    throw new Error("The requested action changed. Review it again before approving.");
  }
  const binding = cloneJson(request.binding);
  if (actorId && binding.actor.userId !== String(actorId)) throw new Error("The signed-in account changed. Review the action again.");
  if (sessionId !== undefined && (binding.actor.sessionId || null) !== (sessionId || null)) throw new Error("The signed-in session changed. Review the action again.");
  if (environment && binding.environment !== environment) throw new Error("The execution environment changed. Review the action again.");
  if (binding.environment === "tauri-desktop" && binding.requiresConfirmation) {
    if (!nativeApproval?.approvalId || nativeApproval.bindingKey !== pending.bindingKey || Number(nativeApproval.expiresAt) <= now) {
      throw new Error("The native runtime did not approve this exact action.");
    }
  }

  pendingRequests.delete(request.requestId);
  trimMap(issuedApprovals, now);
  const approval = {
    schema: EXECUTION_AUTHORIZATION_SCHEMA,
    approvalId: createId("approval"),
    requestId: request.requestId,
    binding,
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(Math.min(pending.expiresAt, now + EXECUTION_APPROVAL_TTL_MS)).toISOString(),
    nativeApprovalId: nativeApproval?.approvalId || null,
  };
  issuedApprovals.set(approval.approvalId, {
    bindingKey: pending.bindingKey,
    expiresAt: Date.parse(approval.expiresAt),
    nativeApprovalId: approval.nativeApprovalId,
    consumed: false,
  });
  return approval;
}

export function validateExecutionApproval(approval, binding, { now = Date.now() } = {}) {
  const record = issuedApprovals.get(approval?.approvalId);
  if (!record) return { valid: false, reason: "Approval is unknown, revoked, or already used." };
  if (record.consumed) return { valid: false, reason: "Approval has already been used." };
  if (record.expiresAt <= now) {
    issuedApprovals.delete(approval.approvalId);
    return { valid: false, reason: "Approval expired. Review the action again." };
  }
  if (approval.schema !== EXECUTION_AUTHORIZATION_SCHEMA || stableExecutionBinding(binding) !== record.bindingKey) {
    return { valid: false, reason: "The action or its authorization context changed after approval." };
  }
  if (stableExecutionBinding(approval.binding) !== record.bindingKey) {
    return { valid: false, reason: "Approval details do not match the authorized action." };
  }
  if (record.nativeApprovalId && approval.nativeApprovalId !== record.nativeApprovalId) {
    return { valid: false, reason: "Native approval receipt does not match this action." };
  }
  return { valid: true, approvalId: approval.approvalId, nativeApprovalId: record.nativeApprovalId };
}

export function consumeExecutionApproval(approval, binding, options = {}) {
  const result = validateExecutionApproval(approval, binding, options);
  if (!result.valid) return result;
  const record = issuedApprovals.get(approval.approvalId);
  record.consumed = true;
  return result;
}

export function clearExecutionApprovals() {
  pendingRequests.clear();
  issuedApprovals.clear();
}

export default {
  createExecutionBinding,
  createExecutionApprovalRequest,
  issueExecutionApproval,
  validateExecutionApproval,
  consumeExecutionApproval,
  clearExecutionApprovals,
};
