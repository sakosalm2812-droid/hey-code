/**
 * Tests for trayState.js — State derivation, badge counts, no spin when idle
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TRAY_STATES,
  TRAY_STATE_GLYPHS,
  TRAY_STATE_LABELS,
  TRAY_STATE_TOOLTIPS,
  deriveTrayState,
  validateNoSpinWhenIdle,
  getTrayMenuItems,
  deriveBadgeCount,
} from '../src/components/tray/trayState.js';

describe('trayState.js — Constants', () => {
  it('exports all tray states', () => {
    assert.deepStrictEqual(TRAY_STATES, [
      'idle',
      'working',
      'waiting',
      'offline',
      'relay-off',
      'error',
    ]);
    assert.throws(() => TRAY_STATES.push('new'));
  });

  it('exports glyphs for each state', () => {
    assert.strictEqual(TRAY_STATE_GLYPHS.idle, 'dot');
    assert.strictEqual(TRAY_STATE_GLYPHS.working, 'rotating-arc');
    assert.strictEqual(TRAY_STATE_GLYPHS.waiting, 'badge');
    assert.strictEqual(TRAY_STATE_GLYPHS.offline, 'slash');
    assert.strictEqual(TRAY_STATE_GLYPHS['relay-off'], 'plug');
    assert.strictEqual(TRAY_STATE_GLYPHS.error, 'triangle');
  });

  it('exports labels for each state', () => {
    assert.strictEqual(TRAY_STATE_LABELS.idle, 'HEY — Ready');
    assert.strictEqual(TRAY_STATE_LABELS.working, 'HEY — Working');
    assert.strictEqual(TRAY_STATE_LABELS.waiting, 'HEY — Approval waiting');
    assert.strictEqual(TRAY_STATE_LABELS.offline, 'HEY — Offline');
    assert.strictEqual(TRAY_STATE_LABELS['relay-off'], 'HEY — Relay off');
    assert.strictEqual(TRAY_STATE_LABELS.error, 'HEY — Error');
  });

  it('exports tooltips for each state', () => {
    assert.ok(TRAY_STATE_TOOLTIPS.idle.includes('ready'));
    assert.ok(TRAY_STATE_TOOLTIPS.working.includes('running'));
    assert.ok(TRAY_STATE_TOOLTIPS.waiting.includes('approval'));
    assert.ok(TRAY_STATE_TOOLTIPS.offline.includes('connectivity'));
    assert.ok(TRAY_STATE_TOOLTIPS['relay-off'].includes('Relay'));
    assert.ok(TRAY_STATE_TOOLTIPS.error.includes('error'));
  });
});

describe('trayState.js — deriveTrayState', () => {
  it('returns idle when nothing happening', () => {
    const state = deriveTrayState({});
    assert.strictEqual(state.state, 'idle');
    assert.strictEqual(state.glyph, 'dot');
    assert.strictEqual(state.animating, false);
  });

  it('returns idle when all systems nominal', () => {
    const state = deriveTrayState({
      heyLive: {},
      dynamicIsland: { activeTaskCount: 0 },
      notificationCenter: { connectivity: 'online', pendingApprovals: 0, unreadCount: 0 },
      deviceGateway: { relayRunning: true, hasRelayConfigured: true, connectivity: 'online' },
      costGovernor: {},
    });
    assert.strictEqual(state.state, 'idle');
    assert.strictEqual(state.animating, false);
  });

  it('returns error when heyLive has error', () => {
    const state = deriveTrayState({
      heyLive: { error: 'Permission denied' },
      dynamicIsland: {},
      notificationCenter: {},
      deviceGateway: {},
      costGovernor: {},
    });
    assert.strictEqual(state.state, 'error');
    assert.strictEqual(state.glyph, 'triangle');
    assert.ok(state.tooltip.includes('Error'));
  });

  it('returns error when dynamicIsland has error', () => {
    const state = deriveTrayState({
      heyLive: {},
      dynamicIsland: { error: 'Mission failed' },
      notificationCenter: {},
      deviceGateway: {},
      costGovernor: {},
    });
    assert.strictEqual(state.state, 'error');
  });

  it('returns error when costGovernor has error', () => {
    const state = deriveTrayState({
      heyLive: {},
      dynamicIsland: {},
      notificationCenter: {},
      deviceGateway: {},
      costGovernor: { error: 'Budget exceeded' },
    });
    assert.strictEqual(state.state, 'error');
  });

  it('returns relay-off when relay configured but not running', () => {
    const state = deriveTrayState({
      heyLive: {},
      dynamicIsland: {},
      notificationCenter: { connectivity: 'online' },
      deviceGateway: { relayRunning: false, hasRelayConfigured: true, connectivity: 'online' },
      costGovernor: {},
    });
    assert.strictEqual(state.state, 'relay-off');
    assert.strictEqual(state.glyph, 'plug');
    assert.ok(state.tooltip.includes('Relay'));
  });

  it('returns offline when connectivity false', () => {
    const state = deriveTrayState({
      heyLive: {},
      dynamicIsland: {},
      notificationCenter: { connectivity: 'offline' },
      deviceGateway: { connectivity: 'offline' },
      costGovernor: {},
    });
    assert.strictEqual(state.state, 'offline');
    assert.strictEqual(state.glyph, 'slash');
  });

  it('returns waiting when pending approvals', () => {
    const state = deriveTrayState({
      heyLive: {},
      dynamicIsland: {},
      notificationCenter: { connectivity: 'online', pendingApprovals: 3 },
      deviceGateway: { connectivity: 'online' },
      costGovernor: {},
    });
    assert.strictEqual(state.state, 'waiting');
    assert.strictEqual(state.glyph, 'badge');
    assert.strictEqual(state.badge, 3);
    assert.strictEqual(state.animating, false);
  });

  it('returns working when active mission', () => {
    const state = deriveTrayState({
      heyLive: {},
      dynamicIsland: { activeMission: true, activeTaskCount: 0 },
      notificationCenter: { connectivity: 'online', pendingApprovals: 0 },
      deviceGateway: { connectivity: 'online' },
      costGovernor: {},
    });
    assert.strictEqual(state.state, 'working');
    assert.strictEqual(state.glyph, 'rotating-arc');
    assert.strictEqual(state.animating, true);
  });

  it('returns working when active generation', () => {
    const state = deriveTrayState({
      heyLive: {},
      dynamicIsland: { activeGeneration: true, activeTaskCount: 0 },
      notificationCenter: { connectivity: 'online', pendingApprovals: 0 },
      deviceGateway: { connectivity: 'online' },
      costGovernor: {},
    });
    assert.strictEqual(state.state, 'working');
    assert.strictEqual(state.animating, true);
  });

  it('returns working when active voice', () => {
    const state = deriveTrayState({
      heyLive: { activeVoice: true },
      dynamicIsland: { activeTaskCount: 0 },
      notificationCenter: { connectivity: 'online', pendingApprovals: 0 },
      deviceGateway: { connectivity: 'online' },
      costGovernor: {},
    });
    assert.strictEqual(state.state, 'working');
    assert.strictEqual(state.animating, true);
  });

  it('returns working when active tasks', () => {
    const state = deriveTrayState({
      heyLive: {},
      dynamicIsland: { activeTaskCount: 2 },
      notificationCenter: { connectivity: 'online', pendingApprovals: 0 },
      deviceGateway: { connectivity: 'online' },
      costGovernor: {},
    });
    assert.strictEqual(state.state, 'working');
    assert.strictEqual(state.animating, true);
    assert.strictEqual(state.badge, 2);
  });

  it('priority: error > relay-off > offline > waiting > working > idle', () => {
    // Error beats everything
    let state = deriveTrayState({
      heyLive: { error: 'err' },
      dynamicIsland: { activeMission: true },
      notificationCenter: { pendingApprovals: 5, connectivity: 'offline' },
      deviceGateway: { relayRunning: false, hasRelayConfigured: true },
    });
    assert.strictEqual(state.state, 'error');

    // Relay-off beats offline/waiting/working
    state = deriveTrayState({
      heyLive: {},
      dynamicIsland: { activeMission: true },
      notificationCenter: { pendingApprovals: 5, connectivity: 'offline' },
      deviceGateway: { relayRunning: false, hasRelayConfigured: true, connectivity: 'online' },
    });
    assert.strictEqual(state.state, 'relay-off');

    // Offline beats waiting/working
    state = deriveTrayState({
      heyLive: {},
      dynamicIsland: { activeMission: true },
      notificationCenter: { pendingApprovals: 5, connectivity: 'offline' },
      deviceGateway: { relayRunning: true, hasRelayConfigured: true, connectivity: 'offline' },
    });
    assert.strictEqual(state.state, 'offline');

    // Waiting beats working
    state = deriveTrayState({
      heyLive: {},
      dynamicIsland: { activeMission: true },
      notificationCenter: { pendingApprovals: 1, connectivity: 'online' },
      deviceGateway: { connectivity: 'online' },
    });
    assert.strictEqual(state.state, 'waiting');

    // Working beats idle
    state = deriveTrayState({
      heyLive: {},
      dynamicIsland: { activeMission: true },
      notificationCenter: { pendingApprovals: 0, connectivity: 'online' },
      deviceGateway: { connectivity: 'online' },
    });
    assert.strictEqual(state.state, 'working');
  });
});

describe('trayState.js — validateNoSpinWhenIdle', () => {
  it('returns true for idle with animating=false', () => {
    assert.strictEqual(validateNoSpinWhenIdle({ state: 'idle', animating: false }), true);
  });

  it('returns false for idle with animating=true', () => {
    assert.strictEqual(validateNoSpinWhenIdle({ state: 'idle', animating: true }), false);
  });

  it('returns true for non-idle states regardless of animating', () => {
    assert.strictEqual(validateNoSpinWhenIdle({ state: 'working', animating: true }), true);
    assert.strictEqual(validateNoSpinWhenIdle({ state: 'waiting', animating: false }), true);
    assert.strictEqual(validateNoSpinWhenIdle({ state: 'error', animating: true }), true);
  });
});

describe('trayState.js — getTrayMenuItems', () => {
  it('returns base items for idle', () => {
    const items = getTrayMenuItems({ state: 'idle', badge: null });
    const labels = items.map(i => i.label).filter(Boolean);
    assert.ok(labels.includes('Ask HEY…'));
    assert.ok(labels.includes('Quick capture'));
    assert.ok(labels.includes('Today'));
    assert.ok(labels.includes('Open HEY'));
    assert.ok(labels.includes('Settings…'));
    assert.ok(labels.includes('Quit'));
  });

  it('includes approvals item when waiting', () => {
    const items = getTrayMenuItems({ state: 'waiting', badge: 3 });
    const labels = items.map(i => i.label).filter(Boolean);
    assert.ok(labels.some(l => l.includes('Approvals (3)')));
  });

  it('includes relay toggle', () => {
    const items = getTrayMenuItems({ state: 'idle' });
    const relayItem = items.find(i => i.id === 'relay-toggle');
    assert.ok(relayItem);
    assert.strictEqual(relayItem.checked, true);
  });

  it('quit is marked danger', () => {
    const items = getTrayMenuItems({ state: 'idle' });
    const quitItem = items.find(i => i.id === 'quit');
    assert.ok(quitItem);
    assert.strictEqual(quitItem.danger, true);
  });

  it('has separators', () => {
    const items = getTrayMenuItems({ state: 'idle' });
    const separators = items.filter(i => i.type === 'separator');
    assert.strictEqual(separators.length, 2);
  });
});

describe('trayState.js — deriveBadgeCount', () => {
  it('returns approvals count when pending', () => {
    const count = deriveBadgeCount({
      notificationCenter: { pendingApprovals: 3, unreadCount: 5 },
      dynamicIsland: { activeTaskCount: 2 },
    });
    assert.strictEqual(count, 3);
  });

  it('returns active tasks when no approvals', () => {
    const count = deriveBadgeCount({
      notificationCenter: { pendingApprovals: 0, unreadCount: 5 },
      dynamicIsland: { activeTaskCount: 2 },
    });
    assert.strictEqual(count, 2);
  });

  it('returns unread notifications when no approvals or tasks', () => {
    const count = deriveBadgeCount({
      notificationCenter: { pendingApprovals: 0, unreadCount: 5 },
      dynamicIsland: { activeTaskCount: 0 },
    });
    assert.strictEqual(count, 5);
  });

  it('returns null when nothing pending', () => {
    const count = deriveBadgeCount({
      notificationCenter: { pendingApprovals: 0, unreadCount: 0 },
      dynamicIsland: { activeTaskCount: 0 },
    });
    assert.strictEqual(count, null);
  });

  it('handles missing state gracefully', () => {
    const count = deriveBadgeCount({});
    assert.strictEqual(count, null);
  });
});

describe('trayState.js — Integration', () => {
  it('idle state never has animating=true', () => {
    const states = [
      {},
      { heyLive: {}, dynamicIsland: { activeTaskCount: 0 }, notificationCenter: { pendingApprovals: 0 }, deviceGateway: { relayRunning: true } },
    ];

    for (const appState of states) {
      const trayState = deriveTrayState(appState);
      if (trayState.state === 'idle') {
        assert.strictEqual(trayState.animating, false, 'Idle should never animate');
      }
    }
  });

  it('working state always has animating=true', () => {
    const workingStates = [
      { heyLive: {}, dynamicIsland: { activeMission: true }, notificationCenter: {}, deviceGateway: {} },
      { heyLive: { activeVoice: true }, dynamicIsland: {}, notificationCenter: {}, deviceGateway: {} },
      { heyLive: {}, dynamicIsland: { activeGeneration: true }, notificationCenter: {}, deviceGateway: {} },
      { heyLive: {}, dynamicIsland: { activeTaskCount: 1 }, notificationCenter: {}, deviceGateway: {} },
    ];

    for (const appState of workingStates) {
      const trayState = deriveTrayState(appState);
      assert.strictEqual(trayState.state, 'working');
      assert.strictEqual(trayState.animating, true, 'Working should always animate');
    }
  });

  it('waiting state has badge but not animating', () => {
    const trayState = deriveTrayState({
      notificationCenter: { pendingApprovals: 2, connectivity: 'online' },
      deviceGateway: { connectivity: 'online' },
    });
    assert.strictEqual(trayState.state, 'waiting');
    assert.strictEqual(trayState.badge, 2);
    assert.strictEqual(trayState.animating, false);
  });
});