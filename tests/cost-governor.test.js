/**
 * Tests for costGovernor.js
 * Minimum 12 tests per spec.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  createEnvelope,
  reserve,
  commit,
  release,
  killSwitch,
  isKillSwitchActive,
  getEnvelope,
  getEnvelopesForTenant,
  getSnapshot,
  _clear,
} from "../src/core/costGovernor.js";

describe("costGovernor.js", () => {
  beforeEach(() => {
    _clear();
  });

  it("createEnvelope creates envelope with daily and monthly limits", () => {
    const env = createEnvelope({
      userId: "user1",
      tenantId: "tenant1",
      dailyLimitCents: 10000,
      monthlyLimitCents: 100000,
    });
    assert.strictEqual(env.userId, "user1");
    assert.strictEqual(env.tenantId, "tenant1");
    assert.strictEqual(env.dailyLimitCents, 10000);
    assert.strictEqual(env.monthlyLimitCents, 100000);
    assert.ok(env.daily);
    assert.ok(env.monthly);
    assert.ok(env.reservations);
  });

  it("createEnvelope rejects non-integer limits", () => {
    assert.throws(() => createEnvelope({ userId: "u", tenantId: "t", dailyLimitCents: 100.5, monthlyLimitCents: 1000 }), /dailyLimitCents must be a non-negative integer/);
    assert.throws(() => createEnvelope({ userId: "u", tenantId: "t", dailyLimitCents: 100, monthlyLimitCents: -1 }), /monthlyLimitCents must be a non-negative integer/);
  });

  it("reserve holds budget in both daily and monthly", () => {
    const env = createEnvelope({ userId: "user1", tenantId: "tenant1", dailyLimitCents: 10000, monthlyLimitCents: 100000 });
    const result = reserve(env, 500, { capabilityId: "cap.test", traceId: "trace-1" });
    assert.strictEqual(result.ok, true);
    assert.ok(result.reservationId);
    assert.strictEqual(result.remainingDaily, 9500);
    assert.strictEqual(result.remainingMonthly, 99500);
  });

  it("reserve rejects when daily limit exceeded", () => {
    const env = createEnvelope({ userId: "user1", tenantId: "tenant1", dailyLimitCents: 1000, monthlyLimitCents: 100000 });
    const r1 = reserve(env, 600, { capabilityId: "cap.a", traceId: "t1" });
    assert.strictEqual(r1.ok, true);
    const r2 = reserve(env, 500, { capabilityId: "cap.b", traceId: "t2" });
    assert.strictEqual(r2.ok, false);
    assert.ok(r2.reason.includes("Daily limit"));
  });

  it("reserve rejects when monthly limit exceeded", () => {
    const env = createEnvelope({ userId: "user1", tenantId: "tenant1", dailyLimitCents: 10000, monthlyLimitCents: 1000 });
    const r1 = reserve(env, 600, { capabilityId: "cap.a", traceId: "t1" });
    assert.strictEqual(r1.ok, true);
    const r2 = reserve(env, 500, { capabilityId: "cap.b", traceId: "t2" });
    assert.strictEqual(r2.ok, false);
    assert.ok(r2.reason.includes("Monthly limit"));
  });

  it("reserve rejects when kill switch active", () => {
    const env = createEnvelope({ userId: "user1", tenantId: "tenant1", dailyLimitCents: 10000, monthlyLimitCents: 100000 });
    killSwitch("tenant1");
    const result = reserve(env, 100, { capabilityId: "cap.test", traceId: "trace-1" });
    assert.strictEqual(result.ok, false);
    assert.ok(result.reason.includes("Kill switch active"));
  });

  it("commit converts reservation to spend", () => {
    const env = createEnvelope({ userId: "user1", tenantId: "tenant1", dailyLimitCents: 10000, monthlyLimitCents: 100000 });
    const r = reserve(env, 500, { capabilityId: "cap.test", traceId: "trace-1" });
    assert.strictEqual(r.ok, true);

    const c = commit(env, r.reservationId, 450, { traceId: "trace-1" });
    assert.strictEqual(c.ok, true);
    assert.strictEqual(c.spentDaily, 450);
    assert.strictEqual(c.spentMonthly, 450);
    assert.strictEqual(c.remainingDaily, 9550);
    assert.strictEqual(c.remainingMonthly, 99550);
  });

  it("commit rejects when actual exceeds reservation", () => {
    const env = createEnvelope({ userId: "user1", tenantId: "tenant1", dailyLimitCents: 10000, monthlyLimitCents: 100000 });
    const r = reserve(env, 500, { capabilityId: "cap.test", traceId: "trace-1" });
    const c = commit(env, r.reservationId, 600, { traceId: "trace-1" });
    assert.strictEqual(c.ok, false);
    assert.ok(c.reason.includes("exceeds reservation"));
  });

  it("commit rejects on traceId mismatch", () => {
    const env = createEnvelope({ userId: "user1", tenantId: "tenant1", dailyLimitCents: 10000, monthlyLimitCents: 100000 });
    const r = reserve(env, 500, { capabilityId: "cap.test", traceId: "trace-1" });
    const c = commit(env, r.reservationId, 450, { traceId: "trace-2" });
    assert.strictEqual(c.ok, false);
    assert.ok(c.reason.includes("Trace ID mismatch"));
  });

  it("release returns reservation to available budget", () => {
    const env = createEnvelope({ userId: "user1", tenantId: "tenant1", dailyLimitCents: 10000, monthlyLimitCents: 100000 });
    const r = reserve(env, 500, { capabilityId: "cap.test", traceId: "trace-1" });
    assert.strictEqual(r.ok, true);

    const rel = release(env, r.reservationId);
    assert.strictEqual(rel.ok, true);
    assert.strictEqual(rel.remainingDaily, 10000);
    assert.strictEqual(rel.remainingMonthly, 100000);
  });

  it("release rejects double release", () => {
    const env = createEnvelope({ userId: "user1", tenantId: "tenant1", dailyLimitCents: 10000, monthlyLimitCents: 100000 });
    const r = reserve(env, 500, { capabilityId: "cap.test", traceId: "trace-1" });
    release(env, r.reservationId);
    const rel2 = release(env, r.reservationId);
    assert.strictEqual(rel2.ok, false);
    assert.ok(rel2.reason.includes("Reservation released"));
  });

  it("killSwitch activates and blocks reservations", () => {
    const env = createEnvelope({ userId: "user1", tenantId: "tenant1", dailyLimitCents: 10000, monthlyLimitCents: 100000 });
    const ks = killSwitch("tenant1");
    assert.strictEqual(ks.ok, true);
    assert.strictEqual(isKillSwitchActive("tenant1"), true);

    const r = reserve(env, 100, { capabilityId: "cap.test", traceId: "trace-1" });
    assert.strictEqual(r.ok, false);
    assert.ok(r.reason.includes("Kill switch active"));
  });

  it("getEnvelope retrieves envelope by user and tenant", () => {
    createEnvelope({ userId: "user1", tenantId: "tenant1", dailyLimitCents: 10000, monthlyLimitCents: 100000 });
    const env = getEnvelope("user1", "tenant1");
    assert.ok(env);
    assert.strictEqual(env.userId, "user1");
  });

  it("getEnvelopesForTenant returns all envelopes for tenant", () => {
    createEnvelope({ userId: "user1", tenantId: "tenant1", dailyLimitCents: 10000, monthlyLimitCents: 100000 });
    createEnvelope({ userId: "user2", tenantId: "tenant1", dailyLimitCents: 5000, monthlyLimitCents: 50000 });
    createEnvelope({ userId: "user3", tenantId: "tenant2", dailyLimitCents: 2000, monthlyLimitCents: 20000 });

    const envs = getEnvelopesForTenant("tenant1");
    assert.strictEqual(envs.length, 2);
    assert.ok(envs.every(e => e.tenantId === "tenant1"));
  });

  it("getSnapshot returns complete envelope state", () => {
    const env = createEnvelope({ userId: "user1", tenantId: "tenant1", dailyLimitCents: 10000, monthlyLimitCents: 100000 });
    reserve(env, 500, { capabilityId: "cap.test", traceId: "trace-1" });

    const snap = getSnapshot(env);
    assert.strictEqual(snap.userId, "user1");
    assert.strictEqual(snap.tenantId, "tenant1");
    assert.strictEqual(snap.dailyLimitCents, 10000);
    assert.strictEqual(snap.monthlyLimitCents, 100000);
    assert.ok(snap.daily);
    assert.ok(snap.monthly);
    assert.strictEqual(snap.activeReservations, 1);
    assert.strictEqual(snap.killSwitchActive, false);
  });

  it("envelope is frozen and cannot be mutated", () => {
    const env = createEnvelope({ userId: "user1", tenantId: "tenant1", dailyLimitCents: 10000, monthlyLimitCents: 100000 });
    assert.throws(() => { env.dailyLimitCents = 9999; }, /Cannot assign to read only property/);
  });

  it("concurrent reservations tracked independently", () => {
    const env = createEnvelope({ userId: "user1", tenantId: "tenant1", dailyLimitCents: 10000, monthlyLimitCents: 100000 });
    const r1 = reserve(env, 300, { capabilityId: "cap.a", traceId: "t1" });
    const r2 = reserve(env, 400, { capabilityId: "cap.b", traceId: "t2" });
    assert.strictEqual(r1.ok, true);
    assert.strictEqual(r2.ok, true);
    assert.notStrictEqual(r1.reservationId, r2.reservationId);
  });

  it("integer cents only - fractional cents rejected", () => {
    const env = createEnvelope({ userId: "user1", tenantId: "tenant1", dailyLimitCents: 10000, monthlyLimitCents: 100000 });
    const r = reserve(env, 100.5, { capabilityId: "cap.test", traceId: "trace-1" });
    assert.strictEqual(r.ok, false);
    assert.ok(r.reason.includes("Invalid amount"));
  });
});