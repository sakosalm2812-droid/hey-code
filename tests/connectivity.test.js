/**
 * Connectivity Tests — Pure
 * Tests: deriveConnectivity, getConnectivityReason, computeConnectivityMetrics, createProbe
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveConnectivity,
  getConnectivityReason,
  computeConnectivityMetrics,
  createProbe,
  DEGRADED_THRESHOLDS,
} from "../src/components/offline/connectivity.js";

const NOW = Date.now();

test("connectivity — createProbe", () => {
  test("creates a probe with required fields", () => {
    const probe = createProbe({
      online: true,
      backendLatencyMs: 100,
      backendReachable: true,
    });

    assert.strictEqual(probe.online, true);
    assert.strictEqual(probe.backendLatencyMs, 100);
    assert.strictEqual(probe.backendReachable, true);
    assert.ok(typeof probe.timestamp === "number");
    assert.ok(probe.timestamp <= NOW + 100);
    assert.ok(probe.timestamp >= NOW - 100);
  });

  test("defaults online from navigator.onLine when not provided", () => {
    const probe = createProbe({});
    assert.strictEqual(probe.online, navigator.onLine);
  });

  test("includes all optional fields when provided", () => {
    const probe = createProbe({
      online: true,
      backendLatencyMs: 150,
      backendReachable: true,
      providerLatencyMs: 2000,
      providerReachable: true,
      error: "timeout",
    });

    assert.strictEqual(probe.providerLatencyMs, 2000);
    assert.strictEqual(probe.providerReachable, true);
    assert.strictEqual(probe.error, "timeout");
  });
});

test("connectivity — deriveConnectivity", () => {
  test("returns 'offline' when navigator.onLine is false", () => {
    const probes = [createProbe({ online: false, timestamp: NOW })];
    const state = deriveConnectivity(probes);
    assert.strictEqual(state, "offline");
  });

  test("returns 'online' for healthy probes", () => {
    const probes = [
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, timestamp: NOW }),
      createProbe({ online: true, backendLatencyMs: 120, backendReachable: true, timestamp: NOW - 1000 }),
      createProbe({ online: true, backendLatencyMs: 90, backendReachable: true, timestamp: NOW - 2000 }),
    ];
    const state = deriveConnectivity(probes);
    assert.strictEqual(state, "online");
  });

  test("returns 'degraded' when backend p95 exceeds threshold", () => {
    const probes = [
      createProbe({ online: true, backendLatencyMs: 5000, backendReachable: true, timestamp: NOW }),
      createProbe({ online: true, backendLatencyMs: 4500, backendReachable: true, timestamp: NOW - 1000 }),
      createProbe({ online: true, backendLatencyMs: 4800, backendReachable: true, timestamp: NOW - 2000 }),
      createProbe({ online: true, backendLatencyMs: 5200, backendReachable: true, timestamp: NOW - 3000 }),
      createProbe({ online: true, backendLatencyMs: 4900, backendReachable: true, timestamp: NOW - 4000 }),
    ];
    const state = deriveConnectivity(probes);
    assert.strictEqual(state, "degraded");
  });

  test("returns 'degraded' when provider p95 exceeds threshold", () => {
    const probes = [
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerLatencyMs: 10000, providerReachable: true, timestamp: NOW }),
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerLatencyMs: 9000, providerReachable: true, timestamp: NOW - 1000 }),
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerLatencyMs: 9500, providerReachable: true, timestamp: NOW - 2000 }),
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerLatencyMs: 10000, providerReachable: true, timestamp: NOW - 3000 }),
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerLatencyMs: 9800, providerReachable: true, timestamp: NOW - 4000 }),
    ];
    const state = deriveConnectivity(probes);
    assert.strictEqual(state, "degraded");
  });

  test("returns 'degraded' when backend is unreachable", () => {
    const probes = [
      createProbe({ online: true, backendReachable: false, timestamp: NOW }),
      createProbe({ online: true, backendReachable: false, timestamp: NOW - 1000 }),
      createProbe({ online: true, backendReachable: false, timestamp: NOW - 2000 }),
    ];
    const state = deriveConnectivity(probes);
    assert.strictEqual(state, "degraded");
  });

  test("returns 'degraded' when provider is unreachable", () => {
    const probes = [
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerReachable: false, timestamp: NOW }),
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerReachable: false, timestamp: NOW - 1000 }),
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerReachable: false, timestamp: NOW - 2000 }),
    ];
    const state = deriveConnectivity(probes);
    assert.strictEqual(state, "degraded");
  });

  test("ignores stale probes beyond freshness window", () => {
    const probes = [
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, timestamp: NOW }),
      // Stale probe with high latency - should be ignored
      createProbe({ online: true, backendLatencyMs: 5000, backendReachable: true, timestamp: NOW - DEGRADED_THRESHOLDS.PROBE_FRESHNESS_MS - 1000 }),
    ];
    const state = deriveConnectivity(probes);
    // Only 1 fresh probe, not enough samples for p95, so should be online
    assert.strictEqual(state, "online");
  });

  test("returns 'unknown' for empty probes array", () => {
    const state = deriveConnectivity([]);
    assert.strictEqual(state, "unknown");
  });

  test("returns 'unknown' for null/undefined probes", () => {
    assert.strictEqual(deriveConnectivity(null), "unknown");
    assert.strictEqual(deriveConnectivity(undefined), "unknown");
  });

  test("requires minimum samples for p95 calculation", () => {
    // Only 2 samples - less than MIN_SAMPLES (3)
    const probes = [
      createProbe({ online: true, backendLatencyMs: 5000, backendReachable: true, timestamp: NOW }),
      createProbe({ online: true, backendLatencyMs: 5000, backendReachable: true, timestamp: NOW - 1000 }),
    ];
    const state = deriveConnectivity(probes);
    assert.strictEqual(state, "online"); // Not enough samples for p95
  });
});

test("connectivity — getConnectivityReason", () => {
  test("returns offline reason", () => {
    const reason = getConnectivityReason("offline", []);
    assert.ok(reason.includes("no network connection"));
  });

  test("returns online reason", () => {
    const reason = getConnectivityReason("online", []);
    assert.ok(reason.includes("operational"));
  });

  test("returns degraded reason with backend latency", () => {
    const probes = [
      createProbe({ online: true, backendLatencyMs: 5000, backendReachable: true, timestamp: NOW }),
      createProbe({ online: true, backendLatencyMs: 4500, backendReachable: true, timestamp: NOW - 1000 }),
      createProbe({ online: true, backendLatencyMs: 4800, backendReachable: true, timestamp: NOW - 2000 }),
      createProbe({ online: true, backendLatencyMs: 5200, backendReachable: true, timestamp: NOW - 3000 }),
      createProbe({ online: true, backendLatencyMs: 4900, backendReachable: true, timestamp: NOW - 4000 }),
    ];
    const reason = getConnectivityReason("degraded", probes);
    assert.ok(reason.includes("Backend responding slowly"));
    assert.ok(reason.includes("p95"));
  });

  test("returns degraded reason with provider latency", () => {
    const probes = [
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerLatencyMs: 10000, providerReachable: true, timestamp: NOW }),
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerLatencyMs: 9000, providerReachable: true, timestamp: NOW - 1000 }),
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerLatencyMs: 9500, providerReachable: true, timestamp: NOW - 2000 }),
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerLatencyMs: 10000, providerReachable: true, timestamp: NOW - 3000 }),
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerLatencyMs: 9800, providerReachable: true, timestamp: NOW - 4000 }),
    ];
    const reason = getConnectivityReason("degraded", probes);
    assert.ok(reason.includes("Model provider slow"));
    assert.ok(reason.includes("p95"));
  });

  test("returns degraded reason for unreachable backend", () => {
    const probes = [
      createProbe({ online: true, backendReachable: false, timestamp: NOW }),
      createProbe({ online: true, backendReachable: false, timestamp: NOW - 1000 }),
      createProbe({ online: true, backendReachable: false, timestamp: NOW - 2000 }),
    ];
    const reason = getConnectivityReason("degraded", probes);
    assert.ok(reason.includes("Backend unreachable"));
  });

  test("returns degraded reason for unreachable provider", () => {
    const probes = [
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerReachable: false, timestamp: NOW }),
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerReachable: false, timestamp: NOW - 1000 }),
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerReachable: false, timestamp: NOW - 2000 }),
    ];
    const reason = getConnectivityReason("degraded", probes);
    assert.ok(reason.includes("Model provider unreachable"));
  });

  test("returns unknown reason", () => {
    const reason = getConnectivityReason("unknown", []);
    assert.ok(reason.includes("unknown"));
  });
});

test("connectivity — computeConnectivityMetrics", () => {
  test("returns complete metrics object for healthy probes", () => {
    const probes = [
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerLatencyMs: 500, providerReachable: true, timestamp: NOW }),
      createProbe({ online: true, backendLatencyMs: 120, backendReachable: true, providerLatencyMs: 600, providerReachable: true, timestamp: NOW - 1000 }),
      createProbe({ online: true, backendLatencyMs: 90, backendReachable: true, providerLatencyMs: 550, providerReachable: true, timestamp: NOW - 2000 }),
    ];
    const metrics = computeConnectivityMetrics(probes);

    assert.strictEqual(metrics.state, "online");
    assert.ok(typeof metrics.reason === "string");
    assert.strictEqual(metrics.backend.reachable, true);
    assert.ok(typeof metrics.backend.p50 === "number");
    assert.ok(typeof metrics.backend.p95 === "number");
    assert.strictEqual(metrics.backend.samples, 3);
    assert.strictEqual(metrics.provider.reachable, true);
    assert.ok(typeof metrics.provider.p50 === "number");
    assert.ok(typeof metrics.provider.p95 === "number");
    assert.strictEqual(metrics.provider.samples, 3);
    assert.ok(metrics.latestProbe);
  });

  test("returns backend unreachable when no successful backend probes", () => {
    const probes = [
      createProbe({ online: true, backendReachable: false, timestamp: NOW }),
      createProbe({ online: true, backendReachable: false, timestamp: NOW - 1000 }),
    ];
    const metrics = computeConnectivityMetrics(probes);

    assert.strictEqual(metrics.backend.reachable, false);
    assert.strictEqual(metrics.backend.samples, 0);
    assert.strictEqual(metrics.backend.p50, null);
    assert.strictEqual(metrics.backend.p95, null);
  });

  test("returns provider unreachable when no successful provider probes", () => {
    const probes = [
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerReachable: false, timestamp: NOW }),
      createProbe({ online: true, backendLatencyMs: 100, backendReachable: true, providerReachable: false, timestamp: NOW - 1000 }),
    ];
    const metrics = computeConnectivityMetrics(probes);

    assert.strictEqual(metrics.provider.reachable, false);
    assert.strictEqual(metrics.provider.samples, 0);
    assert.strictEqual(metrics.provider.p50, null);
    assert.strictEqual(metrics.provider.p95, null);
  });

  test("handles empty probes array", () => {
    const metrics = computeConnectivityMetrics([]);

    assert.strictEqual(metrics.state, "unknown");
    assert.strictEqual(metrics.backend.reachable, false);
    assert.strictEqual(metrics.provider.reachable, false);
    assert.strictEqual(metrics.latestProbe, null);
  });

  test("handles null/undefined probes", () => {
    const metrics1 = computeConnectivityMetrics(null);
    const metrics2 = computeConnectivityMetrics(undefined);

    assert.strictEqual(metrics1.state, "unknown");
    assert.strictEqual(metrics2.state, "unknown");
  });
});

test("connectivity — DEGRADED_THRESHOLDS", () => {
  test("has correct threshold values", () => {
    assert.strictEqual(DEGRADED_THRESHOLDS.BACKEND_LATENCY_P95_MS, 4000);
    assert.strictEqual(DEGRADED_THRESHOLDS.PROVIDER_LATENCY_P95_MS, 8000);
    assert.strictEqual(DEGRADED_THRESHOLDS.MIN_SAMPLES, 3);
    assert.strictEqual(DEGRADED_THRESHOLDS.PROBE_FRESHNESS_MS, 60000);
  });

  test("is frozen (immutable)", () => {
    assert.throws(() => {
      DEGRADED_THRESHOLDS.BACKEND_LATENCY_P95_MS = 5000;
    }, TypeError);
  });
});