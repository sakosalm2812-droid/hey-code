import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DurableScheduler } from '../src/core/durableScheduler.js';

test('PRIM-012 Acceptance Test 1: Cron fires at correct time', async () => {
  const tmpPath = path.resolve('tmp', 'scheduler-1.json');
  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

  let firedCount = 0;
  const scheduler = new DurableScheduler({ storagePath: tmpPath });
  const id = scheduler.schedule({
    cron: '*/5 * * * *',
    job: () => {
      firedCount++;
    },
  });

  // Next run is in the future; immediate tick should not fire
  const firedBefore = await scheduler.tick(Date.now());
  assert.equal(firedBefore.length, 0);
  assert.equal(firedCount, 0);

  // Advance time past next_run_at
  const job = scheduler.jobs.get(id);
  const nextTime = new Date(job.next_run_at).getTime() + 1000;
  const firedAfter = await scheduler.tick(nextTime);

  assert.equal(firedAfter.length, 1);
  assert.equal(firedCount, 1);
});

test('PRIM-012 Acceptance Test 2: Restart does not double-fire', async () => {
  const tmpPath = path.resolve('tmp', 'scheduler-2.json');
  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

  let executionCount = 0;
  const handler = () => {
    executionCount++;
  };

  const scheduler1 = new DurableScheduler({ storagePath: tmpPath });
  const id = scheduler1.schedule({ cron: '* * * * *', job: handler });

  // Fast forward past run time
  const job = scheduler1.jobs.get(id);
  const runTime = new Date(job.next_run_at).getTime() + 500;
  await scheduler1.tick(runTime);
  assert.equal(executionCount, 1);

  // Restart scheduler from saved disk state
  const scheduler2 = new DurableScheduler({ storagePath: tmpPath });
  scheduler2.jobHandlers.set(id, handler);

  // Ticking at same time should NOT fire again
  const secondTickFired = await scheduler2.tick(runTime);
  assert.equal(secondTickFired.length, 0);
  assert.equal(executionCount, 1, 'must not double fire on restart');
});

test('PRIM-012 Acceptance Test 3: Two workers do not both fire the same job', async () => {
  const tmpPath = path.resolve('tmp', 'scheduler-3.json');
  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

  let executionCount = 0;
  const handler = () => {
    executionCount++;
  };

  const scheduler1 = new DurableScheduler({ storagePath: tmpPath, workerId: 'worker-A' });
  const id = scheduler1.schedule({ cron: '* * * * *', job: handler });

  const scheduler2 = new DurableScheduler({ storagePath: tmpPath, workerId: 'worker-B' });
  scheduler2.jobHandlers.set(id, handler);

  const job = scheduler1.jobs.get(id);
  const runTime = new Date(job.next_run_at).getTime() + 100;

  // Worker A acquires lease
  scheduler1.acquireLease(id, 'worker-A', 15000, runTime);

  // Worker B attempts tick
  const workerBFired = await scheduler2.tick(runTime, 'worker-B');
  assert.equal(workerBFired.length, 0, 'worker B cannot fire while worker A holds lease');
  assert.equal(executionCount, 0);
});

test('PRIM-012 Acceptance Test 4: Missed run fires once on resume', async () => {
  const tmpPath = path.resolve('tmp', 'scheduler-4.json');
  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

  let executionCount = 0;
  const scheduler = new DurableScheduler({ storagePath: tmpPath });
  const id = scheduler.schedule({
    cron: '* * * * *',
    job: () => {
      executionCount++;
    },
  });

  // Simulate missed schedule 3 hours ago
  const job = scheduler.jobs.get(id);
  job.last_run_at = new Date(Date.now() - 4 * 3600000).toISOString();
  job.next_run_at = new Date(Date.now() - 3 * 3600000).toISOString();
  scheduler.saveState();

  // Tick now
  const fired = await scheduler.tick(Date.now());
  assert.equal(fired.length, 1);
  assert.equal(executionCount, 1, 'missed run should fire exactly once');

  // Next run is projected forward
  assert.ok(new Date(job.next_run_at).getTime() > Date.now());
});

test('PRIM-012 Acceptance Test 5: Cancel stops future runs', async () => {
  const tmpPath = path.resolve('tmp', 'scheduler-5.json');
  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

  let runCount = 0;
  const scheduler = new DurableScheduler({ storagePath: tmpPath });
  const id = scheduler.schedule({
    cron: '* * * * *',
    job: () => {
      runCount++;
    },
  });

  scheduler.cancel(id);
  assert.equal(scheduler.list().length, 0);

  const targetTime = Date.now() + 100000;
  const fired = await scheduler.tick(targetTime);
  assert.equal(fired.length, 0);
  assert.equal(runCount, 0, 'cancelled job must never run');
});

test('PRIM-012 Acceptance Test 6: Invalid cron rejected', () => {
  const scheduler = new DurableScheduler();
  assert.throws(() => {
    scheduler.schedule({ cron: 'not a cron' });
  }, /Invalid cron/);

  assert.throws(() => {
    scheduler.schedule({ cron: '99 * * * *' }); // minute 99 > 59
  }, /Invalid cron value/);
});
