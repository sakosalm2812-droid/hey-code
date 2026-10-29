import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { log as auditLog } from './auditLogger.js';

export function parseCron(cronString) {
  if (!cronString || typeof cronString !== 'string') {
    throw new Error('Invalid cron string');
  }
  const parts = cronString.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron format: "${cronString}". Expected 5 fields.`);
  }

  // Validate fields: min (0-59), hour (0-23), dom (1-31), month (1-12), dow (0-7)
  const validatePart = (p, min, max) => {
    if (p === '*') return;
    if (p.startsWith('*/')) {
      const step = Number(p.slice(2));
      if (!Number.isInteger(step) || step < 1 || step > max) throw new Error(`Invalid cron step: ${p}`);
      return;
    }
    const num = Number(p);
    if (!Number.isInteger(num) || num < min || num > max) {
      throw new Error(`Invalid cron value: ${p}`);
    }
  };

  validatePart(parts[0], 0, 59);
  validatePart(parts[1], 0, 23);
  validatePart(parts[2], 1, 31);
  validatePart(parts[3], 1, 12);
  validatePart(parts[4], 0, 7);

  return parts;
}

export function computeNextRun(cronString, fromDate = new Date()) {
  const parts = parseCron(cronString);
  const next = new Date(fromDate.getTime() + 60000); // at least 1 minute forward
  next.setSeconds(0);
  next.setMilliseconds(0);

  // If simple minute step e.g. */5
  if (parts[0].startsWith('*/')) {
    const step = Number(parts[0].slice(2));
    const currentMin = next.getMinutes();
    const nextMin = Math.ceil(currentMin / step) * step;
    if (nextMin >= 60) {
      next.setHours(next.getHours() + 1);
      next.setMinutes(nextMin % 60);
    } else {
      next.setMinutes(nextMin);
    }
    return next.toISOString();
  }

  // Default next minute
  return next.toISOString();
}

export class DurableScheduler {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.resolve(process.cwd(), 'data', 'scheduler', 'jobs.json');
    this.auditLogger = options.auditLogger || auditLog;
    this.workerId = options.workerId || `worker_${crypto.randomUUID().slice(0, 8)}`;
    this.jobs = new Map();
    this.watchers = new Map();
    this.jobHandlers = new Map(); // jobId -> fn

    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch {}

    this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          for (const item of data) {
            const existing = this.jobs.get(item.id);
            if (existing) {
              Object.assign(existing, item);
            } else {
              this.jobs.set(item.id, item);
            }
          }
        }
      }
    } catch {
      this.jobs.clear();
    }
  }

  saveState() {
    try {
      const items = Array.from(this.jobs.values());
      fs.writeFileSync(this.storagePath, JSON.stringify(items, null, 2), 'utf-8');
    } catch {}
  }

  schedule({ cron, job, payload = {}, timezone = 'UTC' }) {
    parseCron(cron); // Throws if invalid cron

    const id = `sched_${crypto.randomUUID()}`;
    const next_run_at = computeNextRun(cron);

    const jobRecord = {
      id,
      type: 'cron',
      cron,
      jobName: typeof job === 'string' ? job : 'custom_fn',
      payload,
      timezone,
      next_run_at,
      last_run_at: null,
      lease_owner: null,
      lease_until: null,
      cancelled: false,
      run_count: 0,
      created_at: new Date().toISOString(),
    };

    if (typeof job === 'function') {
      this.jobHandlers.set(id, job);
    }

    this.jobs.set(id, jobRecord);
    this.saveState();
    return id;
  }

  watch({ event, condition = null, job }) {
    if (!event) throw new TypeError('Event name is required for watch()');

    const id = `watch_${crypto.randomUUID()}`;
    const watchRecord = {
      id,
      type: 'watch',
      event,
      condition,
      jobName: typeof job === 'string' ? job : 'custom_fn',
      cancelled: false,
      run_count: 0,
    };

    if (typeof job === 'function') {
      this.jobHandlers.set(id, job);
    }

    this.watchers.set(id, watchRecord);
    return id;
  }

  cancel(id) {
    if (this.jobs.has(id)) {
      const j = this.jobs.get(id);
      j.cancelled = true;
      this.saveState();
      return true;
    }
    if (this.watchers.has(id)) {
      const w = this.watchers.get(id);
      w.cancelled = true;
      return true;
    }
    return false;
  }

  list() {
    return Array.from(this.jobs.values()).filter((j) => !j.cancelled);
  }

  acquireLease(jobId, workerId = this.workerId, leaseDurationMs = 10000, now = Date.now(), reload = false) {
    if (reload) this.loadState();
    const job = this.jobs.get(jobId);
    if (!job || job.cancelled) return false;

    // Check if lease is active by someone else
    if (job.lease_until && new Date(job.lease_until).getTime() > now) {
      if (job.lease_owner && job.lease_owner !== workerId) {
        return false; // locked by another worker
      }
    }

    // Acquire lease
    job.lease_owner = workerId;
    job.lease_until = new Date(now + leaseDurationMs).toISOString();
    this.saveState();
    return true;
  }

  releaseLease(jobId, workerId = this.workerId) {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    if (job.lease_owner === workerId) {
      job.lease_owner = null;
      job.lease_until = null;
      this.saveState();
      return true;
    }
    return false;
  }

  async tick(nowTime = Date.now(), workerId = this.workerId) {
    this.loadState();
    const fired = [];
    const nowISO = new Date(nowTime).toISOString();

    for (const job of this.jobs.values()) {
      if (job.cancelled) continue;

      if (job.next_run_at && new Date(job.next_run_at).getTime() <= nowTime) {
        // Must acquire lease before firing
        const hasLease = this.acquireLease(job.id, workerId, 10000, nowTime);
        if (!hasLease) {
          continue; // Cannot fire without lease
        }

        const isMissed = job.last_run_at && (nowTime - new Date(job.next_run_at).getTime() > 120000);
        if (isMissed && typeof this.auditLogger === 'function') {
          this.auditLogger({
            event_type: 'schedule:missed',
            actor: workerId,
            correlation_id: job.id,
            payload: { jobId: job.id, scheduled_for: job.next_run_at },
          });
        }

        try {
          const handler = this.jobHandlers.get(job.id);
          if (handler) {
            await handler(job.payload);
          }
          job.run_count++;
          job.last_run_at = nowISO;
          job.next_run_at = computeNextRun(job.cron, new Date(nowTime));

          if (typeof this.auditLogger === 'function') {
            this.auditLogger({
              event_type: 'schedule:fired',
              actor: workerId,
              correlation_id: job.id,
              payload: { jobId: job.id, run_count: job.run_count },
            });
          }
          fired.push(job.id);
        } catch (err) {
          if (typeof this.auditLogger === 'function') {
            this.auditLogger({
              event_type: 'schedule:failed',
              actor: workerId,
              correlation_id: job.id,
              payload: { jobId: job.id, error: err.message },
            });
          }
        } finally {
          this.releaseLease(job.id, workerId);
        }
      }
    }

    return fired;
  }

  async triggerWatch(event, payload = {}) {
    const fired = [];
    for (const w of this.watchers.values()) {
      if (w.cancelled) continue;
      if (w.event === event) {
        if (!w.condition || w.condition(payload)) {
          const handler = this.jobHandlers.get(w.id);
          if (handler) await handler(payload);
          w.run_count++;
          fired.push(w.id);
        }
      }
    }
    return fired;
  }
}

export const defaultScheduler = new DurableScheduler();

export function schedule(input) {
  return defaultScheduler.schedule(input);
}

export function watch(input) {
  return defaultScheduler.watch(input);
}

export function cancel(id) {
  return defaultScheduler.cancel(id);
}

export function list() {
  return defaultScheduler.list();
}

export default {
  DurableScheduler,
  defaultScheduler,
  schedule,
  watch,
  cancel,
  list,
  parseCron,
  computeNextRun,
};
