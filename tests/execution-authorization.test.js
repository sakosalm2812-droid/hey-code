import assert from "node:assert/strict";
import test from "node:test";
import {
  clearExecutionApprovals,
  createExecutionBinding,
  createExecutionApprovalRequest,
  issueExecutionApproval,
  validateExecutionApproval,
  consumeExecutionApproval,
} from "../src/core/executionAuthorization.js";
import { createWorkflow, runWorkflow } from "../src/core/workflowEngine.js";
import { authorizeExecution, clearPermissions, grantPermission } from "../src/core/permissionManager.js";
import { executeRequest } from "../src/core/executionController.js";

const now = Date.parse("2026-10-03T12:00:00.000Z");

function makeBinding(overrides = {}) {
  return createExecutionBinding({
    actor: { userId: "user-a", sessionId: "session-a" },
    action: { id: "computer.delete_file", capability: "filesystem.delete", parameters: { path: "C:/notes.txt", recursive: false } },
    scope: "account",
    riskLevel: "critical",
    permission: "filesystem.delete",
    permissionContext: { plan: "elite", granted: true, permissions: ["filesystem.delete"] },
    environment: "browser",
    policyVersion: "policy-7",
    requiresConfirmation: true,
    ...overrides,
  });
}

function approve(binding, { requestNow = now, approvalNow = now, nativeApproval = null } = {}) {
  const request = createExecutionApprovalRequest(binding, { now: requestNow });
  const approval = issueExecutionApproval(request, { now: approvalNow, nativeApproval });
  return { request, approval };
}

test.beforeEach(() => clearExecutionApprovals());
test.after(() => clearExecutionApprovals());

test("a current approval authorizes only its exact actor, action, target, parameters, scope, policy and environment", () => {
  const binding = makeBinding();
  const { approval } = approve(binding);
  assert.equal(validateExecutionApproval(approval, binding, { now }).valid, true);
  assert.equal(consumeExecutionApproval(approval, binding, { now }).valid, true);
  assert.equal(validateExecutionApproval(approval, binding, { now }).valid, false);
});

test("a changed target or parameter invalidates the approval", () => {
  const binding = makeBinding();
  const { approval } = approve(binding);
  const changedTarget = makeBinding({ action: { id: "computer.delete_file", capability: "filesystem.delete", parameters: { path: "C:/other.txt", recursive: false } } });
  const changedParameter = makeBinding({ action: { id: "computer.delete_file", capability: "filesystem.delete", parameters: { path: "C:/notes.txt", recursive: true } } });
  assert.equal(validateExecutionApproval(approval, changedTarget, { now }).valid, false);
  assert.equal(validateExecutionApproval(approval, changedParameter, { now }).valid, false);
});

test("a changed actor, session, scope, risk, permission, policy, workflow step, or environment invalidates approval", () => {
  const binding = makeBinding({ workflow: { id: "mission-1", stepId: "step-1", index: 0 } });
  const { approval } = approve(binding);
  const variants = [
    makeBinding({ actor: { userId: "user-b", sessionId: "session-a" }, workflow: binding.workflow }),
    makeBinding({ actor: { userId: "user-a", sessionId: "session-b" }, workflow: binding.workflow }),
    makeBinding({ scope: "resource:C:/notes.txt", workflow: binding.workflow }),
    makeBinding({ riskLevel: "high", workflow: binding.workflow }),
    makeBinding({ permission: "filesystem.write", workflow: binding.workflow }),
    makeBinding({ policyVersion: "policy-8", workflow: binding.workflow }),
    makeBinding({ workflow: { id: "mission-1", stepId: "step-2", index: 1 } }),
    makeBinding({ environment: "tauri-desktop", workflow: binding.workflow }),
    makeBinding({ permissionContext: { plan: "free", granted: false, permissions: [] }, workflow: binding.workflow }),
  ];
  for (const variant of variants) assert.equal(validateExecutionApproval(approval, variant, { now }).valid, false);
});

test("expired requests cannot be approved and expired approvals cannot execute", () => {
  const binding = makeBinding();
  const request = createExecutionApprovalRequest(binding, { now, ttlMs: 1000 });
  assert.throws(() => issueExecutionApproval(request, { now: now + 1001 }), /expired/);
  const fresh = approve(binding);
  assert.equal(validateExecutionApproval(fresh.approval, binding, { now: now + 2 * 60 * 1000 }).valid, false);
});

test("approval requests cannot be altered, replayed, or approved for another environment", () => {
  const binding = makeBinding();
  const request = createExecutionApprovalRequest(binding, { now });
  assert.throws(() => issueExecutionApproval({ ...request, binding: makeBinding({ target: "changed" }) }, { now }), /changed/);
  const approval = issueExecutionApproval(request, { now });
  assert.equal(consumeExecutionApproval(approval, binding, { now }).valid, true);
  assert.equal(consumeExecutionApproval(approval, binding, { now }).valid, false);
});

test("native approvals require a matching trusted receipt for the exact action binding", () => {
  const binding = makeBinding({ environment: "tauri-desktop" });
  const request = createExecutionApprovalRequest(binding, { now });
  assert.throws(() => issueExecutionApproval(request, { now }), /native runtime/);
  const nativeApproval = { approvalId: "native_approval_1", bindingKey: JSON.stringify(binding), expiresAt: now + 60_000 };
  const approval = issueExecutionApproval(request, { now, nativeApproval });
  assert.equal(validateExecutionApproval(approval, binding, { now }).valid, true);
  assert.equal(validateExecutionApproval({ ...approval, nativeApprovalId: "forged" }, binding, { now }).valid, false);
});

test("workflow approvals are per step and cannot be replayed on the next step", async () => {
  const user = { id: "user-a", plan: "pro", entitlements: ["pro"], permissions: ["browser.open_url"] };
  const workflow = createWorkflow("Open two pages", [
    { id: "open-one", action: "browser.open_url", input: { url: "https://one.example" }, permission: "browser.open_url", requiresConfirmation: true, riskLevel: "medium" },
    { id: "open-two", action: "browser.open_url", input: { url: "https://two.example" }, permission: "browser.open_url", requiresConfirmation: true, riskLevel: "medium" },
  ]);
  const handlers = { browser_open_url: async () => ({ success: true }) };
  handlers["browser.open_url"] = async () => ({ success: true });
  const pending = await runWorkflow(workflow, handlers, { user });
  assert.equal(pending.status, "awaiting_confirmation");
  const firstApproval = issueExecutionApproval(pending.approvalRequest, { actorId: user.id });
  const secondPending = await runWorkflow(workflow, handlers, { user, approvals: { "open-one": firstApproval } });
  assert.equal(secondPending.status, "awaiting_confirmation");
  assert.equal(workflow.steps[0].status, "completed");
  assert.equal(workflow.steps[1].status, "pending");
  assert.equal(secondPending.approvalRequest.binding.workflow.stepId, "open-two");
});

test("authorization rechecks permissions after approval and rejects duplicate submission", () => {
  const user = { id: "user-a", sessionId: "session-a", plan: "pro", entitlements: ["pro"], permissions: ["browser.open_url"] };
  const input = {
    user,
    capability: "browser.open_url",
    permission: "browser.open_url",
    riskLevel: "medium",
    requiresConfirmation: true,
    action: { id: "open-site", capability: "browser.open_url", parameters: { url: "https://example.com" } },
  };
  const pending = authorizeExecution(input);
  const ticket = issueExecutionApproval(pending.approvalRequest, { actorId: user.id, sessionId: user.sessionId });
  const accepted = authorizeExecution({ ...input, approval: ticket });
  assert.equal(accepted.authorized, true);
  assert.equal(consumeExecutionApproval(ticket, accepted.executionBinding).valid, true);
  assert.equal(consumeExecutionApproval(ticket, accepted.executionBinding).valid, false);

  const revoked = authorizeExecution({ ...input, user: { ...user, permissions: [] }, approval: ticket });
  assert.equal(revoked.authorized, false);
  assert.equal(revoked.decision, "denied");
});

test("a client-side permission grant cannot authorize execution", () => {
  clearPermissions();
  const grant = grantPermission("browser.open_url", "account", { source: "client" });
  assert.equal(grant.status, "denied");
  const result = authorizeExecution({
    user: { id: "self-grant-user", plan: "pro", entitlements: ["pro"], permissions: [] },
    capability: "browser.open_url",
    permission: "browser.open_url",
    riskLevel: "low",
    confirmed: true,
  });
  assert.equal(result.authorized, false);
  assert.equal(result.decision, "denied");
  clearPermissions();
});

test("tool execution returns an audit receipt and rejects a replayed approval", async () => {
  const { registerTool, executeTool } = await import("../src/core/toolRegistry.js");
  const { listAuditEntries } = await import("../src/core/auditLog.js");
  registerTool("authorization.receipt_test", async () => ({ success: true, verified: true, opened: true }), {
    capabilities: ["browser.open_url"],
    permission: "browser.open_url",
    riskLevel: "medium",
    requiresConfirmation: true,
  });
  const user = { id: "receipt-user", plan: "pro", entitlements: ["pro"], permissions: ["browser.open_url"] };
  const input = { url: "https://receipt.example" };
  const pending = await executeTool("authorization.receipt_test", input, { user });
  const approval = issueExecutionApproval(pending.approvalRequest, { actorId: user.id });
  const result = await executeTool("authorization.receipt_test", input, { user, approval });
  assert.equal(result.success, true);
  assert.ok(result.receipt?.id);
  assert.equal(result.receipt.approvalId, approval.approvalId);
  assert.equal(listAuditEntries(20).some((entry) => entry.id === result.receipt.id && entry.metadata.actionId === "authorization.receipt_test"), true);
  const replay = await executeTool("authorization.receipt_test", input, { user, approval });
  assert.equal(replay.success, false);
  assert.equal(replay.requiresConfirmation, true);
});

test("approved workflow resumes at the exact pending step without replaying completed actions", async () => {
  const user = { id: "workflow-user", sessionId: "workflow-session", plan: "pro", entitlements: ["pro"], permissions: ["browser.open_url"] };
  const command = { kind: "workflow", steps: [
    { kind: "open_url", url: "https://same.example" },
    { kind: "open_url", url: "https://same.example" },
  ] };
  const calls = [];
  const requestBody = { input: "open the same page twice", command };
  const executeTool = async (name, input, context) => {
    calls.push(context.workflow.stepId);
    const binding = createExecutionBinding({
      actor: { userId: user.id, sessionId: user.sessionId },
      action: { id: name, capability: "browser.open_url", parameters: input },
      target: input.url,
      scope: "account",
      riskLevel: "medium",
      permission: "browser.open_url",
      permissionContext: { plan: user.plan, permissions: user.permissions },
      policyVersion: "hey-execution-policy/1",
      environment: "browser",
      workflow: context.workflow,
      requiresConfirmation: true,
    });
    if (context.approval) {
      const consumed = consumeExecutionApproval(context.approval, binding);
      assert.equal(consumed.valid, true);
      return { success: true, verified: true, result: { verified: true } };
    }
    if (context.workflow.actionIndex === 0) return { success: true, verified: true, result: { verified: true } };
    const approvalRequest = createExecutionApprovalRequest(binding);
    return { success: false, verified: false, requiresConfirmation: true, status: "permission_required", approvalRequest, error: "Review this step." };
  };
  const pending = await executeRequest(requestBody, { user, executeTool });
  assert.equal(pending.status, "permission_required");
  assert.equal(pending.results.length, 2);
  assert.equal(calls.length, 2);
  assert.equal(pending.result.approvalRequest.binding.workflow.stepId, "step:1");
  assert.equal(pending.result.approvalRequest.binding.workflow.executionRequestId, pending.requestId);

  const approval = issueExecutionApproval(pending.result.approvalRequest, { actorId: user.id, sessionId: user.sessionId });
  const resumed = await executeRequest(requestBody, { user, executeTool, requestId: pending.requestId, approval });
  assert.equal(resumed.success, true);
  assert.deepEqual(calls, ["step:0", "step:1", "step:1"]);
  assert.equal((await executeRequest(requestBody, { user, executeTool, requestId: pending.requestId })).success, true);
  assert.deepEqual(calls, ["step:0", "step:1", "step:1"]);
  const otherActor = await executeRequest(requestBody, { user: { ...user, id: "other-user" }, executeTool, requestId: pending.requestId });
  assert.equal(otherActor.status, "request_conflict");
});
