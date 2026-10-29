/**
 * HEY — Outcome Telemetry (Part 15, Phase C, Module 7.10)
 *
 * Layer 7: Production → Retrospective → Research.
 * Every production execution records outcome.
 * Retrospective feeds researchPipeline as new jobs.
 *
 * @module core/outcomeTelemetry
 */

const OUTCOMES = new Map();

/**
 * Record a production outcome.
 * @param {Object} input
 * @param {string} input.capabilityId
 * @param {string} input.traceId
 * @param {boolean} input.success
 * @param {number} input.latencyMs
 * @param {number} input.costCents
 * @param {string} [input.error]
 * @param {string} [input.userId]
 * @param {string} [input.tenantId]
 * @returns {{ recorded: boolean }}
 */
export function recordOutcome({ capabilityId, traceId, success, latencyMs, costCents, error, userId, tenantId }) {
  if (!capabilityId || typeof capabilityId !== "string") {
    throw new TypeError("capabilityId required");
  }
  if (!traceId || typeof traceId !== "string") {
    throw new TypeError("traceId required");
  }
  if (typeof success !== "boolean") {
    throw new TypeError("success must be boolean");
  }
  if (!Number.isInteger(latencyMs) || latencyMs < 0) {
    throw new TypeError("latencyMs must be non-negative integer");
  }
  if (!Number.isInteger(costCents) || costCents < 0) {
    throw new TypeError("costCents must be non-negative integer");
  }

  const key = capabilityId;
  if (!OUTCOMES.has(key)) {
    OUTCOMES.set(key, []);
  }

  const record = Object.freeze({
    traceId,
    success,
    latencyMs,
    costCents,
    error: error ?? null,
    userId: userId ?? null,
    tenantId: tenantId ?? null,
    recordedAt: new Date().toISOString(),
  });

  OUTCOMES.get(key).push(record);
  return { recorded: true };
}

/**
 * Aggregate outcomes for a capability over a time window.
 * @param {Object} input
 * @param {string} input.capabilityId
 * @param {number} [input.windowDays=30]
 * @returns {{ successRate: number, avgLatency: number, avgCost: number, errorRate: number, trend: string }}
 */
export function aggregate({ capabilityId, windowDays = 30 }) {
  if (!capabilityId || typeof capabilityId !== "string") {
    throw new TypeError("capabilityId required");
  }
  if (!Number.isInteger(windowDays) || windowDays <= 0) {
    throw new TypeError("windowDays must be positive integer");
  }

  const outcomes = OUTCOMES.get(capabilityId) ?? [];
  const cutoffMs = Date.now() - windowDays * 24 * 60 * 60 * 1000;

  const recent = outcomes.filter(o => new Date(o.recordedAt).getTime() >= cutoffMs);
  if (recent.length === 0) {
    return {
      successRate: 0,
      avgLatency: 0,
      avgCost: 0,
      errorRate: 0,
      trend: "no-data",
    };
  }

  const successCount = recent.filter(o => o.success).length;
  const totalLatency = recent.reduce((sum, o) => sum + o.latencyMs, 0);
  const totalCost = recent.reduce((sum, o) => sum + o.costCents, 0);
  const errorCount = recent.filter(o => !o.success && o.error).length;

  // Simple trend: compare first half vs second half success rates
  const mid = Math.floor(recent.length / 2);
  const firstHalf = recent.slice(0, mid);
  const secondHalf = recent.slice(mid);
  const firstSuccessRate = firstHalf.length > 0 ? firstHalf.filter(o => o.success).length / firstHalf.length : 0;
  const secondSuccessRate = secondHalf.length > 0 ? secondHalf.filter(o => o.success).length / secondHalf.length : 0;
  const trend = secondSuccessRate > firstSuccessRate ? "improving" : secondSuccessRate < firstSuccessRate ? "degrading" : "stable";

  return {
    successRate: successCount / recent.length,
    avgLatency: Math.round(totalLatency / recent.length),
    avgCost: Math.round(totalCost / recent.length),
    errorRate: errorCount / recent.length,
    trend,
  };
}

/**
 * Generate retrospective from aggregated outcomes.
 * Feeds researchPipeline as new jobs.
 * @param {Object} input
 * @param {number} [input.windowDays=30]
 * @returns {{ insights: string[], proposedResearch: Object[], capabilityGaps: string[] }}
 */
export function generateRetrospective({ windowDays = 30 } = {}) {
  if (!Number.isInteger(windowDays) || windowDays <= 0) {
    throw new TypeError("windowDays must be positive integer");
  }

  const insights = [];
  const proposedResearch = [];
  const capabilityGaps = [];

  const allCapabilities = [...OUTCOMES.keys()];

  for (const capabilityId of allCapabilities) {
    const agg = aggregate({ capabilityId, windowDays });

    // Insight: low success rate
    if (agg.successRate < 0.9 && agg.trend !== "improving") {
      insights.push(`Capability ${capabilityId} has ${Math.round(agg.successRate * 100)}% success rate (${agg.trend})`);
      if (agg.successRate < 0.5) {
        proposedResearch.push({
          title: `Improve reliability of ${capabilityId}`,
          capabilityId,
          priority: 10,
          costCents: 1000,
          lane: "proposal",
          metrics: ["successRate", "errorRate"],
        });
      }
    }

    // Insight: high latency
    if (agg.avgLatency > 5000) {
      insights.push(`Capability ${capabilityId} has high avg latency: ${agg.avgLatency}ms`);
      proposedResearch.push({
        title: `Optimize latency for ${capabilityId}`,
        capabilityId,
        priority: 8,
        costCents: 500,
        lane: "proposal",
        metrics: ["latency"],
      });
    }

    // Insight: high cost
    if (agg.avgCost > 1000) {
      insights.push(`Capability ${capabilityId} has high avg cost: ${agg.avgCost} cents`);
      proposedResearch.push({
        title: `Reduce cost for ${capabilityId}`,
        capabilityId,
        priority: 6,
        costCents: 500,
        lane: "proposal",
        metrics: ["cost"],
      });
    }

    // Capability gap: no outcomes recorded
    if (agg.successRate === 0 && agg.avgLatency === 0) {
      capabilityGaps.push(capabilityId);
    }
  }

  return {
    insights: Object.freeze(insights),
    proposedResearch: Object.freeze(proposedResearch),
    capabilityGaps: Object.freeze(capabilityGaps),
  };
}

/**
 * Get all recorded outcomes for a capability.
 * @param {string} capabilityId
 * @returns {Object[]}
 */
export function getOutcomes(capabilityId) {
  return Object.freeze([...(OUTCOMES.get(capabilityId) ?? [])]);
}

/**
 * Get all capabilities with outcomes.
 * @returns {string[]}
 */
export function getCapabilitiesWithOutcomes() {
  return Object.freeze([...OUTCOMES.keys()]);
}

/**
 * Clear all state (test helper).
 */
export function _clear() {
  OUTCOMES.clear();
}

export default {
  recordOutcome,
  aggregate,
  generateRetrospective,
  getOutcomes,
  getCapabilitiesWithOutcomes,
  _clear,
};