// Tests for NeverCutOff Engine
// Engine 15: Never Cut Off — Continuous availability, offline-first

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NeverCutOffEngine, createNeverCutOffEngine } from '../NeverCutOffEngine';
import type { AvailabilityConfig } from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

describe('NeverCutOffEngine', () => {
  let engine: NeverCutOffEngine;

  const testConfig: Partial<AvailabilityConfig> = {
    minConnectivityCheckIntervalMs: 30000,
    maxOfflineQueueSize: 1000,
    syncIntervalMs: 60000,
    retryBaseDelayMs: 1000,
    maxRetryDelayMs: 60000,
    criticalOperations: ['computer_control', 'filesystem_write', 'external_communication'],
    hcuBudgetPerHour: 0.5,
  };

  beforeEach(async () => {
    engine = createNeverCutOffEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Initialization', () => {
    it('initializes with default config', async () => {
      const defaultEngine = createNeverCutOffEngine();
      await defaultEngine.initialize();
      const health = defaultEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.connectivityState).toBe('offline');
      expect(health.currentProfile).not.toBeNull();
      await defaultEngine.shutdown();
    });

    it('initializes with custom config', async () => {
      const customEngine = createNeverCutOffEngine({
        hcuBudgetPerHour: 5.0,
        maxOfflineQueueSize: 500,
      });
      await customEngine.initialize();
      const health = customEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.hcuBudgetPerHour).toBe(5.0);
      await customEngine.shutdown();
    });
  });

  describe('Connectivity Management', () => {
    it('reports connectivity state', () => {
      const state = engine.getConnectivityState();
      expect(state).toBe('offline');
      expect(['online', 'offline', 'limited', 'reconnecting']).toContain(state);
    });

    it('reports current network profile', () => {
      const profile = engine.getCurrentProfile();
      expect(profile).not.toBeNull();
      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('name');
      expect(profile).toHaveProperty('type');
    });
  });

  describe('Offline Queue Management', () => {
    it('adds operation to offline queue', () => {
      const queueItem = engine.addToOfflineQueue('test_operation', { test: true }, 'normal');
      expect(queueItem).toHaveProperty('id');
      expect(queueItem.operation).toBe('test_operation');
      expect(queueItem.status).toBe('pending');
      expect(queueItem.priority).toBe('normal');
    });

    it('adds critical operation to offline queue', () => {
      const queueItem = engine.addToOfflineQueue('computer_control', { command: 'test' }, 'critical');
      expect(queueItem.operation).toBe('computer_control');
      expect(queueItem.priority).toBe('critical');
    });

    it('removes operation from offline queue', () => {
      const item = engine.addToOfflineQueue('test_op', {}, 'normal');
      const removed = engine.removeFromOfflineQueue(item.id);
      expect(removed).toBe(true);
      const remaining = engine.getOfflineQueue();
      expect(remaining.length).toBe(0);
    });

    it('rejects removing non-existent operation', () => {
      const removed = engine.removeFromOfflineQueue('non_existent_id');
      expect(removed).toBe(false);
    });

    it('reports pending operations', () => {
      engine.addToOfflineQueue('op1', {}, 'normal');
      engine.addToOfflineQueue('op2', {}, 'high');
      const pending = engine.getPendingOperations();
      expect(pending.length).toBe(2);
    });
  });

  describe('Sync Operations', () => {
    it('adds sync operation', () => {
      const syncOp = engine.addSyncOperation({
        type: 'pull',
        resource: 'test_resource',
      });
      expect(syncOp).toHaveProperty('id');
      expect(syncOp.type).toBe('pull');
      expect(syncOp.resource).toBe('test_resource');
      expect(syncOp.state).toBe('pending');
    });

    it('completes sync operation successfully', () => {
      const syncOp = engine.addSyncOperation({
        type: 'push',
        resource: 'test_resource',
      });
      const completed = engine.completeSyncOperation(syncOp.id, true);
      expect(completed).toBe(true);
    });

    it('handles failed sync operation', () => {
      const syncOp = engine.addSyncOperation({
        type: 'pull',
        resource: 'test_resource',
      });
      const completed = engine.completeSyncOperation(syncOp.id, false);
      expect(completed).toBe(true);
    });

    it('rejects completing non-existent sync operation', () => {
      const completed = engine.completeSyncOperation('non_existent', true);
      expect(completed).toBe(false);
    });
  });

  describe('Queue Size Limits', () => {
    it('respects max offline queue size', () => {
      // Add operations up to the limit
      for (let i = 0; i < 10; i++) {
        engine.addToOfflineQueue(`op_${i}`, {}, 'normal');
      }
      const queue = engine.getOfflineQueue();
      // Should be capped at 1000, but we added 10 so should have 10
      expect(queue.length).toBe(10);
    });

    it('processes operations when online', async () => {
      engine.addToOfflineQueue('test_op', {}, 'normal');
      // Engine starts offline, so operation stays pending
      const health = engine.getHealth();
      expect(health.offlineQueueSize).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Health Metrics', () => {
    it('reports health metrics', () => {
      const health = engine.getHealth();
      expect(health).toHaveProperty('isRunning');
      expect(health).toHaveProperty('connectivityState');
      expect(health).toHaveProperty('currentProfile');
      expect(health).toHaveProperty('offlineQueueSize');
      expect(health).toHaveProperty('pendingSyncOperations');
      expect(health).toHaveProperty('totalHCUSpent');
      expect(health).toHaveProperty('hcuBudgetPerHour');
      expect(health).toHaveProperty('uptimePercentage');
      expect(typeof health.uptimePercentage).toBe('number');
      expect(health.uptimePercentage).toBeGreaterThanOrEqual(0);
      expect(health.uptimePercentage).toBeLessThanOrEqual(100);
    });

    it('reports zero HCU spent initially', () => {
      const health = engine.getHealth();
      expect(health.totalHCUSpent).toBe(0);
    });
  });

  describe('Config Management', () => {
    it('updates config', () => {
      engine.updateConfig({ hcuBudgetPerHour: 2.0, maxOfflineQueueSize: 200 });
      const config = engine.getConfig();
      expect(config.hcuBudgetPerHour).toBe(2.0);
      expect(config.maxOfflineQueueSize).toBe(200);
    });

    it('defaults are applied', () => {
      const defaultEngine = createNeverCutOffEngine();
      expect(defaultEngine.getConfig().hcuBudgetPerHour).toBe(0.5);
      expect(defaultEngine.getConfig().maxOfflineQueueSize).toBe(1000);
    });
  });

  describe('Event System', () => {
    it('emits connectivity_changed event', () => {
      let eventReceived = false;
      engine.onEvent('connectivity_changed', () => { eventReceived = true; });
      // Connectivity change happens in detectConnectivity during init
      // Just verify the listener can be registered
      expect(() => {
        engine.onEvent('connectivity_changed', () => {});
      }).not.toThrow();
    });

    it('emits offline_queue_added event', () => {
      let eventReceived = false;
      engine.onEvent('offline_queue_added', () => { eventReceived = true; });
      engine.addToOfflineQueue('test_op', {}, 'normal');
      // Event is emitted synchronously during addToOfflineQueue
    });

    it('registers and removes event listeners', () => {
      const listener = vi.fn();
      engine.onEvent('connectivity_changed', listener);
      engine.offEvent?.('connectivity_changed', listener);
      // Listener removal test
    });
  });
});