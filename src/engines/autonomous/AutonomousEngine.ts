// src/engines/autonomous/AutonomousEngine.ts
// Autonomous Action Engine — Orchestrates MotorCortex, Somatosensory, ActionPlanner,
// ApprovalGates, ReflexArc, RollbackManager, and adapters.
// Plans, executes, verifies, and rolls back complex multi-step actions.

import type {
  ActionPlan,
  ActionStep,
  ActionStepResult,
  AutonomousConfig,
  ExecutionContext,
  Platform,
  ControlMode,
  RiskLevel,
  VerificationResult,
} from './types';
import { MotorCortex, createMotorCortex } from './MotorCortex';
import { SomatosensoryCortex, createSomatosensoryCortex } from './Somatosensory';
import { ActionPlanner, createActionPlanner } from './ActionPlanner';
import { ApprovalGates, createApprovalGates, type ApprovalResult } from './ApprovalGates';
import { ReflexArc, createReflexArc, type ReflexArcConfig } from './ReflexArc';
import { RollbackManager, createRollbackManager, type StateSnapshot, type RollbackPlan } from './RollbackManager';
import * as hcu from '../../core/cost/costGovernor';
import { pinpoint } from '../../core/precision/pinpointPrecision';
import * as bossAgent from '../../core/engines/bossAgent';
import { logToCosmos } from '../../core/cosmosMemory';

const DEFAULT_CONFIG: AutonomousConfig = {
  motorCortex: {
    bezierControlPoints: 3,
    moveDurationRange: [300, 800],
    clickDelayRange: [50, 150],
    typeDelayRange: [80, 180],
    scrollSmoothness: 0.8,
    humanLikeJitter: true,
  },
  somatosensory: {
    screenshotWaitMs: 500,
    ocrConfidenceThreshold: 0.7,
    domComparisonThreshold: 0.85,
    stateCheckRetries: 3,
    stateCheckIntervalMs: 300,
  },
  approvalGates: {
    moneyThresholdUsd: 10,
    destructiveActionsRequireApproval: true,
    routineActionsAutoApprove: false,
  },
  reflexArc: {
    enabled: true,
    patterns: [
      '[id*="cookie"]', '[class*="cookie"]',
      '[id*="consent"]', '[class*="consent"]',
      '[id*="popup"]', '[class*="popup"]',
      '[id*="modal"]', '[class*="modal"]',
      'button:contains("Accept")', 'button:contains("Agree")',
    ],
  },
  rollback: {
    enabled: true,
    maxHistoryLength: 50,
    snapshotIntervalMs: 5000,
  },
};

export class AutonomousEngine {
  private config: AutonomousConfig;
  private motorCortex: MotorCortex;
  private somatosensory: SomatosensoryCortex;
  private actionPlanner: ActionPlanner;
  private approvalGates: ApprovalGates;
  private reflexArc: ReflexArc;
  private rollbackManager: RollbackManager;
  private adapters: Map<string, ActionAdapter> = new Map();
  private plans: Map<string, ActionPlan> = new Map();
  private history: ActionPlan[] = [];
  private currentPlanId: string | null = null;
  private getDOMFn: (() => Promise<Document>) | null = null;
  private executeClickFn: ((x: number, y: number) => Promise<void>) | null = null;

  constructor(config: Partial<AutonomousConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.motorCortex = createMotorCortex(this.config.motorCortex);
    this.somatosensory = createSomatosensoryCortex(this.config.somatosensory);
    this.actionPlanner = createActionPlanner();
    this.approvalGates = createApprovalGates(this.config.approvalGates);
    this.reflexArc = createReflexArc(this.config.reflexArc as ReflexArcConfig);
    this.rollbackManager = createRollbackManager(this.config.rollback);
  }

  /**
   * Register an action adapter for a platform/capability.
   */
  registerAdapter(adapter: ActionAdapter): void {
    const key = `${adapter.platform}:${adapter.capability}`;
    this.adapters.set(key, adapter);
  }

  getAdapter(platform: Platform, capability: string): ActionAdapter | undefined {
    return this.adapters.get(`${platform}:${capability}`);
  }

  listAdapters(): ActionAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Set DOM accessor for reflex arc and rollback snapshots.
   */
  setDOMAccessor(getDOM: () => Promise<Document>): void {
    this.getDOMFn = getDOM;
    this.reflexArc.setDOMAccessor(getDOM);
    this.rollbackManager.registerAdapter('browser', 'state', {
      platform: 'browser',
      capability: 'state',
      captureState: async () => {
        if (!getDOM) return {};
        const dom = await getDOM();
        return {
          domSnapshot: dom.documentElement.outerHTML,
          url: window.location.href,
        };
      },
      restoreState: async (snapshot) => {
        if (snapshot.url) {
          window.location.href = snapshot.url;
        }
      },
    });
  }

  /**
   * Set click executor for MotorCortex-based clicking.
   */
  setClickExecutor(executor: (x: number, y: number) => Promise<void>): void {
    this.executeClickFn = executor;
    this.reflexArc.setClickExecutor(executor);
  }

  /**
   * Plan a multi-step action from a natural language goal.
   * Uses the ActionPlanner to decompose the goal into steps.
   */
  async createPlan(goal: string, context: ExecutionContext): Promise<ActionPlan> {
    const availableCapabilities = Array.from(this.adapters.keys());
    const plan = await this.actionPlanner.createPlan(goal, context, availableCapabilities);

    // Create rollback plan
    if (this.config.rollback.enabled) {
      plan.rollbackPlan = this.rollbackManager.createRollbackPlan(plan).steps;
    }

    this.plans.set(plan.id, plan);
    hcu.track('createPlan', 0.05);
    bossAgent.grade({ operation: 'createPlan', goal: goal.slice(0, 50), context }, { engine: 'autonomous' });
    pinpoint.verify('autonomous');
    await this.logPlan(plan, context);
    return plan;
  }

  /**
   * Execute an action plan with full verification, reflex arc, and rollback support.
   */
  async executePlan(planId: string, context: ExecutionContext): Promise<ActionPlan> {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Plan not found: ${planId}`);

    if (plan.status === 'running') throw new Error('Plan already running');
    if (plan.status === 'completed') throw new Error('Plan already completed');

    this.currentPlanId = planId;
    hcu.track('executePlanStart', 0.1);
    plan.status = 'running';
    plan.startedAt = new Date().toISOString();
    plan.currentStep = 0;
    plan.results = [];

    // Check HCU budget
    if (plan.hcuCost > context.hcuBudget) {
      plan.status = 'failed';
      throw new Error(`Insufficient HCU budget: need ${plan.hcuCost}, have ${context.hcuBudget}`);
    }

    // Start snapshotting for rollback
    if (this.config.rollback.enabled && this.getDOMFn) {
      this.rollbackManager.startSnapshotting(planId, context, async () => {
        const dom = await this.getDOMFn!();
        return {
          id: '',
          planId,
          stepIndex: plan.currentStep,
          timestamp: new Date().toISOString(),
          platform: context.platform,
          url: window.location.href,
          domSnapshot: dom.documentElement.outerHTML,
        };
      });
    }

    // Start reflex arc checking
    if (this.config.reflexArc.enabled && context.platform === 'browser') {
      this.reflexArc.startChecking();
    }

    try {
      hcu.track('executePlanLoop', 0.01);
      for (let i = 0; i < plan.steps.length; i++) {
        plan.currentStep = i;
        const step = plan.steps[i];

        const result = await this.executeStep(step, context);
        plan.results.push(result);
        plan.hcuSpent += result.hcuCost;

        // Record execution for rollback
        this.rollbackManager.recordExecution(planId, result);

        // Take snapshot after each step
        if (this.config.rollback.enabled && this.config.rollback.autoSnapshotOnStep && this.getDOMFn) {
          await this.rollbackManager.takeSnapshot(planId, i, context, async () => {
            const dom = await this.getDOMFn!();
            return {
              id: '',
              planId,
              stepIndex: i,
              timestamp: new Date().toISOString(),
              platform: context.platform,
              url: window.location.href,
              domSnapshot: dom.documentElement.outerHTML,
            };
          });
        }

        if (!result.success) {
          // Handle failure with rollback
          if (this.config.rollback.enabled && plan.rollbackPlan && plan.rollbackPlan.length > 0) {
            await this.executeRollback(plan, context);
            plan.status = 'rolled_back';
          } else {
            plan.status = 'failed';
          }
          await this.logPlan(plan, context);
          return plan;
        }
      }

      plan.status = 'completed';
      plan.completedAt = new Date().toISOString();
      await this.logPlan(plan, context);
      this.addToHistory(plan);
      return plan;
    } finally {
      hcu.track('executePlanEnd', 0.05);
      pinpoint.verify('autonomous');
      bossAgent.grade({ operation: 'executePlanComplete', planId: planId, status: plan.status }, { engine: 'autonomous' });
      // Cleanup
      this.rollbackManager.stopSnapshotting(planId);
      this.reflexArc.stopChecking();
      this.currentPlanId = null;
    }
  }

  private async executeStep(
    step: ActionStep,
    context: ExecutionContext
  ): Promise<ActionStepResult> {
    const startTime = Date.now();
    const adapter = this.getAdapter(context.platform, step.capability);

    if (!adapter) {
      return {
        stepId: step.id,
        success: false,
        verified: false,
        error: `No adapter for ${context.platform}:${step.capability}`,
        durationMs: Date.now() - startTime,
        retries: 0,
        hcuCost: 0,
      };
    }

    // Check approval gates
    const approvalCheck = await this.approvalGates.checkApproval(step, context);
    if (!approvalCheck.approved) {
      return {
        stepId: step.id,
        success: false,
        verified: false,
        error: approvalCheck.reason || 'Approval required',
        durationMs: Date.now() - startTime,
        retries: 0,
        hcuCost: 0,
      };
    }

    let lastError: string | undefined;
    let retries = 0;

    while (retries <= step.maxRetries) {
      try {
        // Execute the action
        const executionResult = await adapter.execute(step, context);

        if (!executionResult.success) {
          lastError = executionResult.error;
          retries++;
          if (retries <= step.maxRetries) {
            await this.sleep(500 * retries);
            continue;
          }
          break;
        }

        // Verify the result using Somatosensory
        const verification = await this.somatosensory.verify(
          step,
          context.platform,
          adapter.getScreenshot?.bind(adapter),
          adapter.getDOM?.bind(adapter),
          adapter.getState?.bind(adapter)
        );

        if (!verification.verified) {
          lastError = verification.error || 'Verification failed';
          retries++;
          if (retries <= step.maxRetries) {
            await this.sleep(500 * retries);
            continue;
          }
          break;
        }

        // Success!
        return {
          stepId: step.id,
          success: true,
          verified: true,
          data: executionResult.data,
          screenshot: executionResult.screenshot,
          durationMs: Date.now() - startTime,
          retries,
          hcuCost: this.estimateStepHCU(step),
        };
      } catch (e) {
        lastError = e instanceof Error ? e.message : 'Unknown error';
        retries++;
        if (retries <= step.maxRetries) {
          await this.sleep(500 * retries);
          continue;
        }
        break;
      }
    }

    return {
      stepId: step.id,
      success: false,
      verified: false,
      error: lastError || 'Max retries exceeded',
      durationMs: Date.now() - startTime,
      retries,
      hcuCost: 0,
    };
  }

  private async executeRollback(plan: ActionPlan, context: ExecutionContext): Promise<void> {
    if (!plan.rollbackPlan) return;

    const rollbackPlan = this.rollbackManager.createRollbackPlan(plan);

    await this.rollbackManager.executeRollback(
      rollbackPlan.id,
      context,
      async (step, ctx) => {
        const adapter = this.getAdapter(ctx.platform, step.capability);
        if (!adapter) {
          return { success: false, error: `No adapter for rollback: ${ctx.platform}:${step.capability}` };
        }
        try {
          const result = await adapter.execute(step as ActionStep, ctx);
          return { success: result.success, error: result.error };
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : 'Rollback step failed' };
        }
      }
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private estimateStepHCU(step: ActionStep): number {
    const stepCosts: Record<string, number> = {
      'computer.open_url': 0.01,
      'computer.click': 0.005,
      'computer.type_text': 0.002,
      'computer.press_key': 0.001,
      'computer.scroll': 0.003,
      'computer.execute_terminal': 0.05,
      'computer.kill_process': 0.02,
      'computer.change_setting': 0.01,
      'computer.organize_files': 0.03,
      'computer.take_screenshot': 0.005,
      'browser.navigate': 0.01,
      'browser.fill_form': 0.005,
      'browser.click_element': 0.005,
      'browser.extract_text': 0.003,
      'browser.extract_table': 0.01,
      'browser.wait_for': 0.002,
      'browser.submit_form': 0.01,
      'browser.handle_dialog': 0.002,
      'phone.open_app': 0.01,
      'phone.tap': 0.005,
      'phone.swipe': 0.005,
      'phone.type': 0.002,
    };
    return stepCosts[step.capability] || 0.01;
  }

  private async logPlan(plan: ActionPlan, context: ExecutionContext): Promise<void> {
    try {
      await logToCosmos({
        type: 'autonomous_plan',
        planId: plan.id,
        goal: plan.goal,
        status: plan.status,
        steps: plan.steps.length,
        hcuCost: plan.hcuCost,
        hcuSpent: plan.hcuSpent,
        context,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Cosmos not available, continue
    }
  }

  private addToHistory(plan: ActionPlan): void {
    this.history.push(plan);
    if (this.history.length > this.config.rollback.maxHistoryLength) {
      this.history.shift();
    }
  }

  // Public API
  getPlan(planId: string): ActionPlan | undefined {
    return this.plans.get(planId);
  }

  getCurrentPlan(): ActionPlan | undefined {
    return this.currentPlanId ? this.plans.get(this.currentPlanId) : undefined;
  }

  getHistory(): ActionPlan[] {
    return [...this.history];
  }

  getMotorCortex(): MotorCortex {
    return this.motorCortex;
  }

  getSomatosensory(): SomatosensoryCortex {
    return this.somatosensory;
  }

  getActionPlanner(): ActionPlanner {
    return this.actionPlanner;
  }

  getApprovalGates(): ApprovalGates {
    return this.approvalGates;
  }

  getReflexArc(): ReflexArc {
    return this.reflexArc;
  }

  getRollbackManager(): RollbackManager {
    return this.rollbackManager;
  }

  getConfig(): AutonomousConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<AutonomousConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.motorCortex) this.motorCortex.updateConfig(config.motorCortex);
    if (config.somatosensory) this.somatosensory.updateConfig(config.somatosensory);
    if (config.approvalGates) this.approvalGates.updateConfig(config.approvalGates);
    if (config.reflexArc) this.reflexArc.updateConfig(config.reflexArc as ReflexArcConfig);
    if (config.rollback) this.rollbackManager.updateConfig(config.rollback);
  }

  /**
   * Check if a plan can be rolled back (within 24 hours).
   */
  canRollback(planId: string): boolean {
    return this.rollbackManager.canRollback(planId);
  }

  /**
   * Get time until rollback expires for a plan.
   */
  getRollbackTimeRemaining(planId: string): number {
    return this.rollbackManager.getRollbackTimeRemaining(planId);
  }

  /**
   * Manually trigger reflex arc check.
   */
  async triggerReflexArc(): Promise<string[]> {
    if (!this.getDOMFn) return [];
    return this.reflexArc.checkAndDismiss().then(r => r.map(t => t.pattern.id));
  }

  /**
   * Restore a plan to a specific snapshot.
   */
  async restoreToSnapshot(planId: string, snapshotId: string): Promise<boolean> {
    if (!this.getDOMFn) return false;
    return this.rollbackManager.restoreSnapshot(planId, snapshotId, { platform: 'browser', mode: 'act', userId: '', sessionId: '', hcuBudget: 0 }, async (snapshot) => {
      if (snapshot.url) {
        window.location.href = snapshot.url;
      }
    });
  }
}

// Adapter interface
export interface ActionAdapter {
  platform: Platform;
  capability: string;
  execute(step: ActionStep, context: ExecutionContext): Promise<{
    success: boolean;
    data?: unknown;
    error?: string;
    screenshot?: string;
  }>;
  getScreenshot?(): Promise<string>;
  getDOM?(): Promise<Document>;
  getState?(): Promise<unknown>;
}

export function createAutonomousEngine(config?: Partial<AutonomousConfig>): AutonomousEngine {
  return new AutonomousEngine(config);
}

export default AutonomousEngine;