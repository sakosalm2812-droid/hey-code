// Tests for Native Messaging Engine
// Engine 16: Native Messaging — Communication via native messaging host integration

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NativeMessagingEngine, createNativeMessagingEngine } from '../nativeMessagingEngine';
import type { NativeMessagingConfig } from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

describe('NativeMessagingEngine', () => {
  let engine: NativeMessagingEngine;

  const testConfig: Partial<NativeMessagingConfig> = {
    enabled: false,
    origin: '',
    platforms: ['windows', 'linux', 'mac'],
    hcuBudgetPerHour: 0.5,
    maxMessageSize: 65536,
    retryAttempts: 3,
  };

  beforeEach(async () => {
    engine = createNativeMessagingEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Initialization', () => {
    it('initializes with default config', async () => {
      const defaultEngine = createNativeMessagingEngine();
      await defaultEngine.initialize();
      const health = defaultEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.enabled).toBe(false);
      await defaultEngine.shutdown();
    });

    it('initializes with custom config', async () => {
      const customEngine = createNativeMessagingEngine({
        enabled: true,
        origin: 'chrome-extension://test',
        hcuBudgetPerHour: 2.0,
      });
      await customEngine.initialize();
      const health = customEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.enabled).toBe(true);
      await customEngine.shutdown();
    });
  });

  describe('Message Management', () => {
    it('sends message when enabled', async () => {
      const enabledEngine = createNativeMessagingEngine({
        ...testConfig,
        enabled: true,
      });
      await enabledEngine.initialize();
      const result = enabledEngine.sendMessage({ test: 'data' });
      expect(result).toBe(true);
      await enabledEngine.shutdown();
    });

    it('rejects message when disabled', async () => {
      const result = await engine.sendMessage({ test: 'data' });
      expect(result).toBe(false);
    });

    it('receives message', () => {
      let messageReceived = false;
      engine.onEvent('message_received', () => { messageReceived = true; });
      engine.receiveMessage({ test: 'data' });
      expect(messageReceived).toBe(true);
    });
  });

  describe('Health Metrics', () => {
    it('reports health metrics', () => {
      const health = engine.getHealth();
      expect(health).toHaveProperty('isRunning');
      expect(health).toHaveProperty('totalHCUSpent');
      expect(health).toHaveProperty('hcuBudgetPerHour');
      expect(health).toHaveProperty('enabled');
    });

    it('tracks HCU spending after send', () => {
      const enabledEngine = createNativeMessagingEngine({ ...testConfig, enabled: true });
      enabledEngine.initialize();
      enabledEngine.sendMessage({ test: 'data' });
      const health = enabledEngine.getHealth();
      expect(health.totalHCUSpent).toBeGreaterThan(0);
      enabledEngine.shutdown();
    });
  });

  describe('Config Management', () => {
    it('updates config', async () => {
      await engine.updateConfig({ enabled: true, hcuBudgetPerHour: 2.0 });
      const config = engine.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.hcuBudgetPerHour).toBe(2.0);
    });
  });

  describe('Event System', () => {
    it('registers event listeners', () => {
      const listener = vi.fn();
      engine.onEvent('message_received', listener);
      engine.receiveMessage({ test: 'data' });
      expect(listener).toHaveBeenCalled();
    });

    it('emits message_sent event', async () => {
      const enabledEngine = createNativeMessagingEngine({ ...testConfig, enabled: true });
      await enabledEngine.initialize();
      let eventReceived = false;
      enabledEngine.onEvent('message_sent', () => { eventReceived = true; });
      enabledEngine.sendMessage({ test: 'data' });
      expect(eventReceived).toBe(true);
      await enabledEngine.shutdown();
    });

    it('emits message_received event', () => {
      let eventReceived = false;
      engine.onEvent('message_received', () => { eventReceived = true; });
      engine.receiveMessage({ test: 'data' });
      expect(eventReceived).toBe(true);
    });
  });
});