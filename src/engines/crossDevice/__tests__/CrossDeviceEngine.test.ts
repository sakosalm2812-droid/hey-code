// src/engines/crossDevice/__tests__/CrossDeviceEngine.test.ts
// Tests for Cross-Device Organism Engine

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CrossDeviceEngine, createCrossDeviceEngine } from '../CrossDeviceEngine';
import type { CrossDeviceConfig, Device, DeviceState, SyncMessage } from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

describe('CrossDeviceEngine', () => {
  let engine: CrossDeviceEngine;

  const testConfig: Partial<CrossDeviceConfig> = {
    discoveryIntervalMs: 1000,
    syncIntervalMs: 1000,
    heartbeatIntervalMs: 1000,
    hcuBudgetPerHour: 10.0,
    autoHandoff: true,
    maxDevices: 10,
  };

  beforeEach(async () => {
    engine = createCrossDeviceEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Initialization', () => {
    it('initializes with default config', async () => {
      const defaultEngine = createCrossDeviceEngine();
      await defaultEngine.initialize();
      const health = defaultEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.hcuBudgetPerHour).toBe(1.5);
      await defaultEngine.shutdown();
    });

    it('initializes with custom config', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.hcuBudgetPerHour).toBe(10.0);
    });

    it('registers primary device on initialize', () => {
      const devices = engine.getDevices();
      expect(devices.length).toBeGreaterThan(0);
      expect(devices[0].name).toBe('Primary Desktop');
      expect(devices[0].type).toBe('desktop');
      expect(devices[0].status).toBe('online');
    });
  });

  describe('Device Discovery & Registration', () => {
    it('registers a new device', () => {
      const device = engine.registerDevice({
        name: 'Test Phone',
        type: 'phone',
        platform: 'android',
        capabilities: ['display', 'touch', 'notifications'],
        connectivity: { wifi: true, bluetooth: true, cellular: true },
      });

      expect(device.id).toMatch(/^device_/);
      expect(device.name).toBe('Test Phone');
      expect(device.type).toBe('phone');
      expect(device.status).toBe('online');
      expect(device.lastSeen).toBeDefined();
    });

    it('returns existing device if name matches', () => {
      const device1 = engine.registerDevice({
        name: 'Duplicate Phone',
        type: 'phone',
        platform: 'android',
        capabilities: ['display'],
        connectivity: { wifi: true, bluetooth: false, cellular: false },
      });

      const device2 = engine.registerDevice({
        name: 'Duplicate Phone',
        type: 'phone',
        platform: 'android',
        capabilities: ['display'],
        connectivity: { wifi: true, bluetooth: false, cellular: false },
      });

      expect(device1.id).toBe(device2.id);
      expect(device2.status).toBe('online');
    });

    it('throws when max devices reached', async () => {
      const smallEngine = createCrossDeviceEngine({ maxDevices: 2 });
      await smallEngine.initialize();

      // Primary device already registered, so only 1 more slot
      smallEngine.registerDevice({ name: 'D1', type: 'phone', platform: 'android', capabilities: [], connectivity: { wifi: false, bluetooth: false, cellular: false } });

      expect(() => {
        smallEngine.registerDevice({ name: 'D2', type: 'phone', platform: 'android', capabilities: [], connectivity: { wifi: false, bluetooth: false, cellular: false } });
      }).toThrow('Max devices reached');

      await smallEngine.shutdown();
    });

    it('gets all devices', () => {
      engine.registerDevice({ name: 'Phone', type: 'phone', platform: 'android', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: true } });
      engine.registerDevice({ name: 'Tablet', type: 'tablet', platform: 'android', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: false } });

      const devices = engine.getDevices();
      expect(devices.length).toBeGreaterThanOrEqual(3); // Primary + 2 new
    });

    it('gets online devices only', () => {
      engine.registerDevice({ name: 'Phone', type: 'phone', platform: 'android', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: true } });
      const device = engine.getDevices().find(d => d.name === 'Phone');
      if (device) engine.markDeviceOffline(device.id);

      const onlineDevices = engine.getOnlineDevices();
      expect(onlineDevices.every(d => d.status === 'online')).toBe(true);
    });

    it('gets specific device by id', () => {
      const device = engine.registerDevice({ name: 'Specific', type: 'watch', platform: 'wearos', capabilities: [], connectivity: { wifi: false, bluetooth: true, cellular: false } });
      const found = engine.getDevice(device.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Specific');
    });

    it('marks device offline', () => {
      const device = engine.registerDevice({ name: 'ToOffline', type: 'phone', platform: 'android', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: true } });
      const result = engine.markDeviceOffline(device.id);
      expect(result).toBe(true);

      const found = engine.getDevice(device.id);
      expect(found?.status).toBe('offline');
    });
  });

  describe('Device State', () => {
    it('updates device state', () => {
      const device = engine.registerDevice({ name: 'StatePhone', type: 'phone', platform: 'android', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: true } });

      const result = engine.updateDeviceState(device.id, {
        activityLevel: 0.8,
        foreground: true,
        batteryLevel: 75,
        isCharging: false,
        screenOn: true,
        audioPlaying: false,
      });

      expect(result).toBe(true);
      const state = engine.getDeviceState(device.id);
      expect(state).toBeDefined();
      expect(state?.activityLevel).toBe(0.8);
      expect(state?.batteryLevel).toBe(75);
    });

    it('returns false for unknown device state update', () => {
      const result = engine.updateDeviceState('unknown_device', {
        activityLevel: 0.5,
        foreground: true,
        batteryLevel: 50,
        isCharging: true,
        screenOn: true,
        audioPlaying: true,
      });
      expect(result).toBe(false);
    });

    it('gets all device states', () => {
      const device1 = engine.registerDevice({ name: 'State1', type: 'phone', platform: 'android', capabilities: [], connectivity: { wifi: true, bluetooth: false, cellular: false } });
      const device2 = engine.registerDevice({ name: 'State2', type: 'tablet', platform: 'android', capabilities: [], connectivity: { wifi: true, bluetooth: false, cellular: false } });

      // Update states for both devices
      engine.updateDeviceState(device1.id, {
        activityLevel: 0.5,
        foreground: true,
        batteryLevel: 80,
        isCharging: false,
        screenOn: true,
        audioPlaying: false,
      });
      engine.updateDeviceState(device2.id, {
        activityLevel: 0.3,
        foreground: false,
        batteryLevel: 60,
        isCharging: true,
        screenOn: false,
        audioPlaying: false,
      });

      const states = engine.getAllDeviceStates();
      expect(states.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Context Handoff', () => {
    it('initiates handoff between online devices', () => {
      const fromDevice = engine.registerDevice({ name: 'FromPhone', type: 'phone', platform: 'android', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: true } });
      const toDevice = engine.registerDevice({ name: 'ToLaptop', type: 'laptop', platform: 'windows', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: false } });

      const result = engine.initiateHandoff(fromDevice.id, toDevice.id, 'Continue reading article');
      expect(result).toBe(true);
    });

    it('fails handoff if from device offline', () => {
      const fromDevice = engine.registerDevice({ name: 'FromPhone', type: 'phone', platform: 'android', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: true } });
      const toDevice = engine.registerDevice({ name: 'ToLaptop', type: 'laptop', platform: 'windows', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: false } });

      engine.markDeviceOffline(fromDevice.id);
      const result = engine.initiateHandoff(fromDevice.id, toDevice.id, 'test');
      expect(result).toBe(false);
    });

    it('fails handoff if to device offline', () => {
      const fromDevice = engine.registerDevice({ name: 'FromPhone', type: 'phone', platform: 'android', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: true } });
      const toDevice = engine.registerDevice({ name: 'ToLaptop', type: 'laptop', platform: 'windows', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: false } });

      engine.markDeviceOffline(toDevice.id);
      const result = engine.initiateHandoff(fromDevice.id, toDevice.id, 'test');
      expect(result).toBe(false);
    });

    it('fails handoff if autoHandoff disabled', () => {
      engine.updateConfig({ autoHandoff: false });
      const fromDevice = engine.registerDevice({ name: 'FromPhone', type: 'phone', platform: 'android', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: true } });
      const toDevice = engine.registerDevice({ name: 'ToLaptop', type: 'laptop', platform: 'windows', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: false } });

      const result = engine.initiateHandoff(fromDevice.id, toDevice.id, 'test');
      expect(result).toBe(false);
    });
  });

  describe('Sync Messages', () => {
    it('sends sync message', () => {
      const fromDevice = engine.registerDevice({ name: 'MsgFrom', type: 'phone', platform: 'android', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: true } });
      const toDevice = engine.registerDevice({ name: 'MsgTo', type: 'laptop', platform: 'windows', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: false } });

      const message = engine.sendSyncMessage(fromDevice.id, toDevice.id, 'state', { test: 'payload' });

      expect(message.id).toMatch(/^sync_/);
      expect(message.from).toBe(fromDevice.id);
      expect(message.to).toBe(toDevice.id);
      expect(message.type).toBe('state');
      expect(message.payload).toEqual({ test: 'payload' });
      expect(message.status).toBe('pending');
    });

    it('gets sync messages', () => {
      const fromDevice = engine.registerDevice({ name: 'MsgFrom', type: 'phone', platform: 'android', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: true } });
      const toDevice = engine.registerDevice({ name: 'MsgTo', type: 'laptop', platform: 'windows', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: false } });

      engine.sendSyncMessage(fromDevice.id, toDevice.id, 'state', { data: 1 });
      engine.sendSyncMessage(fromDevice.id, toDevice.id, 'handoff', { data: 2 });

      const messages = engine.getSyncMessages(10);
      expect(messages.length).toBeGreaterThanOrEqual(2);
    });

    it('limits sync messages returned', () => {
      const fromDevice = engine.registerDevice({ name: 'MsgFrom', type: 'phone', platform: 'android', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: true } });
      const toDevice = engine.registerDevice({ name: 'MsgTo', type: 'laptop', platform: 'windows', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: false } });

      engine.sendSyncMessage(fromDevice.id, toDevice.id, 'state', { data: 1 });
      engine.sendSyncMessage(fromDevice.id, toDevice.id, 'state', { data: 2 });

      const messages = engine.getSyncMessages(1);
      expect(messages.length).toBe(1);
    });
  });

  describe('Health & Config', () => {
    it('reports health metrics', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.totalDevices).toBeGreaterThan(0);
      expect(health.onlineDevices).toBeGreaterThan(0);
      expect(health.totalHCUSpent).toBeGreaterThanOrEqual(0);
    });

    it('updates config', () => {
      engine.updateConfig({ discoveryIntervalMs: 5000, hcuBudgetPerHour: 5.0 });
      const config = engine.getConfig();
      expect(config.discoveryIntervalMs).toBe(5000);
      expect(config.hcuBudgetPerHour).toBe(5.0);
    });
  });

  describe('Event System', () => {
    it('emits device_discovered event', () => {
      let eventReceived = false;
      let eventDevice: Device | null = null;

      const unsubscribe = engine.onEvent('device_discovered', (e) => {
        eventReceived = true;
        eventDevice = e.device;
      });

      engine.registerDevice({ name: 'EventPhone', type: 'phone', platform: 'android', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: true } });

      expect(eventReceived).toBe(true);
      expect(eventDevice).not.toBeNull();
      expect(eventDevice?.name).toBe('EventPhone');

      unsubscribe();
    });

    it('emits device_offline event', () => {
      let eventReceived = false;
      let eventDeviceId: string | null = null;

      const device = engine.registerDevice({ name: 'OfflinePhone', type: 'phone', platform: 'android', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: true } });

      engine.onEvent('device_offline', (e) => {
        eventReceived = true;
        eventDeviceId = e.deviceId;
      });

      engine.markDeviceOffline(device.id);

      expect(eventReceived).toBe(true);
      expect(eventDeviceId).toBe(device.id);
    });

    it('emits sync_message event after delivery simulation', async () => {
      let eventReceived = false;
      let eventMessage: SyncMessage | null = null;

      const fromDevice = engine.registerDevice({ name: 'MsgFrom', type: 'phone', platform: 'android', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: true } });
      const toDevice = engine.registerDevice({ name: 'MsgTo', type: 'laptop', platform: 'windows', capabilities: [], connectivity: { wifi: true, bluetooth: true, cellular: false } });

      engine.onEvent('sync_message', (e) => {
        eventReceived = true;
        eventMessage = e.message;
      });

      engine.sendSyncMessage(fromDevice.id, toDevice.id, 'state', { test: true });

      // Wait for simulated delivery
      await new Promise(r => setTimeout(r, 200));

      expect(eventReceived).toBe(true);
      expect(eventMessage).not.toBeNull();
      expect(['delivered', 'failed']).toContain(eventMessage?.status);
    });
  });
});