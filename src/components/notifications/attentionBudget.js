/**
 * Attention budget — pure function for notification delivery decisions.
 * Implements: max 3 important+/10 min; critical bypasses budget but not quiet hours.
 */

const BUDGET_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_IMPORTANT_PER_WINDOW = 3;

const SEVERITY_ORDER = {
  silent: 0,
  normal: 1,
  important: 2,
  critical: 3,
};

function isImportantOrAbove(severity) {
  return SEVERITY_ORDER[severity] >= SEVERITY_ORDER.important;
}

function isCritical(severity) {
  return severity === 'critical';
}

/**
 * Determines delivery action for a notification.
 * @param {Object} notification - { id, severity, timestamp, ... }
 * @param {number} now - Current timestamp (ms)
 * @param {Object} state - { deliveries: Array<{severity, timestamp}>, quietUntil: number|null }
 * @returns {Object} { action: 'deliver'|'queue'|'digest', reason: string, updatedState }
 */
export function allow(notification, now, state) {
  const severity = notification.severity || 'normal';
  const deliveries = state.deliveries || [];
  const quietUntil = state.quietUntil || null;

  // Check quiet hours first (critical bypasses budget but NOT quiet hours)
  if (quietUntil && now < quietUntil) {
    if (isCritical(severity)) {
      // Critical bypasses quiet hours? No - spec says "critical bypasses budget not quiet hours"
      // So critical is also deferred during quiet hours
      return {
        action: 'queue',
        reason: 'quiet_hours',
        updatedState: { ...state },
      };
    }
    return {
      action: 'queue',
      reason: 'quiet_hours',
      updatedState: { ...state },
    };
  }

  // Critical always delivers (bypasses budget)
  if (isCritical(severity)) {
    const newDeliveries = [...deliveries, { severity, timestamp: now }];
    return {
      action: 'deliver',
      reason: 'critical_bypass',
      updatedState: { ...state, deliveries: newDeliveries },
    };
  }

  // Count important+ deliveries in the current window
  const windowStart = now - BUDGET_WINDOW_MS;
  const recentImportant = deliveries.filter(d =>
    d.timestamp >= windowStart && isImportantOrAbove(d.severity)
  ).length;

  if (recentImportant >= MAX_IMPORTANT_PER_WINDOW) {
    // Budget exceeded - queue for digest
    return {
      action: 'digest',
      reason: 'budget_exceeded',
      updatedState: { ...state },
    };
  }

  // Within budget - deliver
  const newDeliveries = [...deliveries, { severity, timestamp: now }];
  return {
    action: 'deliver',
    reason: 'within_budget',
    updatedState: { ...state, deliveries: newDeliveries },
  };
}

/**
 * Creates initial budget state.
 * @returns {Object} Initial state
 */
export function createInitialState() {
  return {
    deliveries: [],
    quietUntil: null,
  };
}

/**
 * Prunes old deliveries from state (call periodically).
 * @param {Object} state - Current state
 * @param {number} now - Current timestamp
 * @returns {Object} Pruned state
 */
export function pruneState(state, now) {
  const windowStart = now - BUDGET_WINDOW_MS;
  return {
    ...state,
    deliveries: (state.deliveries || []).filter(d => d.timestamp >= windowStart),
  };
}

export default {
  allow,
  createInitialState,
  pruneState,
  BUDGET_WINDOW_MS,
  MAX_IMPORTANT_PER_WINDOW,
};