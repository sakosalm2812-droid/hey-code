// src/engines/neverCutOff/types.ts
// Engine 15: Never Cut Off — Type definitions with interfaces

export interface ConnectivityState {
  value: 'online' | 'offline' | 'limited' | 'reconnecting';
  label: string;
}

export interface SyncState {
  value: 'synced' | 'pending' | 'conflict' | 'error';
  label: string;
}

export interface NetworkProfile {
  id: string;
  name: string;
  type: 'wifi' | 'ethernet' | 'cellular' | 'satellite' | 'mesh';
  priority: number;
  bandwidth: { down: number; up: number }; // Mbps
  latency: number; // ms
  reliability: number; // 0-1
  costPerMb: number;
}

export interface OfflineQueue {
  id: string;
  operation: string;
  payload: unknown;
  timestamp: string;
  retries: number;
  maxRetries: number;
  priority: 'critical' | 'high' | 'normal' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface SyncOperation {
  id: string;
  type: 'pull' | 'push' | 'bidirectional';
  resource: string;
  lastSync: string;
  nextSync: string;
  state: SyncState;
  itemsProcessed: number;
  itemsTotal: number;
  error?: string;
}

export interface AvailabilityConfig {
  minConnectivityCheckIntervalMs: number;
  maxOfflineQueueSize: number;
  syncIntervalMs: number;
  retryBaseDelayMs: number;
  maxRetryDelayMs: number;
  criticalOperations: string[];
  hcuBudgetPerHour: number;
}

export interface NeverCutOffEvent =
  | { type: 'connectivity_changed'; state: ConnectivityState; previous: ConnectivityState }
  | { type: 'offline_queue_added'; operation: OfflineQueue }
  | { type: 'offline_queue_processed'; operation: OfflineQueue; success: boolean }
  | { type: 'sync_started'; operation: SyncOperation }
  | { type: 'sync_completed'; operation: SyncOperation }
  | { type: 'sync_failed'; operation: SyncOperation; error: string }
  | { type: 'network_profile_selected'; profile: NetworkProfile };

export interface NeverCutOffHealth {
  isRunning: boolean;
  connectivityState: ConnectivityState;
  currentProfile: NetworkProfile | null;
  offlineQueueSize: number;
  pendingSyncOperations: number;
  lastSuccessfulSync: string | null;
  totalHCUSpent: number;
  hcuBudgetPerHour: number;
  uptimePercentage: number;
}