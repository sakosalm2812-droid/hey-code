// src/engines/performanceQuality/__tests__/PerformanceQualityEngine.test.ts
// Tests for Performance & Quality Engine

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerformanceQualityEngine, createPerformanceQualityEngine } from '../PerformanceQualityEngine';
import type { PerformanceQualityConfig, QualityMetric, PerformanceRecord, QualityScore } from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

describe('PerformanceQualityEngine', () => {
  let engine: PerformanceQualityEngine;

  const testConfig: Partial<PerformanceQualityConfig> = {
    metricsRefreshIntervalMs: 1000,
    maxPerformanceRecords: 1000,
    hcuBudgetPerHour: 10.0,
    qualityAlertThreshold: 70,
    performanceBaseline: 100,
  };

  beforeEach(async () => {
    engine = createPerformanceQualityEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Initialization', () => {
    it('initializes with default config', async () => {
      const defaultEngine = createPerformanceQualityEngine();
      await defaultEngine.initialize();
      const health = defaultEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.hcuBudgetPerHour).toBe(1.0);
      await defaultEngine.shutdown();
    });

    it('initializes with custom config', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.hcuBudgetPerHour).toBe(10.0);
    });

    it('creates default metrics', () => {
      const metrics = engine.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.some(m => m.category === 'performance')).toBe(true);
      expect(metrics.some(m => m.category === 'reliability')).toBe(true);
    });
  });

  describe('Metrics', () => {
    it('gets metrics by category', () => {
      const perfMetrics = engine.getMetrics('performance');
      expect(perfMetrics.length).toBeGreaterThan(0);
      expect(perfMetrics.every(m => m.category === 'performance')).toBe(true);
    });

    it('gets single metric by id', () => {
      const metric = engine.getMetric('perf_latency');
      expect(metric).toBeDefined();
      expect(metric?.name).toBe('Response Latency');
    });

    it('refreshes metrics over time', async () => {
      const initial = engine.getMetric('perf_latency');
      await new Promise(r => setTimeout(r, 1500));
      const updated = engine.getMetric('perf_latency');
      expect(updated).toBeDefined();
    });
  });

  describe('Performance Records', () => {
    it('records performance', () => {
      const record = engine.recordPerformance('test_op', 100, true, 0.01);
      expect(record.id).toMatch(/^perf_/);
      expect(record.operation).toBe('test_op');
      expect(record.durationMs).toBe(100);
      expect(record.success).toBe(true);
    });

    it('retrieves records with filters', () => {
      engine.recordPerformance('op1', 50, true, 0.01);
      engine.recordPerformance('op2', 150, false, 0.01);
      engine.recordPerformance('op1', 75, true, 0.01);

      const all = engine.getPerformanceRecords(100);
      expect(all.length).toBe(3);

      const op1Only = engine.getPerformanceRecords(100, 'op1');
      expect(op1Only.length).toBe(2);
      expect(op1Only.every(r => r.operation === 'op1')).toBe(true);
    });

    it('calculates average latency', () => {
      engine.recordPerformance('op', 50, true, 0.01);
      engine.recordPerformance('op', 150, true, 0.01);

      expect(engine.getAverageLatency('op')).toBe(100);
    });

    it('calculates success rate', () => {
      engine.recordPerformance('op', 50, true, 0.01);
      engine.recordPerformance('op', 150, false, 0.01);
      engine.recordPerformance('op', 75, true, 0.01);

      expect(engine.getSuccessRate('op')).toBeCloseTo(0.667, 2);
    });

    it('respects max records', () => {
      const smallEngine = createPerformanceQualityEngine({ maxPerformanceRecords: 5 });
      for (let i = 0; i < 10; i++) {
        smallEngine.recordPerformance('op', i, true, 0.01);
      }
      expect(smallEngine.getPerformanceRecords(100).length).toBe(5);
    });
  });

  describe('Quality Scoring', () => {
    it('computes quality score', async () => {
      const score = await engine.computeQualityScore();
      expect(score.id).toMatch(/^quality_/);
      expect(score.overall).toBeGreaterThan(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(score.grade);
    });

    it('stores quality history', async () => {
      await engine.computeQualityScore();
      const history = engine.getQualityHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('gets latest quality score', async () => {
      await engine.computeQualityScore();
      const latest = engine.getLatestQualityScore();
      expect(latest).not.toBeNull();
      expect(latest?.overall).toBeGreaterThan(0);
    });

    it('emits quality alert when below threshold', async () => {
      let alertReceived = false;
      engine.onEvent('quality_alert', () => { alertReceived = true; });

      // Lower threshold to trigger
      engine.updateConfig({ qualityAlertThreshold: 100 });

      // Make metrics look bad
      engine.getMetrics().forEach(m => {
        m.value = 10; // Very low
      });

      await engine.computeQualityScore();

      expect(alertReceived).toBe(true);
    });
  });

  describe('Health & Config', () => {
    it('reports health metrics', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.metricCount).toBeGreaterThan(0);
      expect(health.performanceRecordCount).toBeGreaterThanOrEqual(0);
      expect(health.qualityScore).toBeGreaterThanOrEqual(0);
    });

    it('updates config', () => {
      engine.updateConfig({ metricsRefreshIntervalMs: 5000, hcuBudgetPerHour: 5.0 });
      const config = engine.getConfig();
      expect(config.metricsRefreshIntervalMs).toBe(5000);
      expect(config.hcuBudgetPerHour).toBe(5.0);
    });
  });

  describe('Event System', () => {
    it('emits metrics_updated event', () => {
      let eventReceived = false;
      engine.onEvent('metrics_updated', () => { eventReceived = true; });

      // Force refresh
      (engine as any).refreshMetrics();

      expect(eventReceived).toBe(true);
    });

    it('emits performance_recorded event', () => {
      let record: PerformanceRecord | null = null;
      engine.onEvent('performance_recorded', (e) => { record = e.record; });

      engine.recordPerformance('op', 100, true, 0.01);
      expect(record).not.toBeNull();
      expect(record?.operation).toBe('op');
    });

    it('emits quality_score_computed event', async () => {
      let score: QualityScore | null = null;
      engine.onEvent('quality_score_computed', (e) => { score = e.score; });

      await engine.computeQualityScore();
      expect(score).not.toBeNull();
    });
  });
});