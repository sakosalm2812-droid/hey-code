/**
 * Tests for src/core/agentHealth.js.
 *
 * The health model exists to stop two things: selecting an agent that is known to be
 * broken, and silently un-blocking one because it happened to succeed. Both are
 * asserted here, along with the thresholds and the mandatory reasons.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_THRESHOLDS,
  canonicalState,
  clearBlocked,
  createHealthRecord,
  isSelectable,
  recordFailure,
  recordSuccess,
  setBlocked,
  setDisabled,
  summarizeHealth,
} from '../src/core/agentHealth.js';

const failTimes = (record, times, reason = 'provider timeout') => {
  let next = record;
  for (let i = 0; i < times; i += 1) next = recordFailure(next, reason);
  return next;
};

test('a new record is healthy with zero counters and no clock', () => {
  const record = createHealthRecord('prayer-times');
  assert.equal(record.state, 'healthy');
  assert.equal(record.consecutiveFailures, 0);
  assert.equal(record.totalSuccesses, 0);
  assert.equal(record.totalFailures, 0);
  assert.deepEqual(record.latency, { samples: 0, totalMs: 0, averageMs: 0 });
  assert.deepEqual(record.history, []);
  assert.equal(typeof record.createdAt, 'undefined');
  assert.equal(JSON.stringify(record).includes('T00:'), false, 'no ISO timestamps anywhere');
  assert.throws(() => createHealthRecord(''), TypeError);
});

test('an agent degrades after the configured consecutive failures', () => {
  const base = createHealthRecord('news');
  assert.equal(failTimes(base, DEFAULT_THRESHOLDS.degradedAfter - 1).state, 'healthy');
  const degraded = failTimes(base, DEFAULT_THRESHOLDS.degradedAfter);
  assert.equal(degraded.state, 'degraded');
  assert.equal(degraded.consecutiveFailures, 3);
  assert.equal(degraded.totalFailures, 3);
  assert.equal(degraded.lastFailureReason, 'provider timeout');
  assert.equal(isSelectable(degraded), true, 'degraded is selectable, by design');
});

test('an agent becomes unavailable after the configured failures', () => {
  const unavailable = failTimes(createHealthRecord('news'), DEFAULT_THRESHOLDS.unavailableAfter);
  assert.equal(unavailable.state, 'unavailable');
  assert.equal(isSelectable(unavailable), false);
  assert.equal(failTimes(unavailable, 1).state, 'unavailable', 'it does not climb back on its own');
});

test('custom thresholds are honoured and validated', () => {
  const fresh = createHealthRecord('news');
  const options = { degradedAfter: 1, unavailableAfter: 2 };
  const degraded = recordFailure(fresh, 'boom', options);
  assert.equal(degraded.state, 'degraded');
  assert.equal(recordFailure(degraded, 'boom', options).state, 'unavailable');
  assert.throws(() => recordFailure(fresh, 'boom', { degradedAfter: 4, unavailableAfter: 4 }), TypeError);
  assert.throws(() => recordFailure(fresh, 'boom', { degradedAfter: 0, unavailableAfter: 2 }), TypeError);
});

test('success resets the failure counters and restores healthy', () => {
  const degraded = failTimes(createHealthRecord('news'), 3);
  const recovered = recordSuccess(degraded, 250);
  assert.equal(recovered.state, 'healthy');
  assert.equal(recovered.consecutiveFailures, 0);
  assert.equal(recovered.totalFailures, 3, 'history is kept');
  assert.equal(recovered.totalSuccesses, 1);
  assert.deepEqual(recovered.latency, { samples: 1, totalMs: 250, averageMs: 250 });
  assert.equal(recordSuccess(recovered, 50).latency.averageMs, 150);
  assert.throws(() => recordSuccess(degraded, -1), TypeError);
  assert.throws(() => recordSuccess(degraded, Number.NaN), TypeError);
});

test('blocked is not selectable and success does not unblock it', () => {
  const blocked = setBlocked(createHealthRecord('secrets'), 'owner froze key rotation');
  assert.equal(blocked.state, 'blocked');
  assert.equal(blocked.blockedReason, 'owner froze key rotation');
  assert.equal(isSelectable(blocked), false);

  const afterSuccess = recordSuccess(blocked, 10);
  assert.equal(afterSuccess.state, 'blocked', 'a success must not clear a block');
  assert.equal(afterSuccess.consecutiveFailures, 0, 'counters still reset');
  assert.equal(isSelectable(afterSuccess), false);

  const afterFailures = failTimes(blocked, 9);
  assert.equal(afterFailures.state, 'blocked', 'no threshold lifts a block');
});

test('only a named owner can clear a block', () => {
  const blocked = setBlocked(createHealthRecord('secrets'), 'incident');
  assert.throws(() => clearBlocked(blocked, { reason: 'resolved' }), TypeError, 'owner is required');
  assert.throws(() => clearBlocked(blocked, { by: 'owner' }), TypeError, 'reason is required');
  const cleared = clearBlocked(blocked, { by: 'owner@hey', reason: 'incident resolved' });
  assert.equal(cleared.state, 'healthy');
  assert.equal(cleared.blockedReason, null);
  assert.equal(isSelectable(cleared), true);
  assert.match(cleared.history.at(-1).reason, /unblocked by owner@hey/);
  assert.equal(clearBlocked(cleared, {}).state, 'healthy', 'idempotent when not blocked');
});

test('disabled is not selectable and cannot be selected back', () => {
  const disabled = setDisabled(createHealthRecord('legacy'), 'replaced by registry agent');
  assert.equal(disabled.state, 'disabled');
  assert.equal(isSelectable(disabled), false);
  assert.equal(isSelectable(recordSuccess(disabled, 5)), false);
  assert.throws(() => setDisabled(createHealthRecord('legacy'), ''), TypeError);
});

test('reasons are mandatory wherever a state changes', () => {
  const record = createHealthRecord('x');
  assert.throws(() => recordFailure(record, ''), TypeError);
  assert.throws(() => recordFailure(record, '   '), TypeError);
  assert.throws(() => setBlocked(record, undefined), TypeError);
  assert.throws(() => createHealthRecord('x', { state: 'blocked' }), TypeError);
  assert.throws(() => createHealthRecord('x', { state: 'exploded' }), TypeError);
});

test('records are immutable: every transition returns a new object', () => {
  const record = createHealthRecord('x');
  const failed = recordFailure(record, 'boom');
  assert.notEqual(failed, record);
  assert.equal(record.consecutiveFailures, 0);
  assert.equal(record.state, 'healthy');
  assert.notEqual(failed.history, record.history);
});

test('summary counts states, offenders and average latency', () => {
  const healthy = createHealthRecord('alpha');
  const degraded = failTimes(createHealthRecord('beta'), 3, 'slow');
  const unavailable = failTimes(createHealthRecord('gamma'), 5, 'down');
  const blocked = setBlocked(createHealthRecord('delta'), 'policy');
  const disabled = setDisabled(createHealthRecord('epsilon'), 'retired');
  const withLatency = recordSuccess(createHealthRecord('zeta'), 100);
  const withLatency2 = recordSuccess(withLatency, 300);
  const legacy = createHealthRecord('legacy');
  const unhealthy = { ...legacy, state: 'unhealthy' };

  const summary = summarizeHealth([healthy, degraded, unavailable, blocked, disabled, withLatency2, unhealthy]);
  assert.equal(summary.total, 7);
  assert.deepEqual(summary.byState, { healthy: 2, degraded: 1, unavailable: 2, blocked: 1, disabled: 1 });
  assert.equal(summary.selectable, 3, 'healthy + degraded are selectable; unavailable, blocked, disabled are not');
  assert.equal(summary.notSelectable, 4);
  assert.deepEqual(summary.blocked, ['delta']);
  assert.deepEqual(summary.disabled, ['epsilon']);
  assert.equal(summary.averageLatencyMs, 200);
  assert.equal(summary.withFailures, 2);
  assert.deepEqual(summary.worstOffenders.map((entry) => entry.agentId), ['gamma', 'beta']);
  assert.equal(summary.worstOffenders[0].consecutiveFailures, 5);
  assert.equal(summary.worstOffenders[0].lastFailureReason, 'down');
  assert.equal(canonicalState('unhealthy'), 'unavailable');
});

test('an unrecognised state fails closed and an absent state is selectable', () => {
  assert.equal(isSelectable({ agentId: 'x', state: 'vibing' }), false);
  assert.equal(isSelectable({ agentId: 'x' }), true, 'no health record is not evidence of ill health');
  assert.equal(isSelectable(null), false);
  assert.equal(isSelectable({ agentId: 'x', health: 'blocked' }), false, 'agent.health is accepted');
  assert.equal(isSelectable({ agentId: 'x', health: 'degraded' }), true);
});

test('summary of an empty set is well formed', () => {
  const summary = summarizeHealth([]);
  assert.equal(summary.total, 0);
  assert.deepEqual(summary.worstOffenders, []);
  assert.equal(summary.averageLatencyMs, 0);
  assert.equal(summarizeHealth(undefined).total, 0);
});
