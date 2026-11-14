// src/engines/crossDevice/CrossDeviceEngine.ts
// Engine 10: Cross-Device Organism — Device discovery, state sync, context handoff

import type {
  Device,
  DeviceType,
  DeviceCapability,
  DeviceState,
  SyncMessage,
  CrossDeviceConfig,
  CrossDeviceEvent,
} from './types';
import * as hcu from '../../core/cost/costGovernor';
import { pinpoint } from '../../core/precision/pinpointPrecision';
import * as bossAgent from '../../core/engines/bossAgent';
import { logToCosmos } from '../../core/cosmosMemory';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CONFIG: CrossDeviceConfig = {
  discoveryIntervalMs: 30000,
  syncIntervalMs: 15000,
  heartbeatIntervalMs: 10000,
  hcuBudgetPerHour: 1.5,
  autoHandoff: true,
  maxDevices: 10,
};

export class CrossDeviceEngine {
  private config: CrossDeviceConfig;
  private devices: Map<string, Device> = new Map();
  private deviceStates: Map<string, DeviceState> = new Map();
  private syncMessages: SyncMessage[] = [];
  private eventListeners: Map<string, Set<(event: CrossDeviceEvent) => void>> = new Map();
  private discoveryTimer: ReturnType<typeof setInterval> | null = null;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private totalHCUSpent = 0;
  private isRunning = false;

  constructor(config: Partial<CrossDeviceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    hcu.track('initialize', 0.01);
    pinpoint.verify('crossDevice');
    bossAgent.grade({ operation: 'initialize', engine: 'crossDevice' }, { engine: 'crossDevice' });

    // Register primary device
    this.registerDevice({
      name: 'Primary Desktop',
      type: 'desktop',
      platform: 'windows',
      capabilities: ['display', 'audio_output', 'keyboard', 'mouse', 'sensors', 'notifications'],
      connectivity: { wifi: true, bluetooth: true, cellular: false },
    });

    this.discoveryTimer = setInterval(() => this.discoverDevices(), this.config.discoveryIntervalMs);
    this.syncTimer = setInterval(() => this.syncStates(), this.config.syncIntervalMs);
    this.heartbeatTimer = setInterval(() => this.checkHeartbeats(), this.config.heartbeatIntervalMs);

    await this.log('cross_device_initialized', { config: this.config });
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
      this.discoveryTimer = null;
    }
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Mark all devices offline
    for (const device of this.devices.values()) {
      device.status = 'offline';
    }

    await this.log('cross_device_shutdown', { totalHCUSpent: this.totalHCUSpent });
  }

  // ============================================
  // Device Discovery & Registration
  // ============================================

  registerDevice(device: Omit<Device, 'id' | 'status' | 'lastSeen'>): Device {
    hcu.track('registerDevice', 0.01);
    pinpoint.verify('crossDevice');
    bossAgent.grade({ operation: 'registerDevice', deviceName: device.name, deviceId: device.type }, { engine: 'crossDevice' });
    if (this.devices.size >= this.config.maxDevices && !this.devices.has(device.name)) {
      throw new Error(`Max devices reached: ${this.config.maxDevices}`);
    }

    // Check if device already registered by name
    const existing = Array.from(this.devices.values()).find(d => d.name === device.name);
    if (existing) {
      existing.status = 'online';
      existing.lastSeen = new Date().toISOString();
      return existing;
    }

    const newDevice: Device = {
      ...device,
      id: `device_${uuidv4().slice(0, 8)}`,
      status: 'online',
      lastSeen: new Date().toISOString(),
    };

    this.devices.set(newDevice.id, newDevice);
    this.emitEvent({ type: 'device_discovered', device: newDevice });
    return newDevice;
  }

  private async discoverDevices(): Promise<void> {
    if (!this.isRunning) return;

    // Simulate discovering nearby devices
    // In production, would use actual discovery protocols (mDNS, BLE, etc.)
    const potentialDevices: { name: string; type: DeviceType; platform: string; capabilities: DeviceCapability[] }[] = [
      { name: 'Phone', type: 'phone', platform: 'android', capabilities: ['display', 'touch', 'notifications', 'microphone', 'location', 'camera'] },
      { name: 'Laptop', type: 'laptop', platform: 'windows', capabilities: ['display', 'audio_output', 'keyboard', 'mouse', 'sensors'] },
      { name: 'Tablet', type: 'tablet', platform: 'android', capabilities: ['display', 'touch', 'notifications', 'camera'] },
      { name: 'Watch', type: 'watch', platform: 'wearos', capabilities: ['display', 'sensors', 'notifications'] },
    ];

    // Random chance to discover each
    for (const potential of potentialDevices) {
      if (Math.random() < 0.3) {
        this.registerDevice({
          ...potential,
          connectivity: { wifi: Math.random() > 0.3, bluetooth: Math.random() > 0.5, cellular: potential.type === 'phone' },
        });
      }
    }

    this.totalHCUSpent += 0.01;
  }

  getDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  getOnlineDevices(): Device[] {
    return Array.from(this.devices.values()).filter(d => d.status === 'online');
  }

  getDevice(deviceId: string): Device | undefined {
    return this.devices.get(deviceId);
  }

  markDeviceOffline(deviceId: string): boolean {
    const device = this.devices.get(deviceId);
    if (device) {
      device.status = 'offline';
      device.lastSeen = new Date().toISOString();
      this.emitEvent({ type: 'device_offline', deviceId });
      return true;
    }
    return false;
  }

  // ============================================
  // Device State
  // ============================================

  updateDeviceState(deviceId: string, state: Omit<DeviceState, 'deviceId' | 'timestamp'>): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    this.deviceStates.set(deviceId, {
      ...state,
      deviceId,
      timestamp: new Date().toISOString(),
    });
    device.lastSeen = new Date().toISOString();
    device.status = 'online';

    return true;
  }

  getDeviceState(deviceId: string): DeviceState | undefined {
    return this.deviceStates.get(deviceId);
  }

  getAllDeviceStates(): Map<string, DeviceState> {
    return new Map(this.deviceStates);
  }

  private async syncStates(): Promise<void> {
    if (!this.isRunning) return;

    const onlineDevices = this.getOnlineDevices();
    if (onlineDevices.length < 2) return;

    // Simulate syncing states between devices
    const primary = onlineDevices[0];
    for (let i = 1; i < onlineDevices.length; i++) {
      const secondary = onlineDevices[i];
      this.emitEvent({ type: 'state_synced', from: primary.id, to: secondary.id });
    }

    this.totalHCUSpent += 0.02;
  }

  // ============================================
  // Context Handoff
  // ============================================

  initiateHandoff(fromDeviceId: string, toDeviceId: string, context: string): boolean {
    const fromDevice = this.devices.get(fromDeviceId);
    const toDevice = this.devices.get(toDeviceId);

    if (!fromDevice || !toDevice) return false;
    if (fromDevice.status !== 'online' || toDevice.status !== 'online') return false;
    if (!this.config.autoHandoff) return false;

    this.emitEvent({
      type: 'handoff_initiated',
      from: fromDeviceId,
      to: toDeviceId,
      context,
    });

    this.totalHCUSpent += 0.03;
    return true;
  }

  // ============================================
  // Sync Messages
  // ============================================

  sendSyncMessage(from: string, to: string, type: SyncMessage['type'], payload: unknown): SyncMessage {
    const message: SyncMessage = {
      id: `sync_${uuidv4().slice(0, 8)}`,
      from,
      to,
      type,
      payload,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    this.syncMessages.unshift(message);
    if (this.syncMessages.length > 1000) {
      this.syncMessages = this.syncMessages.slice(0, 800);
    }

    // Simulate delivery
    setTimeout(() => {
      message.status = Math.random() > 0.05 ? 'delivered' : 'failed';
      this.emitEvent({ type: 'sync_message', message });
    }, 100);

    return message;
  }

  getSyncMessages(limit = 50): SyncMessage[] {
    return this.syncMessages.slice(0, limit);
  }

  // ============================================
  // Heartbeats
  // ============================================

  private checkHeartbeats(): void {
    const now = Date.now();
    for (const device of this.devices.values()) {
      if (device.status === 'online') {
        const lastSeen = new Date(device.lastSeen).getTime();
        if (now - lastSeen > this.config.heartbeatIntervalMs * 3) {
          device.status = 'sleeping';
        }
      }
    }
  }

  // ============================================
  // Health & Config
  // ============================================

  getHealth(): {
    isRunning: boolean;
    totalDevices: number;
    onlineDevices: number;
    sleepingDevices: number;
    offlineDevices: number;
    syncMessageCount: number;
    totalHCUSpent: number;
    hcuBudgetPerHour: number;
  } {
    return {
      isRunning: this.isRunning,
      totalDevices: this.devices.size,
      onlineDevices: this.getOnlineDevices().length,
      sleepingDevices: Array.from(this.devices.values()).filter(d => d.status === 'sleeping').length,
      offlineDevices: Array.from(this.devices.values()).filter(d => d.status === 'offline').length,
      syncMessageCount: this.syncMessages.length,
      totalHCUSpent: this.totalHCUSpent,
      hcuBudgetPerHour: this.config.hcuBudgetPerHour,
    };
  }

  getConfig(): CrossDeviceConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<CrossDeviceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // Event System
  // ============================================

  onEvent<K extends CrossDeviceEvent['type']>(
    eventType: K,
    listener: (event: Extract<CrossDeviceEvent, { type: K }>) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener as any);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener as any);
    };
  }

  private emitEvent(event: CrossDeviceEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error(`CrossDevice event listener error:`, e);
        }
      }
    }
  }

  // ============================================
  // Logging
  // ============================================

  private async log(type: string, data: Record<string, unknown>): Promise<void> {
    try {
      await logToCosmos({
        type: `cross_device_${type}`,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }
}

export function createCrossDeviceEngine(config?: Partial<CrossDeviceConfig>): CrossDeviceEngine {
  return new CrossDeviceEngine(config);
}

export default CrossDeviceEngine;