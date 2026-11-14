// src/engines/continuousIntelligence/__tests__/ContinuousIntelligenceEngine.test.ts
// Tests for Continuous Intelligence Engine

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContinuousIntelligenceEngine, createContinuousIntelligenceEngine } from '../ContinuousIntelligenceEngine';
import type { IntelligenceConfig, ThoughtStreamItem, BackgroundReasoningTask, AnomalyAlert } from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

describe('ContinuousIntelligenceEngine', () => {
  let engine: ContinuousIntelligenceEngine;

  const testConfig: Partial<IntelligenceConfig> = {
    backgroundReasoningIntervalMs: 1000,
    anomalyCheckIntervalMs: 500,
    maxThoughtHistory: 50,
    hcuBudgetPerMinute: 10,
    autoEscalateCritical: true,
  };

  beforeEach(async () => {
    engine = createContinuousIntelligenceEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Initialization', () => {
    it('initializes with default config', async () => {
      const defaultEngine = createContinuousIntelligenceEngine();
      await defaultEngine.initialize();
      const health = defaultEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.hcuBudgetPerMinute).toBe(5.0);
      await defaultEngine.shutdown();
    });

    it('initializes with custom config', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.hcuBudgetPerMinute).toBe(10);
    });

    it('seeds initial thought on initialization', () => {
      const thoughts = engine.getThoughts({ limit: 1 });
      expect(thoughts.length).toBeGreaterThan(0);
      expect(thoughts[0].source).toBe('background_reasoning');
      expect(thoughts[0].content).toContain('initialized');
    });
  });

  describe('Thought Stream', () => {
    it('adds thoughts to stream', () => {
      const thought = engine.addThought({
        source: 'context_monitor',
        content: 'Test thought',
        confidence: 0.9,
        tags: ['test'],
        status: 'active',
      });

      expect(thought.id).toMatch(/^thought_/);
      expect(thought.content).toBe('Test thought');
      expect(thought.confidence).toBe(0.9);
    });

    it('retrieves thoughts with filters', () => {
      engine.addThought({ source: 'background_reasoning', content: 'A', confidence: 0.8, tags: [], status: 'active' });
      engine.addThought({ source: 'anomaly_detection', content: 'B', confidence: 0.7, tags: [], status: 'active' });
      engine.addThought({ source: 'background_reasoning', content: 'C', confidence: 0.6, tags: [], status: 'archived' });

      const all = engine.getThoughts({ limit: 10 });
      expect(all.length).toBe(4); // 1 initial + 3 added

      const active = engine.getThoughts({ status: 'active', limit: 10 });
      expect(active.every(t => t.status === 'active')).toBe(true);

      const bgReasoning = engine.getThoughts({ source: 'background_reasoning', limit: 10 });
      expect(bgReasoning.every(t => t.source === 'background_reasoning')).toBe(true);
    });

    it('respects max history limit', () => {
      for (let i = 0; i < 60; i++) {
        engine.addThought({ source: 'background_reasoning', content: `Thought ${i}`, confidence: 0.5, tags: [], status: 'active' });
      }
      const thoughts = engine.getThoughts({ limit: 100 });
      expect(thoughts.length).toBeLessThanOrEqual(50); // maxThoughtHistory
    });

    it('escalates and archives thoughts', () => {
      const thought = engine.addThought({ source: 'background_reasoning', content: 'Test', confidence: 0.8, tags: [], status: 'active' });

      expect(engine.escalateThought(thought.id)).toBe(true);
      const escalated = engine.getThoughts({ status: 'escalated' });
      expect(escalated.some(t => t.id === thought.id)).toBe(true);

      expect(engine.archiveThought(thought.id)).toBe(true);
      const archived = engine.getThoughts({ status: 'archived' });
      expect(archived.some(t => t.id === thought.id)).toBe(true);
    });

    it('returns false for non-existent thought operations', () => {
      expect(engine.escalateThought('nonexistent')).toBe(false);
      expect(engine.archiveThought('nonexistent')).toBe(false);
    });
  });

  describe('Background Reasoning', () => {
    it('queues reasoning tasks', () => {
      const task = engine.queueReasoningTask('Test Task', 'Analyze something', 0.1);
      expect(task.id).toMatch(/^reasoning_/);
      expect(task.title).toBe('Test Task');
      expect(task.prompt).toBe('Analyze something');
      expect(task.status).toBe('queued');
      expect(task.hcuCost).toBe(0.1);
    });

    it('retrieves tasks by status', () => {
      engine.queueReasoningTask('Task 1', 'Prompt 1', 0.1);
      engine.queueReasoningTask('Task 2', 'Prompt 2', 0.1);

      const queued = engine.getReasoningTasks('queued');
      expect(queued.length).toBe(2);

      const all = engine.getReasoningTasks();
      expect(all.length).toBe(2);
    });

    it('processes queued tasks over time', async () => {
      engine.queueReasoningTask('Process Me', 'Do analysis', 0.1);
      engine.queueReasoningTask('Process Me Too', 'Do more', 0.1);

      // Wait for processing cycle
      await new Promise(r => setTimeout(r, 1500));

      const completed = engine.getReasoningTasks('completed');
      expect(completed.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Anomaly Detection', () => {
    it('creates anomalies', () => {
      const anomaly = (engine as any).createAnomaly({
        severity: 'high',
        title: 'Test Anomaly',
        description: 'Something went wrong',
        sourceSystem: 'test_system',
      });

      expect(anomaly.id).toMatch(/^anomaly_/);
      expect(anomaly.severity).toBe('high');
      expect(anomaly.resolved).toBe(false);
    });

    it('retrieves anomalies by resolution status', () => {
      (engine as any).createAnomaly({ severity: 'low', title: 'A', description: 'a', sourceSystem: 'test' });
      (engine as any).createAnomaly({ severity: 'high', title: 'B', description: 'b', sourceSystem: 'test' });

      const active = engine.getAnomalies(false);
      expect(active.length).toBe(2);

      engine.resolveAnomaly(active[0].id);

      const stillActive = engine.getAnomalies(false);
      const resolved = engine.getAnomalies(true);
      expect(stillActive.length).toBe(1);
      expect(resolved.length).toBe(1);
    });

    it('resolves anomalies', () => {
      const anomaly = (engine as any).createAnomaly({ severity: 'medium', title: 'Test', description: 'test', sourceSystem: 'test' });
      expect(engine.resolveAnomaly(anomaly.id)).toBe(true);
      expect(engine.resolveAnomaly('nonexistent')).toBe(false);
    });

    it('detects HCU budget anomaly', async () => {
      // Manually set high HCU spent
      (engine as any).totalHCUSpent = 100; // Way over budget

      // Wait for anomaly check
      await new Promise(r => setTimeout(r, 1000));

      const anomalies = engine.getAnomalies(false);
      const hcuAnomaly = anomalies.find(a => a.title.includes('HCU Budget'));
      expect(hcuAnomaly).toBeDefined();
      expect(hcuAnomaly?.severity).toBe('high');
    });
  });

  describe('Health & Metrics', () => {
    it('reports health correctly', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(typeof health.thoughtCount).toBe('number');
      expect(typeof health.activeThoughts).toBe('number');
      expect(typeof health.queuedReasoning).toBe('number');
      expect(typeof health.completedReasoning).toBe('number');
      expect(typeof health.activeAnomalies).toBe('number');
      expect(typeof health.totalHCUSpent).toBe('number');
    });

    it('updates config', () => {
      engine.updateConfig({ backgroundReasoningIntervalMs: 5000, hcuBudgetPerMinute: 20 });
      const config = engine.getConfig();
      expect(config.backgroundReasoningIntervalMs).toBe(5000);
      expect(config.hcuBudgetPerMinute).toBe(20);
    });
  });

  describe('Shutdown', () => {
    it('shuts down cleanly', async () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);

      await engine.shutdown();

      const healthAfter = engine.getHealth();
      expect(healthAfter.isRunning).toBe(false);
    });
  });

  describe('Event System', () => {
    it('emits thought_generated events', () => {
      let eventReceived = false;
      const unsub = engine.onEvent('thought_generated', () => { eventReceived = true; });

      engine.addThought({ source: 'background_reasoning', content: 'Event test', confidence: 0.5, tags: [], status: 'active' });

      expect(eventReceived).toBe(true);
      unsub();
    });

    it('emits anomaly_detected events', () => {
      let alert: AnomalyAlert | null = null;
      const unsub = engine.onEvent('anomaly_detected', (e) => { alert = e.alert; });

      (engine as any).createAnomaly({ severity: 'low', title: 'Event Test', description: 'test', sourceSystem: 'test' });

      expect(alert).not.toBeNull();
      expect(alert?.title).toBe('Event Test');
      unsub();
    });

    it('emits reasoning_completed events', async () => {
      let task: BackgroundReasoningTask | null = null;
      const unsub = engine.onEvent('reasoning_completed', (e) => { task = e.task; });

      engine.queueReasoningTask('Event Task', 'test prompt', 0.1);

      await new Promise(r => setTimeout(r, 1500));

      expect(task).not.toBeNull();
      expect(task?.title).toBe('Event Task');
      unsub();
    });
  });
});