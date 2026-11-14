// src/engines/crossDevice/types.ts
// Types for Engine 10: Cross-Device Organism

export interface DeviceType {
  value: 'desktop' | 'laptop' | 'phone' | 'tablet' | 'watch' | 'tv' | 'other';
  label: string;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  platform: string;
  status: 'online' | 'offline' | 'sleeping' | 'error';
  lastSeen: string;
  capabilities: DeviceCapability[];
  battery?: number;
  connectivity: { wifi: boolean; bluetooth: boolean; cellular: boolean };
}

export interface DeviceCapability {
  name: string;
  description?: string;
}

export interface DeviceState {
  deviceId: string;
  timestamp: string;
  activityLevel: number; // 0-1
  foreground: boolean;
  batteryLevel: number;
  isCharging: boolean;
  screenOn: boolean;
  audioPlaying: boolean;
}

export interface SyncMessage {
  id: string;
  from: string;
  to: string;
  type: 'state' | 'handoff' | 'continuation' | 'notification' | 'sync_request';
  payload: unknown;
  timestamp: string;
  status: 'pending' | 'delivered' | 'failed';
}

export interface CrossDeviceConfig {
  discoveryIntervalMs: number;
  syncIntervalMs: number;
  heartbeatIntervalMs: number;
  hcuBudgetPerHour: number;
  autoHandoff: boolean;
  maxDevices: number;
}

export interface CrossDeviceEvent =
  | { type: 'device_discovered'; device: Device }
  | { type: 'device_offline'; deviceId: string }
  | { type: 'state_synced'; from: string; to: string }
  | { type: 'handoff_initiated'; from: string; to: string; context: string }
  | { type: 'sync_message'; message: SyncMessage };