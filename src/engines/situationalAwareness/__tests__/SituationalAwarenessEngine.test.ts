// src/engines/situationalAwareness/__tests__/SituationalAwarenessEngine.test.ts
// Tests for Situational Awareness Engine

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SituationalAwarenessEngine, createSituationalAwarenessEngine } from '../SituationalAwarenessEngine';
import type { AwarenessConfig, EnvironmentSnapshot, SituationAssessment } from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

describe('SituationalAwarenessEngine', () => {
  let engine: SituationalAwarenessEngine;

  const testConfig: Partial<AwarenessConfig> = {
    snapshotIntervalMs: 1000,
    assessmentIntervalMs: 1000,
    historyRetentionMs: 60000,
    hcuBudgetPerHour: 10.0,
    alertThreshold: 'elevated',
    autoActionEnabled: true,
  };

  beforeEach(async () => {
    engine = createSituationalAwarenessEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Initialization', () => {
    it('initializes with default config', async () => {
      const defaultEngine = createSituationalAwarenessEngine();
      await defaultEngine.initialize();
      const health = defaultEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.hcuBudgetPerHour).toBe(2.0);
      await defaultEngine.shutdown();
    });

    it('initializes with custom config', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.hcuBudgetPerHour).toBe(10.0);
    });

    it('captures initial snapshot and assessment', () => {
      const health = engine.getHealth();
      expect(health.snapshotCount).toBeGreaterThan(0);
      expect(health.assessmentCount).toBeGreaterThan(0);
    });
  });

  describe('Snapshots', () => {
    it('periodically captures snapshots', async () => {
      const initialCount = engine.getHealth().snapshotCount;
      await new Promise(r => setTimeout(r, 1500));
      const finalCount = engine.getHealth().snapshotCount;
      expect(finalCount).toBeGreaterThan(initialCount);
    });

    it('retrieves latest snapshot', () => {
      const latest = engine.getLatestSnapshot();
      expect(latest).not.toBeNull();
      expect(latest?.id).toMatch(/^snap_/);
      expect(latest?.system).toBeDefined();
    });

    it('trims old snapshots based on retention', async () => {
      const shortRetentionEngine = createSituationalAwarenessEngine({
        snapshotIntervalMs: 100,
        historyRetentionMs: 500,
      });
      await shortRetentionEngine.initialize();

      await new Promise(r => setTimeout(r, 1000));
      const snapshots = shortRetentionEngine.getSnapshots();

      // Should only have ~5 snapshots (500ms / 100ms)
      expect(snapshots.length).toBeLessThan(15);
      await shortRetentionEngine.shutdown();
    });
  });

  describe('Assessments', () => {
    it('periodically generates assessments', async () => {
      const initialCount = engine.getHealth().assessmentCount;
      await new Promise(r => setTimeout(r, 1500));
      const finalCount = engine.getHealth().assessmentCount;
      expect(finalCount).toBeGreaterThan(initialCount);
    });

    it('calculates severity based on factors', () => {
      const assessment = engine.getLatestAssessment();
      expect(assessment).not.toBeNull();
      expect(['normal', 'elevated', 'high', 'critical']).toContain(assessment?.severity);
    });

    it('detects high CPU severity', async () => {
      // Create a snapshot with high CPU
      const highCpuSnap: any = {
        id: 'test_snap',
        timestamp: new Date().toISOString(),
        system: { cpuUsage: 95, memoryUsage: 40, diskUsage: 40, networkIO: { rx: 0, tx: 0 }, uptime: 100 },
        application: { activeWindows: [], focusedApp: '', keyboardLayout: '' },
        user: { idleTimeMs: 0, lastInput: new Date().toISOString(), attentionState: 'focused' },
        context: { activeTasks: [], recentDecisions: [] },
      };

      (engine as any).snapshots.unshift(highCpuSnap);
      const assessment = await (engine as any).generateAssessment();

      expect(assessment.severity).toBe('high');
      expect(assessment.summary).toContain('High CPU');
    });

    it('detects high memory severity', async () => {
      const highMemSnap: any = {
        id: 'test_snap',
        timestamp: new Date().toISOString(),
        system: { cpuUsage: 20, memoryUsage: 90, diskUsage: 40, networkIO: { rx: 0, tx: 0 }, uptime: 100 },
        application: { activeWindows: [], focusedApp: '', keyboardLayout: '' },
        user: { idleTimeMs: 0, lastInput: new Date().toISOString(), attentionState: 'focused' },
        context: { activeTasks: [], recentDecisions: [] },
      };

      (engine as any).snapshots.unshift(highMemSnap);
      const assessment = await (engine as any).generateAssessment();

      expect(assessment.severity).toBe('elevated');
      expect(assessment.summary).toContain('High memory');
    });
  });

  describe('Alerts & Auto-Actions', () => {
    it('emits alerts based on threshold', async () => {
      let alertTriggered = false;
      engine.onEvent('alert_triggered', () => { alertTriggered = true; });

      // Force a critical assessment
      const criticalSnap: any = {
        id: 'critical_snap',
        timestamp: new Date().toISOString(),
        system: { cpuUsage: 99, memoryUsage: 99, diskUsage: 99, networkIO: { rx: 0, tx: 0 }, uptime: 100 },
        application: { activeWindows: [], focusedApp: '', keyboardLayout: '' },
        user: { idleTimeMs: 0, lastInput: new Date().toISOString(), attentionState: 'focused' },
        context: { activeTasks: [], recentDecisions: [] },
      };

      (engine as any).snapshots.unshift(criticalSnap);
      await (engine as any).generateAssessment();

      expect(alertTriggered).toBe(true);
    });

    it('executes auto-actions for critical assessments', async () => {
      let actionExecuted = false;
      engine.onEvent('auto_action_executed', () => { actionExecuted = true; });

      const criticalSnap: any = {
        id: 'critical_snap',
        timestamp: new Date().toISOString(),
        system: { cpuUsage: 99, memoryUsage: 99, diskUsage: 99, networkIO: { rx: 0, tx: 0 }, uptime: 100 },
        application: { activeWindows: [], focusedApp: '', keyboardLayout: '' },
        user: { idleTimeMs: 0, lastInput: new Date().toISOString(), attentionState: 'focused' },
        context: { activeTasks: [], recentDecisions: [] },
      };

      (engine as any).snapshots.unshift(criticalSnap);
      const assessment = await (engine as any).generateAssessment();

      expect(actionExecuted).toBe(true);
      expect(assessment.autoActionTaken).toBeDefined();
    });
  });

  describe('Health & Metrics', () => {
    it('reports health metrics', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.snapshotCount).toBeGreaterThan(0);
      expect(health.totalHCUSpent).toBeGreaterThan(0);
    });

    it('updates config', () => {
      engine.updateConfig({ snapshotIntervalMs: 5000, hcuBudgetPerHour: 5.0 });
      const config = engine.getConfig();
      expect(config.snapshotIntervalMs).toBe(5000);
      expect(config.hcuBudgetPerHour).toBe(5.0);
    });
  });
});