/**
 * HEY Trace Spine — One Trace ID Across the Whole Stack
 *
 * Pure. No I/O, no network, no clock reads beyond injected time.
 * One trace ID per user request, propagated through every function call.
 *
 * @module core/traceSpine
 */

/**
 * @typedef {Object} TraceSpan
 * @property {string} traceId
 * @property {string} spanId
 * @property {string|null} parentSpanId
 * @property {string} operation          // 'model:call' | 'tool:exec' | 'verify' | 'artifact:create' | 'memory:write' | 'audit:log' | 'capability:check' | 'routing:decide' | 'cost:reserve' | 'response:envelope' | 'receipt:final' | 'request:received' | 'request:complete'
 * @property {string} capabilityId
 * @property {number} startMs
 * @property {number|null} endMs
 * @property {Object} input
 * @property {Object|null} output
 * @property {Object} metadata           // { model, provider, costCents, tokens, verificationStatus, receiptId, reason, refusedBecause }
 * @property {'ok'|'error'|'partial'} status
 */

const TRACES = new Map();

/**
 * Valid operations for trace spans.
 * @type {ReadonlyArray<string>}
 */
export const VALID_OPERATIONS = Object.freeze([
  "model:call",
  "tool:exec",
  "verify",
  "verification:evaluate",
  "artifact:create",
  "memory:write",
  "audit:log",
  "capability:check",
  "routing:decide",
  "cost:reserve",
  "response:envelope",
  "receipt:final",
  "request:received",
  "request:complete",
  "agent:select",
  "delegation:plan",
  "vault:decide",
  "secret:access",
  "release:gate",
]);

/**
 * Start a new trace span.
 *
 * @param {Object} params
 * @param {string} params.traceId
 * @param {string} params.operation
 * @param {string} params.capabilityId
 * @param {Object} params.input
 * @param {string} [params.parentSpanId]
 * @returns {TraceSpan}
 */
export function startTrace({ traceId, operation, capabilityId, input, parentSpanId = null }) {
  if (!traceId || typeof traceId !== "string") {
    throw new TypeError("startTrace: traceId is required and must be a string");
  }
  if (!VALID_OPERATIONS.includes(operation)) {
    throw new TypeError(`startTrace: operation must be one of ${VALID_OPERATIONS.join(", ")}, got ${operation}`);
  }
  if (!capabilityId || typeof capabilityId !== "string") {
    throw new TypeError("startTrace: capabilityId is required and must be a string");
  }

  const spanId = `sp_${crypto.randomUUID()}`;
  const startMs = Date.now();

  const span = {
    traceId,
    spanId,
    parentSpanId,
    operation,
    capabilityId,
    startMs,
    endMs: null,
    input: input ?? {},
    output: null,
    metadata: {},
    status: "partial",
  };

  if (!TRACES.has(traceId)) {
    TRACES.set(traceId, []);
  }
  TRACES.get(traceId).push(span);

  return span;
}

/**
 * End a trace span with output and status.
 *
 * @param {string} spanId
 * @param {Object} params
 * @param {Object} params.output
 * @param {'ok'|'error'|'partial'} params.status
 * @param {Object} [params.metadata]
 * @returns {TraceSpan|null} The completed span, or null if not found
 */
export function endTrace(spanId, { output, status, metadata = {} }) {
  for (const [traceId, spans] of TRACES) {
    const span = spans.find(s => s.spanId === spanId);
    if (span) {
      span.endMs = Date.now();
      span.output = output ?? {};
      span.status = status;
      span.metadata = { ...span.metadata, ...metadata };
      return span;
    }
  }
  return null;
}

/**
 * Get all spans for a trace ID.
 *
 * @param {string} traceId
 * @returns {TraceSpan[]}
 */
export function getTrace(traceId) {
  return TRACES.get(traceId) ? [...TRACES.get(traceId)] : [];
}

/**
 * Export a trace as JSON for debugging.
 *
 * @param {string} traceId
 * @returns {string|null} JSON string or null if trace not found
 */
export function exportTrace(traceId) {
  const spans = TRACES.get(traceId);
  if (!spans) return null;

  const sorted = [...spans].sort((a, b) => a.startMs - b.startMs);
  return JSON.stringify({
    traceId,
    spanCount: sorted.length,
    durationMs: sorted.length > 1 ? sorted[sorted.length - 1].startMs - sorted[0].startMs : 0,
    spans: sorted.map(s => ({
      ...s,
      durationMs: s.endMs ? s.endMs - s.startMs : null,
    })),
  }, null, 2);
}

/**
 * Assert that a trace contains all required operations.
 *
 * @param {string} traceId
 * @param {string[]} requiredOperations
 * @returns {{ ok: boolean, missing: string[] }}
 */
export function assertTraceComplete(traceId, requiredOperations) {
  const spans = TRACES.get(traceId);
  if (!spans) return { ok: false, missing: requiredOperations };

  const foundOperations = new Set(spans.map(s => s.operation));
  const missing = requiredOperations.filter(op => !foundOperations.has(op));

  return { ok: missing.length === 0, missing };
}

/**
 * Get trace statistics.
 *
 * @param {string} traceId
 * @returns {Object|null}
 */
export function getTraceStats(traceId) {
  const spans = TRACES.get(traceId);
  if (!spans) return null;

  const completed = spans.filter(s => s.endMs !== null);
  const byOperation = {};
  const byStatus = { ok: 0, error: 0, partial: 0 };
  let totalDuration = 0;

  for (const span of completed) {
    const dur = span.endMs - span.startMs;
    totalDuration += dur;
    byOperation[span.operation] = (byOperation[span.operation] || 0) + 1;
    byStatus[span.status] = (byStatus[span.status] || 0) + 1;
  }

  return {
    traceId,
    totalSpans: spans.length,
    completedSpans: completed.length,
    incompleteSpans: spans.length - completed.length,
    byOperation,
    byStatus,
    totalDurationMs: totalDuration,
    avgSpanDurationMs: completed.length > 0 ? Math.round(totalDuration / completed.length) : 0,
  };
}

/**
 * Clear a specific trace (test helper).
 *
 * @param {string} traceId
 * @returns {boolean}
 */
export function clearTrace(traceId) {
  return TRACES.delete(traceId);
}

/**
 * Clear all traces (test helper).
 */
export function clearAllTraces() {
  TRACES.clear();
}

/**
 * Create a child span within an existing trace.
 *
 * @param {string} traceId
 * @param {string} parentSpanId
 * @param {string} operation
 * @param {string} capabilityId
 * @param {Object} input
 * @returns {TraceSpan}
 */
export function startChildSpan(traceId, parentSpanId, operation, capabilityId, input) {
  return startTrace({ traceId, operation, capabilityId, input, parentSpanId });
}

/**
 * Link two spans across async boundaries (e.g., client → server).
 *
 * @param {string} traceId
 * @param {string} parentSpanId
 * @param {string} childSpanId
 * @returns {boolean}
 */
export function linkSpans(traceId, parentSpanId, childSpanId) {
  const spans = TRACES.get(traceId);
  if (!spans) return false;

  const parent = spans.find(s => s.spanId === parentSpanId);
  const child = spans.find(s => s.spanId === childSpanId);
  if (!parent || !child) return false;

  child.parentSpanId = parentSpanId;
  return true;
}

/**
 * Get the root span of a trace.
 *
 * @param {string} traceId
 * @returns {TraceSpan|null}
 */
export function getRootSpan(traceId) {
  const spans = TRACES.get(traceId);
  if (!spans || spans.length === 0) return null;
  return spans.find(s => s.parentSpanId === null) || spans[0];
}

/**
 * Get all spans of a specific operation type within a trace.
 *
 * @param {string} traceId
 * @param {string} operation
 * @returns {TraceSpan[]}
 */
export function getSpansByOperation(traceId, operation) {
  const spans = TRACES.get(traceId);
  if (!spans) return [];
  return spans.filter(s => s.operation === operation);
}

/**
 * Check if a trace has any error spans.
 *
 * @param {string} traceId
 * @returns {boolean}
 */
export function hasErrors(traceId) {
  const spans = TRACES.get(traceId);
  if (!spans) return false;
  return spans.some(s => s.status === "error");
}

/**
 * Get the critical path (longest chain of dependent spans).
 *
 * @param {string} traceId
 * @returns {TraceSpan[]}
 */
export function getCriticalPath(traceId) {
  const spans = TRACES.get(traceId);
  if (!spans || spans.length === 0) return [];

  // Build adjacency list
  const byId = new Map(spans.map(s => [s.spanId, s]));
  const children = new Map();
  for (const span of spans) {
    if (span.parentSpanId) {
      if (!children.has(span.parentSpanId)) children.set(span.parentSpanId, []);
      children.get(span.parentSpanId).push(span.spanId);
    }
  }

  // Find root
  const root = spans.find(s => s.parentSpanId === null);
  if (!root) return [];

  // DFS to find longest path
  let longest = [];

  function dfs(spanId, path) {
    const span = byId.get(spanId);
    if (!span) return;
    const newPath = [...path, span];
    const kids = children.get(spanId) || [];
    if (kids.length === 0) {
      if (newPath.length > longest.length) longest = newPath;
    } else {
      for (const kid of kids) dfs(kid, newPath);
    }
  }

  dfs(root.spanId, []);
  return longest;
}

export default {
  VALID_OPERATIONS,
  startTrace,
  endTrace,
  getTrace,
  exportTrace,
  assertTraceComplete,
  getTraceStats,
  clearTrace,
  clearAllTraces,
  startChildSpan,
  linkSpans,
  getRootSpan,
  getSpansByOperation,
  hasErrors,
  getCriticalPath,
};