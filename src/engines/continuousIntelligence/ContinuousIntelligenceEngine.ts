// src/engines/continuousIntelligence/ContinuousIntelligenceEngine.ts
// Engine 5: Continuous Intelligence — Background reasoning, context monitoring, anomaly detection

import type {
  ThoughtStreamItem,
  BackgroundReasoningTask,
  AnomalyAlert,
  IntelligenceConfig,
  IntelligenceEvent,
} from './types';
import { logToCosmos } from '../../core/cosmosMemory';
import * as hcu from '../../core/cost/costGovernor';
import { pinpoint } from '../../core/precision/pinpointPrecision';
import * as bossAgent from '../../core/engines/bossAgent';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CONFIG: IntelligenceConfig = {
  backgroundReasoningIntervalMs: 60000, // 1 minute
  maxThoughtHistory: 1000,
  anomalyCheckIntervalMs: 30000, // 30 seconds
  hcuBudgetPerMinute: 5.0,
  autoEscalateCritical: true,
};

export class ContinuousIntelligenceEngine {
  private config: IntelligenceConfig;
  private thoughtStream: ThoughtStreamItem[] = [];
  private reasoningQueue: BackgroundReasoningTask[] = [];
  private anomalies: AnomalyAlert[] = [];
  private eventListeners: Map<string, Set<(event: IntelligenceEvent) => void>> = new Map();
  private reasoningTimer: ReturnType<typeof setInterval> | null = null;
  private anomalyTimer: ReturnType<typeof setInterval> | null = null;
  private totalHCUSpent = 0;
  private isRunning = false;

  constructor(config: Partial<IntelligenceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    hcu.track('initialize', 0.01);
    pinpoint.verify('continuousIntelligence');
    bossAgent.grade({ operation: 'initialize', engine: 'continuousIntelligence' }, { engine: 'continuousIntelligence' });

    this.reasoningTimer = setInterval(() => this.processBackgroundReasoning(), this.config.backgroundReasoningIntervalMs);
    this.anomalyTimer = setInterval(() => this.checkAnomalies(), this.config.anomalyCheckIntervalMs);

    // Seed initial thought
    this.addThought({
      source: 'background_reasoning',
      content: 'Continuous Intelligence engine initialized. Monitoring for anomalies and processing background reasoning.',
      confidence: 1.0,
      tags: ['system', 'init'],
      status: 'active',
    });

    await this.log('intelligence_initialized', { config: this.config });
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.reasoningTimer) {
      clearInterval(this.reasoningTimer);
      this.reasoningTimer = null;
    }
    if (this.anomalyTimer) {
      clearInterval(this.anomalyTimer);
      this.anomalyTimer = null;
    }

    await this.log('intelligence_shutdown', { totalHCUSpent: this.totalHCUSpent });
  }

  // ============================================
  // Thought Stream
  // ============================================

  addThought(thought: Omit<ThoughtStreamItem, 'id' | 'timestamp'>): ThoughtStreamItem {
    const item: ThoughtStreamItem = {
      ...thought,
      id: `thought_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
    };

    this.thoughtStream.unshift(item);
    if (this.thoughtStream.length > this.config.maxThoughtHistory) {
      this.thoughtStream = this.thoughtStream.slice(0, this.config.maxThoughtHistory);
    }

    this.emitEvent({ type: 'thought_generated', thought: item });
    return item;
  }

  getThoughts(filter?: { status?: ThoughtStreamItem['status']; source?: ThoughtStreamItem['source']; limit?: number }): ThoughtStreamItem[] {
    let results = [...this.thoughtStream];
    if (filter?.status) results = results.filter(t => t.status === filter.status);
    if (filter?.source) results = results.filter(t => t.source === filter.source);
    if (filter?.limit) results = results.slice(0, filter.limit);
    return results;
  }

  escalateThought(thoughtId: string): boolean {
    const thought = this.thoughtStream.find(t => t.id === thoughtId);
    if (thought) {
      thought.status = 'escalated';
      return true;
    }
    return false;
  }

  archiveThought(thoughtId: string): boolean {
    const thought = this.thoughtStream.find(t => t.id === thoughtId);
    if (thought) {
      thought.status = 'archived';
      return true;
    }
    return false;
  }

  // ============================================
  // Background Reasoning
  // ============================================

  queueReasoningTask(title: string, prompt: string, hcuCost = 0.1): BackgroundReasoningTask {
    const task: BackgroundReasoningTask = {
      id: `reasoning_${uuidv4().slice(0, 8)}`,
      title,
      prompt,
      status: 'queued',
      hcuCost,
      createdAt: new Date().toISOString(),
    };

    this.reasoningQueue.push(task);
    return task;
  }

  private async processBackgroundReasoning(): Promise<void> {
    if (!this.isRunning) return;

    const queuedTasks = this.reasoningQueue.filter(t => t.status === 'queued');
    if (queuedTasks.length === 0) return;

    // Check HCU budget
    const totalCost = queuedTasks.reduce((sum, t) => sum + t.hcuCost, 0);
    if (this.totalHCUSpent + totalCost > this.config.hcuBudgetPerMinute * 10) { // 10-min rolling window
      return; // Budget exceeded, skip this cycle
    }

    for (const task of queuedTasks.slice(0, 3)) { // Process max 3 per cycle
      await this.executeReasoningTask(task);
    }
  }

  private async executeReasoningTask(task: BackgroundReasoningTask): Promise<void> {
    hcu.track('executeReasoningTask', task.hcuCost);
    pinpoint.verify('continuousIntelligence');
    bossAgent.grade({ operation: 'executeReasoningTask', taskId: task.id, status: task.status }, { engine: 'continuousIntelligence' });
    task.status = 'processing';

    try {
      // In production, this would call an LLM
      // For now, generate a simulated result
      const result = await this.simulateReasoning(task.prompt);
      task.result = result;
      task.status = 'completed';
      task.completedAt = new Date().toISOString();

      this.totalHCUSpent += task.hcuCost;

      // Add result as a thought
      this.addThought({
        source: 'background_reasoning',
        content: `${task.title}: ${result}`,
        confidence: 0.85,
        tags: ['reasoning', 'completed'],
        status: 'active',
      });

      this.emitEvent({ type: 'reasoning_completed', task });
    } catch (e) {
      task.status = 'failed';
      task.result = e instanceof Error ? e.message : 'Unknown error';
      task.completedAt = new Date().toISOString();
    }
  }

  private async simulateReasoning(prompt: string): Promise<string> {
    // Simulated reasoning - in production would call actual LLM
    await new Promise(r => setTimeout(r, 50));
    return `Processed: "${prompt.slice(0, 50)}..." — Analysis complete. Key insights generated.`;
  }

  getReasoningTasks(status?: BackgroundReasoningTask['status']): BackgroundReasoningTask[] {
    if (status) return this.reasoningQueue.filter(t => t.status === status);
    return [...this.reasoningQueue];
  }

  // ============================================
  // Anomaly Detection
  // ============================================

  private checkAnomalies(): void {
    if (!this.isRunning) return;

    // Check HCU budget anomaly
    if (this.totalHCUSpent > this.config.hcuBudgetPerMinute * 5) {
      this.createAnomaly({
        severity: 'high',
        title: 'HCU Budget Exceeded',
        description: `Total HCU spent (${this.totalHCUSpent.toFixed(2)}) exceeds 5x per-minute budget (${this.config.hcuBudgetPerMinute})`,
        sourceSystem: 'cost_governor',
      });
    }

    // Check reasoning queue backlog
    const pendingCount = this.reasoningQueue.filter(t => t.status === 'queued').length;
    if (pendingCount > 20) {
      this.createAnomaly({
        severity: 'medium',
        title: 'Reasoning Queue Backlog',
        description: `${pendingCount} reasoning tasks queued, exceeding normal threshold`,
        sourceSystem: 'reasoning_scheduler',
      });
    }

    // Check thought stream growth
    if (this.thoughtStream.length > this.config.maxThoughtHistory * 0.9) {
      this.createAnomaly({
        severity: 'low',
        title: 'Thought Stream Near Capacity',
        description: `Thought stream at ${this.thoughtStream.length}/${this.config.maxThoughtHistory} capacity`,
        sourceSystem: 'memory_manager',
      });
    }
  }

  private createAnomaly(alert: Omit<AnomalyAlert, 'id' | 'timestamp' | 'resolved'>): AnomalyAlert {
    const anomaly: AnomalyAlert = {
      ...alert,
      id: `anomaly_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    this.anomalies.push(anomaly);
    this.emitEvent({ type: 'anomaly_detected', alert: anomaly });
    return anomaly;
  }

  getAnomalies(resolved?: boolean): AnomalyAlert[] {
    if (resolved !== undefined) return this.anomalies.filter(a => a.resolved === resolved);
    return [...this.anomalies];
  }

  resolveAnomaly(anomalyId: string): boolean {
    const anomaly = this.anomalies.find(a => a.id === anomalyId);
    if (anomaly) {
      anomaly.resolved = true;
      return true;
    }
    return false;
  }

  // ============================================
  // Health & Metrics
  // ============================================

  getHealth(): {
    isRunning: boolean;
    thoughtCount: number;
    activeThoughts: number;
    queuedReasoning: number;
    completedReasoning: number;
    activeAnomalies: number;
    totalHCUSpent: number;
    hcuBudgetPerMinute: number;
  } {
    return {
      isRunning: this.isRunning,
      thoughtCount: this.thoughtStream.length,
      activeThoughts: this.thoughtStream.filter(t => t.status === 'active').length,
      queuedReasoning: this.reasoningQueue.filter(t => t.status === 'queued').length,
      completedReasoning: this.reasoningQueue.filter(t => t.status === 'completed').length,
      activeAnomalies: this.anomalies.filter(a => !a.resolved).length,
      totalHCUSpent: this.totalHCUSpent,
      hcuBudgetPerMinute: this.config.hcuBudgetPerMinute,
    };
  }

  getConfig(): IntelligenceConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<IntelligenceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // Event System
  // ============================================

  onEvent<K extends IntelligenceEvent['type']>(
    eventType: K,
    listener: (event: Extract<IntelligenceEvent, { type: K }>) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener as any);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener as any);
    };
  }

  private emitEvent(event: IntelligenceEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error(`Intelligence event listener error:`, e);
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
        type: `intelligence_${type}`,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }
}

export function createContinuousIntelligenceEngine(config?: Partial<IntelligenceConfig>): ContinuousIntelligenceEngine {
  return new ContinuousIntelligenceEngine(config);
}

export default ContinuousIntelligenceEngine;