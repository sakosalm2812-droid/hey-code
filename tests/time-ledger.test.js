/**
 * Time Ledger Tests — Pure
 * Tests: baselines, clamp to 0, rejection = 0, min-3 rule, baseline correction keeps original
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  loadLedger,
  saveLedger,
  recordEntry,
  computeTotals,
  applyBaselineCorrection,
  explain,
  getEntriesByCategory,
  getRecentEntries,
  clearLedger,
  formatDuration,
  formatCategory,
  validateBaseline,
  DEFAULT_BASELINES,
  MIN_ENTRIES_FOR_TOTAL,
  STORAGE_KEY,
} from "../src/core/timeLedger.js";

function clearLedgerForTest() {
  clearLedger();
}

test("timeLedger — DEFAULT_BASELINES", () => {
  test("has expected default categories", () => {
    assert.ok(DEFAULT_BASELINES.quiz);
    assert.ok(DEFAULT_BASELINES.worksheet);
    assert.ok(DEFAULT_BASELINES.lesson_plan);
    assert.ok(DEFAULT_BASELINES.marking);
    assert.ok(DEFAULT_BASELINES.lesson_summary);
    assert.ok(DEFAULT_BASELINES.research);
  });

  test("has reasonable minute values", () => {
    for (const [category, minutes] of Object.entries(DEFAULT_BASELINES)) {
      assert.ok(Number.isInteger(minutes));
      assert.ok(minutes >= 5);
      assert.ok(minutes <= 120);
    }
  });

  test("is frozen", () => {
    assert.throws(() => {
      DEFAULT_BASELINES.quiz = 999;
    }, TypeError);
  });
});

test("timeLedger — MIN_ENTRIES_FOR_TOTAL", () => {
  test("is 3", () => {
    assert.strictEqual(MIN_ENTRIES_FOR_TOTAL, 3);
  });
});

test("timeLedger — validateBaseline", () => {
  test("returns true for valid baselines", () => {
    assert.strictEqual(validateBaseline(1), true);
    assert.strictEqual(validateBaseline(30), true);
    assert.strictEqual(validateBaseline(480), true);
  });

  test("returns false for invalid baselines", () => {
    assert.strictEqual(validateBaseline(0), false);
    assert.strictEqual(validateBaseline(-5), false);
    assert.strictEqual(validateBaseline(481), false);
    assert.strictEqual(validateBaseline(30.5), false);
    assert.strictEqual(validateBaseline("30"), false);
  });
});

test("timeLedger — formatDuration", () => {
  test("formats minutes < 60", () => {
    assert.strictEqual(formatDuration(0), "0 min");
    assert.strictEqual(formatDuration(1), "1 min");
    assert.strictEqual(formatDuration(25), "25 min");
    assert.strictEqual(formatDuration(59), "59 min");
  });

  test("formats exact hours", () => {
    assert.strictEqual(formatDuration(60), "1 h");
    assert.strictEqual(formatDuration(120), "2 h");
    assert.strictEqual(formatDuration(480), "8 h");
  });

  test("formats hours and minutes", () => {
    assert.strictEqual(formatDuration(61), "1 h 1 min");
    assert.strictEqual(formatDuration(90), "1 h 30 min");
    assert.strictEqual(formatDuration(150), "2 h 30 min");
  });
});

test("timeLedger — formatCategory", () => {
  test("formats snake_case to Title Case", () => {
    assert.strictEqual(formatCategory("lesson_plan"), "Lesson Plan");
    assert.strictEqual(formatCategory("lesson_summary"), "Lesson Summary");
    assert.strictEqual(formatCategory("quiz"), "Quiz");
  });
});

test("timeLedger — recordEntry", () => {
  clearLedgerForTest();

  test("records an accepted entry with positive time saved", () => {
    const entry = recordEntry({
      category: "quiz",
      baselineMinutes: 25,
      actualMinutes: 10,
      correctionMinutes: 2,
      status: "accepted",
      traceId: "tr_123",
      taskId: "task_1",
    });

    assert.ok(entry.id.startsWith("tl_"));
    assert.strictEqual(entry.category, "quiz");
    assert.strictEqual(entry.baselineMinutes, 25);
    assert.strictEqual(entry.actualMinutes, 10);
    assert.strictEqual(entry.correctionMinutes, 2);
    assert.strictEqual(entry.timeSavedMinutes, 13); // 25 - 10 - 2 = 13
    assert.strictEqual(entry.status, "accepted");
    assert.strictEqual(entry.traceId, "tr_123");
    assert.ok(entry.acceptedAt);
  });

  test("records a rejected entry with 0 time saved", () => {
    clearLedgerForTest();
    const entry = recordEntry({
      category: "worksheet",
      baselineMinutes: 40,
      actualMinutes: 15,
      correctionMinutes: 0,
      status: "rejected",
      traceId: "tr_456",
    });

    assert.strictEqual(entry.status, "rejected");
    assert.strictEqual(entry.timeSavedMinutes, 0);
    assert.strictEqual(entry.acceptedAt, null);
  });

  test("clamps negative time saved to 0 for accepted entries", () => {
    clearLedgerForTest();
    const entry = recordEntry({
      category: "lesson_plan",
      baselineMinutes: 30,
      actualMinutes: 40, // Took longer than baseline
      correctionMinutes: 5,
      status: "accepted",
    });

    // 30 - 40 - 5 = -15 → clamped to 0
    assert.strictEqual(entry.timeSavedMinutes, 0);
  });

  test("clamps exactly zero", () => {
    clearLedgerForTest();
    const entry = recordEntry({
      category: "research",
      baselineMinutes: 20,
      actualMinutes: 15,
      correctionMinutes: 5, // 20 - 15 - 5 = 0
      status: "accepted",
    });

    assert.strictEqual(entry.timeSavedMinutes, 0);
  });

  test("defaults correctionMinutes to 0", () => {
    clearLedgerForTest();
    const entry = recordEntry({
      category: "marking",
      baselineMinutes: 15,
      actualMinutes: 8,
      status: "accepted",
    });

    assert.strictEqual(entry.correctionMinutes, 0);
    assert.strictEqual(entry.timeSavedMinutes, 7);
  });

  test("generates unique IDs", () => {
    clearLedgerForTest();
    const entry1 = recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, status: "accepted" });
    const entry2 = recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, status: "accepted" });

    assert.notStrictEqual(entry1.id, entry2.id);
  });

  test("persists to localStorage", () => {
    clearLedgerForTest();
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, status: "accepted" });
    const ledger = loadLedger();
    assert.strictEqual(ledger.length, 1);
  });
});

test("timeLedger — computeTotals", () => {
  clearLedgerForTest();

  test("returns zero totals for empty ledger", () => {
    const totals = computeTotals();
    assert.strictEqual(totals.totalSavedMinutes, 0);
    assert.strictEqual(totals.totalSavedFormatted, "0 min");
    assert.strictEqual(totals.acceptedCount, 0);
    assert.strictEqual(totals.showTotal, false);
    assert.deepStrictEqual(totals.categoryBreakdown, []);
    assert.deepStrictEqual(totals.entries, []);
  });

  test("sums time saved across accepted entries", () => {
    clearLedgerForTest();
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, correctionMinutes: 0, status: "accepted" });
    recordEntry({ category: "worksheet", baselineMinutes: 40, actualMinutes: 20, correctionMinutes: 5, status: "accepted" });
    // 15 + 15 = 30

    const totals = computeTotals();
    assert.strictEqual(totals.totalSavedMinutes, 30);
    assert.strictEqual(totals.totalSavedFormatted, "30 min");
    assert.strictEqual(totals.acceptedCount, 2);
  });

  test("excludes rejected entries from totals", () => {
    clearLedgerForTest();
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, status: "accepted" });
    recordEntry({ category: "worksheet", baselineMinutes: 40, actualMinutes: 5, status: "rejected" }); // Would be 35 saved but rejected

    const totals = computeTotals();
    assert.strictEqual(totals.totalSavedMinutes, 15); // Only the accepted one
    assert.strictEqual(totals.acceptedCount, 1);
  });

  test("groups by category correctly", () => {
    clearLedgerForTest();
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, status: "accepted" });
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 12, status: "accepted" });
    recordEntry({ category: "worksheet", baselineMinutes: 40, actualMinutes: 20, status: "accepted" });

    const totals = computeTotals();
    assert.strictEqual(totals.categoryBreakdown.length, 2);

    const quiz = totals.categoryBreakdown.find((c) => c.category === "quiz");
    assert.ok(quiz);
    assert.strictEqual(quiz.count, 2);
    assert.strictEqual(quiz.totalSavedMinutes, 28); // 15 + 13
    assert.strictEqual(quiz.totalBaselineMinutes, 50);
    assert.strictEqual(quiz.totalActualMinutes, 22);

    const worksheet = totals.categoryBreakdown.find((c) => c.category === "worksheet");
    assert.ok(worksheet);
    assert.strictEqual(worksheet.count, 1);
    assert.strictEqual(worksheet.totalSavedMinutes, 20);
  });

  test("filters by since date", () => {
    clearLedgerForTest();
    const oldDate = new Date(Date.now() - 86400000 * 10).toISOString(); // 10 days ago
    const recentDate = new Date().toISOString();

    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, status: "accepted" });
    // Manually add old entry
    const ledger = loadLedger();
    ledger[0].createdAt = oldDate;
    ledger[0].acceptedAt = oldDate;
    saveLedger(ledger);

    recordEntry({ category: "worksheet", baselineMinutes: 40, actualMinutes: 20, status: "accepted" });

    const totals = computeTotals({ since: recentDate });
    assert.strictEqual(totals.acceptedCount, 1);
    assert.strictEqual(totals.totalSavedMinutes, 20); // Only recent worksheet
  });

  test("filters by until date", () => {
    clearLedgerForTest();
    const oldDate = new Date(Date.now() - 86400000 * 10).toISOString();
    const recentDate = new Date().toISOString();

    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, status: "accepted" });
    const ledger = loadLedger();
    ledger[0].createdAt = oldDate;
    ledger[0].acceptedAt = oldDate;
    saveLedger(ledger);

    recordEntry({ category: "worksheet", baselineMinutes: 40, actualMinutes: 20, status: "accepted" });

    const totals = computeTotals({ until: oldDate });
    assert.strictEqual(totals.acceptedCount, 1);
    assert.strictEqual(totals.totalSavedMinutes, 15); // Only old quiz
  });

  test("filters by categories", () => {
    clearLedgerForTest();
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, status: "accepted" });
    recordEntry({ category: "worksheet", baselineMinutes: 40, actualMinutes: 20, status: "accepted" });
    recordEntry({ category: "research", baselineMinutes: 20, actualMinutes: 10, status: "accepted" });

    const totals = computeTotals({ categories: ["quiz", "research"] });
    assert.strictEqual(totals.acceptedCount, 2);
    assert.strictEqual(totals.totalSavedMinutes, 25); // 15 + 10
  });

  test("showTotal is false when acceptedCount < 3", () => {
    clearLedgerForTest();
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, status: "accepted" });
    recordEntry({ category: "worksheet", baselineMinutes: 40, actualMinutes: 20, status: "accepted" });

    const totals = computeTotals();
    assert.strictEqual(totals.acceptedCount, 2);
    assert.strictEqual(totals.showTotal, false);
  });

  test("showTotal is true when acceptedCount >= 3", () => {
    clearLedgerForTest();
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, status: "accepted" });
    recordEntry({ category: "worksheet", baselineMinutes: 40, actualMinutes: 20, status: "accepted" });
    recordEntry({ category: "research", baselineMinutes: 20, actualMinutes: 10, status: "accepted" });

    const totals = computeTotals();
    assert.strictEqual(totals.acceptedCount, 3);
    assert.strictEqual(totals.showTotal, true);
  });

  test("includes minEntriesRule in result", () => {
    clearLedgerForTest();
    const totals = computeTotals();
    assert.strictEqual(totals.minEntriesRule, 3);
  });
});

test("timeLedger — applyBaselineCorrection", () => {
  clearLedgerForTest();

  test("updates baseline for accepted entries in category", () => {
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, status: "accepted" });
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 12, status: "accepted" });
    recordEntry({ category: "worksheet", baselineMinutes: 40, actualMinutes: 20, status: "accepted" });

    const result = applyBaselineCorrection({ category: "quiz", correctedBaselineMinutes: 30 });
    assert.strictEqual(result.updated, 2);

    const totals = computeTotals();
    const quiz = totals.categoryBreakdown.find((c) => c.category === "quiz");
    // New baseline 30: (30-10) + (30-12) = 20 + 18 = 38
    assert.strictEqual(quiz.totalSavedMinutes, 38);
  });

  test("does not update rejected entries", () => {
    clearLedgerForTest();
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, status: "accepted" });
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 15, status: "rejected" });

    const result = applyBaselineCorrection({ category: "quiz", correctedBaselineMinutes: 30 });
    assert.strictEqual(result.updated, 1); // Only accepted
  });

  test("keeps original baseline in entry for audit", () => {
    clearLedgerForTest();
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, status: "accepted" });

    applyBaselineCorrection({ category: "quiz", correctedBaselineMinutes: 30 });

    const ledger = loadLedger();
    const entry = ledger[0];
    assert.ok(entry.baselineCorrection);
    assert.strictEqual(entry.baselineCorrection.originalBaseline, 25);
    assert.strictEqual(entry.baselineCorrection.correctedBaseline, 30);
    assert.ok(entry.baselineCorrection.correctedAt);
  });

  test("does not double-correct already corrected entries", () => {
    clearLedgerForTest();
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, status: "accepted" });

    applyBaselineCorrection({ category: "quiz", correctedBaselineMinutes: 30 });
    const result2 = applyBaselineCorrection({ category: "quiz", correctedBaselineMinutes: 35 });

    assert.strictEqual(result2.updated, 0); // Already corrected

    const ledger = loadLedger();
    assert.strictEqual(ledger[0].baselineCorrection.originalBaseline, 25); // Original preserved
    assert.strictEqual(ledger[0].baselineCorrection.correctedBaseline, 30); // First correction kept
  });

  test("returns 0 updated for non-existent category", () => {
    clearLedgerForTest();
    const result = applyBaselineCorrection({ category: "nonexistent", correctedBaselineMinutes: 30 });
    assert.strictEqual(result.updated, 0);
  });
});

test("timeLedger — explain", () => {
  test("explains accepted entry with positive savings", () => {
    const entry = {
      category: "quiz",
      baselineMinutes: 25,
      actualMinutes: 10,
      correctionMinutes: 2,
      timeSavedMinutes: 13,
      status: "accepted",
      traceId: "tr_123",
      baselineCorrection: null,
    };

    const explanation = explain(entry);
    assert.ok(explanation.includes("Category: Quiz"));
    assert.ok(explanation.includes("Baseline: 25 min"));
    assert.ok(explanation.includes("Actual time: 10 min"));
    assert.ok(explanation.includes("Correction time: 2 min"));
    assert.ok(explanation.includes("Calculation: 25 - 10 - 2 = 13 min"));
    assert.ok(explanation.includes("Time saved: 13 min"));
    assert.ok(explanation.includes("Trace: tr_123"));
  });

  test("explains rejected entry", () => {
    const entry = {
      category: "worksheet",
      baselineMinutes: 40,
      actualMinutes: 15,
      correctionMinutes: 0,
      timeSavedMinutes: 0,
      status: "rejected",
      traceId: "tr_456",
    };

    const explanation = explain(entry);
    assert.ok(explanation.includes("Status: Rejected → time saved = 0"));
  });

  test("explains zero savings", () => {
    const entry = {
      category: "lesson_plan",
      baselineMinutes: 30,
      actualMinutes: 35,
      correctionMinutes: 0,
      timeSavedMinutes: 0,
      status: "accepted",
    };

    const explanation = explain(entry);
    assert.ok(explanation.includes("No time saved"));
  });

  test("includes baseline correction info", () => {
    const entry = {
      category: "quiz",
      baselineMinutes: 30, // corrected
      actualMinutes: 10,
      correctionMinutes: 0,
      timeSavedMinutes: 20,
      status: "accepted",
      baselineCorrection: {
        originalBaseline: 25,
        correctedBaseline: 30,
        correctedAt: new Date().toISOString(),
      },
    };

    const explanation = explain(entry);
    assert.ok(explanation.includes("Baseline corrected from 25 to 30 min"));
  });
});

test("timeLedger — persistence", () => {
  clearLedgerForTest();

  test("getEntriesByCategory returns filtered entries", () => {
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, status: "accepted" });
    recordEntry({ category: "worksheet", baselineMinutes: 40, actualMinutes: 20, status: "accepted" });
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 12, status: "rejected" });

    const quizEntries = getEntriesByCategory("quiz");
    assert.strictEqual(quizEntries.length, 2);
    assert.ok(quizEntries.every((e) => e.category === "quiz"));
  });

  test("getRecentEntries returns most recent first", () => {
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, status: "accepted" });
    recordEntry({ category: "worksheet", baselineMinutes: 40, actualMinutes: 20, status: "accepted" });
    recordEntry({ category: "research", baselineMinutes: 20, actualMinutes: 10, status: "accepted" });

    const recent = getRecentEntries(2);
    assert.strictEqual(recent.length, 2);
    assert.strictEqual(recent[0].category, "research"); // Most recent first
    assert.strictEqual(recent[1].category, "worksheet");
  });

  test("clearLedger empties storage", () => {
    clearLedgerForTest(); // Ensure clean state
    recordEntry({ category: "quiz", baselineMinutes: 25, actualMinutes: 10, status: "accepted" });
    assert.strictEqual(loadLedger().length, 1);

    clearLedger();
    assert.strictEqual(loadLedger().length, 0);
  });
});