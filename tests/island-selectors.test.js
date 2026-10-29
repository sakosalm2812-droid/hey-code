/**
 * Tests for islandSelectors.js — pure functions, no DOM required.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  pickPrimary,
  badgeCount,
  visibleModules,
  activityLabel,
  activityIcon,
} from '../src/components/island/islandSelectors.js';

describe('islandSelectors', () => {
  const baseActivity = (overrides = {}) => ({
    id: `activity_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type: 'task',
    title: 'Test Task',
    message: 'Running...',
    progress: 50,
    actions: [],
    priority: 'normal',
    persistent: false,
    expiresAt: null,
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dismissed: false,
    pinned: false,
    ...overrides,
  });

  describe('pickPrimary', () => {
    it('returns null for empty array', () => {
      assert.strictEqual(pickPrimary([]), null);
    });

    it('returns null for undefined', () => {
      assert.strictEqual(pickPrimary(undefined), null);
    });

    it('returns the only activity', () => {
      const a = baseActivity({ title: 'Only One' });
      const result = pickPrimary([a]);
      assert.strictEqual(result.title, 'Only One');
    });

    it('prefers pinned over non-pinned', () => {
      const a = baseActivity({ title: 'Pinned', pinned: true });
      const b = baseActivity({ title: 'Not Pinned' });
      const result = pickPrimary([b, a]);
      assert.strictEqual(result.title, 'Pinned');
    });

    it('prefers high priority over normal', () => {
      const a = baseActivity({ title: 'High', priority: 'high' });
      const b = baseActivity({ title: 'Normal', priority: 'normal' });
      const result = pickPrimary([b, a]);
      assert.strictEqual(result.title, 'High');
    });

    it('prefers normal priority over low', () => {
      const a = baseActivity({ title: 'Normal', priority: 'normal' });
      const b = baseActivity({ title: 'Low', priority: 'low' });
      const result = pickPrimary([b, a]);
      assert.strictEqual(result.title, 'Normal');
    });

    it('prefers most recent when priority and pinned are equal', () => {
      const earlier = baseActivity({
        title: 'Earlier',
        createdAt: new Date(Date.now() - 10000).toISOString(),
      });
      const later = baseActivity({
        title: 'Later',
        createdAt: new Date().toISOString(),
      });
      const result = pickPrimary([earlier, later]);
      assert.strictEqual(result.title, 'Later');
    });

    it('filters out dismissed activities', () => {
      const a = baseActivity({ title: 'Dismissed', dismissed: true });
      const b = baseActivity({ title: 'Active' });
      const result = pickPrimary([a, b]);
      assert.strictEqual(result.title, 'Active');
    });

    it('returns null if all activities are dismissed', () => {
      const a = baseActivity({ dismissed: true });
      const b = baseActivity({ dismissed: true });
      assert.strictEqual(pickPrimary([a, b]), null);
    });
  });

  describe('badgeCount', () => {
    it('returns 0 for empty array', () => {
      assert.strictEqual(badgeCount([], null), 0);
    });

    it('returns 0 when only primary exists', () => {
      const a = baseActivity();
      assert.strictEqual(badgeCount([a], a), 0);
    });

    it('returns count of additional activities', () => {
      const a = baseActivity({ id: 'a' });
      const b = baseActivity({ id: 'b' });
      const c = baseActivity({ id: 'c' });
      assert.strictEqual(badgeCount([a, b, c], a), 2);
    });

    it('does not count dismissed activities', () => {
      const a = baseActivity({ id: 'a' });
      const b = baseActivity({ id: 'b', dismissed: true });
      assert.strictEqual(badgeCount([a, b], a), 0);
    });

    it('returns total count when primary is null', () => {
      const a = baseActivity({ id: 'a' });
      const b = baseActivity({ id: 'b' });
      assert.strictEqual(badgeCount([a, b], null), 2);
    });
  });

  describe('visibleModules', () => {
    it('returns empty array when no primary', () => {
      assert.deepStrictEqual(visibleModules([], null), []);
    });

    it('returns approval modules for pending_confirmation', () => {
      const primary = baseActivity({ type: 'pending_confirmation', actions: [{ id: 'approve' }] });
      const modules = visibleModules([primary], primary);
      assert.ok(modules.includes('approval'));
      assert.ok(modules.length <= 3);
    });

    it('returns mission-progress for task with progress', () => {
      const primary = baseActivity({ type: 'task', progress: 50 });
      const modules = visibleModules([primary], primary);
      assert.ok(modules.includes('mission-progress'));
    });

    it('returns voice-session for listening activity', () => {
      const primary = baseActivity({ type: 'listening' });
      const modules = visibleModules([primary], primary);
      assert.ok(modules.includes('voice-session'));
    });

    it('returns capture-indicator for speaking activity', () => {
      const primary = baseActivity({ type: 'speaking' });
      const modules = visibleModules([primary], primary);
      assert.ok(modules.includes('capture-indicator'));
    });

    it('returns approval-timer when expiresAt is set', () => {
      const primary = baseActivity({
        type: 'timer',
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      });
      const modules = visibleModules([primary], primary);
      assert.ok(modules.includes('approval-timer'));
    });

    it('returns cost-warning for generation with cost metadata', () => {
      const primary = baseActivity({
        type: 'generation',
        metadata: { costCents: 150 },
      });
      const modules = visibleModules([primary], primary);
      assert.ok(modules.includes('cost-warning'));
    });

    it('returns sync-state when activities have pendingSync metadata', () => {
      const primary = baseActivity({ type: 'task' });
      const other = baseActivity({ type: 'task', metadata: { pendingSync: true } });
      const modules = visibleModules([primary, other], primary);
      assert.ok(modules.includes('sync-state'));
    });

    it('returns catch-up when multiple activities exist', () => {
      const primary = baseActivity({ type: 'task' });
      const other = baseActivity({ type: 'notification' });
      const modules = visibleModules([primary, other], primary);
      assert.ok(modules.includes('catch-up'));
    });

    it('limits to 3 modules', () => {
      const primary = baseActivity({
        type: 'pending_confirmation',
        actions: [{ id: 'approve' }],
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        metadata: { costCents: 100, pendingSync: true },
      });
      const modules = visibleModules([primary], primary);
      assert.ok(modules.length <= 3);
    });
  });

  describe('activityLabel', () => {
    it('returns known labels for standard types', () => {
      assert.strictEqual(activityLabel('task'), 'Task');
      assert.strictEqual(activityLabel('pending_confirmation'), 'Approval Needed');
      assert.strictEqual(activityLabel('listening'), 'Listening');
    });

    it('returns "Activity" for unknown type', () => {
      assert.strictEqual(activityLabel('unknown_type'), 'Activity');
    });
  });

  describe('activityIcon', () => {
    it('returns known icons for standard types', () => {
      assert.strictEqual(activityIcon('task'), 'Activity');
      assert.strictEqual(activityIcon('pending_confirmation'), 'AlertTriangle');
      assert.strictEqual(activityIcon('listening'), 'Mic');
    });

    it('returns "Activity" for unknown type', () => {
      assert.strictEqual(activityIcon('unknown_type'), 'Activity');
    });
  });
});