// src/engines/ownerConsole/__tests__/OwnerConsoleEngine.test.ts
// Tests for Owner Console Engine

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OwnerConsoleEngine, createOwnerConsoleEngine } from '../OwnerConsoleEngine';
import type { OwnerConfig, EngineId, SystemCommand, BudgetAllocation, SystemNotification, EngineState } from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

describe('OwnerConsoleEngine', () => {
  let engine: OwnerConsoleEngine;

  const testConfig: Partial<OwnerConfig> = {
    globalHCUBudgetPerHour: 100.0,
    emergencyStopEnabled: true,
    autoRestartFailedEngines: false,
    maxConcurrentCommands: 3,
    commandTimeoutMs: 5000,
    broadcastEnabled: true,
  };

  beforeEach(async () => {
    engine = createOwnerConsoleEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Initialization', () => {
    it('initializes with default config', async () => {
      const defaultEngine = createOwnerConsoleEngine();
      await defaultEngine.initialize();
      const health = defaultEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.globalHCUBudget).toBe(50.0);
      expect(health.enginesTotal).toBe(10); // 10 Golden Engines (ownerConsole engineId set)
      await defaultEngine.shutdown();
    });

    it('initializes with custom config', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.globalHCUBudget).toBe(100.0);
    });

    it('initializes all 10 engine states', () => {
      const states = engine.getAllEngineStates();
      expect(states.length).toBe(10);
      expect(states.every(s => s.enabled === true)).toBe(true);
    });
  });

  describe('Engine Management', () => {
    it('starts an engine', async () => {
      // First stop it
      await engine.stopEngine('crossDevice');
      expect(engine.getEngineState('crossDevice')?.status).toBe('stopped');

      // Then start it
      const command = await engine.startEngine('crossDevice');
      expect(command.status).toBe('completed');
      expect(engine.getEngineState('crossDevice')?.status).toBe('running');
    });

    it('stops an engine', async () => {
      const command = await engine.stopEngine('guidanceWorld');
      expect(command.status).toBe('completed');
      expect(engine.getEngineState('guidanceWorld')?.status).toBe('stopped');
    });

    it('restarts an engine', async () => {
      const command = await engine.restartEngine('safetyTrio');
      expect(command.status).toBe('completed');
      expect(engine.getEngineState('safetyTrio')?.status).toBe('running');
    });

    it('enables an engine', async () => {
      await engine.disableEngine('multiSense');
      expect(engine.getEngineState('multiSense')?.enabled).toBe(false);

      const command = await engine.enableEngine('multiSense');
      expect(command.status).toBe('completed');
      expect(engine.getEngineState('multiSense')?.enabled).toBe(true);
      expect(engine.getEngineState('multiSense')?.status).toBe('running');
    });

    it('disables an engine', async () => {
      const command = await engine.disableEngine('selfImprovement');
      expect(command.status).toBe('completed');
      expect(engine.getEngineState('selfImprovement')?.enabled).toBe(false);
      expect(engine.getEngineState('selfImprovement')?.status).toBe('stopped');
    });

    it('gets engine state', () => {
      const state = engine.getEngineState('agentWorkforce');
      expect(state).toBeDefined();
      expect(state?.id).toBe('agentWorkforce');
      expect(state?.name).toBe('Agent Workforce');
    });

    it('gets running engines', () => {
      const running = engine.getRunningEngines();
      expect(running.length).toBeGreaterThan(0);
      expect(running.every(e => e.status === 'running')).toBe(true);
    });

    it('gets failed engines', () => {
      // Manually set an engine to error
      const state = engine.getEngineState('agentWorkforce')!;
      state.status = 'error';
      state.lastError = 'Test error';

      const failed = engine.getFailedEngines();
      expect(failed.length).toBe(1);
      expect(failed[0].id).toBe('agentWorkforce');
    });
  });

  describe('System Commands', () => {
    it('executes global stop', async () => {
      const command = await engine.globalStop('Test global stop');
      expect(command.status).toBe('completed');
      expect(command.result?.success).toBe(true);

      // All engines should be stopped
      const running = engine.getRunningEngines();
      expect(running.length).toBe(0);
      expect(engine.isGlobalStopped()).toBe(true);
    });

    it('executes emergency override', async () => {
      const command = await engine.emergencyOverride('Test emergency');
      expect(command.status).toBe('completed');
      expect(command.result?.success).toBe(true);
      expect(command.result?.preservedEngines).toContain('safetyTrio');
      expect(command.result?.preservedEngines).toContain('ownerConsole');
      expect(engine.isEmergencyOverrideActive()).toBe(true);
      expect(engine.isGlobalStopped()).toBe(true);
    });

    it('rejects emergency override when disabled', async () => {
      engine.updateConfig({ emergencyStopEnabled: false });
      await expect(engine.emergencyOverride('Test')).rejects.toThrow('Emergency override is disabled');
    });

    it('clears emergency override', async () => {
      await engine.emergencyOverride('Test');
      expect(engine.isEmergencyOverrideActive()).toBe(true);

      engine.clearEmergencyOverride();
      expect(engine.isEmergencyOverrideActive()).toBe(false);
      expect(engine.isGlobalStopped()).toBe(false);
    });

    it('executes budget reallocation', async () => {
      const command = await engine.executeCommand({
        id: 'test_cmd',
        type: 'budget_realloc',
        target: 'crossDevice',
        payload: { engineId: 'crossDevice', amount: 5.0 },
        requestedBy: 'test',
        timestamp: new Date().toISOString(),
        status: 'pending',
      } as SystemCommand);

      expect(command.status).toBe('completed');
      expect(engine.getAllocation('crossDevice')?.allocated).toBe(5.0);
    });

    it('executes broadcast', async () => {
      const command = await engine.executeCommand({
        id: 'test_cmd',
        type: 'broadcast',
        target: 'all',
        payload: { type: 'info', title: 'Test', message: 'Hello world' },
        requestedBy: 'test',
        timestamp: new Date().toISOString(),
        status: 'pending',
      } as SystemCommand);

      expect(command.status).toBe('completed');
      const notifications = engine.getNotifications(10);
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].title).toBe('Test');
    });

    it('executes snapshot', async () => {
      const command = await engine.executeCommand({
        id: 'test_cmd',
        type: 'snapshot',
        target: 'all',
        payload: {},
        requestedBy: 'test',
        timestamp: new Date().toISOString(),
        status: 'pending',
      } as SystemCommand);

      expect(command.status).toBe('completed');
      expect(command.result?.snapshot).toBeDefined();
    });

    it('executes health check', async () => {
      const command = await engine.executeCommand({
        id: 'test_cmd',
        type: 'health_check',
        target: 'all',
        payload: {},
        requestedBy: 'test',
        timestamp: new Date().toISOString(),
        status: 'pending',
      } as SystemCommand);

      expect(command.status).toBe('completed');
      expect(command.result?.health).toBeDefined();
    });
  });

  describe('Budget Management', () => {
    it('gets all budget allocations', () => {
      const allocations = engine.getAllAllocations();
      expect(allocations.length).toBe(10);
      expect(allocations.every(a => a.allocated > 0)).toBe(true);
    });

    it('gets specific allocation', () => {
      const allocation = engine.getAllocation('agentWorkforce');
      expect(allocation).toBeDefined();
      expect(allocation?.engineId).toBe('agentWorkforce');
    });

    it('updates budget allocation', () => {
      const result = engine.updateBudget('autonomous', 10.0);
      expect(result).toBe(true);
      expect(engine.getAllocation('autonomous')?.allocated).toBe(10.0);
    });

    it('records HCU spent', () => {
      engine.recordHCUSpent('continuousIntelligence', 1.5);
      expect(engine.getAllocation('continuousIntelligence')?.spent).toBe(1.5);
      expect(engine.getEngineState('continuousIntelligence')?.hcuSpent).toBe(1.5);
    });

    it('safetyTrio has critical priority', () => {
      const allocation = engine.getAllocation('safetyTrio');
      expect(allocation?.priority).toBe('critical');
    });
  });

  describe('Notifications', () => {
    it('broadcasts notification', () => {
      const notification = engine.broadcast('warning', 'Test Warning', 'This is a test');
      expect(notification.id).toMatch(/^notif_/);
      expect(notification.type).toBe('warning');
      expect(notification.title).toBe('Test Warning');
      expect(notification.read).toBe(false);
    });

    it('gets notifications', () => {
      engine.broadcast('info', 'Test 1', 'Message 1');
      engine.broadcast('error', 'Test 2', 'Message 2');
      const notifications = engine.getNotifications(10);
      expect(notifications.length).toBeGreaterThanOrEqual(2);
    });

    it('marks notification as read', () => {
      const notification = engine.broadcast('info', 'Read Test', 'Message');
      const result = engine.markNotificationRead(notification.id);
      expect(result).toBe(true);
      const fetched = engine.getNotifications(10).find(n => n.id === notification.id);
      expect(fetched?.read).toBe(true);
    });
  });

  describe('Health & Config', () => {
    it('reports health metrics', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.enginesRunning).toBeGreaterThan(0);
      expect(health.enginesTotal).toBe(10);
      expect(health.totalHCUAllocated).toBeGreaterThan(0);
      expect(health.systemStatus).toBe('healthy');
    });

    it('reports degraded status when many engines stopped', async () => {
      // Stop most engines
      for (const state of engine.getAllEngineStates()) {
        if (state.id !== 'ownerConsole' && state.id !== 'safetyTrio') {
          await engine.stopEngine(state.id);
        }
      }

      const health = engine.getHealth();
      expect(health.systemStatus).toBe('degraded');
    });

    it('reports critical status when global stopped', async () => {
      await engine.globalStop('Test');
      const health = engine.getHealth();
      expect(health.systemStatus).toBe('critical');
    });

    it('reports emergency status when override active', async () => {
      await engine.emergencyOverride('Test');
      const health = engine.getHealth();
      expect(health.systemStatus).toBe('emergency_stop');
    });

    it('updates config', () => {
      engine.updateConfig({ globalHCUBudgetPerHour: 75.0, maxConcurrentCommands: 10 });
      const config = engine.getConfig();
      expect(config.globalHCUBudgetPerHour).toBe(75.0);
      expect(config.maxConcurrentCommands).toBe(10);
    });

    it('updates engine configs', () => {
      engine.updateConfig({
        engines: {
          crossDevice: { enabled: false, hcuBudget: 3.0 },
        },
      });
      const state = engine.getEngineState('crossDevice')!;
      expect(state.enabled).toBe(false);
      expect(state.hcuBudget).toBe(3.0);
    });
  });

  describe('Event System', () => {
    it('emits engine_state_changed', async () => {
      let eventReceived = false;
      engine.onEvent('engine_state_changed', () => { eventReceived = true; });
      engine.startEngine('crossDevice');
      // Wait for engine to start
      await new Promise(r => setTimeout(r, 100));
      expect(engine.getEngineState('crossDevice')?.status).toBe('running');
    });

    it('emits command_executed', async () => {
      let eventReceived = false;
      engine.onEvent('command_executed', () => { eventReceived = true; });
      await engine.stopEngine('guidanceWorld');
      expect(eventReceived).toBe(true);
    });

    it('emits budget_changed', () => {
      let eventReceived = false;
      engine.onEvent('budget_changed', () => { eventReceived = true; });
      engine.updateBudget('agentWorkforce', 8.0);
      expect(eventReceived).toBe(true);
    });

    it('emits notification', () => {
      let eventReceived = false;
      engine.onEvent('notification', () => { eventReceived = true; });
      engine.broadcast('info', 'Event Test', 'Test message');
      expect(eventReceived).toBe(true);
    });

    it('emits global_stop', async () => {
      let eventReceived = false;
      engine.onEvent('global_stop', () => { eventReceived = true; });
      await engine.globalStop('Event test');
      expect(eventReceived).toBe(true);
    });

    it('emits emergency_override', async () => {
      let eventReceived = false;
      engine.onEvent('emergency_override', () => { eventReceived = true; });
      await engine.emergencyOverride('Event test');
      expect(eventReceived).toBe(true);
    });
  });
});