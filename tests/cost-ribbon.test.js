/**
 * Cost Model Tests — Pure
 * Tests: state thresholds, unknown-price rendering, estimated labelling
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  getEnvelopeState,
  getDailyEnvelopeState,
  getMonthlyEnvelopeState,
  formatCents,
  formatCost,
  getCostLabel,
  buildRibbonViewModel,
  buildDetailViewModel,
  appendActionLog,
  loadActionLog,
  saveActionLog,
  clearActionLog,
  getTotalCostFromLog,
  getActionLogStats,
  ENVELOPE_THRESHOLDS,
  MAX_LOG_ENTRIES,
} from "../src/components/cost/costModel.js";

test("costModel — ENVELOPE_THRESHOLDS", () => {
  test("has correct threshold values", () => {
    assert.strictEqual(ENVELOPE_THRESHOLDS.NOMINAL_MAX_PCT, 70);
    assert.strictEqual(ENVELOPE_THRESHOLDS.APPROACHING_MAX_PCT, 95);
    assert.strictEqual(ENVELOPE_THRESHOLDS.AT_ENVELOPE_PCT, 95);
    assert.strictEqual(ENVELOPE_THRESHOLDS.OVER_PCT, 100);
  });

  test("is frozen", () => {
    assert.throws(() => {
      ENVELOPE_THRESHOLDS.NOMINAL_MAX_PCT = 80;
    }, TypeError);
  });
});

test("costModel — getEnvelopeState", () => {
  test("returns nominal for < 70%", () => {
    assert.strictEqual(getEnvelopeState(69, 100), "nominal");
    assert.strictEqual(getEnvelopeState(0, 100), "nominal");
    assert.strictEqual(getEnvelopeState(35, 100), "nominal");
  });

  test("returns approaching for 70-94%", () => {
    assert.strictEqual(getEnvelopeState(70, 100), "approaching");
    assert.strictEqual(getEnvelopeState(85, 100), "approaching");
    assert.strictEqual(getEnvelopeState(94, 100), "approaching");
  });

  test("returns at-envelope for 95-99%", () => {
    assert.strictEqual(getEnvelopeState(95, 100), "at-envelope");
    assert.strictEqual(getEnvelopeState(99, 100), "at-envelope");
  });

  test("returns over for >= 100%", () => {
    assert.strictEqual(getEnvelopeState(100, 100), "over");
    assert.strictEqual(getEnvelopeState(150, 100), "over");
  });

  test("handles zero limit", () => {
    assert.strictEqual(getEnvelopeState(0, 0), "nominal");
    assert.strictEqual(getEnvelopeState(100, 0), "nominal");
  });

  test("handles negative limit gracefully", () => {
    assert.strictEqual(getEnvelopeState(100, -10), "nominal");
  });
});

test("costModel — formatCents", () => {
  test("formats whole dollars", () => {
    const result = formatCents(100);
    assert.ok(result.includes("1.00") || result.includes("1"));
  });

  test("formats cents", () => {
    const result = formatCents(123);
    assert.ok(result.includes("1.23"));
  });

  test("formats zero", () => {
    const result = formatCents(0);
    assert.ok(result.includes("0"));
  });

  test("formats large amounts", () => {
    const result = formatCents(10000);
    assert.ok(result.includes("100"));
  });

  test("returns string for all inputs", () => {
    assert.strictEqual(typeof formatCents(100), "string");
    assert.strictEqual(typeof formatCents(0), "string");
    assert.strictEqual(typeof formatCents(-50), "string");
  });
});

test("costModel — formatCost", () => {
  test("formats known costs", () => {
    const result = formatCost(100);
    assert.ok(result !== "—");
    assert.ok(result.includes("$") || result.includes("1"));
  });

  test("returns — for unknown (-1)", () => {
    assert.strictEqual(formatCost(-1), "—");
  });

  test("returns — for undefined", () => {
    assert.strictEqual(formatCost(undefined), "—");
  });

  test("returns — for null", () => {
    assert.strictEqual(formatCost(null), "—");
  });
});

test("costModel — getCostLabel", () => {
  test("returns 'price unknown' for unknown", () => {
    assert.strictEqual(getCostLabel(-1), "price unknown");
    assert.strictEqual(getCostLabel(undefined), "price unknown");
    assert.strictEqual(getCostLabel(null), "price unknown");
  });

  test("returns 'cost' for known values", () => {
    assert.strictEqual(getCostLabel(0), "cost");
    assert.strictEqual(getCostLabel(100), "cost");
    assert.strictEqual(getCostLabel(1), "cost");
  });
});

test("costModel — buildRibbonViewModel", () => {
  const mockEnvelope = {
    userId: "local",
    tenantId: "default",
    dailyLimitCents: 500,
    monthlyLimitCents: 5000,
    killSwitchActive: false,
  };

  const mockSnapshot = {
    daily: { committedCents: 150, reservedCents: 50, refusals: [], commits: [] },
    monthly: { committedCents: 1200, reservedCents: 100, refusals: [], commits: [] },
    dailyLimitCents: 500,
    monthlyLimitCents: 5000,
    activeReservations: 2,
    killSwitchActive: false,
  };

  const mockActionLog = [
    {
      id: "1",
      capabilityId: "cap.model.call",
      model: "gpt-4o",
      provider: "openai",
      actualCents: 50,
      timestamp: new Date().toISOString(),
    },
    {
      id: "2",
      capabilityId: "cap.model.call",
      model: "claude-3",
      provider: "anthropic",
      actualCents: 100,
      timestamp: new Date(Date.now() - 60000).toISOString(),
    },
  ];

  test("builds view model with correct structure", () => {
    const vm = buildRibbonViewModel({
      envelope: mockEnvelope,
      snapshot: mockSnapshot,
      actionLog: mockActionLog,
      locale: "en-US",
    });

    assert.ok(vm.state);
    assert.ok(vm.daily);
    assert.ok(vm.monthly);
    assert.ok(vm.session);
    assert.ok(vm.ribbon);
    assert.strictEqual(typeof vm.canPause, "boolean");
    assert.strictEqual(typeof vm.canReset, "boolean");
  });

  test("calculates daily state correctly", () => {
    // 150 + 50 = 200 out of 500 = 40% → nominal
    const vm = buildRibbonViewModel({
      envelope: mockEnvelope,
      snapshot: mockSnapshot,
      actionLog: mockActionLog,
    });
    assert.strictEqual(vm.daily.state, "nominal");
  });

  test("calculates monthly state correctly", () => {
    // 1200 + 100 = 1300 out of 5000 = 26% → nominal
    const vm = buildRibbonViewModel({
      envelope: mockEnvelope,
      snapshot: mockSnapshot,
      actionLog: mockActionLog,
    });
    assert.strictEqual(vm.monthly.state, "nominal");
  });

  test("calculates session cost correctly", () => {
    const vm = buildRibbonViewModel({
      envelope: mockEnvelope,
      snapshot: mockSnapshot,
      actionLog: mockActionLog,
    });
    assert.strictEqual(vm.session.costCents, 150);
    assert.strictEqual(vm.session.count, 2);
  });

  test("handles empty action log", () => {
    const vm = buildRibbonViewModel({
      envelope: mockEnvelope,
      snapshot: mockSnapshot,
      actionLog: [],
    });
    assert.strictEqual(vm.session.costCents, 0);
    assert.strictEqual(vm.session.count, 0);
  });

  test("handles missing snapshot gracefully", () => {
    const vm = buildRibbonViewModel({
      envelope: mockEnvelope,
      snapshot: null,
      actionLog: mockActionLog,
    });
    assert.ok(vm.daily);
    assert.ok(vm.monthly);
  });

  test("handles missing envelope gracefully", () => {
    const vm = buildRibbonViewModel({
      envelope: null,
      snapshot: mockSnapshot,
      actionLog: mockActionLog,
    });
    assert.ok(vm);
  });
});

test("costModel — buildDetailViewModel", () => {
  const mockEnvelope = {
    userId: "local",
    tenantId: "default",
    dailyLimitCents: 500,
    monthlyLimitCents: 5000,
    killSwitchActive: false,
  };

  const mockSnapshot = {
    daily: { committedCents: 150, reservedCents: 50, refusals: [], commits: [] },
    monthly: { committedCents: 1200, reservedCents: 100, refusals: [], commits: [] },
    dailyLimitCents: 500,
    monthlyLimitCents: 5000,
    activeReservations: 2,
    killSwitchActive: false,
  };

  const mockActionLog = [
    {
      id: "1",
      capabilityId: "cap.model.call",
      model: "gpt-4o",
      provider: "openai",
      actualCents: 50,
      timestamp: new Date().toISOString(),
      tokensIn: 100,
      tokensOut: 50,
      traceId: "tr_abc123",
    },
    {
      id: "2",
      capabilityId: "cap.model.call",
      model: "gpt-4o",
      provider: "openai",
      actualCents: -1, // unknown
      timestamp: new Date(Date.now() - 60000).toISOString(),
      tokensIn: 200,
      tokensOut: 100,
      traceId: "tr_def456",
    },
    {
      id: "3",
      capabilityId: "cap.artifact.export.pdf",
      model: "local",
      provider: "local",
      actualCents: 0,
      timestamp: new Date(Date.now() - 120000).toISOString(),
      cached: true,
    },
  ];

  test("includes all ribbon view model fields", () => {
    const vm = buildDetailViewModel({
      envelope: mockEnvelope,
      snapshot: mockSnapshot,
      actionLog: mockActionLog,
    });

    assert.ok(vm.state);
    assert.ok(vm.daily);
    assert.ok(vm.monthly);
    assert.ok(vm.session);
    assert.ok(vm.ribbon);
  });

  test("enhances actions with formatted data", () => {
    const vm = buildDetailViewModel({
      envelope: mockEnvelope,
      snapshot: mockSnapshot,
      actionLog: mockActionLog,
    });

    assert.strictEqual(vm.actions.length, 3);
    assert.ok(vm.actions[0].formattedCost);
    assert.ok(vm.actions[0].formattedTime);
    assert.strictEqual(vm.actions[0].costLabel, "cost");
    assert.strictEqual(vm.actions[1].costLabel, "price unknown");
  });

  test("groups by model correctly", () => {
    const vm = buildDetailViewModel({
      envelope: mockEnvelope,
      snapshot: mockSnapshot,
      actionLog: mockActionLog,
    });

    const gpt4o = vm.byModel.find((m) => m.model === "gpt-4o");
    assert.ok(gpt4o);
    assert.strictEqual(gpt4o.count, 2);
    assert.strictEqual(gpt4o.totalCents, 50); // only known costs counted
  });

  test("groups by capability correctly", () => {
    const vm = buildDetailViewModel({
      envelope: mockEnvelope,
      snapshot: mockSnapshot,
      actionLog: mockActionLog,
    });

    const modelCall = vm.byCapability.find((c) => c.capability === "cap.model.call");
    assert.ok(modelCall);
    assert.strictEqual(modelCall.count, 2);

    const pdfExport = vm.byCapability.find((c) => c.capability === "cap.artifact.export.pdf");
    assert.ok(pdfExport);
    assert.strictEqual(pdfExport.count, 1);
  });

  test("includes trace links for actions with traceId", () => {
    const vm = buildDetailViewModel({
      envelope: mockEnvelope,
      snapshot: mockSnapshot,
      actionLog: mockActionLog,
    });

    assert.strictEqual(vm.traceLinks.length, 2);
    assert.strictEqual(vm.traceLinks[0].traceId, "tr_abc123");
    assert.strictEqual(vm.traceLinks[1].traceId, "tr_def456");
  });
});

test("costModel — action log persistence", () => {
  test("loadActionLog returns array", () => {
    const log = loadActionLog();
    assert.ok(Array.isArray(log));
  });

  test("saveActionLog and loadActionLog round-trip", () => {
    const testLog = [
      { id: "test1", actualCents: 100, capabilityId: "test" },
      { id: "test2", actualCents: 200, capabilityId: "test" },
    ];
    saveActionLog(testLog);
    const loaded = loadActionLog();
    assert.strictEqual(loaded.length, 2);
    assert.strictEqual(loaded[0].id, "test1");
    // Cleanup
    clearActionLog();
  });

  test("appendActionLog adds entry with generated id and timestamp", () => {
    clearActionLog();
    const log = appendActionLog({
      capabilityId: "test.cap",
      model: "test-model",
      provider: "test-provider",
      actualCents: 50,
    });

    assert.strictEqual(log.length, 1);
    assert.ok(log[0].id.startsWith("cost_"));
    assert.ok(log[0].timestamp);
    assert.strictEqual(log[0].capabilityId, "test.cap");
    assert.strictEqual(log[0].actualCents, 50);
    clearActionLog();
  });

  test("appendActionLog caps at MAX_LOG_ENTRIES", () => {
    clearActionLog();
    const manyEntries = Array(MAX_LOG_ENTRIES + 10).fill(null).map((_, i) => ({
      capabilityId: `test${i}`,
      model: "test",
      provider: "test",
      actualCents: i,
    }));

    let log = [];
    for (const entry of manyEntries) {
      log = appendActionLog(entry);
    }

    assert.strictEqual(log.length, MAX_LOG_ENTRIES);
    // Should keep most recent
    assert.strictEqual(log[0].capabilityId, `test${manyEntries.length - 1}`);
    clearActionLog();
  });

  test("clearActionLog empties the log", () => {
    const log = appendActionLog({ capabilityId: "test", model: "test", provider: "test", actualCents: 100 });
    assert.strictEqual(log.length, 1);
    clearActionLog();
    const cleared = loadActionLog();
    assert.strictEqual(cleared.length, 0);
  });

  test("getTotalCostFromLog sums known costs only", () => {
    clearActionLog();
    appendActionLog({ capabilityId: "a", model: "m", provider: "p", actualCents: 100 });
    appendActionLog({ capabilityId: "b", model: "m", provider: "p", actualCents: -1 }); // unknown
    appendActionLog({ capabilityId: "c", model: "m", provider: "p", actualCents: 50 });
    appendActionLog({ capabilityId: "d", model: "m", provider: "p", actualCents: 0 }); // free

    const total = getTotalCostFromLog();
    assert.strictEqual(total, 150);
    clearActionLog();
  });

  test("getActionLogStats returns correct stats", () => {
    clearActionLog();
    appendActionLog({ capabilityId: "cap.a", model: "model1", provider: "prov1", actualCents: 100, tokensIn: 10, tokensOut: 20 });
    appendActionLog({ capabilityId: "cap.b", model: "model1", provider: "prov1", actualCents: -1 });
    appendActionLog({ capabilityId: "cap.a", model: "model2", provider: "prov2", actualCents: 50, cached: true });

    const stats = getActionLogStats();
    assert.strictEqual(stats.totalEntries, 3);
    assert.strictEqual(stats.totalCents, 150);
    assert.strictEqual(stats.knownCents, 150);
    assert.strictEqual(stats.unknownCount, 1);
    assert.strictEqual(stats.cachedCount, 1);
    assert.strictEqual(stats.uniqueModels, 2);
    assert.strictEqual(stats.uniqueCapabilities, 2);
    clearActionLog();
  });
});