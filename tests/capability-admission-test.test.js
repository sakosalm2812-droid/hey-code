/**
 * Tests for capabilityAdmissionTest.js
 * Minimum 10 tests per spec.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  runAdmissionTest,
  assertAdmitted,
  getAdmissionResult,
  getAllAdmissionResults,
  _clear,
} from "../src/core/capabilityAdmissionTest.js";

describe("capabilityAdmissionTest.js", () => {
  beforeEach(() => {
    _clear();
  });

  it("runAdmissionTest passes when candidate beats baseline on successRate", () => {
    const result = runAdmissionTest({
      capabilityId: "cap.test.1",
      baseline: { successRate: 0.8, latency: 100, cost: 10, errorRate: 0.05 },
      candidate: { successRate: 0.9, latency: 100, cost: 10, errorRate: 0.05 },
    });
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.evidence.primaryMetric, "successRate");
    assert.ok(Math.abs(result.evidence.relativeImprovement - 0.125) < 0.0001);
    assert.strictEqual(result.evidence.meetsMinimum, true);
    assert.strictEqual(result.evidence.isSignificant, true);
    assert.strictEqual(result.evidence.regressions.length, 0);
  });

  it("runAdmissionTest passes when candidate beats baseline on latency (lower is better)", () => {
    const result = runAdmissionTest({
      capabilityId: "cap.test.2",
      baseline: { successRate: 0.8, latency: 200, cost: 10, errorRate: 0.05 },
      candidate: { successRate: 0.8, latency: 150, cost: 10, errorRate: 0.05 },
      threshold: { primaryMetric: "latency" },
    });
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.evidence.primaryMetric, "latency");
    assert.strictEqual(result.evidence.relativeImprovement, 0.25); // (200-150)/200 = 0.25
    assert.strictEqual(result.evidence.regressions.length, 0);
  });

  it("runAdmissionTest passes when candidate beats baseline on cost (lower is better)", () => {
    const result = runAdmissionTest({
      capabilityId: "cap.test.3",
      baseline: { successRate: 0.8, latency: 100, cost: 20, errorRate: 0.05 },
      candidate: { successRate: 0.8, latency: 100, cost: 15, errorRate: 0.05 },
      threshold: { primaryMetric: "cost" },
    });
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.evidence.primaryMetric, "cost");
    assert.strictEqual(result.evidence.relativeImprovement, 0.25); // (20-15)/20 = 0.25
  });

  it("runAdmissionTest passes when candidate beats baseline on errorRate (lower is better)", () => {
    const result = runAdmissionTest({
      capabilityId: "cap.test.4",
      baseline: { successRate: 0.8, latency: 100, cost: 10, errorRate: 0.1 },
      candidate: { successRate: 0.8, latency: 100, cost: 10, errorRate: 0.05 },
      threshold: { primaryMetric: "errorRate" },
    });
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.evidence.primaryMetric, "errorRate");
    assert.strictEqual(result.evidence.relativeImprovement, 0.5); // (0.1-0.05)/0.1 = 0.5
  });

  it("runAdmissionTest fails when improvement is below minimum", () => {
    const result = runAdmissionTest({
      capabilityId: "cap.test.5",
      baseline: { successRate: 0.8, latency: 100, cost: 10, errorRate: 0.05 },
      candidate: { successRate: 0.805, latency: 100, cost: 10, errorRate: 0.05 }, // Only 0.625% improvement
      threshold: { minImprovement: 0.01 }, // 1% minimum
    });
    assert.strictEqual(result.passed, false);
    assert.strictEqual(result.evidence.meetsMinimum, false);
  });

  it("runAdmissionTest fails when not statistically significant", () => {
    const result = runAdmissionTest({
      capabilityId: "cap.test.6",
      baseline: { successRate: 0.8, latency: 100, cost: 10, errorRate: 0.05 },
      candidate: { successRate: 0.82, latency: 100, cost: 10, errorRate: 0.05 }, // 2.5% improvement, below 5% significance threshold
    });
    assert.strictEqual(result.passed, false);
    assert.strictEqual(result.evidence.isSignificant, false);
  });

  it("runAdmissionTest fails when regression on other metrics", () => {
    const result = runAdmissionTest({
      capabilityId: "cap.test.7",
      baseline: { successRate: 0.8, latency: 100, cost: 10, errorRate: 0.05 },
      candidate: { successRate: 0.9, latency: 200, cost: 10, errorRate: 0.05 }, // Latency doubled (regression)
    });
    assert.strictEqual(result.passed, false);
    assert.ok(result.evidence.regressions.includes("latency"));
  });

  it("runAdmissionTest fails when regression on cost", () => {
    const result = runAdmissionTest({
      capabilityId: "cap.test.8",
      baseline: { successRate: 0.8, latency: 100, cost: 10, errorRate: 0.05 },
      candidate: { successRate: 0.9, latency: 100, cost: 20, errorRate: 0.05 }, // Cost doubled
    });
    assert.strictEqual(result.passed, false);
    assert.ok(result.evidence.regressions.includes("cost"));
  });

  it("runAdmissionTest fails when regression on errorRate", () => {
    const result = runAdmissionTest({
      capabilityId: "cap.test.9",
      baseline: { successRate: 0.8, latency: 100, cost: 10, errorRate: 0.05 },
      candidate: { successRate: 0.9, latency: 100, cost: 10, errorRate: 0.1 }, // Error rate doubled
    });
    assert.strictEqual(result.passed, false);
    assert.ok(result.evidence.regressions.includes("errorRate"));
  });

  it("runAdmissionTest validates required metrics", () => {
    assert.throws(() => runAdmissionTest({
      capabilityId: "cap.test",
      baseline: { successRate: 0.8, latency: 100, cost: 10 }, // missing errorRate
      candidate: { successRate: 0.9, latency: 100, cost: 10, errorRate: 0.05 },
    }), /must have numeric errorRate/);
  });

  it("assertAdmitted throws for untested capability", () => {
    assert.throws(() => assertAdmitted("cap.untested"), /has not been tested/);
  });

  it("assertAdmitted throws for failed admission", () => {
    runAdmissionTest({
      capabilityId: "cap.failed",
      baseline: { successRate: 0.8, latency: 100, cost: 10, errorRate: 0.05 },
      candidate: { successRate: 0.7, latency: 100, cost: 10, errorRate: 0.05 },
    });
    assert.throws(() => assertAdmitted("cap.failed"), /failed admission test/);
  });

  it("assertAdmitted passes for admitted capability", () => {
    runAdmissionTest({
      capabilityId: "cap.passed",
      baseline: { successRate: 0.8, latency: 100, cost: 10, errorRate: 0.05 },
      candidate: { successRate: 0.9, latency: 100, cost: 10, errorRate: 0.05 },
    });
    assert.doesNotThrow(() => assertAdmitted("cap.passed"));
  });

  it("getAdmissionResult returns result", () => {
    runAdmissionTest({
      capabilityId: "cap.test",
      baseline: { successRate: 0.8, latency: 100, cost: 10, errorRate: 0.05 },
      candidate: { successRate: 0.9, latency: 100, cost: 10, errorRate: 0.05 },
    });
    const result = getAdmissionResult("cap.test");
    assert.ok(result);
    assert.strictEqual(result.passed, true);
  });

  it("getAllAdmissionResults returns all results", () => {
    runAdmissionTest({
      capabilityId: "cap.a",
      baseline: { successRate: 0.8, latency: 100, cost: 10, errorRate: 0.05 },
      candidate: { successRate: 0.9, latency: 100, cost: 10, errorRate: 0.05 },
    });
    runAdmissionTest({
      capabilityId: "cap.b",
      baseline: { successRate: 0.8, latency: 100, cost: 10, errorRate: 0.05 },
      candidate: { successRate: 0.7, latency: 100, cost: 10, errorRate: 0.05 },
    });
    const results = getAllAdmissionResults();
    assert.strictEqual(results.length, 2);
  });

  it("runAdmissionTest is deterministic", () => {
    const r1 = runAdmissionTest({
      capabilityId: "cap.det",
      baseline: { successRate: 0.8, latency: 100, cost: 10, errorRate: 0.05 },
      candidate: { successRate: 0.9, latency: 100, cost: 10, errorRate: 0.05 },
    });
    _clear();
    const r2 = runAdmissionTest({
      capabilityId: "cap.det",
      baseline: { successRate: 0.8, latency: 100, cost: 10, errorRate: 0.05 },
      candidate: { successRate: 0.9, latency: 100, cost: 10, errorRate: 0.05 },
    });
    assert.strictEqual(r1.passed, r2.passed);
    assert.strictEqual(r1.evidence.relativeImprovement, r2.evidence.relativeImprovement);
  });

  it("runAdmissionTest returns frozen result", () => {
    const result = runAdmissionTest({
      capabilityId: "cap.frozen",
      baseline: { successRate: 0.8, latency: 100, cost: 10, errorRate: 0.05 },
      candidate: { successRate: 0.9, latency: 100, cost: 10, errorRate: 0.05 },
    });
    assert.throws(() => { result.passed = false; }, /Cannot assign to read only property/);
    assert.throws(() => { result.evidence.regressions.push("test"); }, /Cannot add property/);
  });
});