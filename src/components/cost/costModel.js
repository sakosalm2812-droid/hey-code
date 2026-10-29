/**
 * Cost Model — Pure View Model Builder
 * Reads governor state + local action log → view model for CostRibbon/CostDetailPanel.
 * No I/O, no side effects.
 *
 * @module components/cost/costModel
 */

const ACTION_LOG_KEY = "hey_cost_action_log";
const MAX_LOG_ENTRIES = 500;

/**
 * Envelope state thresholds (matching costGovernor.js).
 * @readonly
 */
export const ENVELOPE_THRESHOLDS = Object.freeze({
  NOMINAL_MAX_PCT: 70,      // < 70% = nominal
  APPROACHING_MAX_PCT: 95,  // 70-95% = approaching
  AT_ENVELOPE_PCT: 95,      // >= 95% = at envelope (warning)
  OVER_PCT: 100,            // >= 100% = over (blocked)
});

/**
 * Envelope state variants.
 * @type {'nominal'|'approaching'|'at-envelope'|'over'}
 */

/**
 * Gets the envelope state from used/limit cents.
 * @param {number} usedCents
 * @param {number} limitCents
 * @returns {'nominal'|'approaching'|'at-envelope'|'over'}
 */
export function getEnvelopeState(usedCents, limitCents) {
  if (limitCents <= 0) return "nominal";

  const pct = (usedCents / limitCents) * 100;

  if (pct >= ENVELOPE_THRESHOLDS.OVER_PCT) return "over";
  if (pct >= ENVELOPE_THRESHOLDS.AT_ENVELOPE_PCT) return "at-envelope";
  if (pct >= ENVELOPE_THRESHOLDS.NOMINAL_MAX_PCT) return "approaching";
  return "nominal";
}

/**
 * Gets the daily envelope state from costGovernor snapshot.
 * @param {Object} snapshot - Result of costGovernor.getSnapshot(envelope)
 * @returns {'nominal'|'approaching'|'at-envelope'|'over'}
 */
export function getDailyEnvelopeState(snapshot) {
  if (!snapshot || !snapshot.daily) return "nominal";
  const used = snapshot.daily.committedCents + snapshot.daily.reservedCents;
  return getEnvelopeState(used, snapshot.dailyLimitCents);
}

/**
 * Gets the monthly envelope state from costGovernor snapshot.
 * @param {Object} snapshot - Result of costGovernor.getSnapshot(envelope)
 * @returns {'nominal'|'approaching'|'at-envelope'|'over'}
 */
export function getMonthlyEnvelopeState(snapshot) {
  if (!snapshot || !snapshot.monthly) return "nominal";
  const used = snapshot.monthly.committedCents + snapshot.monthly.reservedCents;
  return getEnvelopeState(used, snapshot.monthlyLimitCents);
}

/**
 * Formats cents as a currency string using Intl.NumberFormat.
 * @param {number} cents
 * @param {string} [locale] - Locale for formatting
 * @returns {string}
 */
export function formatCents(cents, locale) {
  const dollars = cents / 100;
  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(dollars);
  } catch {
    // Fallback
    return `$${dollars.toFixed(cents % 100 === 0 ? 0 : 2)}`;
  }
}

/**
 * Formats a cost value that may be unknown.
 * @param {number} cents - Cost in cents, or -1 for unknown
 * @param {string} [locale]
 * @returns {string}
 */
export function formatCost(cents, locale) {
  if (cents === -1 || cents === undefined || cents === null) {
    return "—";
  }
  return formatCents(cents, locale);
}

/**
 * Gets the label for a cost value (handles unknown).
 * @param {number} cents
 * @returns {string}
 */
export function getCostLabel(cents) {
  if (cents === -1 || cents === undefined || cents === null) {
    return "price unknown";
  }
  return "cost";
}

/**
 * Builds the ribbon view model from governor state and action log.
 * @param {Object} params
 * @param {Object} params.envelope - Cost governor envelope
 * @param {Object} params.snapshot - Cost governor snapshot
 * @param {Object[]} params.actionLog - Local action log entries
 * @param {string} [params.locale] - Locale for formatting
 * @returns {Object} Ribbon view model
 */
export function buildRibbonViewModel({ envelope, snapshot, actionLog, locale }) {
  const dailyUsed = snapshot?.daily?.committedCents ?? 0;
  const dailyReserved = snapshot?.daily?.reservedCents ?? 0;
  const dailyTotal = dailyUsed + dailyReserved;
  const dailyLimit = envelope?.dailyLimitCents ?? 0;

  const monthlyUsed = snapshot?.monthly?.committedCents ?? 0;
  const monthlyReserved = snapshot?.monthly?.reservedCents ?? 0;
  const monthlyTotal = monthlyUsed + monthlyReserved;
  const monthlyLimit = envelope?.monthlyLimitCents ?? 0;

  const dailyState = getDailyEnvelopeState(snapshot);
  const monthlyState = getMonthlyEnvelopeState(snapshot);
  const overallState = dailyState === "over" || monthlyState === "over" ? "over"
    : dailyState === "at-envelope" || monthlyState === "at-envelope" ? "at-envelope"
    : dailyState === "approaching" || monthlyState === "approaching" ? "approaching"
    : "nominal";

  const recentActions = (actionLog || []).slice(0, 5);
  const recentCost = recentActions.reduce((sum, a) => sum + (a.actualCents || 0), 0);
  const recentCount = recentActions.length;

  return {
    // Overall
    state: overallState,
    isPaused: envelope?.killSwitchActive ?? false,

    // Daily
    daily: {
      usedCents: dailyUsed,
      reservedCents: dailyReserved,
      totalCents: dailyTotal,
      limitCents: dailyLimit,
      remainingCents: Math.max(0, dailyLimit - dailyTotal),
      state: dailyState,
      formattedUsed: formatCents(dailyUsed, locale),
      formattedLimit: formatCents(dailyLimit, locale),
      formattedRemaining: formatCents(Math.max(0, dailyLimit - dailyTotal), locale),
    },

    // Monthly
    monthly: {
      usedCents: monthlyUsed,
      reservedCents: monthlyReserved,
      totalCents: monthlyTotal,
      limitCents: monthlyLimit,
      remainingCents: Math.max(0, monthlyLimit - monthlyTotal),
      state: monthlyState,
      formattedUsed: formatCents(monthlyUsed, locale),
      formattedLimit: formatCents(monthlyLimit, locale),
      formattedRemaining: formatCents(Math.max(0, monthlyLimit - monthlyTotal), locale),
    },

    // Session (recent)
    session: {
      costCents: recentCost,
      count: recentCount,
      formattedCost: formatCents(recentCost, locale),
    },

    // Ribbon display
    ribbon: {
      text: `${formatCents(recentCost, locale)} · ${recentCount} call${recentCount !== 1 ? "s" : ""}`,
      expandedText: `Today: ${formatCents(dailyUsed, locale)} / ${formatCents(dailyLimit, locale)} (${formatCents(Math.max(0, dailyLimit - dailyUsed), locale)} left)`,
    },

    // Actions
    canPause: !envelope?.killSwitchActive,
    canResume: envelope?.killSwitchActive,
    canReset: true,
  };
}

/**
 * Builds the detail panel view model.
 * @param {Object} params
 * @param {Object} params.envelope - Cost governor envelope
 * @param {Object} params.snapshot - Cost governor snapshot
 * @param {Object[]} params.actionLog - Local action log entries
 * @param {string} [params.locale] - Locale for formatting
 * @returns {Object} Detail panel view model
 */
export function buildDetailViewModel({ envelope, snapshot, actionLog, locale }) {
  const ribbonVM = buildRibbonViewModel({ envelope, snapshot, actionLog, locale });

  // Enhance action log entries with display data
  const enhancedActions = (actionLog || []).map((entry) => ({
    ...entry,
    formattedCost: entry.actualCents === -1 ? "—" : formatCents(entry.actualCents || 0, locale),
    costLabel: getCostLabel(entry.actualCents),
    isEstimated: entry.estimated === true,
    formattedTime: entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString(locale || undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) : "—",
  }));

  // Helper to get valid cost (excludes -1 for unknown)
  const getValidCost = (cents) => (typeof cents === "number" && cents > 0 ? cents : 0);

  // Group by model
  const byModel = {};
  for (const action of enhancedActions) {
    const model = action.model || "unknown";
    if (!byModel[model]) byModel[model] = { count: 0, totalCents: 0, actions: [] };
    byModel[model].count++;
    byModel[model].totalCents += getValidCost(action.actualCents);
    byModel[model].actions.push(action);
  }

  // Group by capability
  const byCapability = {};
  for (const action of enhancedActions) {
    const cap = action.capabilityId || "unknown";
    if (!byCapability[cap]) byCapability[cap] = { count: 0, totalCents: 0, actions: [] };
    byCapability[cap].count++;
    byCapability[cap].totalCents += getValidCost(action.actualCents);
    byCapability[cap].actions.push(action);
  }

  return {
    ...ribbonVM,
    actions: enhancedActions,
    byModel: Object.entries(byModel).map(([model, data]) => ({
      model,
      count: data.count,
      totalCents: data.totalCents,
      formattedTotal: formatCents(data.totalCents, locale),
      actions: data.actions,
    })),
    byCapability: Object.entries(byCapability).map(([capability, data]) => ({
      capability,
      count: data.count,
      totalCents: data.totalCents,
      formattedTotal: formatCents(data.totalCents, locale),
      actions: data.actions,
    })),
    traceLinks: enhancedActions
      .filter((a) => a.traceId)
      .map((a) => ({ traceId: a.traceId, capability: a.capabilityId, time: a.formattedTime })),
  };
}

/**
 * Loads the local action log from localStorage.
 * @returns {Object[]}
 */
export function loadActionLog() {
  try {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(ACTION_LOG_KEY) : null;
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

/**
 * Saves the local action log to localStorage.
 * @param {Object[]} log
 */
export function saveActionLog(log) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(ACTION_LOG_KEY, JSON.stringify(log.slice(0, MAX_LOG_ENTRIES)));
    }
  } catch {
    // Ignore quota errors
  }
}

/**
 * Appends an action to the local log.
 * @param {Object} entry - Action entry
 * @param {string} entry.capabilityId
 * @param {string} entry.model
 * @param {string} entry.provider
 * @param {number} entry.actualCents - Actual cost in cents, -1 for unknown
 * @param {number} [entry.estimatedCents] - Estimated cost
 * @param {string} [entry.traceId] - Trace ID for linking
 * @param {number} [entry.tokensIn] - Input tokens
 * @param {number} [entry.tokensOut] - Output tokens
 * @param {boolean} [entry.cached] - Whether this was a cached call
 * @returns {Object[]} Updated log
 */
export function appendActionLog(entry) {
  const log = loadActionLog();
  const newEntry = {
    id: `cost_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  const updated = [newEntry, ...log].slice(0, MAX_LOG_ENTRIES);
  saveActionLog(updated);
  return updated;
}

/**
 * Clears the local action log.
 * @returns {Object[]} Empty log
 */
export function clearActionLog() {
  saveActionLog([]);
  return [];
}

/**
 * Gets the total cost from the action log.
 * @returns {number} Total in cents
 */
export function getTotalCostFromLog() {
  const log = loadActionLog();
  return log.reduce((sum, entry) => sum + (entry.actualCents > 0 ? entry.actualCents : 0), 0);
}

/**
 * Gets action log stats.
 * @returns {Object}
 */
export function getActionLogStats() {
  const log = loadActionLog();
  const totalCents = log.reduce((sum, e) => sum + (e.actualCents > 0 ? e.actualCents : 0), 0);
  const knownCents = log.filter((e) => e.actualCents > 0).reduce((sum, e) => sum + e.actualCents, 0);
  const unknownCount = log.filter((e) => e.actualCents === -1).length;
  const cachedCount = log.filter((e) => e.cached).length;

  return {
    totalEntries: log.length,
    totalCents,
    knownCents,
    unknownCount,
    cachedCount,
    uniqueModels: new Set(log.map((e) => e.model).filter(Boolean)).size,
    uniqueCapabilities: new Set(log.map((e) => e.capabilityId).filter(Boolean)).size,
  };
}

export { MAX_LOG_ENTRIES };

export default {
  getEnvelopeState,
  getDailyEnvelopeState,
  getMonthlyEnvelopeState,
  formatCents,
  formatCost,
  getCostLabel,
  buildRibbonViewModel,
  buildDetailViewModel,
  loadActionLog,
  saveActionLog,
  appendActionLog,
  clearActionLog,
  getTotalCostFromLog,
  getActionLogStats,
  ENVELOPE_THRESHOLDS,
  MAX_LOG_ENTRIES,
};