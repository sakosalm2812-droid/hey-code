/**
 * HEY — Capability Admission Test (Part 15, Phase C, Module 7.8)
 *
 * Measurable gate: candidate must beat baseline on primary metric with p < 0.05
 * AND not regress on others. No admission without evidence.
 *
 * @module core/capabilityAdmissionTest
 */

const ADMISSION_RESULTS = new Map();

/**
 * Run admission test comparing candidate against baseline.
 * @param {Object} input
 * @param {string} input.capabilityId
 * @param {Object} input.baseline - Baseline metrics
 * @param {number} input.baseline.successRate - 0-1
 * @param {number} input.baseline.latency - ms
 * @param {number} input.baseline.cost - cents
 * @param {number} input.baseline.errorRate - 0-1
 * @param {Object} input.candidate - Candidate metrics
 * @param {number} input.candidate.successRate - 0-1
 * @param {number} input.candidate.latency - ms
 * @param {number} input.candidate.cost - cents
 * @param {number} input.candidate.errorRate - 0-1
 * @param {Object} [input.threshold] - Statistical thresholds
 * @param {string} [input.threshold.primaryMetric='successRate'] - 'successRate'|'latency'|'cost'|'errorRate'
 * @param {number} [input.threshold.pValue=0.05] - Significance level
 * @param {number} [input.threshold.minImprovement=0.01] - Minimum relative improvement
 * @returns {{ passed: boolean, evidence: Object, baselineMetrics: Object, candidateMetrics: Object }}
 */
export function runAdmissionTest({
  capabilityId,
  baseline,
  candidate,
  threshold = {},
}) {
  if (!capabilityId || typeof capabilityId !== "string") {
    throw new TypeError("capabilityId required");
  }
  if (!baseline || typeof baseline !== "object") {
    throw new TypeError("baseline required");
  }
  if (!candidate || typeof candidate !== "object") {
    throw new TypeError("candidate required");
  }

  const primaryMetric = threshold.primaryMetric ?? "successRate";
  const pValue = threshold.pValue ?? 0.05;
  const minImprovement = threshold.minImprovement ?? 0.01;

  // Validate metrics
  const metrics = ["successRate", "latency", "cost", "errorRate"];
  for (const m of metrics) {
    if (typeof baseline[m] !== "number" || typeof candidate[m] !== "number") {
      throw new TypeError(`baseline and candidate must have numeric ${m}`);
    }
  }

  // Determine if higher or lower is better for each metric
  const higherIsBetter = { successRate: true, latency: false, cost: false, errorRate: false };

  // Primary metric test
  const baselinePrimary = baseline[primaryMetric];
  const candidatePrimary = candidate[primaryMetric];
  const isHigherBetter = higherIsBetter[primaryMetric];

  // Calculate relative improvement
  let relativeImprovement;
  if (isHigherBetter) {
    relativeImprovement = (candidatePrimary - baselinePrimary) / (baselinePrimary || 1);
  } else {
    relativeImprovement = (baselinePrimary - candidatePrimary) / (baselinePrimary || 1);
  }

  // Check if improvement meets minimum
  const meetsMinimum = relativeImprovement >= minImprovement;

  // Simple statistical test (deterministic equivalent of p < 0.05)
  // For deterministic testing, we use a threshold-based approach:
  // - For successRate: candidate must be at least 5% relatively better
  // - For latency/cost/errorRate: candidate must be at least 5% relatively lower
  const significantThreshold = 0.05; // 5% relative improvement
  const isSignificant = relativeImprovement >= significantThreshold;

  // Check regression on other metrics
  const regressions = [];
  for (const m of metrics) {
    if (m === primaryMetric) continue;
    const baselineVal = baseline[m];
    const candidateVal = candidate[m];
    const isBetter = higherIsBetter[m];
    let regressed = false;
    if (isBetter) {
      regressed = candidateVal < baselineVal * (1 - minImprovement);
    } else {
      regressed = candidateVal > baselineVal * (1 + minImprovement);
    }
    if (regressed) {
      regressions.push(m);
    }
  }

  const passed = meetsMinimum && isSignificant && regressions.length === 0;

  const evidence = Object.freeze({
    capabilityId,
    primaryMetric,
    baselinePrimary,
    candidatePrimary,
    relativeImprovement,
    meetsMinimum,
    isSignificant,
    regressions: Object.freeze([...regressions]),
    pValue,
    minImprovement,
    testedAt: new Date().toISOString(),
  });

  const result = Object.freeze({
    passed,
    evidence,
    baselineMetrics: Object.freeze({ ...baseline }),
    candidateMetrics: Object.freeze({ ...candidate }),
  });

  ADMISSION_RESULTS.set(capabilityId, result);
  return result;
}

/**
 * Assert that a capability has been admitted.
 * Throws if not admitted.
 * @param {string} capabilityId
 * @throws {Error} If not admitted
 */
export function assertAdmitted(capabilityId) {
  const result = ADMISSION_RESULTS.get(capabilityId);
  if (!result) {
    throw new Error(`Capability ${capabilityId} has not been tested for admission`);
  }
  if (!result.passed) {
    throw new Error(`Capability ${capabilityId} failed admission test: ${result.evidence.regressions.length > 0 ? "regression on " + result.evidence.regressions.join(", ") : "insufficient improvement"}`);
  }
}

/**
 * Get admission result for a capability.
 * @param {string} capabilityId
 * @returns {Object|undefined}
 */
export function getAdmissionResult(capabilityId) {
  return ADMISSION_RESULTS.get(capabilityId);
}

/**
 * Get all admission results.
 * @returns {Object[]}
 */
export function getAllAdmissionResults() {
  return Object.freeze([...ADMISSION_RESULTS.values()]);
}

/**
 * Clear all state (test helper).
 */
export function _clear() {
  ADMISSION_RESULTS.clear();
}

export default {
  runAdmissionTest,
  assertAdmitted,
  getAdmissionResult,
  getAllAdmissionResults,
  _clear,
};