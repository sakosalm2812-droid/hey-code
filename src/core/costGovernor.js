/**
 * HEY — Cost Governor (Production) (Part 15, Phase C, Module 7.4)
 *
 * Extends Part 3's costGovernor.js with:
 * - Daily/monthly windows
 * - Kill switch per tenant
 * - Production enforcement
 * Integer cents only. Reservation required before spend.
 *
 * @module core/costGovernor
 */

// --- Part 3 Core (inlined) ---
const ENVELOPE_MARK = Symbol('hey.costEnvelope');
const CLOSED = new Set(['committed', 'released']);

function isInteger(value) {
  return typeof value === 'number' && Number.isInteger(value);
}

function isEnvelope(envelope) {
  return Boolean(envelope && envelope[ENVELOPE_MARK] === true);
}

function assertEnvelope(envelope, fn) {
  if (!isEnvelope(envelope)) {
    throw new TypeError(`${fn}: first argument must be an envelope from createEnvelope()`);
  }
}

function refuse(envelope, code, detail) {
  const record = {
    seq: ++envelope.state.seq,
    kind: 'refusal',
    code,
    ...detail,
  };
  envelope.state.refusals.push(record);
  return { ok: false, reason: code, detail };
}

/**
 * Part 3: Create a simple envelope with limit and optional window.
 * @param {{ limitCents: number, windowsMs?: number }} options
 * @returns {object} envelope
 */
function createBaseEnvelope({ limitCents, windowsMs = 0 } = {}) {
  if (!isInteger(limitCents) || limitCents < 0) {
    throw new TypeError('createEnvelope: limitCents must be a non-negative integer number of cents');
  }
  if (!isInteger(windowsMs) || windowsMs < 0) {
    throw new TypeError('createEnvelope: windowsMs must be a non-negative integer');
  }

  const state = {
    seq: 0,
    committedCents: 0,
    reservedCents: 0,
    reservations: new Map(),
    refusals: [],
    commits: [],
  };

  const envelope = { state };
  Object.defineProperty(envelope, ENVELOPE_MARK, { value: true, enumerable: false });
  Object.defineProperty(envelope, 'limitCents', { value: limitCents, enumerable: true, writable: false });
  Object.defineProperty(envelope, 'windowsMs', { value: windowsMs, enumerable: true, writable: false });
  return envelope;
}

/** Budget neither reserved nor spent. @returns {number} */
function baseRemaining(envelope) {
  assertEnvelope(envelope, 'remaining');
  const { limitCents } = envelope;
  const { committedCents, reservedCents } = envelope.state;
  return limitCents - committedCents - reservedCents;
}

/**
 * Part 3: Hold `cents` against the envelope.
 * @returns {{ ok: true, reservationId: string, remainingCents: number } | { ok: false, reason: string }}
 */
function baseReserve(envelope, cents, ref = '') {
  assertEnvelope(envelope, 'reserve');
  const reference = typeof ref === 'string' ? ref.slice(0, 120) : '';

  if (!isInteger(cents) || cents <= 0) {
    return refuse(envelope, 'invalid-amount', { cents, ref: reference });
  }

  const left = baseRemaining(envelope);
  if (cents > left) {
    return refuse(envelope, 'insufficient-budget', { cents, ref: reference, remainingCents: left });
  }

  const seq = ++envelope.state.seq;
  const reservationId = `res-${seq}`;
  envelope.state.reservations.set(reservationId, {
    id: reservationId,
    cents,
    ref: reference,
    status: 'reserved',
    seq,
  });
  envelope.state.reservedCents += cents;

  return { ok: true, reservationId, remainingCents: baseRemaining(envelope) };
}

/**
 * Part 3: Convert a reservation into actual spend.
 */
function baseCommit(envelope, reservationId, actualCents) {
  assertEnvelope(envelope, 'commit');
  const reservation = envelope.state.reservations.get(reservationId);
  if (!reservation) {
    return refuse(envelope, 'unknown-reservation', { reservationId, actualCents });
  }
  if (CLOSED.has(reservation.status)) {
    return refuse(envelope, 'reservation-closed', { reservationId, status: reservation.status, actualCents });
  }
  if (!isInteger(actualCents) || actualCents < 0) {
    return refuse(envelope, 'invalid-amount', { reservationId, actualCents });
  }
  if (actualCents > reservation.cents) {
    return refuse(envelope, 'exceeds-reservation', {
      reservationId,
      reservedCents: reservation.cents,
      actualCents,
    });
  }

  reservation.status = 'committed';
  reservation.actualCents = actualCents;
  envelope.state.reservedCents -= reservation.cents;
  envelope.state.committedCents += actualCents;
  envelope.state.commits.push({
    reservationId,
    ref: reservation.ref,
    reservedCents: reservation.cents,
    actualCents,
    releasedCents: reservation.cents - actualCents,
  });

  return {
    ok: true,
    committedCents: actualCents,
    releasedCents: reservation.cents - actualCents,
    remainingCents: baseRemaining(envelope),
  };
}

/** Part 3: Return a hold that was never spent. */
function baseRelease(envelope, reservationId) {
  assertEnvelope(envelope, 'release');
  const reservation = envelope.state.reservations.get(reservationId);
  if (!reservation) {
    return refuse(envelope, 'unknown-reservation', { reservationId });
  }
  if (CLOSED.has(reservation.status)) {
    return refuse(envelope, 'reservation-closed', { reservationId, status: reservation.status });
  }

  reservation.status = 'released';
  envelope.state.reservedCents -= reservation.cents;

  return { ok: true, releasedCents: reservation.cents, remainingCents: baseRemaining(envelope) };
}

/** Part 3: Immutable view of the ledger. */
function baseSnapshot(envelope) {
  assertEnvelope(envelope, 'snapshot');
  const { limitCents, windowsMs } = envelope;
  const { committedCents, reservedCents, reservations, refusals, commits } = envelope.state;
  return {
    limitCents,
    windowsMs,
    committedCents,
    reservedCents,
    remainingCents: limitCents - committedCents - reservedCents,
    reservationCount: reservations.size,
    reservations: Array.from(reservations.values()).map((entry) => ({ ...entry })),
    refusals: refusals.map((entry) => ({ ...entry })),
    refusalCount: refusals.length,
    commits: commits.map((entry) => ({ ...entry })),
  };
}

// --- Part 15 Extensions ---

const ENVELOPES = new Map();
const TENANT_KILL_SWITCH = new Set();

/**
 * @typedef {Object} Envelope
 * @property {string} userId
 * @property {string} tenantId
 * @property {number} dailyLimitCents
 * @property {number} monthlyLimitCents
 * @property {number} reservedCents
 * @property {Object} daily - Part 3 envelope for daily window
 * @property {Object} monthly - Part 3 envelope for monthly window
 * @property {Object} reservations - Active reservations
 */

/**
 * Create a cost envelope with daily and monthly limits.
 * @param {Object} input
 * @param {string} input.userId
 * @param {string} input.tenantId
 * @param {number} input.dailyLimitCents - Daily limit in cents (>= 0)
 * @param {number} input.monthlyLimitCents - Monthly limit in cents (>= 0)
 * @param {number} [input.reservedCents=0] - Pre-reserved amount
 * @returns {Envelope} Frozen envelope
 * @throws {TypeError} If invalid input
 */
export function createEnvelope({ userId, tenantId, dailyLimitCents, monthlyLimitCents, reservedCents = 0 }) {
  if (!userId || typeof userId !== "string" || !userId.trim()) {
    throw new TypeError("userId is required");
  }
  if (!tenantId || typeof tenantId !== "string" || !tenantId.trim()) {
    throw new TypeError("tenantId is required");
  }
  if (!Number.isInteger(dailyLimitCents) || dailyLimitCents < 0) {
    throw new TypeError("dailyLimitCents must be a non-negative integer");
  }
  if (!Number.isInteger(monthlyLimitCents) || monthlyLimitCents < 0) {
    throw new TypeError("monthlyLimitCents must be a non-negative integer");
  }
  if (!Number.isInteger(reservedCents) || reservedCents < 0) {
    throw new TypeError("reservedCents must be a non-negative integer");
  }

  const daily = createBaseEnvelope({ limitCents: dailyLimitCents, windowsMs: 24 * 60 * 60 * 1000 });
  const monthly = createBaseEnvelope({ limitCents: monthlyLimitCents, windowsMs: 30 * 24 * 60 * 60 * 1000 });

  const envelope = Object.freeze({
    userId: userId.trim(),
    tenantId: tenantId.trim(),
    dailyLimitCents,
    monthlyLimitCents,
    reservedCents,
    daily,
    monthly,
    reservations: new Map(),
  });

  ENVELOPES.set(`${tenantId}:${userId}`, envelope);
  return envelope;
}

/**
 * Reserve cents against both daily and monthly envelopes.
 * @param {Envelope} envelope
 * @param {number} cents - Amount to reserve (positive integer)
 * @param {Object} metadata
 * @param {string} metadata.capabilityId
 * @param {string} metadata.traceId
 * @returns {{ ok: true, reservationId: string, remainingDaily: number, remainingMonthly: number } | { ok: false, reason: string }}
 */
export function reserve(envelope, cents, { capabilityId, traceId }) {
  if (!envelope || typeof envelope !== "object") {
    return { ok: false, reason: "Invalid envelope" };
  }
  if (!Number.isInteger(cents) || cents <= 0) {
    return { ok: false, reason: "Invalid amount: must be positive integer cents" };
  }
  if (!capabilityId || typeof capabilityId !== "string" || !capabilityId.trim()) {
    return { ok: false, reason: "capabilityId required" };
  }
  if (!traceId || typeof traceId !== "string" || !traceId.trim()) {
    return { ok: false, reason: "traceId required" };
  }

  // Check kill switch
  if (TENANT_KILL_SWITCH.has(envelope.tenantId)) {
    return { ok: false, reason: `Kill switch active for tenant ${envelope.tenantId}` };
  }

  // Reserve from daily
  const dailyResult = baseReserve(envelope.daily, cents, `cap:${capabilityId}:${traceId}`);
  if (!dailyResult.ok) {
    return { ok: false, reason: `Daily limit: ${dailyResult.reason}` };
  }

  // Reserve from monthly
  const monthlyResult = baseReserve(envelope.monthly, cents, `cap:${capabilityId}:${traceId}`);
  if (!monthlyResult.ok) {
    // Release daily reservation
    baseRelease(envelope.daily, dailyResult.reservationId);
    return { ok: false, reason: `Monthly limit: ${monthlyResult.reason}` };
  }

  const reservationId = `res-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  envelope.reservations.set(reservationId, {
    id: reservationId,
    cents,
    capabilityId,
    traceId,
    dailyReservationId: dailyResult.reservationId,
    monthlyReservationId: monthlyResult.reservationId,
    status: "reserved",
    at: new Date().toISOString(),
  });

  return {
    ok: true,
    reservationId,
    remainingDaily: dailyResult.remainingCents,
    remainingMonthly: monthlyResult.remainingCents,
  };
}

/**
 * Commit a reservation to actual spend.
 * @param {Envelope} envelope
 * @param {string} reservationId
 * @param {number} actualCents - Actual amount spent (<= reserved)
 * @param {Object} metadata
 * @param {string} metadata.traceId
 * @returns {{ ok: true, spentDaily: number, spentMonthly: number, remainingDaily: number, remainingMonthly: number } | { ok: false, reason: string }}
 */
export function commit(envelope, reservationId, actualCents, { traceId }) {
  if (!envelope || typeof envelope !== "object") {
    return { ok: false, reason: "Invalid envelope" };
  }
  const reservation = envelope.reservations.get(reservationId);
  if (!reservation) {
    return { ok: false, reason: "Unknown reservation" };
  }
  if (reservation.status !== "reserved") {
    return { ok: false, reason: `Reservation ${reservation.status}` };
  }
  if (!Number.isInteger(actualCents) || actualCents < 0) {
    return { ok: false, reason: "Invalid amount" };
  }
  if (actualCents > reservation.cents) {
    return { ok: false, reason: "Actual exceeds reservation" };
  }
  if (traceId !== reservation.traceId) {
    return { ok: false, reason: "Trace ID mismatch" };
  }

  // Commit daily
  const dailyResult = baseCommit(envelope.daily, reservation.dailyReservationId, actualCents);
  if (!dailyResult.ok) {
    return { ok: false, reason: `Daily commit failed: ${dailyResult.reason}` };
  }

  // Commit monthly
  const monthlyResult = baseCommit(envelope.monthly, reservation.monthlyReservationId, actualCents);
  if (!monthlyResult.ok) {
    return { ok: false, reason: `Monthly commit failed: ${monthlyResult.reason}` };
  }

  reservation.status = "committed";
  reservation.actualCents = actualCents;
  reservation.committedAt = new Date().toISOString();

  return {
    ok: true,
    spentDaily: actualCents,
    spentMonthly: actualCents,
    remainingDaily: dailyResult.remainingCents,
    remainingMonthly: monthlyResult.remainingCents,
  };
}

/**
 * Release a reservation (if spend didn't happen).
 * @param {Envelope} envelope
 * @param {string} reservationId
 * @returns {{ ok: true, releasedDaily: number, releasedMonthly: number, remainingDaily: number, remainingMonthly: number } | { ok: false, reason: string }}
 */
export function release(envelope, reservationId) {
  if (!envelope || typeof envelope !== "object") {
    return { ok: false, reason: "Invalid envelope" };
  }
  const reservation = envelope.reservations.get(reservationId);
  if (!reservation) {
    return { ok: false, reason: "Unknown reservation" };
  }
  if (reservation.status !== "reserved") {
    return { ok: false, reason: `Reservation ${reservation.status}` };
  }

  const dailyResult = baseRelease(envelope.daily, reservation.dailyReservationId);
  const monthlyResult = baseRelease(envelope.monthly, reservation.monthlyReservationId);

  reservation.status = "released";
  reservation.releasedAt = new Date().toISOString();

  return {
    ok: true,
    releasedDaily: dailyResult.releasedCents,
    releasedMonthly: monthlyResult.releasedCents,
    remainingDaily: dailyResult.remainingCents,
    remainingMonthly: monthlyResult.remainingCents,
  };
}

/**
 * Emergency kill switch - stops all spending for a tenant.
 * @param {string} tenantId
 * @returns {{ ok: true, reason: string } | { ok: false, reason: string }}
 */
export function killSwitch(tenantId) {
  if (!tenantId || typeof tenantId !== "string" || !tenantId.trim()) {
    return { ok: false, reason: "tenantId required" };
  }
  TENANT_KILL_SWITCH.add(tenantId.trim());
  return { ok: true, reason: `Kill switch activated for tenant ${tenantId}` };
}

/**
 * Check if kill switch is active for a tenant.
 * @param {string} tenantId
 * @returns {boolean}
 */
export function isKillSwitchActive(tenantId) {
  return TENANT_KILL_SWITCH.has(tenantId);
}

/**
 * Get envelope for a user.
 * @param {string} userId
 * @param {string} tenantId
 * @returns {Envelope|undefined}
 */
export function getEnvelope(userId, tenantId) {
  return ENVELOPES.get(`${tenantId}:${userId}`);
}

/**
 * Get all envelopes for a tenant.
 * @param {string} tenantId
 * @returns {Envelope[]}
 */
export function getEnvelopesForTenant(tenantId) {
  const results = [];
  for (const [key, envelope] of ENVELOPES) {
    if (key.startsWith(`${tenantId}:`)) {
      results.push(envelope);
    }
  }
  return Object.freeze(results);
}

/**
 * Get all envelopes across all tenants.
 * @returns {Envelope[]}
 */
export function getAllEnvelopes() {
  const results = [];
  for (const envelope of ENVELOPES.values()) {
    results.push(envelope);
  }
  return Object.freeze(results);
}

/**
 * Get snapshot of an envelope's state.
 * @param {Envelope} envelope
 * @returns {Object}
 */
export function getSnapshot(envelope) {
  return {
    userId: envelope.userId,
    tenantId: envelope.tenantId,
    dailyLimitCents: envelope.dailyLimitCents,
    monthlyLimitCents: envelope.monthlyLimitCents,
    reservedCents: envelope.reservedCents,
    daily: baseSnapshot(envelope.daily),
    monthly: baseSnapshot(envelope.monthly),
    activeReservations: envelope.reservations.size,
    killSwitchActive: TENANT_KILL_SWITCH.has(envelope.tenantId),
  };
}

/**
 * Clear all state (test helper).
 */
export function _clear() {
  ENVELOPES.clear();
  TENANT_KILL_SWITCH.clear();
}

export default {
  createEnvelope,
  reserve,
  commit,
  release,
  killSwitch,
  isKillSwitchActive,
  getEnvelope,
  getEnvelopesForTenant,
  getSnapshot,
  _clear,
};