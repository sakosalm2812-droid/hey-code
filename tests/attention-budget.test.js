import { describe, it } from 'node:test';
import assert from 'node:assert';
import attentionBudget from '../src/components/notifications/attentionBudget.js';

const { allow, createInitialState, pruneState, BUDGET_WINDOW_MS, MAX_IMPORTANT_PER_WINDOW } = attentionBudget;

describe('notifications/attentionBudget.js', () => {
  const now = 1000000000000; // Fixed timestamp for determinism

  describe('allow', () => {
    it('delivers critical notifications (bypasses budget)', () => {
      const state = createInitialState();
      const notification = { id: '1', severity: 'critical', timestamp: now };

      const result = allow(notification, now, state);

      assert.strictEqual(result.action, 'deliver');
      assert.strictEqual(result.reason, 'critical_bypass');
      assert.strictEqual(result.updatedState.deliveries.length, 1);
    });

    it('delivers important notifications within budget', () => {
      const state = createInitialState();
      const notification = { id: '1', severity: 'important', timestamp: now };

      const result = allow(notification, now, state);

      assert.strictEqual(result.action, 'deliver');
      assert.strictEqual(result.reason, 'within_budget');
      assert.strictEqual(result.updatedState.deliveries.length, 1);
    });

    it('delivers normal notifications (not counted in budget)', () => {
      const state = createInitialState();
      const notification = { id: '1', severity: 'normal', timestamp: now };

      const result = allow(notification, now, state);

      assert.strictEqual(result.action, 'deliver');
      assert.strictEqual(result.reason, 'within_budget');
    });

    it('queues 4th important notification in 10 min window (digest)', () => {
      let state = createInitialState();

      // Deliver 3 important notifications
      for (let i = 0; i < 3; i++) {
        const notification = { id: String(i), severity: 'important', timestamp: now };
        const result = allow(notification, now, state);
        assert.strictEqual(result.action, 'deliver');
        state = result.updatedState;
      }

      // 4th important notification should be digest
      const notification4 = { id: '3', severity: 'important', timestamp: now };
      const result = allow(notification4, now, state);

      assert.strictEqual(result.action, 'digest');
      assert.strictEqual(result.reason, 'budget_exceeded');
    });

    it('queues important notifications during quiet hours', () => {
      const state = { ...createInitialState(), quietUntil: now + 3600000 }; // 1 hour from now
      const notification = { id: '1', severity: 'important', timestamp: now };

      const result = allow(notification, now, state);

      assert.strictEqual(result.action, 'queue');
      assert.strictEqual(result.reason, 'quiet_hours');
    });

    it('queues critical notifications during quiet hours (critical does not bypass quiet hours)', () => {
      const state = { ...createInitialState(), quietUntil: now + 3600000 };
      const notification = { id: '1', severity: 'critical', timestamp: now };

      const result = allow(notification, now, state);

      assert.strictEqual(result.action, 'queue');
      assert.strictEqual(result.reason, 'quiet_hours');
    });

    it('delivers critical after quiet hours end', () => {
      const state = { ...createInitialState(), quietUntil: now - 1000 }; // Quiet hours ended
      const notification = { id: '1', severity: 'critical', timestamp: now };

      const result = allow(notification, now, state);

      assert.strictEqual(result.action, 'deliver');
      assert.strictEqual(result.reason, 'critical_bypass');
    });

    it('delivers normal during quiet hours? No - all queued during quiet hours', () => {
      const state = { ...createInitialState(), quietUntil: now + 3600000 };
      const notification = { id: '1', severity: 'normal', timestamp: now };

      const result = allow(notification, now, state);

      assert.strictEqual(result.action, 'queue');
      assert.strictEqual(result.reason, 'quiet_hours');
    });

    it('respects 10-minute rolling window', () => {
      let state = createInitialState();

      // Deliver 3 important at time 0
      for (let i = 0; i < 3; i++) {
        const notification = { id: String(i), severity: 'important', timestamp: now };
        const result = allow(notification, now, state);
        state = result.updatedState;
      }

      // At 9 minutes, still at budget
      const notificationAt9 = { id: '3', severity: 'important', timestamp: now + 9 * 60 * 1000 };
      const resultAt9 = allow(notificationAt9, now + 9 * 60 * 1000, state);
      assert.strictEqual(resultAt9.action, 'digest');

      // At 11 minutes, window has rolled, budget resets
      const notificationAt11 = { id: '4', severity: 'important', timestamp: now + 11 * 60 * 1000 };
      const prunedState = pruneState(state, now + 11 * 60 * 1000);
      const resultAt11 = allow(notificationAt11, now + 11 * 60 * 1000, prunedState);
      assert.strictEqual(resultAt11.action, 'deliver');
    });
  });

  describe('createInitialState', () => {
    it('returns empty deliveries and no quietUntil', () => {
      const state = createInitialState();
      assert.deepStrictEqual(state.deliveries, []);
      assert.strictEqual(state.quietUntil, null);
    });
  });

  describe('pruneState', () => {
    it('removes deliveries older than window', () => {
      const oldTime = now - BUDGET_WINDOW_MS - 1000;
      const state = {
        deliveries: [
          { severity: 'important', timestamp: oldTime },
          { severity: 'important', timestamp: now },
        ],
        quietUntil: null,
      };

      const pruned = pruneState(state, now);
      assert.strictEqual(pruned.deliveries.length, 1);
      assert.strictEqual(pruned.deliveries[0].timestamp, now);
    });

    it('preserves quietUntil', () => {
      const state = {
        deliveries: [],
        quietUntil: now + 3600000,
      };

      const pruned = pruneState(state, now);
      assert.strictEqual(pruned.quietUntil, now + 3600000);
    });
  });

  describe('constants', () => {
    it('exports BUDGET_WINDOW_MS = 10 minutes', () => {
      assert.strictEqual(BUDGET_WINDOW_MS, 10 * 60 * 1000);
    });

    it('exports MAX_IMPORTANT_PER_WINDOW = 3', () => {
      assert.strictEqual(MAX_IMPORTANT_PER_WINDOW, 3);
    });
  });
});