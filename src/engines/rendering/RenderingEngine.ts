// src/engines/rendering/RenderingEngine.ts
// Engine 9: Rendering — Frame rendering, framebuffer management, and visual output

import type { RenderingConfig, RenderingHealth, Frame, RenderingEvent } from './types';
import { logToCosmos } from '../../core/cosmosMemory';
import * as hcu from '../../core/cost/costGovernor';
import { pinpoint } from '../../core/precision/pinpointPrecision';
import * as bossAgent from '../../core/engines/bossAgent';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CONFIG: RenderingConfig = {
  framesPerSecond: 60,
  framebufferWidth: 1920,
  framebufferHeight: 1080,
  maxFramesInFlight: 2,
  hcuBudgetPerHour: 1.0,
  enableVSync: true,
};

const initialFrames: Frame[] = [];

export class RenderingEngine {
  private config: RenderingConfig;
  private isRunning = false;
  private totalHCUSpent = 0;
  private eventListeners: Map<string, Set<(event: RenderingEvent) => void>> = new Map();

  constructor(config: Partial<RenderingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    hcu.track('rendering_init', 0.01);
    pinpoint.verify('rendering');
    bossAgent.grade({ operation: 'init', engine: 'rendering' }, { engine: 'rendering' });

    await this.log('rendering_engine_initialized', { config: this.config });
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    hcu.track('rendering_shutdown', 0.01);
    pinpoint.verify('rendering');
    bossAgent.grade({ operation: 'shutdown', engine: 'rendering' }, { engine: 'rendering' });

    await this.log('rendering_engine_shutdown', { totalHCUSpent: this.totalHCUSpent });
  }

  // Frame Management

  createFrame(data: Partial<Frame>): Frame {
    hcu.track('rendering_createFrame', 0.001);
    pinpoint.verify('rendering');
    bossAgent.grade({ operation: 'createFrame', frameId: data.id || 'frame', engine: 'rendering' }, { engine: 'rendering' });

    const frame: Frame = {
      id: `frame_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      width: this.config.framebufferWidth,
      height: this.config.framebufferHeight,
      ...data,
    };
    this.totalHCUSpent += 0.001;
    this.emitEvent?.({ type: 'frame_created', frame });
    return frame;
  }

  getFrames(): Frame[] {
    return initialFrames;
  }

  // Health & Config

  getHealth(): RenderingHealth {
    return {
      isRunning: this.isRunning,
      totalHCUSpent: this.totalHCUSpent,
      hcuBudgetPerHour: this.config.hcuBudgetPerHour,
    };
  }

  getConfig(): RenderingConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<RenderingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Event System

  onEvent<K extends RenderingEvent['type']>(
    eventType: K,
    listener: (event: Extract<RenderingEvent, { type: K }>) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener as any);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener as any);
    };
  }

  emitEvent(event: RenderingEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error('Rendering engine event error:', e);
        }
      }
    }
  }

  // Logging

  private async log(type: string, data: Record<string, unknown>): Promise<void> {
    try {
      await logToCosmos({
        type: `rendering_${type}`,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }
}

export function createRenderingEngine(config?: Partial<RenderingConfig>): RenderingEngine {
  return new RenderingEngine(config);
}

export default RenderingEngine;