// src/engines/modes/__tests__/ModesEngine.test.ts
// Tests for Modes Engine

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModesEngine, createModesEngine } from '../ModesEngine';
import type { ModesConfig, Mode, ActiveMode, ModeTransition, ModeSchedule } from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

describe('ModesEngine', () => {
  let engine: ModesEngine;

  const testConfig: Partial<ModesConfig> = {
    defaultMode: 'focus',
    allowManualOverride: true,
    transitionCooldownMs: 100,
    persistActiveMode: true,
    hcuBudgetPerHour: 10.0,
  };

  beforeEach(async () => {
    engine = createModesEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Initialization', () => {
    it('initializes with default config', async () => {
      const defaultEngine = createModesEngine();
      await defaultEngine.initialize();
      const health = defaultEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.hcuBudgetPerHour).toBe(0.5);
      expect(health.activeMode?.modeId).toBe('focus');
      expect(health.availableModes).toBe(7); // 7 default modes
      await defaultEngine.shutdown();
    });

    it('initializes with custom config', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.hcuBudgetPerHour).toBe(10.0);
    });

    it('creates all default modes', () => {
      const modes = engine.getAllModes();
      expect(modes.length).toBe(7);
      const modeIds = modes.map(m => m.id);
      expect(modeIds).toContain('focus');
      expect(modeIds).toContain('creative');
      expect(modeIds).toContain('learning');
      expect(modeIds).toContain('rest');
      expect(modeIds).toContain('social');
      expect(modeIds).toContain('admin');
      expect(modeIds).toContain('emergency');
    });
  });

  describe('Mode Activation', () => {
    it('gets active mode', () => {
      const active = engine.getActiveMode();
      expect(active).not.toBeNull();
      expect(active?.modeId).toBe('focus');
    });

    it('activates a mode manually', async () => {
      const result = await engine.activateMode('creative', 'manual', { reason: 'test' });
      expect(result).toBe(true);

      const active = engine.getActiveMode();
      expect(active?.modeId).toBe('creative');
      expect(active?.activatedBy).toBe('manual');
    });

    it('rejects activation of disabled mode', async () => {
      engine.disableMode('learning');
      const result = await engine.activateMode('learning', 'manual');
      expect(result).toBe(false);
    });

    it('rejects activation of unknown mode', async () => {
      const result = await engine.activateMode('unknown' as any, 'manual');
      expect(result).toBe(false);
    });

    it('records transition', async () => {
      await engine.activateMode('creative', 'manual', { reason: 'test' });
      await engine.activateMode('learning', 'manual', { reason: 'test2' });

      const transitions = engine.getTransitions(10);
      expect(transitions.length).toBe(2);
      expect(transitions[0].from).toBe('creative');
      expect(transitions[0].to).toBe('learning');
      expect(transitions[1].from).toBe('focus');
      expect(transitions[1].to).toBe('creative');
    });

    it('respects transition cooldown when manual override disabled', async () => {
      engine.updateConfig({ allowManualOverride: false, transitionCooldownMs: 5000 });
      await engine.activateMode('creative', 'manual');
      // Try immediately - should fail due to cooldown
      const result = await engine.activateMode('learning', 'manual');
      expect(result).toBe(false);
    });

    it('allows manual override despite cooldown when enabled', async () => {
      engine.updateConfig({ allowManualOverride: true, transitionCooldownMs: 5000 });
      await engine.activateMode('creative', 'manual');
      // Manual override should work
      const result = await engine.activateMode('learning', 'manual');
      expect(result).toBe(true);
    });
  });

  describe('Mode Management', () => {
    it('gets specific mode', () => {
      const mode = engine.getMode('focus');
      expect(mode).toBeDefined();
      expect(mode?.name).toBe('Deep Focus');
      expect(mode?.triggers.length).toBeGreaterThan(0);
    });

    it('gets enabled modes', () => {
      const enabled = engine.getEnabledModes();
      expect(enabled.length).toBe(7);
      expect(enabled.every(m => m.enabled)).toBe(true);
    });

    it('disables a mode', () => {
      const result = engine.disableMode('social');
      expect(result).toBe(true);
      expect(engine.getMode('social')?.enabled).toBe(false);
    });

    it('enables a mode', () => {
      engine.disableMode('social');
      const result = engine.enableMode('social');
      expect(result).toBe(true);
      expect(engine.getMode('social')?.enabled).toBe(true);
    });

    it('switches to default when active mode disabled', async () => {
      await engine.activateMode('creative', 'manual');
      engine.disableMode('creative');

      const active = engine.getActiveMode();
      expect(active?.modeId).toBe('focus');
    });

    it('updates mode configuration', () => {
      const result = engine.updateMode('focus', { description: 'Updated description' });
      expect(result).toBe(true);
      expect(engine.getMode('focus')?.description).toBe('Updated description');
    });

    it('adds custom mode', () => {
      const customMode = engine.addCustomMode({
        id: 'custom',
        name: 'Custom Mode',
        description: 'A custom mode',
        icon: '⭐',
        color: '#FF00FF',
        enabled: true,
        triggers: [],
        engineConfigs: {},
        uiOverrides: {},
      });

      expect(customMode.id).toBe('custom');
      expect(engine.getMode('custom')).toBeDefined();
    });
  });

  describe('Schedule Management', () => {
    it('sets mode schedule', () => {
      const schedule: ModeSchedule = {
        days: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'UTC',
      };
      const result = engine.setModeSchedule('focus', schedule);
      expect(result).toBe(true);
      expect(engine.getModeSchedule('focus')).toEqual(schedule);
    });

    it('clears mode schedule', () => {
      engine.setModeSchedule('focus', { days: [1], startTime: '09:00', endTime: '10:00', timezone: 'UTC' });
      const result = engine.setModeSchedule('focus', undefined);
      expect(result).toBe(true);
      expect(engine.getModeSchedule('focus')).toBeUndefined();
    });
  });

  describe('Trigger Evaluation', () => {
    it('emits trigger_evaluated events', () => {
      let eventReceived = false;
      engine.onEvent('trigger_evaluated', () => { eventReceived = true; });
      // Trigger evaluation
      (engine as any).evaluateTriggers();
      expect(eventReceived).toBe(true);
    });

    it('time trigger matching logic', () => {
      // Test the private method via evaluateTriggers which uses it
      // Just verify no error thrown
      expect(() => (engine as any).evaluateTriggers()).not.toThrow();
    });
  });

  describe('Health & Config', () => {
    it('reports health metrics', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.activeMode).not.toBeNull();
      expect(health.availableModes).toBe(7);
      expect(health.enabledModes).toBe(7);
      expect(health.totalHCUSpent).toBeGreaterThanOrEqual(0);
    });

    it('updates config', () => {
      engine.updateConfig({ defaultMode: 'creative', hcuBudgetPerHour: 2.0 });
      const config = engine.getConfig();
      expect(config.defaultMode).toBe('creative');
      expect(config.hcuBudgetPerHour).toBe(2.0);
    });
  });

  describe('Event System', () => {
    it('emits mode_activated event', () => {
      let eventReceived = false;
      engine.onEvent('mode_activated', () => { eventReceived = true; });
      engine.activateMode('creative', 'manual');
      expect(eventReceived).toBe(true);
    });

    it('emits mode_deactivated event', () => {
      let eventReceived = false;
      engine.onEvent('mode_deactivated', () => { eventReceived = true; });
      engine.activateMode('creative', 'manual');
      expect(eventReceived).toBe(true);
    });

    it('emits mode_transition event', () => {
      let eventReceived = false;
      engine.onEvent('mode_transition', () => { eventReceived = true; });
      engine.activateMode('creative', 'manual');
      engine.activateMode('learning', 'manual');
      expect(eventReceived).toBe(true);
    });

    it('emits schedule_changed event', () => {
      let eventReceived = false;
      engine.onEvent('schedule_changed', () => { eventReceived = true; });
      engine.setModeSchedule('focus', { days: [1], startTime: '09:00', endTime: '10:00', timezone: 'UTC' });
      expect(eventReceived).toBe(true);
    });
  });
});