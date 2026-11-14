// src/engines/multiSense/MultiSenseEngine.ts
// Engine 7: Multi-Sense Control — Multi-modal sensory integration and fusion

import type {
  SenseType,
  SenseChannel,
  SensoryInput,
  SenseFusionResult,
  MultiSenseConfig,
  MultiSenseEvent,
} from './types';
import { logToCosmos } from '../../core/cosmosMemory';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CONFIG: MultiSenseConfig = {
  enabledSenses: ['vision', 'audio', 'spatial'],
  fusionIntervalMs: 5000,
  minConfidenceThreshold: 0.5,
  hcuBudgetPerMinute: 3.0,
  autoCalibrate: true,
};

export class MultiSenseEngine {
  private config: MultiSenseConfig;
  private channels: Map<string, SenseChannel> = new Map();
  private inputBuffer: SensoryInput[] = [];
  private fusionHistory: SenseFusionResult[] = [];
  private eventListeners: Map<string, Set<(event: MultiSenseEvent) => void>> = new Map();
  private fusionTimer: ReturnType<typeof setInterval> | null = null;
  private totalHCUSpent = 0;
  private isRunning = false;

  constructor(config: Partial<MultiSenseConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeChannels();
  }

  private initializeChannels(): void {
    const defaultChannels: Omit<SenseChannel, 'id' | 'lastActivity' | 'metadata'>[] = [
      { type: 'vision', name: 'Screen Vision', status: 'active', sensitivity: 0.8 },
      { type: 'audio', name: 'System Audio', status: 'inactive', sensitivity: 0.7 },
      { type: 'tactile', name: 'Input Tracking', status: 'active', sensitivity: 0.6 },
      { type: 'spatial', name: 'Window Layout', status: 'active', sensitivity: 0.9 },
      { type: 'biometric', name: 'Biometric', status: 'inactive', sensitivity: 0.5 },
    ];

    for (const ch of defaultChannels) {
      if (this.config.enabledSenses.includes(ch.type)) {
        const channel: SenseChannel = {
          ...ch,
          id: `sense_${ch.type}`,
          lastActivity: new Date().toISOString(),
          metadata: {},
        };
        this.channels.set(channel.id, channel);
      }
    }
  }

  async initialize(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    hcu.track('multiSense_init', 0.01);
    pinpoint.verify('multiSense');
    bossAgent.grade({ operation: 'init', engine: 'multiSense' }, { engine: 'multiSense' });

    this.fusionTimer = setInterval(() => this.fuseSenses(), this.config.fusionIntervalMs);

    // Initial fusion
    await this.fuseSenses();

    await this.log('multisense_initialized', {
      enabledSenses: this.config.enabledSenses,
      channels: Array.from(this.channels.values()).map(c => c.type),
    });
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    hcu.track('multiSense_shutdown', 0.01);
    pinpoint.verify('multiSense');
    bossAgent.grade({ operation: 'shutdown', engine: 'multiSense' }, { engine: 'multiSense' });

    if (this.fusionTimer) {
      clearInterval(this.fusionTimer);
      this.fusionTimer = null;
    }

    // Deactivate all channels
    for (const channel of this.channels.values()) {
      channel.status = 'inactive';
    }

    await this.log('multisense_shutdown', { totalHCUSpent: this.totalHCUSpent });
  }

  // ============================================
  // Channel Management
  // ============================================

  activateSense(type: SenseType): SenseChannel | null {
    let channel = Array.from(this.channels.values()).find(c => c.type === type);
    if (!channel) {
      channel = {
        id: `sense_${type}_${uuidv4().slice(0, 4)}`,
        type,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Sense`,
        status: 'active',
        sensitivity: 0.7,
        lastActivity: new Date().toISOString(),
        metadata: {},
      };
      this.channels.set(channel.id, channel);
    } else {
      channel.status = 'active';
    }

    this.emitEvent({ type: 'sense_activated', channelId: channel.id, senseType: type });
    return channel;
  }

  deactivateSense(channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.status = 'inactive';
      return true;
    }
    return false;
  }

  setSensitivity(channelId: string, sensitivity: number): boolean {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.sensitivity = Math.max(0, Math.min(1, sensitivity));
      return true;
    }
    return false;
  }

  getChannels(): SenseChannel[] {
    return Array.from(this.channels.values());
  }

  getChannel(channelId: string): SenseChannel | undefined {
    return this.channels.get(channelId);
  }

  // ============================================
  // Sensory Input
  // ============================================

  receiveInput(input: Omit<SensoryInput, 'id' | 'timestamp'>): SensoryInput {
    const sensoryInput: SensoryInput = {
      ...input,
      id: `input_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
    };

    // Validate channel exists and is active
    const channel = this.channels.get(input.channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${input.channelId}`);
    }
    if (channel.status !== 'active') {
      throw new Error(`Channel not active: ${input.channelId}`);
    }

    channel.lastActivity = sensoryInput.timestamp;

    // Add to buffer
    this.inputBuffer.unshift(sensoryInput);
    if (this.inputBuffer.length > 1000) {
      this.inputBuffer = this.inputBuffer.slice(0, 800);
    }

    this.emitEvent({ type: 'sensory_input_received', input: sensoryInput });
    return sensoryInput;
  }

  // Convenience methods for simulated input
  simulateVisionInput(data: { elements: string[]; focusArea?: string }, confidence = 0.9): SensoryInput {
    const visionChannel = this.getVisionChannel();
    if (!visionChannel) throw new Error('Vision channel not available');
    return this.receiveInput({
      channelId: visionChannel.id,
      type: 'vision',
      data,
      confidence,
      importance: 0.8,
    });
  }

  simulateAudioInput(data: { transcript: string; keywords: string[] }, confidence = 0.85): SensoryInput {
    const audioChannel = this.getAudioChannel();
    if (!audioChannel) throw new Error('Audio channel not available');
    return this.receiveInput({
      channelId: audioChannel.id,
      type: 'audio',
      data,
      confidence,
      importance: 0.7,
    });
  }

  simulateSpatialInput(data: { windows: string[]; layout: string }, confidence = 0.95): SensoryInput {
    const spatialChannel = this.getSpatialChannel();
    if (!spatialChannel) throw new Error('Spatial channel not available');
    return this.receiveInput({
      channelId: spatialChannel.id,
      type: 'spatial',
      data,
      confidence,
      importance: 0.6,
    });
  }

  simulateTactileInput(data: { actions: string[]; hotkeys: string[] }, confidence = 0.9): SensoryInput {
    const tactileChannel = this.getTactileChannel();
    if (!tactileChannel) throw new Error('Tactile channel not available');
    return this.receiveInput({
      channelId: tactileChannel.id,
      type: 'tactile',
      data,
      confidence,
      importance: 0.5,
    });
  }

  private getVisionChannel(): SenseChannel | undefined {
    return Array.from(this.channels.values()).find(c => c.type === 'vision');
  }
  private getAudioChannel(): SenseChannel | undefined {
    return Array.from(this.channels.values()).find(c => c.type === 'audio');
  }
  private getSpatialChannel(): SenseChannel | undefined {
    return Array.from(this.channels.values()).find(c => c.type === 'spatial');
  }
  private getTactileChannel(): SenseChannel | undefined {
    return Array.from(this.channels.values()).find(c => c.type === 'tactile');
  }

  // ============================================
  // Sense Fusion
  // ============================================

  private async fuseSenses(): Promise<SenseFusionResult | null> {
    if (!this.isRunning) return null;
    if (this.inputBuffer.length === 0) return null;

    hcu.track('multiSense_fuseSenses', 0.001);
    pinpoint.verify('multiSense');
    bossAgent.grade({ operation: 'fuseSenses', engine: 'multiSense' }, { engine: 'multiSense' });

    const recentInputs = this.inputBuffer.slice(0, 50);
    const inputsByType = this.groupByType(recentInputs);

    if (Object.keys(inputsByType).length < 2) {
      // Need at least 2 senses for meaningful fusion
      return null;
    }

    const contributingSenses = Object.keys(inputsByType) as SenseType[];
    const insight = this.generateUnifiedInsight(inputsByType);
    const confidence = this.calculateFusionConfidence(inputsByType);
    const intent = this.inferIntent(inputsByType);

    if (confidence < this.config.minConfidenceThreshold) {
      return null;
    }

    const result: SenseFusionResult = {
      id: `fusion_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      unifiedInsight: insight,
      contributingSenses,
      confidence,
      intent,
    };

    this.fusionHistory.unshift(result);
    if (this.fusionHistory.length > 200) {
      this.fusionHistory = this.fusionHistory.slice(0, 150);
    }

    // Clear processed inputs (keep some for context)
    this.inputBuffer = this.inputBuffer.slice(50);

    this.totalHCUSpent += 0.02;
    this.emitEvent({ type: 'senses_fused', result });
    return result;
  }

  private groupByType(inputs: SensoryInput[]): Record<SenseType, SensoryInput[]> {
    const grouped: Record<string, SensoryInput[]> = {};
    for (const input of inputs) {
      if (!grouped[input.type]) grouped[input.type] = [];
      grouped[input.type].push(input);
    }
    return grouped as Record<SenseType, SensoryInput[]>;
  }

  private generateUnifiedInsight(inputsByType: Record<SenseType, SensoryInput[]>): string {
    const parts: string[] = [];

    if (inputsByType.vision?.length) {
      const latest = inputsByType.vision[0].data as any;
      parts.push(`Vision: ${latest.elements?.join(', ') || 'monitoring'}`);
    }
    if (inputsByType.audio?.length) {
      const latest = inputsByType.audio[0].data as any;
      parts.push(`Audio: "${latest.transcript?.slice(0, 30) || 'listening'}..."`);
    }
    if (inputsByType.spatial?.length) {
      const latest = inputsByType.spatial[0].data as any;
      parts.push(`Spatial: ${latest.layout || 'mapping'} (${latest.windows?.length || 0} windows)`);
    }
    if (inputsByType.tactile?.length) {
      const latest = inputsByType.tactile[0].data as any;
      parts.push(`Tactile: ${latest.actions?.join(', ') || 'tracking'}`);
    }

    return `Multi-sense fusion: ${parts.join(' | ')}`;
  }

  private calculateFusionConfidence(inputsByType: Record<SenseType, SensoryInput[]>): number {
    let totalConfidence = 0;
    let totalWeight = 0;

    for (const [type, inputs] of Object.entries(inputsByType)) {
      if (inputs.length === 0) continue;
      const channel = this.getChannels().find(c => c.type === type);
      const sensitivity = channel?.sensitivity || 0.5;

      const avgConfidence = inputs.reduce((sum, i) => sum + i.confidence, 0) / inputs.length;
      const weight = sensitivity * Math.min(inputs.length / 5, 1);

      totalConfidence += avgConfidence * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalConfidence / totalWeight : 0;
  }

  private inferIntent(inputsByType: Record<SenseType, SensoryInput[]>): string | undefined {
    // Simple intent inference based on patterns
    if (inputsByType.vision && inputsByType.tactile) {
      const vision = inputsByType.vision[0].data as any;
      const tactile = inputsByType.tactile[0].data as any;

      if (vision.elements?.some((e: string) => e.includes('code') || e.includes('editor'))) {
        return 'coding_session';
      }
      if (tactile.hotkeys?.some((h: string) => h.includes('ctrl') || h.includes('cmd'))) {
        return 'productivity_work';
      }
    }

    if (inputsByType.audio && inputsByType.audio[0].data) {
      const audio = inputsByType.audio[0].data as any;
      if (audio.keywords?.some((k: string) => ['meeting', 'call', 'presentation'].includes(k.toLowerCase()))) {
        return 'meeting_active';
      }
    }

    if (inputsByType.spatial) {
      const spatial = inputsByType.spatial[0].data as any;
      if (spatial.windows && spatial.windows.length > 5) {
        return 'multitasking';
      }
    }

    return 'general_monitoring';
  }

  getFusionHistory(limit = 50): SenseFusionResult[] {
    return this.fusionHistory.slice(0, limit);
  }

  getLatestFusion(): SenseFusionResult | null {
    return this.fusionHistory[0] || null;
  }

  // ============================================
  // Health & Config
  // ============================================

  getHealth(): {
    isRunning: boolean;
    activeChannels: number;
    totalChannels: number;
    bufferedInputs: number;
    fusionCount: number;
    totalHCUSpent: number;
    hcuBudgetPerMinute: number;
  } {
    return {
      isRunning: this.isRunning,
      activeChannels: Array.from(this.channels.values()).filter(c => c.status === 'active').length,
      totalChannels: this.channels.size,
      bufferedInputs: this.inputBuffer.length,
      fusionCount: this.fusionHistory.length,
      totalHCUSpent: this.totalHCUSpent,
      hcuBudgetPerMinute: this.config.hcuBudgetPerMinute,
    };
  }

  getConfig(): MultiSenseConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<MultiSenseConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.enabledSenses) {
      // Reinitialize channels based on new enabled senses
      this.channels.clear();
      this.initializeChannels();
    }
  }

  // ============================================
  // Event System
  // ============================================

  onEvent<K extends MultiSenseEvent['type']>(
    eventType: K,
    listener: (event: Extract<MultiSenseEvent, { type: K }>) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener as any);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener as any);
    };
  }

  private emitEvent(event: MultiSenseEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error(`MultiSense event listener error:`, e);
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
        type: `multisense_${type}`,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }
}

export function createMultiSenseEngine(config?: Partial<MultiSenseConfig>): MultiSenseEngine {
  return new MultiSenseEngine(config);
}

export default MultiSenseEngine;