import { recordAudit } from "./auditLog.js";

const MAX_ATTEMPTS = 3;

export async function runVerifiedStep(step, executor, observer = async (result) => result, options = {}) {
  if (typeof executor !== "function") throw new TypeError("An executor is required.");
  const maxAttempts = step?.idempotent === true
    ? Math.max(1, Math.min(MAX_ATTEMPTS, Number(options.maxAttempts) || MAX_ATTEMPTS))
    : 1;
  const requestId = options.requestId || crypto.randomUUID();
  let lastError = null;
  let attempts = 0;
  let lastResult = null;
  let lastObservation = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (options.signal?.aborted) return { success: false, result: null, observation: null, verified: false, attempts: attempt - 1, requestId, error: "Execution cancelled.", cancelled: true };
    try {
      attempts = attempt;
      const result = await executor({ step, attempt, requestId, signal: options.signal });
      lastResult = result;
      if (result?.success === false) throw new Error(result.error || "The action reported a failure.");
      if (options.signal?.aborted) return { success: false, result, observation: null, verified: false, attempts: attempt, requestId, error: "Execution cancelled; reconcile the action result.", cancelled: true, requiresReconciliation: true };
      const observation = await observer(result, { step, attempt, requestId, signal: options.signal });
      lastObservation = observation;
      if (options.signal?.aborted) return { success: false, result, observation, verified: false, attempts: attempt, requestId, error: "Verification cancelled; reconcile the action result.", cancelled: true, requiresReconciliation: true };
      const verified = observation?.verified === true;
      recordAudit({ action: "execution.step", tool: step?.tool || step?.action, status: verified ? "completed" : "needs_verification", requestId, metadata: { attempt, verified, observation } });
      if (verified) return { success: true, result, observation, verified, attempts: attempt, requestId };
      lastError = "The action completed but could not be verified.";
      // Reconcile the existing result; lack of evidence never justifies
      // repeating an action that may already have happened.
      return { success: false, result, observation, verified: false, attempts: attempt, requestId, error: lastError, code: "TOOL_UNKNOWN_EFFECT", requiresReconciliation: true };
    } catch (error) {
      if (options.signal?.aborted || error?.name === "AbortError") return { success: false, result: lastResult, observation: lastObservation, verified: false, attempts: attempt, requestId, error: "Execution cancelled.", cancelled: true, requiresReconciliation: lastResult != null };
      lastError = error instanceof Error ? error.message : String(error);
      recordAudit({ action: "execution.step", tool: step?.tool || step?.action, status: "failed", requestId, metadata: { attempt, error: lastError } });
      if (lastResult?.success !== false && lastResult !== null) break;
      const failure = lastResult?.success === false ? lastResult : error;
      const status = Number(failure?.status || failure?.statusCode);
      const transient = failure?.retryable === true || failure?.transient === true || status === 408 || status === 429 || status >= 500;
      if (!transient) break;
      lastResult = null;
    }
  }

  return { success: false, result: lastResult, observation: lastObservation, verified: false, attempts, requestId, error: lastError, ...(lastResult?.success !== false && lastResult !== null ? { code: "TOOL_UNKNOWN_EFFECT", requiresReconciliation: true } : {}) };
}

export async function runVerifiedWorkflow(steps = [], executor, options = {}) {
  const results = [];
  for (const step of steps) {
    if (options.signal?.aborted) return { success: false, status: "cancelled", results };
    const result = await runVerifiedStep(step, executor, options.observer, options);
    results.push({ step, ...result });
    if (!result.success) return { success: false, status: result.cancelled ? "cancelled" : "blocked", results };
  }
  return { success: true, status: "completed", results };
}

export default { runVerifiedStep, runVerifiedWorkflow };
