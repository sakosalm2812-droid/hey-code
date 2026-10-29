import { recordAudit } from "./auditLog.js";
import { publish } from "./eventBus.js";
import { resolveAccountPlan } from "../lib/accountRecords.js";
import { canGrantPermission } from "../lib/permissionPolicy.js";
import {
  EXECUTION_POLICY_VERSION,
  createExecutionBinding,
  createExecutionApprovalRequest,
  validateExecutionApproval,
  consumeExecutionApproval,
  clearExecutionApprovals,
} from "./executionAuthorization.js";

const permissions = new Map();
let permissionOwnerId = null;

export const PERMISSION_RISK = Object.freeze({
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
});

const SECURITY_RESTRICTIONS = new Set([
  "terminal.execute",
  "input.control",
  "filesystem.delete",
  "window.control",
]);

const VALID_DECISIONS = Object.freeze({
  ALLOWED: "allowed",
  DENIED: "denied",
  CONFIRMATION_REQUIRED: "confirmation_required",
});

function normalizeString(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value).trim();
}

function normalizeRiskLevel(value) {
  const risk = normalizeString(value, "low").toLowerCase();

  return Object.hasOwn(PERMISSION_RISK, risk)
    ? risk
    : "critical";
}

function normalizePermissions(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeString(entry))
    .filter(Boolean);
}

function getUserId(user = {}) {
  return normalizeString(
    user.id || user.userId || user.accountId,
  );
}

function getUserRole(user = {}) {
  return normalizeString(
    user.role,
    "user",
  ).toLowerCase();
}

function hasAuthenticatedIdentity(user = {}) {
  return Boolean(getUserId(user));
}

function resolveSessionPlan(user = {}) {
  const entitlements = normalizePermissions(
    user.entitlements,
  );

  const plan = normalizeString(
    user.plan,
    "free",
  ).toLowerCase();

  return resolveAccountPlan({
    plan,
    entitlements,
  });
}

function hasExplicitPermission(
  user,
  permission,
) {
  const userPermissions = new Set(
    normalizePermissions(user?.permissions),
  );

  return (
    userPermissions.has(permission) ||
    userPermissions.has("*") ||
    userPermissions.has("all")
  );
}

function isHighRisk(riskLevel) {
  return (
    PERMISSION_RISK[riskLevel] >=
    PERMISSION_RISK.high
  );
}

function isCriticalRisk(riskLevel) {
  return (
    PERMISSION_RISK[riskLevel] >=
    PERMISSION_RISK.critical
  );
}

function evaluateSecurityRestriction({
  capability,
  permission,
  riskLevel,
}) {
  const capabilityKey = normalizeString(
    capability,
  );

  const permissionKey = normalizeString(
    permission,
  );

  const restricted =
    SECURITY_RESTRICTIONS.has(capabilityKey) ||
    SECURITY_RESTRICTIONS.has(permissionKey);

  if (!restricted) {
    return {
      blocked: false,
      reason: null,
    };
  }

  /*
   * These capabilities require their own
   * dedicated, safety-gated execution paths.
   *
   * Permission ownership alone must never
   * turn a sensitive primitive into an
   * unrestricted execution surface.
   */
  if (isCriticalRisk(riskLevel)) {
    return {
      blocked: true,
      reason:
        "Security restriction: critical-risk execution requires a dedicated verified execution path.",
    };
  }

  return {
    blocked: false,
    reason: null,
  };
}

function auditAuthorization({
  permission,
  capability,
  riskLevel,
  status,
  decision,
  reason,
  user,
  plan,
  ignoredClientOverrides,
}) {
  recordAudit({
    action: "authorization.decision",
    tool: permission,
    riskLevel,
    status,
    metadata: {
      capability,
      decision,
      reason,
      plan,
      userId: getUserId(user),
      role: getUserRole(user),
      ignoredClientOverrides,
    },
  });
}

export function getPermissionKey(
  permission,
  scope = "account",
) {
  return `${normalizeString(permission)}:${normalizeString(
    scope,
    "account",
  )}`;
}

export function grantPermission(
  permission,
  scope = "account",
  metadata = {},
) {
  const normalizedPermission =
    normalizeString(permission);

  if (!normalizedPermission) {
    throw new Error(
      "A permission is required.",
    );
  }

  const normalizedScope = normalizeString(scope, "account");
  const value = {
    permission: normalizedPermission,
    scope: normalizedScope,
    status: "denied",
    metadata: { ...metadata, reason: "Permission grants must be written by the authenticated server permission workflow." },
    updatedAt: new Date(),
  };

  recordAudit({
    action: "permission.grant_rejected",
    tool: normalizedPermission,
    status: "denied",
    metadata: {
      scope: normalizedScope,
      reason: value.metadata.reason,
    },
  });

  return value;
}

export function revokePermission(
  permission,
  scope = "account",
) {
  const normalizedPermission =
    normalizeString(permission);

  if (!normalizedPermission) {
    return false;
  }

  const normalizedScope = normalizeString(
    scope,
    "account",
  );

  const key = getPermissionKey(
    normalizedPermission,
    normalizedScope,
  );

  const value = {
    permission: normalizedPermission,
    scope: normalizedScope,
    status: "revoked",
    metadata: {},
    updatedAt: new Date(),
  };

  permissions.set(key, value);

  publish("permission.updated", value);

  recordAudit({
    action: "permission.revoked",
    tool: normalizedPermission,
    status: "completed",
    metadata: {
      scope: normalizedScope,
    },
  });

  return value;
}

export function hasPermission(
  permission,
  scope = "account",
  userId = null,
) {
  if (userId && permissionOwnerId !== normalizeString(userId)) {
    return false;
  }
  const key = getPermissionKey(
    permission,
    scope,
  );

  return (
    permissions.get(key)?.status ===
    "granted"
  );
}

export function listPermissions() {
  return Array.from(
    permissions.values(),
  );
}

export function clearPermissions() {
  permissions.clear();
  permissionOwnerId = null;
  clearExecutionApprovals();
}

export function seedPermissions(records = [], userId = null) {
  clearPermissions();
  if (!Array.isArray(records)) return 0;
  permissionOwnerId = normalizeString(userId) || null;

  records.forEach((record) => {
    const permission = normalizeString(
      record.permission,
    );
    const scope = normalizeString(
      record.scope,
      "account",
    );
    if (!permission) return;

    const key = getPermissionKey(
      permission,
      scope,
    );

    permissions.set(key, {
      permission,
      scope,
      status: record.status === "granted" ? "granted" : "revoked",
      metadata: record.metadata || {},
      updatedAt:
        record.updatedAt instanceof Date
          ? record.updatedAt
          : new Date(
              record.updatedAt ||
                record.updated_at ||
                Date.now(),
            ),
    });
  });

  return permissions.size;
}

export function authorizeExecution(
  input = {},
) {
  const user = input.user || {};

  const capability = normalizeString(
    input.capability,
    "unknown",
  );

  const permission = normalizeString(
    input.permission,
    capability || "unknown",
  );

  const riskLevel = normalizeRiskLevel(
    input.riskLevel,
  );

  const approval = input.approval && typeof input.approval === "object"
    ? input.approval
    : null;

  const requiresExplicitConfirmation =
    input.requiresConfirmation === true ||
    isHighRisk(riskLevel);

  const clientPlan =
    input.clientPlan ?? null;

  const clientEntitlements =
    input.clientEntitlements ?? null;

  const hasClientOverrides =
    clientPlan !== null ||
    clientEntitlements !== null;

  const ignoredClientOverrides =
    hasClientOverrides;

  /*
   * Never authorize an action without a
   * server-authenticated identity.
   */
  if (!hasAuthenticatedIdentity(user)) {
    const reason =
      "Authenticated user identity is required before any HEY action can execute.";

    // A non-authenticated request must never execute. For an action that also
    // needs confirmation, retain that state so the interface can explain the
    // complete next step instead of presenting a misleading hard failure.
    const decision = {
      authorized: false,
      decision: VALID_DECISIONS.DENIED,
      requiresConfirmation: false,
      plan: "free",
      reason,
      ignoredClientOverrides: false,
      capability,
      permission,
      riskLevel,
      role: getUserRole(user),
      userId: null,
    };

    auditAuthorization({
      permission,
      capability,
      riskLevel,
      status: "denied",
      decision: decision.decision,
      reason,
      user,
      plan: "free",
      ignoredClientOverrides: false,
    });

    return decision;
  }

  const effectivePlan =
    resolveSessionPlan(user);

  const role = getUserRole(user);
  const userId = getUserId(user);

  const reasonParts = [];

  if (hasClientOverrides) {
    reasonParts.push(
      "client-supplied plan or entitlements are ignored because authenticated account state is authoritative",
    );
  }

  const planAllowed = canGrantPermission({
    plan: effectivePlan,
    permission,
  });

  // The local permission cache is only a display/hydration aid. It cannot
  // grant access; only permissions from the authenticated account record do.
  const permissionGranted = hasExplicitPermission(user, permission);

  if (!planAllowed) {
    reasonParts.push(
      `plan ${effectivePlan} does not include ${permission}`,
    );
  }

  if (!permissionGranted) {
    reasonParts.push(
      `missing permission ${permission}`,
    );
  }

  /*
   * Approval is bound to the complete action and the live authorization
   * context. The old reusable `confirmed: true` value is ignored.
   */
  const securityCheck = evaluateSecurityRestriction({ capability, permission, riskLevel });
  let executionBinding = null;
  let approvalValidation = { valid: false, reason: "An action-bound approval is required." };
  if (planAllowed && permissionGranted && !securityCheck.blocked) {
    try {
      executionBinding = createExecutionBinding({
        actor: { userId, sessionId: user.sessionId || user.session_id || null },
        action: input.action || { id: capability, capability, parameters: input.parameters || {} },
        target: input.target,
        scope: input.scope || "account",
        riskLevel,
        permission,
        permissionContext: {
          plan: effectivePlan,
          entitlements: [...normalizePermissions(user.entitlements)].sort(),
          permissions: [...normalizePermissions(user.permissions)].sort(),
          permissionGranted,
        },
        policyVersion: input.policyVersion || EXECUTION_POLICY_VERSION,
        environment: input.environment || (globalThis.window?.__TAURI_INTERNALS__ ? "tauri-desktop" : "browser"),
        workflow: input.workflow || null,
        requiresConfirmation: true,
      });
      approvalValidation = requiresExplicitConfirmation
        ? validateExecutionApproval(approval, executionBinding)
        : { valid: false, reason: "No approval is required for this action." };
    } catch (error) {
      approvalValidation = { valid: false, reason: error instanceof Error ? error.message : "Action binding is invalid." };
    }
  }

  if (requiresExplicitConfirmation && planAllowed && permissionGranted && !securityCheck.blocked && !approvalValidation.valid) {
    const approvalRequest = executionBinding
      ? createExecutionApprovalRequest(executionBinding)
      : null;
    const reason = approvalValidation.reason || `Review and approve ${permission} before execution.`;

    const decision = {
      authorized: false,
      decision: VALID_DECISIONS.CONFIRMATION_REQUIRED,
      requiresConfirmation: true,
      plan: effectivePlan,
      reason,
      ignoredClientOverrides,
      capability,
      permission,
      riskLevel,
      role,
      userId,
      approvalRequest,
      approvalId: null,
    };

    auditAuthorization({
      permission,
      capability,
      riskLevel,
      status: "awaiting_confirmation",
      decision: decision.decision,
      reason,
      user,
      plan: effectivePlan,
      ignoredClientOverrides,
    });

    return decision;
  }

  if (securityCheck.blocked) {
    const reason = [
      securityCheck.reason,
      "The operation was rejected before execution.",
    ].join(" ");

    const decision = {
      authorized: false,
      decision: VALID_DECISIONS.DENIED,
      requiresConfirmation: false,
      plan: effectivePlan,
      reason,
      ignoredClientOverrides,
      capability,
      permission,
      riskLevel,
      role,
      userId,
    };

    auditAuthorization({
      permission,
      capability,
      riskLevel,
      status: "denied",
      decision: decision.decision,
      reason,
      user,
      plan: effectivePlan,
      ignoredClientOverrides,
    });

    return decision;
  }

  if (!planAllowed || !permissionGranted) {
    const decision = {
      authorized: false,
      decision: VALID_DECISIONS.DENIED,
      requiresConfirmation: false,
      plan: effectivePlan,
      reason:
        reasonParts.join("; ") ||
        `Execution is not authorized for ${permission}.`,
      ignoredClientOverrides,
      capability,
      permission,
      riskLevel,
      role,
      userId,
    };

    auditAuthorization({
      permission,
      capability,
      riskLevel,
      status: "denied",
      decision: decision.decision,
      reason: decision.reason,
      user,
      plan: effectivePlan,
      ignoredClientOverrides,
    });

    return decision;
  }

  const reason =
    `Execution allowed for ${permission} under the authenticated ${effectivePlan} plan and security policy.`;

  const decision = {
    authorized: true,
    decision: VALID_DECISIONS.ALLOWED,
    requiresConfirmation: false,
    plan: effectivePlan,
    reason,
    ignoredClientOverrides,
    capability,
    permission,
    riskLevel,
    role,
    userId,
    approvalId: approvalValidation.valid ? approvalValidation.approvalId : null,
    nativeApprovalId: approvalValidation.valid ? approvalValidation.nativeApprovalId : null,
    executionBinding,
  };

  auditAuthorization({
    permission,
    capability,
    riskLevel,
    status: "completed",
    decision: decision.decision,
    reason,
    user,
    plan: effectivePlan,
    ignoredClientOverrides,
  });

  return decision;
}

export function requestPermission({
  permission,
  scope = "account",
  riskLevel = "medium",
  reason = "",
  approval = null,
}) {
  const normalizedPermission =
    normalizeString(permission);

  const normalizedScope =
    normalizeString(
      scope,
      "account",
    );

  const normalizedRisk =
    normalizeRiskLevel(
      riskLevel,
    );

  if (!normalizedPermission) {
    return {
      permission: "",
      scope: normalizedScope,
      riskLevel: normalizedRisk,
      reason,
      granted: false,
      requiresConfirmation: false,
      error: "A permission is required.",
    };
  }

  const granted = hasPermission(
    normalizedPermission,
    normalizedScope,
  );

  const requiresConfirmation = !granted || isHighRisk(normalizedRisk);

  const request = {
    permission: normalizedPermission,
    scope: normalizedScope,
    riskLevel: normalizedRisk,
    reason,
    granted: false,
    requiresConfirmation,
    approvalId: approval?.approvalId || null,
  };

  recordAudit({
    action: "permission.requested",
    tool: normalizedPermission,
    riskLevel: normalizedRisk,
    status: request.granted
      ? "approved"
      : "awaiting_confirmation",
    metadata: {
      scope: normalizedScope,
      reason,
    },
  });

  return request;
}

export async function executeWithPermission(
  {
    permission,
    scope = "account",
    riskLevel = "medium",
    reason = "",
    approval = null,
    authorization: suppliedAuthorization = null,
    action: actionDescriptor = null,
    target = undefined,
    environment = undefined,
    workflow = null,
    user = null,
    capability = permission,
    clientPlan = null,
    clientEntitlements = null,
  },
  action,
) {
  if (typeof action !== "function") {
    return {
      success: false,
      requiresConfirmation: false,
      error:
        "A valid execution action is required.",
    };
  }

  /*
   * No legacy execution path.
   *
   * Every actual action must pass through
   * authenticated authorization.
   */
  const authorization = suppliedAuthorization || authorizeExecution({
      user,
      capability,
      permission,
      riskLevel,
      approval,
      action: actionDescriptor,
      target,
      scope,
      environment,
      workflow,
      clientPlan,
      clientEntitlements,
    });

  if (!authorization.authorized) {
    recordAudit({
      action: "permissioned_action",
      tool: permission,
      riskLevel,
      status:
        authorization.requiresConfirmation
          ? "awaiting_confirmation"
          : "denied",
      metadata: {
        scope,
        reason,
        decision:
          authorization.decision,
        plan: authorization.plan,
        userId: authorization.userId,
      },
    });

    return {
      success: false,
      requiresConfirmation:
        authorization.requiresConfirmation,
      authorization,
      request: {
        permission,
        scope,
        riskLevel,
        reason,
        granted: false,
        requiresConfirmation:
          authorization.requiresConfirmation,
      },
      error: authorization.reason,
    };
  }

  if (authorization.approvalId) {
    const consumed = consumeExecutionApproval(approval, authorization.executionBinding);
    if (!consumed.valid) {
      return {
        success: false,
        requiresConfirmation: true,
        authorization: { ...authorization, authorized: false, reason: consumed.reason },
        error: consumed.reason,
      };
    }
  }

  try {
    const result = await action({ authorization, approval, action: actionDescriptor, target, scope, workflow });

    const receipt = recordAudit({
      action: "permissioned_action",
      tool: permission,
      riskLevel,
      status: "completed",
      metadata: {
        scope,
        authorization:
          authorization.decision,
        plan: authorization.plan,
        userId: authorization.userId,
        actionId: actionDescriptor?.id || capability,
        target: target ?? null,
        approvalId: authorization.approvalId || null,
        nativeApprovalId: authorization.nativeApprovalId || null,
        nativeReceiptId: result?.nativeReceiptId || result?.receiptId || null,
      },
    });

    return {
      success: true,
      result,
      authorization,
      receipt: { id: receipt.id, actionId: actionDescriptor?.id || capability, approvalId: authorization.approvalId || null, nativeApprovalId: authorization.nativeApprovalId || null, nativeReceiptId: result?.nativeReceiptId || result?.receiptId || null },
      request: {
        permission,
        scope,
        riskLevel,
        reason,
        granted: true,
        requiresConfirmation: false,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    recordAudit({
      action: "permissioned_action",
      tool: permission,
      riskLevel,
      status: "failed",
      metadata: {
        scope,
        error: message,
        plan: authorization.plan,
        userId: authorization.userId,
      },
    });

    return {
      success: false,
      error: message,
      authorization,
      request: {
        permission,
        scope,
        riskLevel,
        reason,
        granted: true,
        requiresConfirmation: false,
      },
    };
  }
}

export default {
  grantPermission,
  revokePermission,
  hasPermission,
  listPermissions,
  clearPermissions,
  seedPermissions,
  requestPermission,
  authorizeExecution,
  executeWithPermission,
  getPermissionKey,
};
