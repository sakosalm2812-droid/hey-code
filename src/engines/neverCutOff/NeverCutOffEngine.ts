// src/engines/neverCutOff/NeverCutOffEngine.ts
// Engine 15: Never Cut Off — Continuous availability, offline-first

import type {
  ConnectivityState,
  SyncState,
  NetworkProfile,
  OfflineQueue,
  SyncOperation,
  AvailabilityConfig,
  NeverCutOffEvent,
  NeverCutOffHealth,
} from './types';
import * as hcu from '../../core/cost/costGovernor';
import { pinpoint } from '../../core/precision/pinpointPrecision';
import * as bossAgent from '../../core/engines/bossAgent';
import { logToCosmos } from '../../core/cosmosMemory';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CONFIG: AvailabilityConfig = {
  minConnectivityCheckIntervalMs: 30000,
  maxOfflineQueueSize: 1000,
  syncIntervalMs: 60000,
  retryBaseDelayMs: 1000,
  maxRetryDelayMs: 60000,
  criticalOperations: ['computer_control', 'filesystem_write', 'external_communication'],
  hcuBudgetPerHour: 0.5,
};

const DEFAULT_NETWORK_PROFILES: NetworkProfile[] = [
  { id: 'wifi-home', name: 'Home WiFi', type: 'wifi', priority: 10, bandwidth: { down: 50, up: 10 }, latency: 20, reliability: 0.95, costPerMb: 0.01 },
  { id: 'wifi-work', name: 'Work WiFi', type: 'wifi', priority: 8, bandwidth: { down: 100, up: 20 }, latency: 10, reliability: 0.98, costPerMb: 0.005 },
  { id: 'cellular-5g', name: '5G Cellular', type: 'cellular', priority: 6, bandwidth: { down: 500, up: 100 }, latency: 30, reliability: 0.9, costPerMb: 0.1 },
  { id: 'ethernet', name: 'Ethernet', type: 'ethernet', priority: 12, bandwidth: { down: 1000, up: 500 }, latency: 5, reliability: 0.99, costPerMb: 0.001 },
];

const initialQueue: OfflineQueue[] = [];

export class NeverCutOffEngine {
  private config: AvailabilityConfig;
  private connectivityState: ConnectivityState = 'offline';
  private currentProfile: NetworkProfile | null = null;
  private offlineQueue: OfflineQueue[] = [...initialQueue];
  private syncOperations: Map<string, SyncOperation> = new Map();
  private eventListeners: Map<string, Set<(event: NeverCutOffEvent) => void>> = new Map();
  private connectivityTimer: ReturnType<typeof setInterval> | null = null;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private totalHCUSpent = 0;
  private isRunning = false;

  constructor(config: Partial<AvailabilityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    hcu.track('neverCutOff_init', 0.01);
    pinpoint.verify('neverCutOff');
    bossAgent.grade({ operation: 'init', engine: 'neverCutOff' }, { engine: 'neverCutOff' });

    // Determine initial connectivity based on environment
    const initialState = this.detectConnectivity();
    this.connectivityState = initialState.state;
    this.currentProfile = initialState.profile;

    this.emitEvent({ type: 'connectivity_changed', state: this.connectivityState, previous: 'unknown' });

    this.connectivityTimer = setInterval(() => this.checkConnectivity(), this.config.minConnectivityCheckIntervalMs);
    this.syncTimer = setInterval(() => this.syncOperationCycle(), this.config.syncIntervalMs);

    await this.log('never_cutoff_initialized', { config: this.config });
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.connectivityTimer) {
      clearInterval(this.connectivityTimer);
      this.connectivityTimer = null;
    }
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    await this.log('never_cutoff_shutdown', { totalHCUSpent: this.totalHCUSpent });
  }

  // ============================================
  // Connectivity Management
  // ============================================

  getConnectivityState(): ConnectivityState {
    return this.connectivityState;
  }

  getCurrentProfile(): NetworkProfile | null {
    return this.currentProfile;
  }

  getOfflineQueue(): OfflineQueue[] {
    return this.offlineQueue;
  }

  getPendingOperations(): string[] {
    return this.offlineQueue.filter(o => o.status === 'pending').map(o => o.id);
  }

  getSyncOperations(): SyncOperation[] {
    return Array.from(this.syncOperations.values());
  }

  // ============================================
  // Queue Management
  // ============================================

  addToOfflineQueue(
    operation: string,
    payload: unknown,
    priority: 'critical' | 'high' | 'normal' | 'low' = 'normal',
    maxRetries?: number
  ): OfflineQueue {
    if (track(0.001) > 0.5) {
      throw new Error('HCU budget exceeded');
    }

    const queueItem: OfflineQueue = {
      id: `queue_${uuidv4().slice(0, 8)}`,
      operation,
      payload,
      timestamp: new Date().toISOString(),
      retries: 0,
      maxRetries: maxRetries ?? 3,
      priority,
      status: 'pending',
    };

    this.offlineQueue.unshift(queueItem);
    this.emitEvent({ type: 'offline_queue_added', operation: queueItem });
    this.totalHCUSpent += 0.001;

    // BossAgent grade on queue operations
    grade({ operation, queueSize: this.offlineQueue.length }, { engine: 'neverCutOff' });

    // Pinpoint verify on queue state change
    pinpoint.verify('neverCutOff');

    return queueItem;
  }

  removeFromOfflineQueue(queueId: string): boolean {
    const idx = this.offlineQueue.findIndex(o => o.id === queueId);
    if (idx >= 0) {
      this.offlineQueue.splice(idx, 1);
      return true;
    }
    return false;
  }

  // ============================================
  // Sync Management
  // ============================================

  addSyncOperation(op: Omit<SyncOperation, 'id' | 'lastSync' | 'nextSync' | 'itemsProcessed' | 'itemsTotal' | 'state'>): SyncOperation {
    const now = new Date().toISOString();
    const operation: SyncOperation = {
      id: `sync_${uuidv4().slice(0, 8)}`,
      type: op.type,
      resource: op.resource,
      lastSync: now,
      nextSync: new Date(Date.now() + this.config.syncIntervalMs).toISOString(),
      state: 'pending',
      itemsProcessed: 0,
      itemsTotal: 0,
      error: undefined,
    };

    this.syncOperations.set(operation.id, operation);
    this.emitEvent({ type: 'sync_started', operation });
    return operation;
  }

  completeSyncOperation(queueId: string, success: boolean): boolean {
    const syncOp = Array.from(this.syncOperations.values()).find(o => o.id === queueId);
    if (!syncOp) return false;

    syncOp.state = success ? 'conflict' : 'error'; // Could also be 'synced' in real usage
    syncOp.itemsProcessed = success ? syncOp.itemsTotal : 0;
    syncOp.error = success ? undefined : 'Sync failed';

    this.emitEvent({ type: success ? 'sync_completed' : 'sync_failed', operation: syncOp });
    return true;
  }

  // ============================================
  // Connectivity Detection
  // ============================================

  private detectConnectivity(): { state: ConnectivityState; profile: NetworkProfile | null } {
    // In production, would check actual network state via Tauri/network APIs
    // For now, default to offline with default profile
    const wifiProfile = DEFAULT_NETWORK_PROFILES.find(p => p.type === 'wifi' && p.id === 'wifi-home');
    return { state: 'offline', profile: wifiProfile || null };
  }

  private checkConnectivity(): void {
    // Simulate connectivity check
    const wasOffline = this.connectivityState !== 'online';

    // Random chance to go online (for simulation purposes)
    const random = Math.random();
    if (wasOffline && random < 0.05) {
      this.connectivityState = 'online';
      this.currentProfile = DEFAULT_NETWORK_PROFILES.find(p => p.type === 'wifi' && p.id === 'wifi-home');
      this.emitEvent({ type: 'connectivity_changed', state: this.connectivityState, previous: 'offline' });
    } else if (!wasOffline && random < 0.01) {
      this.connectivityState = 'limited';
      this.emitEvent({ type: 'connectivity_changed', state: this.connectivityState, previous: 'online' });
    }
  }

  private syncOperationCycle(): void {
    if (!this.isRunning) return;

    hcu.track('neverCutOff_sync_cycle', 0.001);
    pinpoint.verify('neverCutOff');
    bossAgent.grade({ operation: 'sync_cycle', connectivity: this.connectivityState }, { engine: 'neverCutOff' });

    // Sync pending offline operations when online
    if (this.connectivityState === 'online' || this.connectivityState === 'limited') {
      this.processOfflineQueue();
    }

    // Run pending syncs
    this.runSyncOperations();
  }

  private processOfflineQueue(): void {
    const pending = this.offlineQueue.filter(o => o.status === 'pending');
    for (const item of pending) {
      this.processQueueItem(item);
    }
  }

  private processQueueItem(item: OfflineQueue): void {
    // Check if this is a critical operation and we're online
    const isCritical = this.config.criticalOperations.includes(item.operation);
    const canProcess = isCritical || this.connectivityState === 'online';

    if (canProcess) {
      // Move to processing then complete
      item.status = 'processing';
      item.retries++;
      item.timestamp = new Date().toISOString();

      // Simulate successful processing
      setTimeout(() => {
        item.status = 'completed';
        this.emitEvent({ type: 'offline_queue_processed', operation: item, success: true });
        this.totalHCUSpent += 0.001;
      }, 100);
    } else {
      // Retry with exponential backoff
      const backoff = Math.min(this.config.retryBaseDelayMs * Math.pow(2, item.retries), this.config.maxRetryDelayMs);
      setTimeout(() => this.processQueueItem(item), backoff);
    }
  }

  private runSyncOperations(): void {
    const pendingSyncs = Array.from(this.syncOperations.values()).filter(o => o.state === 'pending');
    for (const syncOp of pendingSyncs) {
      // Simulate sync
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate
        this.completeSyncOperation(syncOp.id, success);
        this.totalHCUSpent += 0.005;
      }, 200);
    }
  }

  // ============================================
  // Health & Config
  // ============================================

  getHealth(): NeverCutOffHealth {
    const pendingCount = this.offlineQueue.filter(o => o.status === 'pending').length;
    const completedCount = this.offlineQueue.filter(o => o.status === 'completed').length;
    const failedCount = this.offlineQueue.filter(o => o.status === 'failed').length;
    const uptime = this.isRunning ? (Date.now() / 1000) % 86400 : 0;

    return {
      isRunning: this.isRunning,
      connectivityState: this.connectivityState,
      currentProfile: this.currentProfile,
      offlineQueueSize: this.offlineQueue.length,
      pendingSyncOperations: this.syncOperations.size,
      lastSuccessfulSync: this.offlineQueue.find(o => o.status === 'completed')?.timestamp || null,
      totalHCUSpent: this.totalHCUSpent,
      hcuBudgetPerHour: this.config.hcuBudgetPerHour,
      uptimePercentage: Math.min(100, (uptime % 86400) / 86400 * 100),
    };
  }

  getConfig(): AvailabilityConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<AvailabilityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // Event System
  // ============================================

  onEvent<K extends NeverCutOffEvent['type']>(
    eventType: K,
    listener: (event: Extract<NeverCutOffEvent, { type: K }>) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener as any);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener as any);
    };
  }

  private emitEvent(event: NeverCutOffEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error(`NeverCutOff event listener error:`, e);
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
        type: `never_cutoff_${type}`,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }
}

export function createNeverCutOffEngine(config?: Partial<AvailabilityConfig>): NeverCutOffEngine {
  return new NeverCutOffEngine(config);
}

export default NeverCutOffEngine;