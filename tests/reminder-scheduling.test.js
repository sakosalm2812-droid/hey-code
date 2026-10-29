import assert from "node:assert/strict";
import test from "node:test";
import { tasksCalendarEngine as calendar } from "../src/core/tasksCalendarEngine.js";

test("reminders reject invalid dates and accept the existing dueAt contract", () => {
  assert.throws(() => calendar.createReminder({ title: "Missing date" }), /valid reminder date/);
  const reminder = calendar.createReminder({ title: "Due alias", dueAt: new Date(Date.now() + 60_000).toISOString() });
  assert.equal(reminder.state, "scheduled");
  assert.ok(reminder.triggerAt);
  calendar.acknowledgeReminder(reminder.id);
  calendar.fireReminder(reminder.id);
  assert.equal(calendar.getReminder(reminder.id).state, "acknowledged");
});

test("long waits are bounded and rescheduling cannot leave duplicate timers", () => {
  const originalSet = globalThis.setTimeout;
  const originalClear = globalThis.clearTimeout;
  const timers = new Map();
  globalThis.setTimeout = (callback, delay) => {
    const timer = { callback, delay, unref() {} };
    timers.set(timer, delay);
    return timer;
  };
  globalThis.clearTimeout = timer => timers.delete(timer);
  try {
    const reminder = calendar.createReminder({ title: "Next year", triggerAt: new Date(Date.now() + 365 * 86400_000).toISOString() });
    assert.equal([...timers.values()][0], 2_147_483_647);
    calendar.scheduleReminder(reminder.id);
    assert.equal(timers.size, 1);
    calendar.snoozeReminder(reminder.id, 10);
    assert.equal(timers.size, 1);
    assert.ok([...timers.values()][0] <= 600_000);
    calendar.acknowledgeReminder(reminder.id);
    assert.equal(timers.size, 0);
  } finally { globalThis.setTimeout = originalSet; globalThis.clearTimeout = originalClear; }
});
