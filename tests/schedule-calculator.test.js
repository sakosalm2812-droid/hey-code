import test from 'node:test';
import assert from 'node:assert/strict';
import { nextCronRun, calculateNextScheduleRun } from '../src/core/scheduleCalculator.js';
const now = new Date(2026, 8, 30, 12, 12, 30);
test('schedule parser rejects invalid ranges, steps and impossible dates', () => {
  for (const value of ['60 * * * *', '* 24 * * *', '* * * 13 *', '*/0 * * * *', '1-0 * * * *', '*/1.5 * * * *', '0 0 31 2 *']) assert.equal(nextCronRun(value, now), null);
  for (const schedule of [NaN, Infinity, -1, new Date('invalid'), { time: '12:99' }, { time: '12:00', weekdays: [] }, { time: '12:00', weekdays: ['wrong'] }, { cron: '* * * * *', timezone: 'UTC' }]) assert.equal(calculateNextScheduleRun(schedule, now), null);
});
test('cron uses lists, named fields, Sunday alias and OR for restricted calendar days', () => {
  const result = nextCronRun('0 9 1 * fri', now);
  assert.equal(result.getDate(), 1); assert.equal(result.getMonth(), 9);
  const sunday = nextCronRun('0 9 * * 7', now);
  assert.equal(sunday.getDay(), 0);
  const stepped = nextCronRun('*/15 12 * sep wed', now);
  assert.equal(stepped.getMinutes(), 15);
});
test('rare leap-day schedules are found and macros align with calendar boundaries', () => {
  const leap = nextCronRun('0 0 29 feb *', now);
  assert.equal(leap.getFullYear(), 2028); assert.equal(leap.getMonth(), 1); assert.equal(leap.getDate(), 29);
  const hourly = calculateNextScheduleRun('@hourly', now);
  assert.equal(hourly.getHours(), 13); assert.equal(hourly.getMinutes(), 0);
  assert.equal(calculateNextScheduleRun({ everyMinutes: 5 }, now).getTime() - now.getTime(), 300000);
});
test('DST missing times are skipped and repeated local times remain future occurrences', () => {
  const old = process.env.TZ;
  process.env.TZ = 'America/New_York';
  try {
    const spring = nextCronRun('30 2 * * *', new Date('2026-03-08T05:00:00Z'));
    assert.equal(spring.toISOString(), '2026-03-09T06:30:00.000Z');
    const fall = nextCronRun('30 1 * * *', new Date('2026-11-01T05:45:00Z'));
    assert.equal(fall.toISOString(), '2026-11-01T06:30:00.000Z');
  } finally { if (old === undefined) delete process.env.TZ; else process.env.TZ = old; }
});
