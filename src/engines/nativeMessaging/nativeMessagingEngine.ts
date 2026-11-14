// src/engines/nativeMessaging/NativeMessagingEngine.ts
// Engine 16: Native Messaging — Communication via native messaging host integration

import type { NativeMessagingConfig, NativeMessagingHealth, NativeMessagingEvent } from './types';
import * as hcu from '../../core/cost/costGovernor';
import { pinpoint } from '../../core/precision/pinpointPrecision';
import * as bossAgent from '../../core/engines/bossAgent';
import { logToCosmos } from '../../core/cosmosMemory';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CONFIG: NativeMessagingConfig = {
  enabled: false,
  origin: '',
  platforms: ['windows', 'linux', 'mac'],
  hcuBudgetPerHour: 0.5,
  maxMessageSize: 65536,
  retryAttempts: 3,
};

const initialMessages: any[] = [];

export class NativeMessagingEngine {
  private config: NativeMessagingConfig;
  private isRunning = false;
  private totalHCUSpent = 0;
  private eventListeners: Map<string, Set<(event: NativeMessagingEvent) => void>> = new Map();

  constructor(config: Partial<NativeMessagingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    hcu.track('native_messaging_init', 0.01);
    pinpoint.verify('nativeMessaging');
    bossAgent.grade({ operation: 'init', engine: 'nativeMessaging' }, { engine: 'nativeMessaging' });

    await this.log('native_messaging_initialized', { config: this.config });
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;
    await this.log('native_messaging_shutdown', { totalHCUSpent: this.totalHCUSpent });
  }

  // Message Management

  sendMessage(message: any): boolean {
    if (!this.config.enabled) {
      this.emitEvent({ type: 'message_sent', success: false, error: 'Engine not enabled' });
      return false;
    }
    track(0.001);
    this.totalHCUSpent += 0.001;
    this.emitEvent({ type: 'message_sent', success: true, message });
    pinpoint.verify('nativeMessaging');
    grade({ operation: 'sendMessage', messageSize: JSON.stringify(message).length }, { engine: 'nativeMessaging' });
    return true;
  }

  sendMessage(message: any): boolean {
    if (!this.config.enabled) {
      this.emitEvent({ type: 'message_sent', success: false, error: 'Engine not enabled' });
      return false;
    }
    hcu.track('message_sent', 0.001);
    this.totalHCUSpent += 0.001;
    this.emitEvent({ type: 'message_sent', success: true, message });
    pinpoint.verify('nativeMessaging');
    bossAgent.grade({ operation: 'sendMessage', messageSize: JSON.stringify(message).length }, { engine: 'nativeMessaging' });
    return true;
  }

  receiveMessage(message: any): void {
    this.emitEvent({ type: 'message_received', message });
  }

  // Health & Config

  getHealth(): NativeMessagingHealth {
    return {
      isRunning: this.isRunning,
      totalHCUSpent: this.totalHCUSpent,
      hcuBudgetPerHour: this.config.hcuBudgetPerHour,
      enabled: this.config.enabled,
    };
  }

  getConfig(): NativeMessagingConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<NativeMessagingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Event System

  onEvent<K extends NativeMessagingEvent['type']>(
    eventType: K,
    listener: (event: Extract<NativeMessagingEvent, { type: K }>) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener as any);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener as any);
    };
  }

  emitEvent(event: NativeMessagingEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error('Native Messaging engine event error:', e);
        }
      }
    }
  }

  // Logging

  private async log(type: string, data: Record<string, unknown>): Promise<void> {
    try {
      await logToCosmos({
        type: `native_messaging_${type}`,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }
}

export function createNativeMessagingEngine(config?: Partial<NativeMessagingConfig>): NativeMessagingEngine {
  return new NativeMessagingEngine(config);
}

export default NativeMessagingEngine;