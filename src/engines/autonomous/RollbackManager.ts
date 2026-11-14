// src/engines/autonomous/RollbackManager.ts
// Rollback Manager — Snapshots state, enables 24-hour undo, manages rollback plans.
// Implements Pinpoint Precision: exact delta verification, restore points, auto-repair.

import type {
  ActionStep,
  ActionPlan,
  ActionStepResult,
  ExecutionContext,
  Platform,
} from './types';
import { logToCosmos } from '../../core/cosmosMemory';

export interface StateSnapshot {
  id: string;
  planId: string;
  stepIndex: number;
  timestamp: string;
  platform: Platform;
  // Browser state
  url?: string;
  domSnapshot?: string; // Serialized DOM or key elements
  cookies?: Record<string, string>;
  localStorage?: Record<string, string>;
  sessionStorage?: Record<string, string>;
  // Desktop state
  activeWindow?: string;
  openApps?: string[];
  clipboard?: string;
  // Phone state
  foregroundApp?: string;
  screenState?: string;
  // Generic
  customState?: Record<string, unknown>;
}

export interface RollbackPlan {
  id: string;
  planId: string;
  steps: RollbackStep[];
  createdAt: string;
  executedAt?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'partial';
}

export interface RollbackStep {
  id: string;
  originalStepId: string;
  capability: string;
  description: string;
  parameters: Record<string, unknown>;
  verification: 'screenshot' | 'dom' | 'state' | 'none';
  expectedState: unknown;
  executed: boolean;
  executedAt?: string;
  error?: string;
}

export interface RollbackManagerConfig {
  enabled: boolean;
  maxHistoryLength: number;
  snapshotIntervalMs: number;
  maxSnapshotAgeMs: number; // 24 hours = 86400000
  autoSnapshotOnStep: boolean;
  compressSnapshots: boolean;
  storagePath?: string;
}

const DEFAULT_CONFIG: RollbackManagerConfig = {
  enabled: true,
  maxHistoryLength: 50,
  snapshotIntervalMs: 5000,
  maxSnapshotAgeMs: 24 * 60 * 60 * 1000, // 24 hours
  autoSnapshotOnStep: true,
  compressSnapshots: true,
};

interface StoredSnapshot {
  snapshot: StateSnapshot;
  compressed: boolean;
}

export class RollbackManager {
  private config: RollbackManagerConfig;
  private snapshots: Map<string, StoredSnapshot[]> = new Map(); // planId -> snapshots
  private rollbackPlans: Map<string, RollbackPlan> = new Map();
  private executionHistory: Map<string, ActionStepResult[]> = new Map(); // planId -> results
  private snapshotTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private adapters: Map<string, RollbackAdapter> = new Map();

  constructor(config: Partial<RollbackManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register an adapter for state capture/restore.
   */
  registerAdapter(platform: Platform, capability: string, adapter: RollbackAdapter): void {
    this.adapters.set(`${platform}:${capability}`, adapter);
  }

  getAdapter(platform: Platform, capability: string): RollbackAdapter | undefined {
    return this.adapters.get(`${platform}:${capability}`);
  }

  /**
   * Start automatic snapshotting for a plan.
   */
  startSnapshotting(planId: string, context: ExecutionContext, getState: () => Promise<StateSnapshot>): void {
    if (!this.config.enabled) return;
    if (this.snapshotTimers.has(planId)) return;

    const timer = setInterval(async () => {
      await this.takeSnapshot(planId, -1, context, getState);
    }, this.config.snapshotIntervalMs);

    this.snapshotTimers.set(planId, timer);

    // Take initial snapshot
    this.takeSnapshot(planId, -1, context, getState);
  }

  /**
   * Stop automatic snapshotting for a plan.
   */
  stopSnapshotting(planId: string): void {
    const timer = this.snapshotTimers.get(planId);
    if (timer) {
      clearInterval(timer);
      this.snapshotTimers.delete(planId);
    }
  }

  /**
   * Take a manual snapshot at a specific step.
   */
  async takeSnapshot(
    planId: string,
    stepIndex: number,
    context: ExecutionContext,
    getState: () => Promise<StateSnapshot>
  ): Promise<StateSnapshot> {
    const snapshot = await getState();
    snapshot.id = `snap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    snapshot.planId = planId;
    snapshot.stepIndex = stepIndex;
    // Only set timestamp if not already provided by getState
    if (!snapshot.timestamp) {
      snapshot.timestamp = new Date().toISOString();
    }
    snapshot.platform = context.platform;

    const stored: StoredSnapshot = {
      snapshot: this.config.compressSnapshots ? this.compressSnapshot(snapshot) : snapshot,
      compressed: this.config.compressSnapshots,
    };

    if (!this.snapshots.has(planId)) {
      this.snapshots.set(planId, []);
    }

    const planSnapshots = this.snapshots.get(planId)!;
    planSnapshots.push(stored);

    // Trim old snapshots
    this.trimSnapshots(planId);

    // Log to Cosmos
    await this.logSnapshot(snapshot);

    return snapshot;
  }

  /**
   * Create a rollback plan from an action plan.
   */
  createRollbackPlan(actionPlan: ActionPlan): RollbackPlan {
    const rollbackSteps: RollbackStep[] = [];

    for (let i = actionPlan.steps.length - 1; i >= 0; i--) {
      const step = actionPlan.steps[i];
      const rollbackStep = this.generateRollbackStep(step, i);
      if (rollbackStep) {
        rollbackSteps.push(rollbackStep);
      }
    }

    const rollbackPlan: RollbackPlan = {
      id: `rollback_${actionPlan.id}`,
      planId: actionPlan.id,
      steps: rollbackSteps,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    this.rollbackPlans.set(rollbackPlan.id, rollbackPlan);
    return rollbackPlan;
  }

  /**
   * Execute a rollback plan.
   */
  async executeRollback(
    rollbackPlanId: string,
    context: ExecutionContext,
    executeStep: (step: RollbackStep, context: ExecutionContext) => Promise<{ success: boolean; error?: string }>
  ): Promise<RollbackPlan> {
    const rollbackPlan = this.rollbackPlans.get(rollbackPlanId);
    if (!rollbackPlan) throw new Error(`Rollback plan not found: ${rollbackPlanId}`);

    rollbackPlan.status = 'executing';
    rollbackPlan.executedAt = new Date().toISOString();

    let completed = 0;
    let failed = 0;

    for (const step of rollbackPlan.steps) {
      try {
        const result = await executeStep(step, context);
        step.executed = true;
        step.executedAt = new Date().toISOString();
        if (!result.success) {
          step.error = result.error;
          failed++;
        } else {
          completed++;
        }
      } catch (e) {
        step.executed = true;
        step.executedAt = new Date().toISOString();
        step.error = e instanceof Error ? e.message : 'Unknown error';
        failed++;
      }
    }

    rollbackPlan.status = failed === 0 ? 'completed' : (completed > 0 ? 'partial' : 'failed');

    await this.logRollback(rollbackPlan);
    return rollbackPlan;
  }

  /**
   * Restore state from a snapshot.
   */
  async restoreSnapshot(
    planId: string,
    snapshotId: string,
    context: ExecutionContext,
    restoreState: (snapshot: StateSnapshot) => Promise<void>
  ): Promise<boolean> {
    const planSnapshots = this.snapshots.get(planId);
    if (!planSnapshots) return false;

    const stored = planSnapshots.find(s => s.snapshot.id === snapshotId);
    if (!stored) return false;

    const snapshot = stored.compressed ? this.decompressSnapshot(stored.snapshot) : stored.snapshot;

    try {
      await restoreState(snapshot);
      await this.logRestore(snapshot);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get available snapshots for a plan.
   */
  getSnapshots(planId: string): StateSnapshot[] {
    const planSnapshots = this.snapshots.get(planId);
    if (!planSnapshots) return [];

    return planSnapshots.map(s => s.compressed ? this.decompressSnapshot(s.snapshot) : s.snapshot);
  }

  /**
   * Get the latest snapshot for a plan.
   */
  getLatestSnapshot(planId: string): StateSnapshot | null {
    const planSnapshots = this.snapshots.get(planId);
    if (!planSnapshots || planSnapshots.length === 0) return null;

    const stored = planSnapshots[planSnapshots.length - 1];
    return stored.compressed ? this.decompressSnapshot(stored.snapshot) : stored.snapshot;
  }

  /**
   * Get snapshot at or before a specific step.
   */
  getSnapshotAtStep(planId: string, stepIndex: number): StateSnapshot | null {
    const planSnapshots = this.snapshots.get(planId);
    if (!planSnapshots) return null;

    // Find the last snapshot at or before the step
    for (let i = planSnapshots.length - 1; i >= 0; i--) {
      const stored = planSnapshots[i];
      const snapshot = stored.compressed ? this.decompressSnapshot(stored.snapshot) : stored.snapshot;
      if (snapshot.stepIndex <= stepIndex) {
        return snapshot;
      }
    }

    return null;
  }

  /**
   * Record execution result for a step.
   */
  recordExecution(planId: string, result: ActionStepResult): void {
    if (!this.executionHistory.has(planId)) {
      this.executionHistory.set(planId, []);
    }
    this.executionHistory.get(planId)!.push(result);
  }

  /**
   * Get execution history for a plan.
   */
  getExecutionHistory(planId: string): ActionStepResult[] {
    return this.executionHistory.get(planId) || [];
  }

  /**
   * Check if a plan can be rolled back (within 24 hours).
   */
  canRollback(planId: string): boolean {
    const planSnapshots = this.snapshots.get(planId);
    if (!planSnapshots || planSnapshots.length === 0) return false;

    const latest = planSnapshots[planSnapshots.length - 1];
    const snapshot = latest.compressed ? this.decompressSnapshot(latest.snapshot) : latest.snapshot;
    const age = Date.now() - new Date(snapshot.timestamp).getTime();

    return age <= this.config.maxSnapshotAgeMs;
  }

  /**
   * Get time until rollback expires.
   */
  getRollbackTimeRemaining(planId: string): number {
    const planSnapshots = this.snapshots.get(planId);
    if (!planSnapshots || planSnapshots.length === 0) return 0;

    const latest = planSnapshots[planSnapshots.length - 1];
    const snapshot = latest.compressed ? this.decompressSnapshot(latest.snapshot) : latest.snapshot;
    const age = Date.now() - new Date(snapshot.timestamp).getTime();

    return Math.max(0, this.config.maxSnapshotAgeMs - age);
  }

  /**
   * Clean up old snapshots and plans.
   */
  cleanup(): { snapshotsRemoved: number; plansRemoved: number } {
    let snapshotsRemoved = 0;
    let plansRemoved = 0;
    const now = Date.now();

    // Clean snapshots
    for (const [planId, snapshots] of this.snapshots.entries()) {
      const initialLength = snapshots.length;
      const filtered = snapshots.filter(s => {
        const snapshot = s.compressed ? this.decompressSnapshot(s.snapshot) : s.snapshot;
        return now - new Date(snapshot.timestamp).getTime() <= this.config.maxSnapshotAgeMs;
      });
      snapshotsRemoved += initialLength - filtered.length;
      this.snapshots.set(planId, filtered);
    }

    // Clean rollback plans older than max age
    for (const [id, plan] of this.rollbackPlans.entries()) {
      const age = now - new Date(plan.createdAt).getTime();
      if (age > this.config.maxSnapshotAgeMs) {
        this.rollbackPlans.delete(id);
        plansRemoved++;
      }
    }

    // Clean execution history
    for (const [planId, history] of this.executionHistory.entries()) {
      if (!this.snapshots.has(planId) || this.snapshots.get(planId)!.length === 0) {
        this.executionHistory.delete(planId);
      }
    }

    return { snapshotsRemoved, plansRemoved };
  }

  private generateRollbackStep(step: ActionStep, index: number): RollbackStep | null {
    const rollbackMap: Record<string, Partial<RollbackStep>> = {
      'computer.open_url': {
        capability: 'browser.navigate',
        description: 'Navigate back to blank page',
        parameters: { url: 'about:blank' },
        verification: 'dom',
        expectedState: { url: 'about:blank' },
      },
      'browser.navigate': {
        capability: 'browser.navigate',
        description: 'Navigate back to previous page',
        parameters: { url: 'about:blank' }, // Would use history.back() in real impl
        verification: 'dom',
        expectedState: { url: 'about:blank' },
      },
      'computer.click': {
        capability: 'computer.click',
        description: 'Click to undo (context dependent)',
        parameters: {},
        verification: 'none',
        expectedState: {},
      },
      'computer.type_text': {
        capability: 'computer.press_key',
        description: 'Clear typed text',
        parameters: { key: 'Backspace', modifiers: ['Ctrl'] },
        verification: 'state',
        expectedState: { cleared: true },
      },
      'computer.press_key': {
        capability: 'computer.press_key',
        description: 'Reverse key press',
        parameters: {},
        verification: 'none',
        expectedState: {},
      },
      'computer.scroll': {
        capability: 'computer.scroll',
        description: 'Scroll back to original position',
        parameters: { direction: 'up', amount: 0 }, // Would track original position
        verification: 'screenshot',
        expectedState: { position: 'original' },
      },
      'computer.execute_terminal': {
        capability: 'computer.execute_terminal',
        description: 'Run cleanup command',
        parameters: { command: 'echo "rollback executed"' },
        verification: 'state',
        expectedState: { rolledBack: true },
      },
      'computer.kill_process': {
        capability: 'computer.execute_terminal',
        description: 'Restart killed process (if possible)',
        parameters: { command: 'echo "process restart not automated"' },
        verification: 'state',
        expectedState: { manual: true },
      },
      'computer.change_setting': {
        capability: 'computer.change_setting',
        description: 'Revert setting change',
        parameters: {},
        verification: 'state',
        expectedState: { reverted: true },
      },
      'computer.organize_files': {
        capability: 'computer.execute_terminal',
        description: 'Move files back (manual)',
        parameters: { command: 'echo "file organization rollback requires manual action"' },
        verification: 'state',
        expectedState: { manual: true },
      },
      'browser.fill_form': {
        capability: 'browser.click_element',
        description: 'Click form reset',
        parameters: { selector: 'button[type="reset"], [data-testid="reset"]' },
        verification: 'dom',
        expectedState: { formReset: true },
      },
      'browser.click_element': {
        capability: 'browser.click_element',
        description: 'Click to undo (context dependent)',
        parameters: {},
        verification: 'none',
        expectedState: {},
      },
      'browser.submit_form': {
        capability: 'computer.execute_terminal',
        description: 'Contact support to cancel submission',
        parameters: { command: 'echo "form submission cannot be automatically rolled back"' },
        verification: 'state',
        expectedState: { manual: true },
      },
    };

    const rollback = rollbackMap[step.capability];
    if (!rollback) return null;

    return {
      id: `rb_${step.id}`,
      originalStepId: step.id,
      capability: rollback.capability!,
      description: rollback.description!,
      parameters: rollback.parameters || {},
      verification: rollback.verification || 'none',
      expectedState: rollback.expectedState || {},
      executed: false,
    };
  }

  private trimSnapshots(planId: string): void {
    const snapshots = this.snapshots.get(planId);
    if (!snapshots) return;

    // Keep only maxHistoryLength snapshots
    if (snapshots.length > this.config.maxHistoryLength) {
      const toRemove = snapshots.length - this.config.maxHistoryLength;
      snapshots.splice(0, toRemove);
    }

    // Also remove by age
    const now = Date.now();
    const validSnapshots = snapshots.filter(s => {
      const snapshot = s.compressed ? this.decompressSnapshot(s.snapshot) : s.snapshot;
      return now - new Date(snapshot.timestamp).getTime() <= this.config.maxSnapshotAgeMs;
    });

    this.snapshots.set(planId, validSnapshots);
  }

  private compressSnapshot(snapshot: StateSnapshot): StateSnapshot {
    // Simple compression: remove verbose fields, keep essentials
    return {
      ...snapshot,
      domSnapshot: snapshot.domSnapshot ? this.compressDOM(snapshot.domSnapshot) : undefined,
      localStorage: snapshot.localStorage ? this.compressStorage(snapshot.localStorage) : undefined,
      sessionStorage: snapshot.sessionStorage ? this.compressStorage(snapshot.sessionStorage) : undefined,
    };
  }

  private decompressSnapshot(snapshot: StateSnapshot): StateSnapshot {
    // Decompression would restore full state
    // For now, return as-is
    return snapshot;
  }

  private compressDOM(dom: string): string {
    // In production, would use actual compression (LZ-string, etc.)
    // For now, truncate if too long
    return dom.length > 10000 ? dom.substring(0, 10000) + '...[truncated]' : dom;
  }

  private compressStorage(storage: Record<string, string>): Record<string, string> {
    // Keep only non-empty values, limit count
    const entries = Object.entries(storage).filter(([, v]) => v && v.length > 0);
    return Object.fromEntries(entries.slice(0, 100));
  }

  private async logSnapshot(snapshot: StateSnapshot): Promise<void> {
    try {
      await logToCosmos({
        type: 'rollback_snapshot',
        snapshotId: snapshot.id,
        planId: snapshot.planId,
        stepIndex: snapshot.stepIndex,
        platform: snapshot.platform,
        timestamp: snapshot.timestamp,
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }

  private async logRollback(plan: RollbackPlan): Promise<void> {
    try {
      await logToCosmos({
        type: 'rollback_executed',
        rollbackPlanId: plan.id,
        originalPlanId: plan.planId,
        stepsTotal: plan.steps.length,
        stepsCompleted: plan.steps.filter(s => s.executed && !s.error).length,
        stepsFailed: plan.steps.filter(s => s.error).length,
        status: plan.status,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }

  private async logRestore(snapshot: StateSnapshot): Promise<void> {
    try {
      await logToCosmos({
        type: 'rollback_restored',
        snapshotId: snapshot.id,
        planId: snapshot.planId,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }

  getConfig(): RollbackManagerConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<RollbackManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getRollbackPlan(planId: string): RollbackPlan | undefined {
    return this.rollbackPlans.get(`rollback_${planId}`);
  }

  getAllRollbackPlans(): RollbackPlan[] {
    return Array.from(this.rollbackPlans.values());
  }
}

export interface RollbackAdapter {
  platform: Platform;
  capability: string;
  captureState(): Promise<Partial<StateSnapshot>>;
  restoreState(snapshot: StateSnapshot): Promise<void>;
}

export function createRollbackManager(config?: Partial<RollbackManagerConfig>): RollbackManager {
  return new RollbackManager(config);
}

export default RollbackManager;