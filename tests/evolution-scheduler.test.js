/**
 * Tests for evolutionScheduler.js
 * Minimum 8 tests per spec.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  planCycle,
  shouldRunNow,
  recordCycleOutcome,
  getScheduleRecord,
  getAllScheduleRecords,
  getNextCyclePlan,
  _clear,
} from "../src/core/evolutionScheduler.js";

describe("evolutionScheduler.js", () => {
  beforeEach(() => {
    _clear();
  });

  it("planCycle returns plan with jobs, deferred, maintenance", () => {
    const candidates = [
      { id: "job1", title: "Job 1", priority: 10, costCents: 100, dedupeKey: "key1" },
      { id: "job2", title: "Job 2", priority: 5, costCents: 200, dedupeKey: "key2" },
    ];
    const result = planCycle({
      now: "2026-10-20T10:00:00.000Z",
      cadence: "daily",
      budgetCents: 500,
      wipLimit: 3,
      running: [],
      candidates,
      knownKeys: [],
    });
    assert.strictEqual(result.ok, true);
    assert.ok(result.cycleId);
    assert.ok(Array.isArray(result.jobs));
    assert.ok(Array.isArray(result.deferred));
    assert.ok(Array.isArray(result.maintenanceJobs));
    assert.ok(result.scheduleRecord);
  });

  it("planCycle respects WIP limit", () => {
    const running = [
      { id: "run1", costCents: 100, dedupeKey: "run1" },
      { id: "run2", costCents: 100, dedupeKey: "run2" },
    ];
    const candidates = [
      { id: "job1", title: "Job 1", priority: 10, costCents: 100, dedupeKey: "key1" },
      { id: "job2", title: "Job 2", priority: 5, costCents: 200, dedupeKey: "key2" },
    ];
    const result = planCycle({
      now: "2026-10-20T10:00:00.000Z",
      cadence: "daily",
      budgetCents: 1000,
      wipLimit: 3,
      running,
      candidates,
      knownKeys: [],
    });
    assert.strictEqual(result.jobs.length, 1);
    assert.strictEqual(result.deferred.length, 1);
    assert.ok(result.deferred[0].reason);
  });

  it("planCycle respects budget", () => {
    const candidates = [
      { id: "job1", title: "Job 1", priority: 10, costCents: 300, dedupeKey: "key1" },
      { id: "job2", title: "Job 2", priority: 5, costCents: 300, dedupeKey: "key2" },
    ];
    const result = planCycle({
      now: "2026-10-20T10:00:00.000Z",
      cadence: "daily",
      budgetCents: 500,
      wipLimit: 3,
      running: [],
      candidates,
      knownKeys: [],
    });
    assert.strictEqual(result.jobs.length, 1);
    assert.strictEqual(result.deferred.length, 1);
    assert.ok(result.deferred[0].reason);
  });

  it("planCycle routes maintenance to separate lane", () => {
    const candidates = [
      { id: "maint1", title: "Security Patch", priority: 10, costCents: 50, dedupeKey: "maint1", lane: "maintenance", deadline: "2026-10-25T00:00:00.000Z" },
      { id: "job1", title: "Regular Job", priority: 5, costCents: 100, dedupeKey: "job1" },
    ];
    const result = planCycle({
      now: "2026-10-20T10:00:00.000Z",
      cadence: "daily",
      budgetCents: 500,
      wipLimit: 3,
      running: [],
      candidates,
      knownKeys: [],
    });
    assert.strictEqual(result.maintenanceJobs.length, 1);
    assert.strictEqual(result.maintenanceJobs[0].id, "maint1");
    assert.strictEqual(result.jobs.length, 1);
    assert.strictEqual(result.jobs[0].id, "job1");
  });

  it("planCycle deduplicates against knownKeys", () => {
    const candidates = [
      { id: "job1", title: "Job 1", priority: 10, costCents: 100, dedupeKey: "known-key" },
    ];
    const result = planCycle({
      now: "2026-10-20T10:00:00.000Z",
      cadence: "daily",
      budgetCents: 500,
      wipLimit: 3,
      running: [],
      candidates,
      knownKeys: ["known-key"],
    });
    assert.strictEqual(result.jobs.length, 0);
    assert.strictEqual(result.deferred.length, 1);
    assert.ok(result.deferred[0].reason);
  });

  it("planCycle refuses invalid configuration", () => {
    const result = planCycle({
      cadence: "invalid-cadence",
      budgetCents: 100,
      wipLimit: 3,
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.reason.includes("Unknown cadence"));
  });

  it("shouldRunNow returns true for on-demand", () => {
    const job = { cadence: "on-demand" };
    const result = shouldRunNow(job, { now: Date.now(), lastRun: "2026-01-01T00:00:00.000Z", cadence: "on-demand" });
    assert.strictEqual(result, true);
  });

  it("shouldRunNow returns true when cadence elapsed", () => {
    const job = { cadence: "daily" };
    const now = Date.now();
    const lastRun = new Date(now - 25 * 60 * 60 * 1000).toISOString();
    const result = shouldRunNow(job, { now, lastRun, cadence: "daily" });
    assert.strictEqual(result, true);
  });

  it("shouldRunNow returns false when cadence not elapsed", () => {
    const job = { cadence: "daily" };
    const now = Date.now();
    const lastRun = new Date(now - 12 * 60 * 60 * 1000).toISOString();
    const result = shouldRunNow(job, { now, lastRun, cadence: "daily" });
    assert.strictEqual(result, false);
  });

  it("shouldRunNow returns false for mismatched cadence", () => {
    const job = { cadence: "weekly" };
    const result = shouldRunNow(job, { now: Date.now(), lastRun: "2026-01-01T00:00:00.000Z", cadence: "daily" });
    assert.strictEqual(result, false);
  });

  it("recordCycleOutcome records outcome and returns next cycle", () => {
    const plan = planCycle({
      now: "2026-10-20T10:00:00.000Z",
      cadence: "daily",
      budgetCents: 500,
      wipLimit: 3,
      running: [],
      candidates: [],
      knownKeys: [],
    });
    const outcome = recordCycleOutcome(plan.cycleId, { success: true, jobsCompleted: 0 });
    assert.strictEqual(outcome.recorded, true);
    assert.ok(outcome.nextCycleAt);
    const nextCycle = new Date(outcome.nextCycleAt).getTime();
    const expected = new Date("2026-10-20T10:00:00.000Z").getTime() + 24 * 60 * 60 * 1000;
    assert.strictEqual(nextCycle, expected);
  });

  it("recordCycleOutcome returns false for unknown cycle", () => {
    const outcome = recordCycleOutcome("unknown-cycle", { success: true });
    assert.strictEqual(outcome.recorded, false);
  });

  it("getScheduleRecord retrieves cycle record", () => {
    const plan = planCycle({
      now: "2026-10-20T10:00:00.000Z",
      cadence: "daily",
      budgetCents: 500,
      wipLimit: 3,
      running: [],
      candidates: [],
      knownKeys: [],
    });
    const record = getScheduleRecord(plan.cycleId);
    assert.ok(record);
    assert.strictEqual(record.cycleId, plan.cycleId);
  });

  it("getAllScheduleRecords returns all records", () => {
    planCycle({ now: "2026-10-20T10:00:00.000Z", cadence: "daily", budgetCents: 500, wipLimit: 3, running: [], candidates: [], knownKeys: [] });
    planCycle({ now: "2026-10-21T10:00:00.000Z", cadence: "daily", budgetCents: 500, wipLimit: 3, running: [], candidates: [], knownKeys: [] });
    const records = getAllScheduleRecords();
    assert.strictEqual(records.length, 2);
  });

  it("getNextCyclePlan returns plan", () => {
    const plan = getNextCyclePlan({
      now: "2026-10-20T10:00:00.000Z",
      cadence: "daily",
      budgetCents: 500,
      wipLimit: 3,
      running: [],
      candidates: [{ id: "j1", costCents: 100, dedupeKey: "k1" }],
      knownKeys: [],
    });
    assert.strictEqual(plan.ok, true);
    assert.ok(plan.cycleId);
  });

  it("planCycle is deterministic", () => {
    const input = { now: "2026-10-20T10:00:00.000Z", cadence: "daily", budgetCents: 500, wipLimit: 3, running: [], candidates: [{ id: "j1", costCents: 100, dedupeKey: "k1" }], knownKeys: [] };
    const r1 = planCycle(input);
    _clear();
    const r2 = planCycle(input);
    assert.strictEqual(r1.jobs.length, r2.jobs.length);
    assert.strictEqual(r1.deferred.length, r2.deferred.length);
  });
});