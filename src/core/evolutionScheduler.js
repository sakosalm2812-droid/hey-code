/**
 * HEY — Evolution Scheduler (Part 15, Phase C, Module 7.9)
 *
 * Runs researchPipeline on chosen cadence.
 * Returns plan for external scheduler. No timer.
 * Uses Part 5's researchPipeline.planCycle.
 *
 * @module core/evolutionScheduler
 */

import { planCycle as researchPlanCycle } from "./researchPipeline.js";

const SCHEDULE_STATE = new Map();

/**
 * Plan an evolution cycle using researchPipeline.
 * @param {Object} input
 * @param {number|string|Date} [input.now=Date.now()]
 * @param {string} [input.cadence='daily'] - 'on-demand'|'daily'|'weekly'|'monthly'|'quarterly'
 * @param {number} [input.budgetCents=0] - Budget for this cycle
 * @param {number} [input.wipLimit=3] - Max concurrent jobs
 * @param {Object[]} [input.running=[]] - Currently running jobs
 * @param {Object[]} [input.candidates=[]] - Candidate jobs
 * @param {string[]} [input.knownKeys=[]] - Known dedupe keys
 * @param {number} [input.maintenanceWindowHours=4] - Maintenance window in hours
 * @returns {Object} Plan with jobs, deferred, maintenance
 */
export function planCycle(input = {}) {
  const now = input.now ?? Date.now();
  const cadence = input.cadence ?? "daily";
  const budgetCents = input.budgetCents ?? 0;
  const wipLimit = input.wipLimit ?? 3;
  const running = input.running ?? [];
  const candidates = input.candidates ?? [];
  const knownKeys = input.knownKeys ?? [];
  const maintenanceWindowHours = input.maintenanceWindowHours ?? 4;

  // Delegate to researchPipeline
  const plan = researchPlanCycle({
    now,
    cadence,
    budgetCents,
    wipLimit,
    running,
    candidates,
    knownKeys,
  });

  if (!plan.ok) {
    return plan;
  }

  // Separate maintenance jobs (already done by researchPipeline)
  const maintenanceJobs = plan.maintenance ?? [];

  // Add schedule metadata
  const cycleId = `cycle-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const scheduleRecord = Object.freeze({
    cycleId,
    plannedAt: new Date(now).toISOString(),
    cadence,
    budgetCents,
    wipLimit,
    wipUsed: plan.wipUsed,
    plannedCostCents: plan.plannedCostCents,
    remainingCents: plan.remainingCents,
    jobsCount: plan.jobs.length,
    deferredCount: plan.deferred.length,
    maintenanceCount: maintenanceJobs.length,
    reason: plan.reason,
  });

  SCHEDULE_STATE.set(cycleId, scheduleRecord);

  return Object.freeze({
    ok: true,
    cycleId,
    jobs: plan.jobs,
    deferred: plan.deferred,
    maintenanceJobs,
    scheduleRecord,
  });
}

/**
 * Check if a job should run now based on cadence.
 * @param {Object} job
 * @param {Object} input
 * @param {number|string|Date} input.now
 * @param {string} input.lastRun - ISO timestamp of last run
 * @param {string} input.cadence - Cadence string
 * @returns {boolean}
 */
export function shouldRunNow(job, { now, lastRun, cadence }) {
  if (!job || typeof job !== "object") return false;
  if (!job.cadence || job.cadence !== cadence) return false;

  const nowMs = typeof now === "number" ? now : new Date(now).getTime();
  const lastRunMs = new Date(lastRun).getTime();

  if (isNaN(nowMs) || isNaN(lastRunMs)) return false;

  const elapsedMs = nowMs - lastRunMs;
  const cadenceMsMap = {
    "on-demand": 0,
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
    quarterly: 90 * 24 * 60 * 60 * 1000,
  };
  const cadenceMs = cadenceMsMap[cadence];

  if (cadenceMs === undefined) return false;
  if (cadence === "on-demand") return true;

  return elapsedMs >= cadenceMs;
}

/**
 * Record cycle outcome.
 * @param {string} cycleId
 * @param {Object} outcome
 * @returns {{ recorded: boolean, nextCycleAt: string }}
 */
export function recordCycleOutcome(cycleId, outcome) {
  const record = SCHEDULE_STATE.get(cycleId);
  if (!record) {
    return { recorded: false, nextCycleAt: null };
  }

  const outcomeRecord = Object.freeze({
    ...record,
    outcome: Object.freeze(outcome),
    recordedAt: new Date().toISOString(),
  });

  SCHEDULE_STATE.set(cycleId, outcomeRecord);

  // Calculate next cycle time
  const cadenceMs = {
    "on-demand": 0,
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
    quarterly: 90 * 24 * 60 * 60 * 1000,
  }[record.cadence];

  const nextCycleAt = new Date(record.plannedAt).getTime() + cadenceMs;

  return {
    recorded: true,
    nextCycleAt: new Date(nextCycleAt).toISOString(),
  };
}

/**
 * Get schedule record for a cycle.
 * @param {string} cycleId
 * @returns {Object|undefined}
 */
export function getScheduleRecord(cycleId) {
  return SCHEDULE_STATE.get(cycleId);
}

/**
 * Get all schedule records.
 * @returns {Object[]}
 */
export function getAllScheduleRecords() {
  return Object.freeze([...SCHEDULE_STATE.values()]);
}

/**
 * Get next cycle plan based on current state.
 * @param {Object} input - Same as planCycle input
 * @returns {Object}
 */
export function getNextCyclePlan(input) {
  return planCycle(input);
}

/**
 * Clear all state (test helper).
 */
export function _clear() {
  SCHEDULE_STATE.clear();
}

export default {
  planCycle,
  shouldRunNow,
  recordCycleOutcome,
  getScheduleRecord,
  getAllScheduleRecords,
  getNextCyclePlan,
  _clear,
};