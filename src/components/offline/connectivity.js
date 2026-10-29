/**
 * Connectivity Derivation — Pure
 * Derives connectivity state from probe results.
 * No I/O, no timers, no side effects.
 *
 * @module components/offline/connectivity
 */

/**
 * Probe result shape from the offline engine or network checks.
 * @typedef {Object} ProbeResult
 * @property {boolean} online - Browser navigator.onLine
 * @property {number} [backendLatencyMs] - Last successful backend call latency
 * @property {boolean} [backendReachable] - Whether backend responded successfully
 * @property {number} [providerLatencyMs] - Last provider call latency
 * @property {boolean} [providerReachable] - Whether provider responded successfully
 * @property {number} [timestamp] - When the probe was taken (Date.now())
 * @property {string} [error] - Error message if failed
 */

/**
 * Derived connectivity state.
 * @type {'online'|'offline'|'degraded'}
 */

/**
 * Thresholds for degraded detection.
 * @readonly
 */
export const DEGRADED_THRESHOLDS = Object.freeze({
  // Backend p95 > 4s over last 5 calls → degraded
  BACKEND_LATENCY_P95_MS: 4000,
  // Provider p95 > 8s → degraded
  PROVIDER_LATENCY_P95_MS: 8000,
  // Minimum samples for p95 calculation
  MIN_SAMPLES: 3,
  // Time window for considering probes fresh (ms)
  PROBE_FRESHNESS_MS: 60000,
});

/**
 * Derives connectivity state from a list of probe results.
 * Pure function — no side effects.
 *
 * @param {ProbeResult[]} probes - Array of probe results, newest first
 * @returns {'online'|'offline'|'degraded'}
 */
export function deriveConnectivity(probes) {
  if (!probes || probes.length === 0) {
    return "unknown";
  }

  // Most recent probe
  const latest = probes[0];

  // If browser reports offline, we're offline
  if (latest.online === false) {
    return "offline";
  }

  // Filter fresh probes
  const now = Date.now();
  const freshProbes = probes.filter(
    (p) => p.timestamp && now - p.timestamp < DEGRADED_THRESHOLDS.PROBE_FRESHNESS_MS
  );

  const workingProbes = freshProbes.length > 0 ? freshProbes : probes.slice(0, DEGRADED_THRESHOLDS.MIN_SAMPLES);

  // Check backend health
  const backendLatencies = workingProbes
    .filter((p) => typeof p.backendLatencyMs === "number" && p.backendReachable === true)
    .map((p) => p.backendLatencyMs)
    .sort((a, b) => a - b);

  // Check provider health
  const providerLatencies = workingProbes
    .filter((p) => typeof p.providerLatencyMs === "number" && p.providerReachable === true)
    .map((p) => p.providerLatencyMs)
    .sort((a, b) => a - b);

  // Determine if degraded
  let isDegraded = false;
  let degradationReasons = [];

  // Backend latency check
  if (backendLatencies.length >= DEGRADED_THRESHOLDS.MIN_SAMPLES) {
    const p95Index = Math.ceil(backendLatencies.length * 0.95) - 1;
    const p95 = backendLatencies[Math.max(0, p95Index)];
    if (p95 > DEGRADED_THRESHOLDS.BACKEND_LATENCY_P95_MS) {
      isDegraded = true;
      degradationReasons.push(`backend p95 ${p95}ms > ${DEGRADED_THRESHOLDS.BACKEND_LATENCY_P95_MS}ms`);
    }
  } else if (backendLatencies.length === 0 && workingProbes.some((p) => p.backendReachable === false)) {
    // Backend completely unreachable
    isDegraded = true;
    degradationReasons.push("backend unreachable");
  }

  // Provider latency check
  if (providerLatencies.length >= DEGRADED_THRESHOLDS.MIN_SAMPLES) {
    const p95Index = Math.ceil(providerLatencies.length * 0.95) - 1;
    const p95 = providerLatencies[Math.max(0, p95Index)];
    if (p95 > DEGRADED_THRESHOLDS.PROVIDER_LATENCY_P95_MS) {
      isDegraded = true;
      degradationReasons.push(`provider p95 ${p95}ms > ${DEGRADED_THRESHOLDS.PROVIDER_LATENCY_P95_MS}ms`);
    }
  } else if (providerLatencies.length === 0 && workingProbes.some((p) => p.providerReachable === false)) {
    // Provider completely unreachable
    isDegraded = true;
    degradationReasons.push("provider unreachable");
  }

  if (isDegraded) {
    return "degraded";
  }

  return "online";
}

/**
 * Gets a human-readable reason for the connectivity state.
 * @param {'online'|'offline'|'degraded'|'unknown'} state
 * @param {ProbeResult[]} probes
 * @returns {string}
 */
export function getConnectivityReason(state, probes) {
  switch (state) {
    case "offline":
      return "Browser reports no network connection.";

    case "degraded": {
      const reasons = [];
      const latest = probes[0];
      const now = Date.now();
      const freshProbes = probes.filter(
        (p) => p.timestamp && now - p.timestamp < DEGRADED_THRESHOLDS.PROBE_FRESHNESS_MS
      );
      const workingProbes = freshProbes.length > 0 ? freshProbes : probes.slice(0, DEGRADED_THRESHOLDS.MIN_SAMPLES);

      const backendLatencies = workingProbes
        .filter((p) => typeof p.backendLatencyMs === "number" && p.backendReachable === true)
        .map((p) => p.backendLatencyMs)
        .sort((a, b) => a - b);

      const providerLatencies = workingProbes
        .filter((p) => typeof p.providerLatencyMs === "number" && p.providerReachable === true)
        .map((p) => p.providerLatencyMs)
        .sort((a, b) => a - b);

      if (backendLatencies.length >= DEGRADED_THRESHOLDS.MIN_SAMPLES) {
        const p95Index = Math.ceil(backendLatencies.length * 0.95) - 1;
        const p95 = backendLatencies[Math.max(0, p95Index)];
        if (p95 > DEGRADED_THRESHOLDS.BACKEND_LATENCY_P95_MS) {
          reasons.push(`Backend responding slowly (p95: ${Math.round(p95)}ms)`);
        }
      } else if (backendLatencies.length === 0 && workingProbes.some((p) => p.backendReachable === false)) {
        reasons.push("Backend unreachable");
      }

      if (providerLatencies.length >= DEGRADED_THRESHOLDS.MIN_SAMPLES) {
        const p95Index = Math.ceil(providerLatencies.length * 0.95) - 1;
        const p95 = providerLatencies[Math.max(0, p95Index)];
        if (p95 > DEGRADED_THRESHOLDS.PROVIDER_LATENCY_P95_MS) {
          reasons.push(`Model provider slow (p95: ${Math.round(p95)}ms)`);
        }
      } else if (providerLatencies.length === 0 && workingProbes.some((p) => p.providerReachable === false)) {
        reasons.push("Model provider unreachable");
      }

      if (reasons.length === 0) {
        reasons.push("Degraded performance detected");
      }

      return reasons.join("; ");
    }

    case "online":
      return "All systems operational.";

    default:
      return "Connectivity state unknown.";
  }
}

/**
 * Computes detailed connectivity metrics from probes.
 * @param {ProbeResult[]} probes
 * @returns {Object}
 */
export function computeConnectivityMetrics(probes) {
  if (!probes || probes.length === 0) {
    return {
      state: "unknown",
      reason: "No probe data available.",
      backend: { reachable: false, p50: null, p95: null, samples: 0 },
      provider: { reachable: false, p50: null, p95: null, samples: 0 },
      latestProbe: null,
    };
  }

  const latest = probes[0];
  const now = Date.now();
  const freshProbes = probes.filter(
    (p) => p.timestamp && now - p.timestamp < DEGRADED_THRESHOLDS.PROBE_FRESHNESS_MS
  );
  const workingProbes = freshProbes.length > 0 ? freshProbes : probes.slice(0, DEGRADED_THRESHOLDS.MIN_SAMPLES);

  const backendLatencies = workingProbes
    .filter((p) => typeof p.backendLatencyMs === "number" && p.backendReachable === true)
    .map((p) => p.backendLatencyMs)
    .sort((a, b) => a - b);

  const providerLatencies = workingProbes
    .filter((p) => typeof p.providerLatencyMs === "number" && p.providerReachable === true)
    .map((p) => p.providerLatencyMs)
    .sort((a, b) => a - b);

  function percentile(sorted, p) {
    if (sorted.length === 0) return null;
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  const state = deriveConnectivity(probes);

  return {
    state,
    reason: getConnectivityReason(state, probes),
    backend: {
      reachable: backendLatencies.length > 0,
      p50: percentile(backendLatencies, 0.5),
      p95: percentile(backendLatencies, 0.95),
      samples: backendLatencies.length,
    },
    provider: {
      reachable: providerLatencies.length > 0,
      p50: percentile(providerLatencies, 0.5),
      p95: percentile(providerLatencies, 0.95),
      samples: providerLatencies.length,
    },
    latestProbe: {
      online: latest.online,
      timestamp: latest.timestamp,
      backendLatencyMs: latest.backendLatencyMs,
      backendReachable: latest.backendReachable,
      providerLatencyMs: latest.providerLatencyMs,
      providerReachable: latest.providerReachable,
      error: latest.error,
    },
  };
}

/**
 * Creates a probe result from a backend call outcome.
 * @param {Object} params
 * @param {boolean} params.online
 * @param {number} [params.backendLatencyMs]
 * @param {boolean} [params.backendReachable]
 * @param {number} [params.providerLatencyMs]
 * @param {boolean} [params.providerReachable]
 * @param {string} [params.error]
 * @returns {ProbeResult}
 */
export function createProbe({ online, backendLatencyMs, backendReachable, providerLatencyMs, providerReachable, error }) {
  return {
    online: online ?? navigator.onLine,
    backendLatencyMs,
    backendReachable,
    providerLatencyMs,
    providerReachable,
    timestamp: Date.now(),
    error,
  };
}

export default {
  deriveConnectivity,
  getConnectivityReason,
  computeConnectivityMetrics,
  createProbe,
  DEGRADED_THRESHOLDS,
};