/**
 * HEY Agent Health.
 *
 * A pure, in-memory health model for agent records. It answers one question with a
 * reason attached: *may this agent be selected right now, and if not, why not?*
 *
 * The live `src/lib/agents/health.ts` derives health per request from environment
 * variables and returns a label that `router.ts` puts in `primaryHealth` and then
 * ignores — a `blocked` agent is still selected as the primary. This module is the
 * other half: a state machine the selector can trust, with no environment reads.
 *
 * Rules encoded here, not assumed:
 *   - counts move on their own; states only move on evidence or on an owner action;
 *   - a failure resets nothing, a success resets the consecutive-failure counter;
 *   - `blocked` and `disabled` are terminal for automated transitions — a success
 *     while blocked does not unblock, and no threshold can lift them. Lifting
 *     `blocked` requires `clearBlocked(record, { by })`, i.e. a named owner;
 *   - reasons are mandatory everywhere a state changes;
 *   - records are immutable: every function returns a new record;
 *   - there are no wall-clock reads and no timestamps, so tests cannot go flaky.
 *
 * @module core/agentHealth
 */

/** The five states this model owns. */
export const HEALTH_STATES = Object.freeze(['healthy', 'degraded', 'unavailable', 'blocked', 'disabled']);

/** States that must never be selected. `degraded` is selectable on purpose. */
export const NON_SELECTABLE_STATES = Object.freeze(['unavailable', 'blocked', 'disabled']);

/** `AgentHealth` in `src/lib/agents/types.ts` also declares `unhealthy`; map it. */
const LEGACY_STATE_ALIASES = Object.freeze({ unhealthy: 'unavailable' });

export const DEFAULT_THRESHOLDS = Object.freeze({ degradedAfter: 3, unavailableAfter: 5 });

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

function assertRecord(record) {
  if (!isPlainObject(record) || typeof record.agentId !== 'string' || record.agentId === '') {
    throw new TypeError('health record must be an object with a non-empty agentId');
  }
  if (typeof record.state !== 'string') {
    throw new TypeError(`health record ${record.agentId} has no state`);
  }
}

function assertReason(reason, what) {
  if (typeof reason !== 'string' || reason.trim() === '') {
    throw new TypeError(`${what} requires a non-empty reason`);
  }
}

function withHistory(record, state, reason) {
  const entry = { state, reason };
  return Array.isArray(record.history) ? [...record.history, entry] : [entry];
}

/**
 * Canonical state name, or `null` when the value is not a health state at all.
 * @param {string} state
 * @returns {string|null}
 */
export function canonicalState(state) {
  if (HEALTH_STATES.includes(state)) return state;
  if (Object.prototype.hasOwnProperty.call(LEGACY_STATE_ALIASES, state)) return LEGACY_STATE_ALIASES[state];
  return null;
}

/**
 * A new record: healthy, zero counters, no reasons, no latency samples.
 * @param {string} agentId
 * @param {object} [initial] optional overrides (state must be a valid state)
 */
export function createHealthRecord(agentId, initial = {}) {
  if (typeof agentId !== 'string' || agentId.trim() === '') {
    throw new TypeError('createHealthRecord requires a non-empty agentId');
  }
  const state = initial.state === undefined ? 'healthy' : canonicalState(initial.state);
  if (!state) throw new TypeError(`unknown health state: ${initial.state}`);
  if (state !== 'healthy') assertReason(initial.reason, `creating a record in state "${state}"`);
  return {
    agentId,
    state,
    consecutiveFailures: 0,
    totalSuccesses: 0,
    totalFailures: 0,
    lastFailureReason: null,
    blockedReason: state === 'blocked' ? initial.reason : null,
    disabledReason: state === 'disabled' ? initial.reason : null,
    latency: { samples: 0, totalMs: 0, averageMs: 0 },
    history: state === 'healthy' ? [] : [{ state, reason: initial.reason }],
  };
}

/**
 * Record a success. Resets the consecutive-failure counter and the degraded state,
 * but never lifts `blocked` or `disabled`.
 *
 * @param {object} record
 * @param {number|null} [latencyMs] optional measured latency; must be finite and >= 0
 * @returns {object} a new record
 */
export function recordSuccess(record, latencyMs = null) {
  assertRecord(record);
  if (latencyMs !== null && latencyMs !== undefined) {
    if (typeof latencyMs !== 'number' || !Number.isFinite(latencyMs) || latencyMs < 0) {
      throw new TypeError('latencyMs must be a finite number >= 0');
    }
  }
  const state = canonicalState(record.state);
  const terminal = state === 'blocked' || state === 'disabled';
  const nextState = terminal ? state : 'healthy';
  let latency = record.latency ?? { samples: 0, totalMs: 0, averageMs: 0 };
  if (typeof latencyMs === 'number') {
    const samples = latency.samples + 1;
    const totalMs = latency.totalMs + latencyMs;
    latency = { samples, totalMs, averageMs: Math.round((totalMs / samples) * 1000) / 1000 };
  }
  return {
    ...record,
    state: nextState,
    consecutiveFailures: 0,
    totalSuccesses: record.totalSuccesses + 1,
    latency,
    history: terminal ? record.history ?? [] : withHistory(record, nextState, 'success'),
  };
}

/**
 * Record a failure and apply the thresholds.
 *
 * @param {object} record
 * @param {string} reason what failed — mandatory
 * @param {object} [options]
 * @param {number} [options.degradedAfter=3] consecutive failures that make an agent degraded
 * @param {number} [options.unavailableAfter=5] consecutive failures that make it unavailable
 * @returns {object} a new record
 */
export function recordFailure(record, reason, options = {}) {
  assertRecord(record);
  assertReason(reason, 'recordFailure');
  const degradedAfter = options.degradedAfter ?? DEFAULT_THRESHOLDS.degradedAfter;
  const unavailableAfter = options.unavailableAfter ?? DEFAULT_THRESHOLDS.unavailableAfter;
  if (!Number.isInteger(degradedAfter) || degradedAfter < 1) {
    throw new TypeError('degradedAfter must be an integer >= 1');
  }
  if (!Number.isInteger(unavailableAfter) || unavailableAfter <= degradedAfter) {
    throw new TypeError('unavailableAfter must be an integer greater than degradedAfter');
  }

  const current = canonicalState(record.state);
  const consecutiveFailures = record.consecutiveFailures + 1;
  const terminal = current === 'blocked' || current === 'disabled';
  let state = current;
  if (!terminal) {
    state = consecutiveFailures >= unavailableAfter
      ? 'unavailable'
      : consecutiveFailures >= degradedAfter
        ? 'degraded'
        : 'healthy';
  }
  return {
    ...record,
    state,
    consecutiveFailures,
    totalFailures: record.totalFailures + 1,
    lastFailureReason: reason,
    history: withHistory(record, state, reason),
  };
}

/** Block an agent. Reason mandatory; terminal until `clearBlocked`. */
export function setBlocked(record, reason) {
  assertRecord(record);
  assertReason(reason, 'setBlocked');
  return {
    ...record,
    state: 'blocked',
    blockedReason: reason,
    lastFailureReason: reason,
    history: withHistory(record, 'blocked', reason),
  };
}

/** Disable an agent. Reason mandatory; terminal until a new record is created. */
export function setDisabled(record, reason) {
  assertRecord(record);
  assertReason(reason, 'setDisabled');
  return {
    ...record,
    state: 'disabled',
    disabledReason: reason,
    history: withHistory(record, 'disabled', reason),
  };
}

/**
 * Lift a block. This is an owner action: `by` is required and recorded in history,
 * because "a blocked record never becomes selectable without an explicit owner
 * action" is a rule about accountability, not about flags.
 *
 * A record that is not blocked is returned unchanged (idempotent, no history noise).
 *
 * @param {object} record
 * @param {{ reason: string, by: string }} action
 */
export function clearBlocked(record, action = {}) {
  assertRecord(record);
  if (canonicalState(record.state) !== 'blocked') return { ...record, history: record.history ?? [] };
  assertReason(action.by, 'clearBlocked (the owner performing the action)');
  assertReason(action.reason, 'clearBlocked');
  return {
    ...record,
    state: 'healthy',
    blockedReason: null,
    consecutiveFailures: 0,
    history: withHistory(record, 'healthy', `unblocked by ${action.by}: ${action.reason}`),
  };
}

/**
 * May this agent be selected? `degraded` is selectable (it is a warning, not a
 * refusal); `unavailable`, `blocked` and `disabled` are not. A record with neither
 * `state` (health record) nor `health` (agent contract field) is treated as
 * selectable — absence of a health record is not evidence of ill health. An
 * unrecognised state is not selectable (fail closed).
 *
 * @param {object|null|undefined} record
 * @returns {boolean}
 */
export function isSelectable(record) {
  if (!isPlainObject(record)) return false;
  const declared = record.state ?? record.health;
  if (declared === undefined) return true;
  const state = canonicalState(declared);
  if (!state) return false;
  return !NON_SELECTABLE_STATES.includes(state);
}

/**
 * Counts, worst offenders and average latency.
 *
 * @param {object[]} records
 * @param {{ limit?: number }} [options]
 * @returns {{ total, byState, selectable, notSelectable, blocked, disabled, worstOffenders, averageLatencyMs, withFailures }}
 */
export function summarizeHealth(records, options = {}) {
  const list = Array.isArray(records) ? records.filter((record) => isPlainObject(record) && typeof record.agentId === 'string') : [];
  const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : 3;

  const byState = Object.fromEntries(HEALTH_STATES.map((state) => [state, 0]));
  let selectable = 0;
  let totalSamples = 0;
  let totalLatency = 0;
  let withFailures = 0;

  for (const record of list) {
    const state = canonicalState(record.state) ?? 'unknown';
    if (byState[state] === undefined) byState[state] = 0;
    byState[state] += 1;
    if (isSelectable(record)) selectable += 1;
    if ((record.totalFailures ?? 0) > 0) withFailures += 1;
    if (record.latency && Number.isFinite(record.latency.totalMs) && Number.isFinite(record.latency.samples)) {
      totalSamples += record.latency.samples;
      totalLatency += record.latency.totalMs;
    }
  }
  byState.unknown = byState.unknown ?? 0;
  if (byState.unknown === 0) delete byState.unknown;

  const worstOffenders = [...list]
    .filter((record) => (record.consecutiveFailures ?? 0) > 0)
    .sort((a, b) => {
      const cf = (b.consecutiveFailures ?? 0) - (a.consecutiveFailures ?? 0);
      if (cf !== 0) return cf;
      const tf = (b.totalFailures ?? 0) - (a.totalFailures ?? 0);
      if (tf !== 0) return tf;
      return a.agentId < b.agentId ? -1 : a.agentId > b.agentId ? 1 : 0;
    })
    .slice(0, limit)
    .map((record) => ({
      agentId: record.agentId,
      state: canonicalState(record.state) ?? 'unknown',
      consecutiveFailures: record.consecutiveFailures ?? 0,
      totalFailures: record.totalFailures ?? 0,
      lastFailureReason: record.lastFailureReason ?? null,
    }));

  return {
    total: list.length,
    byState,
    selectable,
    notSelectable: list.length - selectable,
    blocked: list.filter((record) => canonicalState(record.state) === 'blocked').map((record) => record.agentId).sort(),
    disabled: list.filter((record) => canonicalState(record.state) === 'disabled').map((record) => record.agentId).sort(),
    worstOffenders,
    averageLatencyMs: totalSamples === 0 ? 0 : Math.round((totalLatency / totalSamples) * 1000) / 1000,
    withFailures,
  };
}
