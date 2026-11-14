// src/engines/performanceQuality/PerformanceQualityEngine.ts
// Engine 9: Performance & Quality — Metrics monitoring, quality scoring, performance benchmarking

import type {
  QualityMetric,
  PerformanceRecord,
  QualityScore,
  PerformanceQualityConfig,
  PerformanceQualityEvent,
} from './types';
import { logToCosmos } from '../../core/cosmosMemory';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CONFIG: PerformanceQualityConfig = {
  metricsRefreshIntervalMs: 30000,
  maxPerformanceRecords: 5000,
  hcuBudgetPerHour: 1.0,
  qualityAlertThreshold: 70,
  performanceBaseline: 100,
};

export class PerformanceQualityEngine {
  private config: PerformanceQualityConfig;
  private metrics: QualityMetric[] = [];
  private performanceRecords: PerformanceRecord[] = [];
  private qualityHistory: QualityScore[] = [];
  private eventListeners: Map<string, Set<(event: PerformanceQualityEvent) => void>> = new Map();
  private metricsTimer: ReturnType<typeof setInterval> | null = null;
  private totalHCUSpent = 0;
  private isRunning = false;

  constructor(config: Partial<PerformanceQualityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    this.metrics = [
      { id: 'perf_latency', name: 'Response Latency', category: 'performance', value: 100, target: 80, unit: 'ms', timestamp: new Date().toISOString(), trend: 'stable' },
      { id: 'perf_throughput', name: 'Throughput', category: 'performance', value: 80, target: 100, unit: 'ops/s', timestamp: new Date().toISOString(), trend: 'stable' },
      { id: 'rel_hcu_usage', name: 'HCU Efficiency', category: 'efficiency', value: 90, target: 95, unit: '%', timestamp: new Date().toISOString(), trend: 'stable' },
      { id: 'rel_task_success', name: 'Task Success Rate', category: 'reliability', value: 98, target: 99, unit: '%', timestamp: new Date().toISOString(), trend: 'stable' },
      { id: 'cor_accuracy', name: 'Action Accuracy', category: 'correctness', value: 97, target: 98, unit: '%', timestamp: new Date().toISOString(), trend: 'stable' },
      { id: 'ux_response', name: 'UX Responsiveness', category: 'user_experience', value: 85, target: 90, unit: 'score', timestamp: new Date().toISOString(), trend: 'stable' },
    ];
  }

  async initialize(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    hcu.track('perfQuality_init', 0.01);
    pinpoint.verify('performanceQuality');
    bossAgent.grade({ operation: 'init', engine: 'performanceQuality' }, { engine: 'performanceQuality' });

    this.metricsTimer = setInterval(() => this.refreshMetrics(), this.config.metricsRefreshIntervalMs);

    // Initial refresh and score
    await this.refreshMetrics();
    await this.computeQualityScore();

    await this.log('perf_quality_initialized', { config: this.config });
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    hcu.track('perfQuality_shutdown', 0.01);
    pinpoint.verify('performanceQuality');
    bossAgent.grade({ operation: 'shutdown', engine: 'performanceQuality' }, { engine: 'performanceQuality' });

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = null;
    }

    await this.log('perf_quality_shutdown', { totalHCUSpent: this.totalHCUSpent });
  }

  // ============================================
  // Metrics
  // ============================================

  private async refreshMetrics(): Promise<void> {
    if (!this.isRunning) return;

    hcu.track('perfQuality_refreshMetrics', 0.001);
    pinpoint.verify('performanceQuality');
    bossAgent.grade({ operation: 'refreshMetrics', engine: 'performanceQuality' }, { engine: 'performanceQuality' });

    // Simulate metric updates based on recent performance records
    const recentRecords = this.performanceRecords.slice(0, 100);

    // Update latency based on recent records
    if (recentRecords.length > 0) {
      const avgDuration = recentRecords.reduce((sum, r) => sum + r.durationMs, 0) / recentRecords.length;
      const latencyMetric = this.metrics.find(m => m.id === 'perf_latency');
      if (latencyMetric) {
        const prev = latencyMetric.value;
        latencyMetric.value = Math.round(avgDuration);
        latencyMetric.trend = latencyMetric.value < prev ? 'improving' : latencyMetric.value > prev * 1.2 ? 'declining' : 'stable';
        latencyMetric.timestamp = new Date().toISOString();
      }
    }

    // Update success rate
    if (recentRecords.length > 0) {
      const successRate = (recentRecords.filter(r => r.success).length / recentRecords.length) * 100;
      const successMetric = this.metrics.find(m => m.id === 'rel_task_success');
      if (successMetric) {
        successMetric.value = Math.round(successRate * 10) / 10;
        successMetric.trend = successRate >= 98 ? 'improving' : successRate < 95 ? 'declining' : 'stable';
        successMetric.timestamp = new Date().toISOString();
      }
    }

    // Update HCU efficiency
    const hcuMetric = this.metrics.find(m => m.id === 'rel_hcu_usage');
    if (hcuMetric) {
      const efficiency = Math.max(0, Math.min(100, 100 - (this.totalHCUSpent / Math.max(this.config.hcuBudgetPerHour, 0.1)) * 10));
      hcuMetric.value = Math.round(efficiency);
      hcuMetric.timestamp = new Date().toISOString();
    }

    this.totalHCUSpent += 0.01;
    this.emitEvent({ type: 'metrics_updated', metrics: this.getMetrics() });
  }

  getMetrics(category?: QualityMetric['category']): QualityMetric[] {
    if (category) return this.metrics.filter(m => m.category === category);
    return [...this.metrics];
  }

  getMetric(metricId: string): QualityMetric | undefined {
    return this.metrics.find(m => m.id === metricId);
  }

  // ============================================
  // Performance Records
  // ============================================

  recordPerformance(operation: string, durationMs: number, success: boolean, hcuCost = 0.01): PerformanceRecord {
    hcu.track('perfQuality_record', hcuCost);
    pinpoint.verify('performanceQuality');
    bossAgent.grade({ operation: 'record', durationMs, success, engine: 'performanceQuality' }, { engine: 'performanceQuality' });

    const record: PerformanceRecord = {
      id: `perf_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      operation,
      durationMs,
      hcuCost,
      success,
    };

    this.performanceRecords.unshift(record);
    if (this.performanceRecords.length > this.config.maxPerformanceRecords) {
      this.performanceRecords = this.performanceRecords.slice(0, this.config.maxPerformanceRecords);
    }

    this.emitEvent({ type: 'performance_recorded', record });
    return record;
  }

  getPerformanceRecords(limit = 100, operation?: string): PerformanceRecord[] {
    const records = operation
      ? this.performanceRecords.filter(r => r.operation === operation)
      : this.performanceRecords;
    return records.slice(0, limit);
  }

  getAverageLatency(operation?: string): number {
    const records = this.getPerformanceRecords(100, operation);
    if (records.length === 0) return 0;
    return records.reduce((sum, r) => sum + r.durationMs, 0) / records.length;
  }

  getSuccessRate(operation?: string): number {
    const records = this.getPerformanceRecords(100, operation);
    if (records.length === 0) return 1;
    return records.filter(r => r.success).length / records.length;
  }

  // ============================================
  // Quality Scoring
  // ============================================

  async computeQualityScore(): Promise<QualityScore> {
    hcu.track('perfQuality_computeScore', 0.01);
    pinpoint.verify('performanceQuality');
    bossAgent.grade({ operation: 'computeScore', engine: 'performanceQuality' }, { engine: 'performanceQuality' });

    const performance = this.calculateCategoryScore('performance');
    const reliability = this.calculateCategoryScore('reliability');
    const correctness = this.calculateCategoryScore('correctness');
    const efficiency = this.calculateCategoryScore('efficiency');
    const userExperience = this.calculateCategoryScore('user_experience');

    const overall = Math.round(
      (performance * 0.3 + reliability * 0.25 + correctness * 0.2 + efficiency * 0.15 + userExperience * 0.1)
    );

    const score: QualityScore = {
      id: `quality_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      overall,
      performance,
      reliability,
      correctness,
      efficiency,
      userExperience,
      grade: this.calculateGrade(overall),
    };

    this.qualityHistory.unshift(score);
    if (this.qualityHistory.length > 1000) {
      this.qualityHistory = this.qualityHistory.slice(0, 500);
    }

    this.emitEvent({ type: 'quality_score_computed', score });

    if (overall < this.config.qualityAlertThreshold) {
      this.emitEvent({
        type: 'quality_alert',
        score,
        message: `Quality score dropped to ${overall} (below threshold of ${this.config.qualityAlertThreshold})`,
      });
    }

    this.totalHCUSpent += 0.02;
    return score;
  }

  private calculateCategoryScore(category: QualityMetric['category']): number {
    const categoryMetrics = this.metrics.filter(m => m.category === category);
    if (categoryMetrics.length === 0) return 100;

    return Math.round(
      categoryMetrics.reduce((sum, m) => sum + Math.min((m.value / m.target) * 100, 100), 0) / categoryMetrics.length
    );
  }

  private calculateGrade(score: number): QualityScore['grade'] {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  getQualityHistory(limit = 50): QualityScore[] {
    return this.qualityHistory.slice(0, limit);
  }

  getLatestQualityScore(): QualityScore | null {
    return this.qualityHistory[0] || null;
  }

  // ============================================
  // Health & Config
  // ============================================

  getHealth(): {
    isRunning: boolean;
    metricCount: number;
    performanceRecordCount: number;
    qualityScore: number;
    qualityGrade: QualityScore['grade'];
    avgLatency: number;
    successRate: number;
    totalHCUSpent: number;
    hcuBudgetPerHour: number;
  } {
    const latestScore = this.getLatestQualityScore();
    return {
      isRunning: this.isRunning,
      metricCount: this.metrics.length,
      performanceRecordCount: this.performanceRecords.length,
      qualityScore: latestScore?.overall || 0,
      qualityGrade: latestScore?.grade || 'F',
      avgLatency: this.getAverageLatency(),
      successRate: this.getSuccessRate() * 100,
      totalHCUSpent: this.totalHCUSpent,
      hcuBudgetPerHour: this.config.hcuBudgetPerHour,
    };
  }

  getConfig(): PerformanceQualityConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<PerformanceQualityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // Event System
  // ============================================

  onEvent<K extends PerformanceQualityEvent['type']>(
    eventType: K,
    listener: (event: Extract<PerformanceQualityEvent, { type: K }>) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener as any);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener as any);
    };
  }

  private emitEvent(event: PerformanceQualityEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error(`PerfQuality event listener error:`, e);
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
        type: `perf_quality_${type}`,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }
}

export function createPerformanceQualityEngine(config?: Partial<PerformanceQualityConfig>): PerformanceQualityEngine {
  return new PerformanceQualityEngine(config);
}

export default PerformanceQualityEngine;