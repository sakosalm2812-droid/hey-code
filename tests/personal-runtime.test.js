import { test } from "node:test";
import assert from "node:assert/strict";
import { HEY } from "../src/core/index.js";

test("trust, calendar and focus engines are reachable through the HEY barrel", () => {
  assert.equal(typeof HEY.trust.state, "function");
  assert.equal(typeof HEY.calendar.allTasks, "function");
  assert.equal(typeof HEY.focus.setMode, "function");
  assert.equal(typeof HEY.trust.subscribe, "function");
  assert.equal(typeof HEY.calendar.subscribe, "function");
  assert.equal(typeof HEY.focus.subscribe, "function");
});

test("trust center gates sensors, grants, background services and GDPR flows", () => {
  const trust = HEY.trust;
  const mic = trust.mic(true);
  assert.equal(mic.success, true);
  assert.equal(trust.sensors().microphone, true);

  const grant = trust.grant({ permission: "notification", reason: "assert test" });
  assert.ok(grant.id);
  assert.ok(trust.grants().some((item) => item.id === grant.id));
  trust.revokeGrant(grant.id);
  assert.ok(!trust.grants().some((item) => item.id === grant.id));

  const bg = trust.addBackgroundService({ name: "Sync", purpose: "calendar sync" });
  assert.equal(bg.status, "running");
  assert.ok(trust.backgroundServices().some((item) => item.name === "Sync"));

  const exportRequest = trust.requestExport({ accountId: "me", format: "json" });
  assert.ok(exportRequest.id);

  const state = trust.state();
  for (const key of ["sensors", "activeGrants", "backgroundServices", "securityAlerts"]) {
    assert.ok(key in state, `trust state missing ${key}`);
  }
});

test("calendar engine manages tasks, dependencies, reminders and events", () => {
  const cal = HEY.calendar;
  const task = cal.createTask({ title: "Wire Trust", projectId: "wires", priority: "high" });
  assert.equal(task.state, "active");
  assert.equal(cal.getTask(task.id).title, "Wire Trust");

  const block = cal.createTask({ title: "Blocks Trust" });
  cal.addDependency(task.id, block.id);
  assert.ok(cal.blockedTasks(block.id).some((item) => item.id === task.id));

  cal.setTaskState(task.id, "completed");
  assert.ok(cal.tasksByState("completed").some((item) => item.id === task.id));

  const reminder = cal.createReminder({ title: "Water", dueAt: new Date().toISOString() });
  cal.acknowledgeReminder(reminder.id);
  assert.ok(cal.getReminder(reminder.id).acknowledgedAt);

  const event = cal.createEvent({ title: "Sync", date: "2026-09-18" });
  assert.equal(cal.getEvent(event.id).title, "Sync");
});

test("mode engine drives focus profiles and overrides", () => {
  const focus = HEY.focus;
  const set = focus.setMode("focus");
  assert.equal(set.success, true);
  assert.equal(focus.current(), "focus");

  const profile = focus.createProfile({
    name: "Deep",
    mode: "focus",
    overrides: { notifications: false },
  });
  assert.ok(profile.id);
  assert.equal(focus.getProfile(profile.id).name, "Deep");
  assert.equal(focus.applyProfile(profile.id).success, true);

  focus.setOverride("notifications", false, "profile");
  const override = focus.getOverride("notifications", "profile");
  const rawOverride = override && typeof override === "object" ? override.value : override;
  assert.equal(rawOverride, false);
  const effective = focus.effective("notifications");
  const rawEffective = effective && typeof effective === "object" ? effective.value : effective;
  assert.equal(rawEffective, false);

  const exported = focus.exportMode("focus");
  assert.ok(exported && exported.mode === "focus");
});