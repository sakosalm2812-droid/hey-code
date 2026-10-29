import { shouldRunNow } from '../src/core/evolutionScheduler.js';

const job = { cadence: "on-demand" };
const result = shouldRunNow(job, { now: Date.now(), lastRun: "2026-01-01T00:00:00.000Z", cadence: "on-demand" });
console.log('Result:', result);
console.log('Job cadence:', job.cadence);
console.log('Input cadence:', "on-demand");