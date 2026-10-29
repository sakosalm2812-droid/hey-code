/**
 * Tests for antiGaming.js
 * Minimum 8 tests per spec.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  recordMetric,
  detectGaming,
  auditMetrics,
  getGamingFlags,
  getMetricHistory,
  _clear,
} from "../src/core/antiGaming.js";

describe("antiGaming.js", () => {
  beforeEach(() => {
    _clear();
  });

  it("recordMetric records a metric value", () => {
    const result = recordMetric({ metricId: "approval_rate", value: 0.8, context: { source: "vault" } });
    assert.strictEqual(result.recorded, true);

    const history = getMetricHistory("approval_rate");
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].value, 0.8);
    assert.strictEqual(history[0].metricId, "approval_rate");
    assert.ok(history[0].recordedAt);
  });

  it("recordMetric validates required fields", () => {
    assert.throws(() => recordMetric({ value: 0.8 }), /metricId required/);
    assert.throws(() => recordMetric({ metricId: "test", value: "not-a-number" }), /value must be a finite number/);
    assert.throws(() => recordMetric({ metricId: "test", value: NaN }), /value must be a finite number/);
  });

  it("detectGaming returns insufficient data for few records", () => {
    for (let i = 0; i < 5; i++) {
      recordMetric({ metricId: "approval_rate", value: 0.8 + i * 0.01 });
    }
    const result = detectGaming({ metricId: "approval_rate" });
    assert.strictEqual(result.gamed, false);
    assert.ok(result.evidence.some(e => e.includes("Insufficient data")));
  });

  it("detectGaming detects approval rate ↑ while no-change rate ↓", () => {
    // Record approval_rate: increasing trend (more than 20% increase)
    for (let i = 0; i < 10; i++) {
      recordMetric({ metricId: "approval_rate", value: 0.5 + i * 0.03 }); // 0.5 to 0.77 (54% increase)
    }
    // Record no_change_rate: decreasing trend (more than 20% decrease)
    for (let i = 0; i < 10; i++) {
      recordMetric({ metricId: "no_change_rate", value: 0.4 - i * 0.03 }); // 0.4 to 0.13 (67% decrease)
    }

    const result = detectGaming({ metricId: "approval_rate" });
    assert.strictEqual(result.gamed, true);
    assert.ok(result.evidence.some(e => e.includes("Approval rate increased")));
  });

  it("detectGaming detects verification time ↓ while failure rate ↑", () => {
    // verification_time decreasing
    for (let i = 0; i < 10; i++) {
      recordMetric({ metricId: "verification_time", value: 100 - i * 5 }); // 100 to 55
    }
    // verification_failure_rate increasing
    for (let i = 0; i < 10; i++) {
      recordMetric({ metricId: "verification_failure_rate", value: 0.05 + i * 0.01 }); // 0.05 to 0.14
    }

    const result = detectGaming({ metricId: "verification_time" });
    assert.strictEqual(result.gamed, true);
    assert.ok(result.evidence.some(e => e.includes("Verification time decreased")));
  });

  it("detectGaming detects proposal count ↑ while duplicate rate ↓", () => {
    // proposal_count increasing
    for (let i = 0; i < 10; i++) {
      recordMetric({ metricId: "proposal_count", value: 10 + i * 2 }); // 10 to 28
    }
    // duplicate_proposal_rate decreasing
    for (let i = 0; i < 10; i++) {
      recordMetric({ metricId: "duplicate_proposal_rate", value: 0.3 - i * 0.02 }); // 0.3 to 0.12
    }

    const result = detectGaming({ metricId: "proposal_count" });
    assert.strictEqual(result.gamed, true);
    assert.ok(result.evidence.some(e => e.includes("Proposal count increased")));
  });

  it("detectGaming detects cost per improvement ↑ while reported value ↑", () => {
    // reported_value increasing
    for (let i = 0; i < 10; i++) {
      recordMetric({ metricId: "reported_value", value: 50 + i * 5 }); // 50 to 95
    }
    // cost_per_improvement increasing
    for (let i = 0; i < 10; i++) {
      recordMetric({ metricId: "cost_per_improvement", value: 100 + i * 10 }); // 100 to 190
    }

    const result = detectGaming({ metricId: "reported_value" });
    assert.strictEqual(result.gamed, true);
    assert.ok(result.evidence.some(e => e.includes("Reported value increased")));
  });

  it("detectGaming detects generic metric spike without quality improvement", () => {
    // Metric doubles
    for (let i = 0; i < 10; i++) {
      recordMetric({ metricId: "custom_metric", value: i < 5 ? 10 : 25 });
    }
    // Quality doesn't improve
    for (let i = 0; i < 10; i++) {
      recordMetric({ metricId: "custom_metric_quality", value: 0.8 });
    }

    const result = detectGaming({ metricId: "custom_metric" });
    assert.strictEqual(result.gamed, true);
    assert.ok(result.evidence.some(e => e.includes("doubled without quality improvement")));
  });

  it("auditMetrics returns clean and suspicious metrics", () => {
    // Clean metric
    for (let i = 0; i < 10; i++) {
      recordMetric({ metricId: "clean_metric", value: 100 });
    }
    // Suspicious metric
    for (let i = 0; i < 10; i++) {
      recordMetric({ metricId: "suspicious_metric", value: i < 5 ? 10 : 25 });
    }
    for (let i = 0; i < 10; i++) {
      recordMetric({ metricId: "suspicious_metric_quality", value: 0.8 });
    }

    const audit = auditMetrics();
    assert.ok(audit.clean.includes("clean_metric"));
    assert.ok(audit.suspicious.includes("suspicious_metric"));
  });

  it("getGamingFlags returns flagged metrics", () => {
    for (let i = 0; i < 10; i++) {
      recordMetric({ metricId: "flagged_metric", value: i < 5 ? 10 : 25 });
    }
    for (let i = 0; i < 10; i++) {
      recordMetric({ metricId: "flagged_metric_quality", value: 0.8 });
    }

    detectGaming({ metricId: "flagged_metric" });
    const flags = getGamingFlags();
    assert.strictEqual(flags.length, 1);
    assert.strictEqual(flags[0].metricId, "flagged_metric");
    assert.ok(flags[0].evidence.length > 0);
  });

  it("getMetricHistory returns metric history", () => {
    recordMetric({ metricId: "history_metric", value: 1 });
    recordMetric({ metricId: "history_metric", value: 2 });
    recordMetric({ metricId: "history_metric", value: 3 });
    const history = getMetricHistory("history_metric");
    assert.strictEqual(history.length, 3);
    assert.strictEqual(history[0].value, 1);
    assert.strictEqual(history[2].value, 3);
  });

  it("detectGaming validates windowDays", () => {
    assert.throws(() => detectGaming({ metricId: "test", windowDays: 0 }), /windowDays must be positive integer/);
    assert.throws(() => detectGaming({ metricId: "test", windowDays: -1 }), /windowDays must be positive integer/);
  });

  it("metrics are frozen", () => {
    recordMetric({ metricId: "frozen_metric", value: 1 });
    const history = getMetricHistory("frozen_metric");
    assert.throws(() => { history[0].value = 999; }, /Cannot assign to read only property/);
  });
});