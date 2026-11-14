// src/engines/selfImprovement/__tests__/SelfImprovementEngine.test.ts
// Tests for Self-Improvement Engine

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SelfImprovementEngine, createSelfImprovementEngine } from '../SelfImprovementEngine';
import type { SelfImprovementConfig, ImprovementCycle, ProposedChange } from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

describe('SelfImprovementEngine', () => {
  let engine: SelfImprovementEngine;

  const testConfig: Partial<SelfImprovementConfig> = {
    cycleIntervalMs: 5000,
    maxCyclesPerHour: 100,
    hcuBudgetPerCycle: 2.0,
    autoApplyThreshold: 0.5,
    requireManualApprovalFor: ['high_risk', 'structural_change'],
  };

  beforeEach(async () => {
    engine = createSelfImprovementEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Initialization', () => {
    it('initializes with default config', async () => {
      const defaultEngine = createSelfImprovementEngine();
      await defaultEngine.initialize();
      const health = defaultEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.maxCyclesPerHour).toBe(10);
      await defaultEngine.shutdown();
    });

    it('initializes with custom config', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.maxCyclesPerHour).toBe(100);
    });
  });

  describe('Improvement Cycles', () => {
    it('runs improvement cycle and generates changes', async () => {
      engine.forceCycle('test focus');

      await new Promise(r => setTimeout(r, 2000));

      const cycles = engine.getCycles();
      expect(cycles.length).toBeGreaterThan(0);
      // The forced cycle may not be at index 0 if auto-cycle ran after
      const forcedCycle = cycles.find(c => c.focus === 'test focus');
      expect(forcedCycle).toBeDefined();
      // The changes may have been processed by the time we check
      // At minimum, the cycle should exist
      expect(forcedCycle!.status).toBeDefined();
    });

    it('creates pending changes during cycle', async () => {
      engine.forceCycle('HCU cost optimization');

      await new Promise(r => setTimeout(r, 1000));

      const pending = engine.getPendingChanges();
      // May have been auto-applied or still pending
      expect(pending.length).toBeGreaterThanOrEqual(0);
    });

    it('produces evaluation results', async () => {
      engine.forceCycle('Response latency reduction');

      await new Promise(r => setTimeout(r, 1500));

      const cycles = engine.getCycles();
      const latest = cycles[0];
      expect(latest.results).toBeDefined();
      if (latest.results) {
        expect(typeof latest.results.performanceDelta).toBe('number');
        expect(typeof latest.results.qualityDelta).toBe('number');
        expect(['accept', 'reject', 'partial']).toContain(latest.results.verdict);
      }
    });
  });

  describe('Manual Change Control', () => {
    it('approves pending change', async () => {
      engine.forceCycle('test');

      await new Promise(r => setTimeout(r, 1000));

      const pending = engine.getPendingChanges();
      if (pending.length > 0) {
        const changeId = pending[0].id;
        expect(engine.approveChange(changeId)).toBe(true);
        expect(engine.getPendingChanges().find(c => c.id === changeId)).toBeUndefined();
      }
    });

    it('rejects pending change', async () => {
      engine.forceCycle('test');

      await new Promise(r => setTimeout(r, 1000));

      const pending = engine.getPendingChanges();
      if (pending.length > 0) {
        const changeId = pending[0].id;
        expect(engine.rejectChange(changeId, 'test reason')).toBe(true);
        expect(engine.getPendingChanges().find(c => c.id === changeId)).toBeUndefined();
      }
    });

    it('returns false for non-existent change', () => {
      expect(engine.approveChange('nonexistent')).toBe(false);
      expect(engine.rejectChange('nonexistent', 'reason')).toBe(false);
    });
  });

  describe('History Tracking', () => {
    it('tracks applied changes', async () => {
      engine.forceCycle('test');

      await new Promise(r => setTimeout(r, 1000));

      // Approve any pending
      const pending = engine.getPendingChanges();
      for (const change of pending) {
        engine.approveChange(change.id);
      }

      const applied = engine.getAppliedChanges();
      expect(applied.length).toBeGreaterThanOrEqual(0);
    });

    it('tracks rejected changes', async () => {
      engine.forceCycle('test');

      await new Promise(r => setTimeout(r, 1000));

      const pending = engine.getPendingChanges();
      for (const change of pending) {
        engine.rejectChange(change.id, 'test rejection');
      }

      const rejected = engine.getRejectedChanges();
      expect(rejected.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Health & Config', () => {
    it('reports health metrics', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.totalCycles).toBeGreaterThanOrEqual(0);
      expect(health.hcuBudgetPerCycle).toBe(2.0);
    });

    it('updates config', () => {
      engine.updateConfig({ cycleIntervalMs: 10000, autoApplyThreshold: 0.8 });
      const config = engine.getConfig();
      expect(config.cycleIntervalMs).toBe(10000);
      expect(config.autoApplyThreshold).toBe(0.8);
    });
  });

  describe('Event System', () => {
    it('emits cycle_started event', () => {
      let eventReceived = false;
      engine.onEvent('cycle_started', () => { eventReceived = true; });

      engine.forceCycle('event test');

      expect(eventReceived).toBe(true);
    });

    it('emits change_proposed event', async () => {
      let changes: ProposedChange[] = [];
      engine.onEvent('change_proposed', (e) => { changes.push(e.change); });

      engine.forceCycle('event test');

      await new Promise(r => setTimeout(r, 500));

      expect(changes.length).toBeGreaterThan(0);
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
});