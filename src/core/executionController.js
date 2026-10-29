import { parseNaturalCommand } from "./commandParser.js";
import { executeTool, getTool } from "./toolRegistry.js";
import { recordAudit } from "./auditLog.js";
import { registerComputerTools } from "./computerTools.js";
import { publish } from "./eventBus.js";
import { storeMemory } from "./memoryEngine.js";
import { stableExecutionBinding } from "./executionAuthorization.js";

const executionRequests = new Map();
const EXECUTION_CHECKPOINT_TTL_MS = 10 * 60 * 1000;
const MAX_EXECUTION_CHECKPOINTS = 256;

function trimExecutionRequests(now = Date.now()) {
  for (const [id, record] of executionRequests) if (record.expiresAt <= now) executionRequests.delete(id);
}

const COMMAND_TO_TOOL = {
  open_url: "computer.open_url",
  screen_inspection: "computer.capture_screen",
  web_search: "computer.navigate_browser",
  read: "computer.read_file",
  run: "computer.execute_terminal",
  execute: "computer.execute_terminal",
  create: "computer.create_directory",
  organize: "computer.organize_files",
  open: "computer.open_app",
  close: "computer.close_app",
  quit: "computer.close_app",
  take: "computer.capture_screen",
  navigate_browser: "computer.navigate_browser",
};

function failure(message, details = {}) {
  return {
    success: false,
    verified: false,
    status: details.status || "failed",
    code: details.code || "EXECUTION_FAILED",
    message,
    retryable: Boolean(details.retryable),
    requiresPermission: Boolean(details.requiresPermission),
    requiresConfirmation: Boolean(details.requiresConfirmation),
    approvalRequest: details.approvalRequest || null,
    authorization: details.authorization || null,
    capability: details.capability || null,
    provider: details.provider || null,
    tool: details.tool || null,
  };
}

function commandInput(command) {
  if (command.kind === "open_url") return { url: command.url };
  if (command.kind === "screen_inspection") return {};
  if (command.kind === "web_search") return { target: command.query };
  if (command.kind === "computer" && command.operation === "navigate_browser") {
    const target = command.target.toLowerCase() === "youtube" ? "https://www.youtube.com" : command.target;
    return { target: command.target, url: target };
  }
  if (command.kind === "read") return { path: command.target, target: command.target };
  if (command.kind === "create") return { path: command.target, target: command.target };
  if (["run", "execute"].includes(command.operation)) {
    const [program, ...args] = command.target.split(/\s+/);
    return { program, args };
  }
  return { target: command.target };
}

function resolveCommand(command) {
  if (!command || command.needsClarification) return null;
  if (command.kind === "workflow") return null;
  const toolName = command.kind === "computer"
    ? COMMAND_TO_TOOL[command.operation]
    : COMMAND_TO_TOOL[command.kind];
  if (!toolName) return null;
  return { toolName, input: commandInput(command), capability: toolName.replace(/^computer\./, "") };
}

function isVerified(result) {
  return result?.verified === true || result?.result?.verified === true;
}

async function executeStep(step, options) {
  const resolved = resolveCommand(step);
  if (!resolved) return failure("HEY could not map that request to an executable tool.", { status: "unsupported", code: "NO_TOOL_MAPPING" });
  if (!getTool(resolved.toolName)) return failure(`Tool ${resolved.toolName} is not registered.`, { status: "unavailable", code: "TOOL_UNAVAILABLE", tool: resolved.toolName, capability: resolved.capability });

  const availableTools = options.availableTools || [];
  if (availableTools.length > 0 && !availableTools.includes(resolved.toolName)) {
    return failure(`Tool ${resolved.toolName} is not available for this agent.`, { status: "unauthorized", code: "TOOL_NOT_AUTHORIZED", tool: resolved.toolName, capability: resolved.capability });
  }

  publish("execution.step.started", { requestId: options.requestId, tool: resolved.toolName, capability: resolved.capability });

  const result = await (options.executeTool || executeTool)(resolved.toolName, resolved.input, {
    signal: options.signal,
    requestId: options.requestId,
    permissionScope: options.permissionScope,
    approval: options.approval || null,
    user: options.user || options.session?.user || null,
    sessionId: options.sessionId || options.user?.sessionId || null,
    workflow: options.workflow || null,
    plan: options.plan,
    entitlements: options.entitlements,
    clientPlan: options.clientPlan,
    clientEntitlements: options.clientEntitlements,
  });
  if (result.requiresConfirmation || result.requiresPermission) {
    publish("execution.step.permission_required", { requestId: options.requestId, tool: resolved.toolName, capability: resolved.capability });
    return failure(result.error || `HEY needs permission to use ${resolved.toolName}.`, {
      status: "permission_required",
      code: "CONFIRMATION_REQUIRED",
      requiresPermission: true,
      requiresConfirmation: true,
      approvalRequest: result.approvalRequest || null,
      authorization: result.authorization || null,
      capability: resolved.capability,
      tool: resolved.toolName,
    });
  }
  if (!result.success) {
    publish("execution.step.failed", { requestId: options.requestId, tool: resolved.toolName, capability: resolved.capability, error: result.error });
    return failure(result.error || `Tool ${resolved.toolName} failed.`, {
      status: result.status || "failed",
      code: "TOOL_FAILED",
      retryable: Boolean(result.retryable || result.metadata?.retryable),
      capability: resolved.capability,
      tool: resolved.toolName,
    });
  }
  if (!isVerified(result)) {
    publish("execution.step.verification_failed", { requestId: options.requestId, tool: resolved.toolName, capability: resolved.capability });
    return failure(`Tool ${resolved.toolName} returned without a verified result.`, {
      status: "verification_failed",
      code: "UNVERIFIED_RESULT",
      capability: resolved.capability,
      tool: resolved.toolName,
    });
  }

  const completed = {
    success: true,
    verified: true,
    status: "completed",
    code: "OK",
    message: `HEY completed ${resolved.toolName}.`,
    result: result.result,
    capability: resolved.capability,
    tool: resolved.toolName,
    metadata: result.metadata || {},
  };
  publish("execution.step.completed", completed);
  return completed;
}

export async function executeRequest(request = {}, options = {}) {
  const input = String(request.input || "").trim();
  const command = request.command || parseNaturalCommand(input);
  const requestId = options.requestId || options.approval?.binding?.workflow?.executionRequestId || crypto.randomUUID();
  const availableTools = request.tools || [];
  if (!command) return { handled: false, requestId, result: null };
  publish("execution.request.started", { requestId, input, command });
  registerComputerTools();
  if (command.needsClarification) {
    return { handled: true, requestId, result: failure("More information is required before HEY can execute this request.", { status: "clarification_required", code: "MISSING_INPUT" }) };
  }

  if (command.kind !== "workflow" && !resolveCommand(command)) {
    return { handled: false, requestId, result: null };
  }

  const steps = command.kind === "workflow" ? command.steps : [command];
  const identity = { userId: options.user?.id || options.user?.userId || null, sessionId: options.user?.sessionId || options.user?.session_id || null };
  const fingerprint = stableExecutionBinding(JSON.parse(JSON.stringify({ input, command, identity, workflow: options.workflow || null })));
  trimExecutionRequests();
  let checkpoint = executionRequests.get(requestId);
  if (checkpoint && checkpoint.fingerprint !== fingerprint) {
    return { handled: true, requestId, success: false, verified: false, status: "request_conflict", result: failure("This execution ID is already bound to a different actor, command, or workflow.", { status: "denied", code: "REQUEST_BINDING_MISMATCH" }) };
  }
  if (checkpoint?.status === "completed") return checkpoint.result;
  if (checkpoint?.status === "reconciliation_required") {
    return { handled: true, requestId, success: false, verified: false, status: "reconciliation_required", result: failure("A previous action has an uncertain outcome. Review its external state before continuing.", { status: "reconciliation_required", code: "UNKNOWN_ACTION_OUTCOME" }) };
  }
  if (checkpoint?.running) return { handled: true, requestId, success: false, verified: false, status: "duplicate_submission", result: failure("This execution request is already running.", { status: "duplicate_submission", code: "DUPLICATE_SUBMISSION" }) };
  if (!checkpoint) {
    if (executionRequests.size >= MAX_EXECUTION_CHECKPOINTS) {
      return { handled: true, requestId, success: false, verified: false, status: "busy", result: failure("Execution checkpoints are at capacity. Retry after existing requests expire.", { status: "busy", code: "CHECKPOINT_CAPACITY" }) };
    }
    checkpoint = { fingerprint, status: "pending", running: false, nextStepIndex: 0, results: [], expiresAt: Date.now() + EXECUTION_CHECKPOINT_TTL_MS };
    executionRequests.set(requestId, checkpoint);
  }
  checkpoint.running = true;
  checkpoint.expiresAt = Date.now() + EXECUTION_CHECKPOINT_TTL_MS;
  const results = [...checkpoint.results];
  try {
  for (let index = checkpoint.nextStepIndex; index < steps.length; index += 1) {
    const step = steps[index];
    if (options.signal?.aborted) {
      checkpoint.status = "reconciliation_required";
      return { handled: true, requestId, success: false, verified: false, status: "cancelled", results, result: failure("Execution cancelled. Review the action outcome before continuing.", { status: "cancelled", code: "CANCELLED" }) };
    }
    const workflow = command.kind === "workflow" || options.workflow
      ? {
          id: options.workflow?.id || requestId,
          parentStepId: options.workflow?.stepId || null,
          stepId: `${options.workflow?.stepId || "step"}:${index}`,
          index: options.workflow?.index ?? index,
          actionIndex: index,
          executionRequestId: requestId,
        }
      : null;
    const result = await executeStep(step, { ...options, requestId, availableTools, workflow });
    results.push(result);
    if (!result.success) {
      checkpoint.results = results.slice(0, checkpoint.nextStepIndex);
      checkpoint.status = result.status === "permission_required" || result.status === "denied" || result.status === "unauthorized"
        ? "awaiting_permission"
        : "reconciliation_required";
      recordAudit({ action: "execution.request", status: "failed", requestId, metadata: { results } });
      publish("execution.request.failed", { requestId, result, results });
      return { handled: true, requestId, success: false, verified: false, status: result.status, results, result };
    }
    checkpoint.results.push(result);
    checkpoint.nextStepIndex = index + 1;
  }

  recordAudit({ action: "execution.request", status: "completed", requestId, metadata: { stepCount: results.length } });
  const memory = options.rememberExecution === false ? null : storeMemory({ kind: "verified_action", tools: results.map((item) => item.tool), status: "completed", input }, "pattern");
  publish("execution.request.completed", { requestId, results, memory });
  const outcome = { handled: true, requestId, success: true, verified: true, status: "completed", results, result: results.at(-1), memory };
  checkpoint.status = "completed";
  checkpoint.result = outcome;
  checkpoint.results = results;
  return outcome;
  } catch (error) {
    checkpoint.status = "reconciliation_required";
    recordAudit({ action: "execution.request", status: "reconciliation_required", requestId, metadata: { error: error instanceof Error ? error.message : String(error), completedSteps: checkpoint.nextStepIndex } });
    return { handled: true, requestId, success: false, verified: false, status: "reconciliation_required", result: failure("Execution stopped with an uncertain action outcome. Review external state before retrying.", { status: "reconciliation_required", code: "UNKNOWN_ACTION_OUTCOME" }) };
  } finally {
    checkpoint.running = false;
  }
}

export function getToolForCommand(command) {
  return resolveCommand(command)?.toolName || null;
}

export default { executeRequest, getToolForCommand };

