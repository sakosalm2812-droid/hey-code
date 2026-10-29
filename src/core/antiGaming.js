/**
 * HEY — Anti-Gaming (Part 15, Phase C, Module 7.12)
 *
 * Rule 91 protection: detect gaming patterns in metrics.
 * If gaming detected → metric flagged, owner notified, proposal auto-HOLD.
 *
 * @module core/antiGaming
 */

const METRICS = new Map();
const GAMING_FLAGS = new Map();

/**
 * Gaming patterns to detect (Rule 91):
 * - Proposal approval rate ↑ while no-change rate ↓
 * - Verification time ↓ while failure rate ↑
 * - Duplicate proposal rate ↓ while proposal count ↑
 * - Cost per improvement ↑ while reported "value" ↑
 */

/**
 * Record a metric value.
 * @param {Object} input
 * @param {string} input.metricId
 * @param {number} input.value
 * @param {Object} [input.context={}]
 * @returns {{ recorded: boolean }}
 */
export function recordMetric({ metricId, value, context = {} }) {
  if (!metricId || typeof metricId !== "string") {
    throw new TypeError("metricId required");
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError("value must be a finite number");
  }

  if (!METRICS.has(metricId)) {
    METRICS.set(metricId, []);
  }

  const record = Object.freeze({
    metricId,
    value,
    context: Object.freeze({ ...context }),
    recordedAt: new Date().toISOString(),
  });

  METRICS.get(metricId).push(record);
  return { recorded: true };
}

/**
 * Detect gaming for a metric over a time window.
 * @param {Object} input
 * @param {string} input.metricId
 * @param {number} [input.windowDays=30]
 * @returns {{ gamed: boolean, evidence: string[] }}
 */
export function detectGaming({ metricId, windowDays = 30 }) {
  if (!metricId || typeof metricId !== "string") {
    throw new TypeError("metricId required");
  }
  if (!Number.isInteger(windowDays) || windowDays <= 0) {
    throw new TypeError("windowDays must be positive integer");
  }

  const records = METRICS.get(metricId) ?? [];
  const cutoffMs = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const recent = records.filter(r => new Date(r.recordedAt).getTime() >= cutoffMs);

  if (recent.length < 10) {
    return { gamed: false, evidence: ["Insufficient data for gaming detection"] };
  }

  const evidence = [];

  // Pattern 1: Approval rate ↑ while no-change rate ↓
  // Check if metricId is "approval_rate" and "no_change_rate" exists
  if (metricId === "approval_rate") {
    const noChangeRecords = METRICS.get("no_change_rate") ?? [];
    const noChangeRecent = noChangeRecords.filter(r => new Date(r.recordedAt).getTime() >= cutoffMs);
    if (recent.length >= 5 && noChangeRecent.length >= 5) {
      const recentApprovalAvg = recent.slice(-5).reduce((s, r) => s + r.value, 0) / 5;
      const olderApprovalAvg = recent.slice(0, 5).reduce((s, r) => s + r.value, 0) / 5;
      const recentNoChangeAvg = noChangeRecent.slice(-5).reduce((s, r) => s + r.value, 0) / 5;
      const olderNoChangeAvg = noChangeRecent.slice(0, 5).reduce((s, r) => s + r.value, 0) / 5;

      if (recentApprovalAvg > olderApprovalAvg * 1.2 && recentNoChangeAvg < olderNoChangeAvg * 0.8) {
        evidence.push("Approval rate increased 20%+ while no-change rate decreased 20%+");
      }
    }
  }

  // Pattern 2: Verification time ↓ while failure rate ↑
  if (metricId === "verification_time") {
    const failureRecords = METRICS.get("verification_failure_rate") ?? [];
    const failureRecent = failureRecords.filter(r => new Date(r.recordedAt).getTime() >= cutoffMs);
    if (recent.length >= 5 && failureRecent.length >= 5) {
      const recentTimeAvg = recent.slice(-5).reduce((s, r) => s + r.value, 0) / 5;
      const olderTimeAvg = recent.slice(0, 5).reduce((s, r) => s + r.value, 0) / 5;
      const recentFailureAvg = failureRecent.slice(-5).reduce((s, r) => s + r.value, 0) / 5;
      const olderFailureAvg = failureRecent.slice(0, 5).reduce((s, r) => s + r.value, 0) / 5;

      if (recentTimeAvg < olderTimeAvg * 0.8 && recentFailureAvg > olderFailureAvg * 1.2) {
        evidence.push("Verification time decreased 20%+ while failure rate increased 20%+");
      }
    }
  }

  // Pattern 3: Duplicate proposal rate ↓ while proposal count ↑
  if (metricId === "proposal_count") {
    const dupRecords = METRICS.get("duplicate_proposal_rate") ?? [];
    const dupRecent = dupRecords.filter(r => new Date(r.recordedAt).getTime() >= cutoffMs);
    if (recent.length >= 5 && dupRecent.length >= 5) {
      const recentProposalAvg = recent.slice(-5).reduce((s, r) => s + r.value, 0) / 5;
      const olderProposalAvg = recent.slice(0, 5).reduce((s, r) => s + r.value, 0) / 5;
      const recentDupAvg = dupRecent.slice(-5).reduce((s, r) => s + r.value, 0) / 5;
      const olderDupAvg = dupRecent.slice(0, 5).reduce((s, r) => s + r.value, 0) / 5;

      if (recentProposalAvg > olderProposalAvg * 1.2 && recentDupAvg < olderDupAvg * 0.8) {
        evidence.push("Proposal count increased 20%+ while duplicate rate decreased 20%+");
      }
    }
  }

  // Pattern 4: Cost per improvement ↑ while reported "value" ↑
  if (metricId === "reported_value") {
    const costRecords = METRICS.get("cost_per_improvement") ?? [];
    const costRecent = costRecords.filter(r => new Date(r.recordedAt).getTime() >= cutoffMs);
    if (recent.length >= 5 && costRecent.length >= 5) {
      const recentValueAvg = recent.slice(-5).reduce((s, r) => s + r.value, 0) / 5;
      const olderValueAvg = recent.slice(0, 5).reduce((s, r) => s + r.value, 0) / 5;
      const recentCostAvg = costRecent.slice(-5).reduce((s, r) => s + r.value, 0) / 5;
      const olderCostAvg = costRecent.slice(0, 5).reduce((s, r) => s + r.value, 0) / 5;

      if (recentValueAvg > olderValueAvg * 1.2 && recentCostAvg > olderCostAvg * 1.2) {
        evidence.push("Reported value increased 20%+ while cost per improvement increased 20%+");
      }
    }
  }

  // Generic pattern: sudden metric spike without corresponding improvement
  if (recent.length >= 10) {
    const recentAvg = recent.slice(-5).reduce((s, r) => s + r.value, 0) / 5;
    const olderAvg = recent.slice(0, 5).reduce((s, r) => s + r.value, 0) / 5;
    if (olderAvg > 0 && recentAvg > olderAvg * 2) {
      // Check if there's a corresponding quality metric
      const qualityRecords = METRICS.get(`${metricId}_quality`) ?? [];
      const qualityRecent = qualityRecords.filter(r => new Date(r.recordedAt).getTime() >= cutoffMs);
      if (qualityRecent.length >= 5) {
        const qualityAvg = qualityRecent.slice(-5).reduce((s, r) => s + r.value, 0) / 5;
        const olderQualityAvg = qualityRecent.slice(0, 5).reduce((s, r) => s + r.value, 0) / 5;
        if (qualityAvg <= olderQualityAvg) {
          evidence.push(`Metric ${metricId} doubled without quality improvement`);
        }
      }
    }
  }

  const gamed = evidence.length > 0;

  if (gamed) {
    const flag = Object.freeze({
      metricId,
      evidence: Object.freeze(evidence),
      detectedAt: new Date().toISOString(),
      windowDays,
    });
    GAMING_FLAGS.set(metricId, flag);
  }

  return { gamed, evidence: Object.freeze(evidence) };
}

/**
 * Audit all metrics for gaming.
 * @returns {{ clean: string[], suspicious: string[] }}
 */
export function auditMetrics() {
  const clean = [];
  const suspicious = [];

  for (const metricId of METRICS.keys()) {
    const result = detectGaming({ metricId, windowDays: 30 });
    if (result.gamed) {
      suspicious.push(metricId);
    } else {
      clean.push(metricId);
    }
  }

  return {
    clean: Object.freeze(clean),
    suspicious: Object.freeze(suspicious),
  };
}

/**
 * Get gaming flags.
 * @returns {Object[]}
 */
export function getGamingFlags() {
  return Object.freeze([...GAMING_FLAGS.values()]);
}

/**
 * Get metric history.
 * @param {string} metricId
 * @returns {Object[]}
 */
export function getMetricHistory(metricId) {
  return Object.freeze([...(METRICS.get(metricId) ?? [])]);
}

/**
 * Clear all state (test helper).
 */
export function _clear() {
  METRICS.clear();
  GAMING_FLAGS.clear();
}

export default {
  recordMetric,
  detectGaming,
  auditMetrics,
  getGamingFlags,
  getMetricHistory,
  _clear,
};