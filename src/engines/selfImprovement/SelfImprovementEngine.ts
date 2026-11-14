// src/engines/selfImprovement/SelfImprovementEngine.ts
// Engine 8: Self-Improvement — Autonomous optimization, refactoring, and evolution

import type {
  ImprovementCycle,
  ProposedChange,
  EvaluationResult,
  SelfImprovementConfig,
  SelfImprovementEvent,
} from './types';
import { logToCosmos } from '../../core/cosmosMemory';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CONFIG: SelfImprovementConfig = {
  cycleIntervalMs: 300000, // 5 minutes
  maxCyclesPerHour: 10,
  hcuBudgetPerCycle: 2.0,
  autoApplyThreshold: 0.7,
  requireManualApprovalFor: ['high_risk', 'structural_change'],
};

export class SelfImprovementEngine {
  private config: SelfImprovementConfig;
  private cycles: ImprovementCycle[] = [];
  private pendingChanges: ProposedChange[] = [];
  private appliedChanges: ProposedChange[] = [];
  private rejectedChanges: { change: ProposedChange; reason: string }[] = [];
  private eventListeners: Map<string, Set<(event: SelfImprovementEvent) => void>> = new Map();
  private cycleTimer: ReturnType<typeof setInterval> | null = null;
  private totalHCUSpent = 0;
  private isRunning = false;
  private cyclesThisHour = 0;
  private lastHourReset = Date.now();

  constructor(config: Partial<SelfImprovementConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    hcu.track('selfImprovement_init', 0.01);
    pinpoint.verify('selfImprovement');
    bossAgent.grade({ operation: 'init', engine: 'selfImprovement' }, { engine: 'selfImprovement' });

    this.cycleTimer = setInterval(() => this.runImprovementCycle(), this.config.cycleIntervalMs);

    // Initial cycle after short delay
    setTimeout(() => this.runImprovementCycle(), 5000);

    await this.log('self_improvement_initialized', { config: this.config });
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    hcu.track('selfImprovement_shutdown', 0.01);
    pinpoint.verify('selfImprovement');
    bossAgent.grade({ operation: 'shutdown', engine: 'selfImprovement' }, { engine: 'selfImprovement' });

    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }

    await this.log('self_improvement_shutdown', {
      totalHCUSpent: this.totalHCUSpent,
      totalCycles: this.cycles.length,
      appliedChanges: this.appliedChanges.length,
    });
  }

  // ============================================
  // Improvement Cycles
  // ============================================

  private async runImprovementCycle(): Promise<void> {
    if (!this.isRunning) return;

    hcu.track('selfImprovement_runCycle', 0.01);
    pinpoint.verify('selfImprovement');
    bossAgent.grade({ operation: 'runCycle', engine: 'selfImprovement' }, { engine: 'selfImprovement' });

    // Check rate limiting
    this.resetHourlyCounterIfNeeded();
    if (this.cyclesThisHour >= this.config.maxCyclesPerHour) {
      return;
    }

    // Check HCU budget
    if (this.totalHCUSpent > this.config.hcuBudgetPerCycle * 20) { // 20-cycle rolling budget
      return;
    }

    this.cyclesThisHour++;

    const cycle: ImprovementCycle = {
      id: `cycle_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      status: 'planning',
      focus: this.selectFocus(),
      changes: [],
      hcuCost: 0,
    };

    this.cycles.unshift(cycle);
    if (this.cycles.length > 200) this.cycles = this.cycles.slice(0, 150);

    this.emitEvent({ type: 'cycle_started', cycle });

    try {
      // Planning phase
      cycle.status = 'planning';
      cycle.changes = await this.proposeChanges(cycle.focus);

      for (const change of cycle.changes) {
        this.emitEvent({ type: 'change_proposed', change });
        this.pendingChanges.push(change);
      }

      // Execution phase
      cycle.status = 'executing';
      const executedChanges = await this.executeChanges(cycle.changes);

      // Evaluation phase
      cycle.status = 'evaluating';
      cycle.results = await this.evaluateChanges(executedChanges);

      // Apply/Reject phase
      if (cycle.results.verdict === 'accept' || (cycle.results.verdict === 'partial' && this.shouldAutoApply(cycle.results))) {
        cycle.status = 'completed';
        await this.applyChanges(executedChanges);
        for (const change of executedChanges) {
          this.emitEvent({ type: 'change_applied', change });
        }
      } else {
        cycle.status = 'rolled_back';
        await this.rollbackChanges(executedChanges);
        for (const change of executedChanges) {
          this.emitEvent({ type: 'change_rejected', change, reason: cycle.results.verdict });
        }
      }

      cycle.hcuCost = this.config.hcuBudgetPerCycle;
      this.totalHCUSpent += cycle.hcuCost;

      this.emitEvent({ type: 'cycle_completed', cycle, result: cycle.results! });
    } catch (e) {
      cycle.status = 'rolled_back';
      cycle.results = {
        performanceDelta: 0,
        qualityDelta: 0,
        stabilityImpact: 0,
        passedTests: false,
        metrics: {},
        verdict: 'reject',
      };
      console.error('Improvement cycle failed:', e);
    }
  }

  private resetHourlyCounterIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastHourReset > 3600000) {
      this.cyclesThisHour = 0;
      this.lastHourReset = now;
    }
  }

  private selectFocus(): string {
    const focuses = [
      'HCU cost optimization',
      'Response latency reduction',
      'Memory usage optimization',
      'Error rate reduction',
      'Code quality improvement',
      'Test coverage expansion',
      'Configuration tuning',
    ];
    return focuses[Math.floor(Math.random() * focuses.length)];
  }

  private async proposeChanges(focus: string): Promise<ProposedChange[]> {
    // In production, would analyze metrics, code, and generate actual proposals
    // Simulated proposals based on focus
    const proposals: ProposedChange[] = [];

    const baseProposals: Record<string, Omit<ProposedChange, 'id' | 'estimatedCost' | 'riskLevel'>[]> = {
      'HCU cost optimization': [
        { target: 'agentWorkforce', type: 'optimization', description: 'Reduce IPC polling frequency during idle', estimatedImpact: 0.3 },
        { target: 'continuousIntelligence', type: 'optimization', description: 'Batch reasoning tasks to reduce LLM calls', estimatedImpact: 0.4 },
        { target: 'situationalAwareness', type: 'config_tuning', description: 'Increase snapshot interval when system stable', estimatedImpact: 0.2 },
      ],
      'Response latency reduction': [
        { target: 'autonomous', type: 'optimization', description: 'Cache common action plans', estimatedImpact: 0.35 },
        { target: 'multiSense', type: 'optimization', description: 'Parallelize sense fusion processing', estimatedImpact: 0.25 },
      ],
      'Memory usage optimization': [
        { target: 'agentWorkforce', type: 'optimization', description: 'Implement LRU eviction for memory vectors', estimatedImpact: 0.3 },
        { target: 'cosmos', type: 'optimization', description: 'Compress old memory entries', estimatedImpact: 0.2 },
      ],
      'Error rate reduction': [
        { target: 'autonomous', type: 'bug_fix', description: 'Add retry logic for flaky browser actions', estimatedImpact: 0.4 },
        { target: 'agentWorkforce', type: 'bug_fix', description: 'Fix race condition in task queue', estimatedImpact: 0.3 },
      ],
      'Code quality improvement': [
        { target: 'shared', type: 'refactor', description: 'Extract common CRDT sync logic', estimatedImpact: 0.15 },
      ],
      'Configuration tuning': [
        { target: 'costGovernor', type: 'config_tuning', description: 'Adjust HCU alert thresholds based on usage patterns', estimatedImpact: 0.2 },
      ],
      'Test coverage expansion': [
        { target: 'shared', type: 'feature', description: 'Add integration tests for cross-engine workflows', estimatedImpact: 0.25 },
      ],
    };

    const focusProposals = baseProposals[focus] || baseProposals['HCU cost optimization'];

    for (const p of focusProposals.slice(0, 3)) {
      const change: ProposedChange = {
        ...p,
        id: `change_${uuidv4().slice(0, 8)}`,
        estimatedCost: Math.random() * 1.5 + 0.5,
        riskLevel: p.type === 'refactor' ? 'medium' : p.type === 'bug_fix' ? 'low' : 'low',
      };
      proposals.push(change);
    }

    // Simulate async planning
    await new Promise(r => setTimeout(r, 100));
    return proposals;
  }

  private async executeChanges(changes: ProposedChange[]): Promise<ProposedChange[]> {
    // In production, would actually apply changes to codebase
    // For simulation, just mark as executed with simulated diffs
    for (const change of changes) {
      change.codeDiff = this.generateMockDiff(change);
      await new Promise(r => setTimeout(r, 50));
    }
    return changes;
  }

  private generateMockDiff(change: ProposedChange): string {
    return `// ${change.target} - ${change.type}\n${change.description}\n// Simulated diff for: ${change.id}`;
  }

  private async evaluateChanges(changes: ProposedChange[]): Promise<EvaluationResult> {
    // Simulate evaluation with metrics
    await new Promise(r => setTimeout(r, 100));

    // Simulate running tests
    const passedTests = Math.random() > 0.1; // 90% pass rate

    const avgImpact = changes.reduce((sum, c) => sum + c.estimatedImpact, 0) / changes.length;
    const performanceDelta = (Math.random() - 0.3) * avgImpact; // Bias toward positive
    const qualityDelta = (Math.random() - 0.2) * avgImpact;
    const stabilityImpact = Math.random() * 0.3; // Small stability impact

    let verdict: EvaluationResult['verdict'] = 'accept';
    if (!passedTests) verdict = 'reject';
    else if (performanceDelta < 0 || qualityDelta < -0.1) verdict = 'partial';

    return {
      performanceDelta,
      qualityDelta,
      stabilityImpact,
      passedTests,
      metrics: {
        avgImpact,
        testPassRate: passedTests ? 1 : 0,
        hcuEfficiency: 1 - Math.abs(performanceDelta),
      },
      verdict,
    };
  }

  private shouldAutoApply(results: EvaluationResult): boolean {
    const score = (results.performanceDelta + results.qualityDelta + (1 - results.stabilityImpact)) / 3;
    return score >= this.config.autoApplyThreshold && results.passedTests;
  }

  private async applyChanges(changes: ProposedChange[]): Promise<void> {
    for (const change of changes) {
      this.pendingChanges = this.pendingChanges.filter(c => c.id !== change.id);
      this.appliedChanges.push(change);
      await new Promise(r => setTimeout(r, 20));
    }
  }

  private async rollbackChanges(changes: ProposedChange[]): Promise<void> {
    for (const change of changes) {
      this.pendingChanges = this.pendingChanges.filter(c => c.id !== change.id);
      this.rejectedChanges.push({ change, reason: 'Evaluation rejected' });
      await new Promise(r => setTimeout(r, 20));
    }
  }

  // ============================================
  // Manual Control
  // ============================================

  forceCycle(focus?: string): ImprovementCycle {
    const cycle: ImprovementCycle = {
      id: `cycle_manual_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      status: 'planning',
      focus: focus || this.selectFocus(),
      changes: [],
      hcuCost: 0,
    };
    this.cycles.unshift(cycle);
    this.runImprovementCycle(); // Async execution
    return cycle;
  }

  approveChange(changeId: string): boolean {
    const idx = this.pendingChanges.findIndex(c => c.id === changeId);
    if (idx >= 0) {
      const change = this.pendingChanges.splice(idx, 1)[0];
      this.appliedChanges.push(change);
      this.emitEvent({ type: 'change_applied', change });
      return true;
    }
    return false;
  }

  rejectChange(changeId: string, reason: string): boolean {
    const idx = this.pendingChanges.findIndex(c => c.id === changeId);
    if (idx >= 0) {
      const change = this.pendingChanges.splice(idx, 1)[0];
      this.rejectedChanges.push({ change, reason });
      this.emitEvent({ type: 'change_rejected', change, reason });
      return true;
    }
    return false;
  }

  // ============================================
  // Queries
  // ============================================

  getCycles(limit = 50): ImprovementCycle[] {
    return this.cycles.slice(0, limit);
  }

  getLatestCycle(): ImprovementCycle | null {
    return this.cycles[0] || null;
  }

  getPendingChanges(): ProposedChange[] {
    return [...this.pendingChanges];
  }

  getAppliedChanges(limit = 50): ProposedChange[] {
    return this.appliedChanges.slice(0, limit);
  }

  getRejectedChanges(limit = 50): { change: ProposedChange; reason: string }[] {
    return this.rejectedChanges.slice(0, limit);
  }

  // ============================================
  // Health & Config
  // ============================================

  getHealth(): {
    isRunning: boolean;
    totalCycles: number;
    cyclesThisHour: number;
    maxCyclesPerHour: number;
    pendingChanges: number;
    appliedChanges: number;
    rejectedChanges: number;
    totalHCUSpent: number;
    hcuBudgetPerCycle: number;
  } {
    return {
      isRunning: this.isRunning,
      totalCycles: this.cycles.length,
      cyclesThisHour: this.cyclesThisHour,
      maxCyclesPerHour: this.config.maxCyclesPerHour,
      pendingChanges: this.pendingChanges.length,
      appliedChanges: this.appliedChanges.length,
      rejectedChanges: this.rejectedChanges.length,
      totalHCUSpent: this.totalHCUSpent,
      hcuBudgetPerCycle: this.config.hcuBudgetPerCycle,
    };
  }

  getConfig(): SelfImprovementConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<SelfImprovementConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // Event System
  // ============================================

  onEvent<K extends SelfImprovementEvent['type']>(
    eventType: K,
    listener: (event: Extract<SelfImprovementEvent, { type: K }>) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener as any);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener as any);
    };
  }

  private emitEvent(event: SelfImprovementEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error(`SelfImprovement event listener error:`, e);
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
        type: `self_improvement_${type}`,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }
}

export function createSelfImprovementEngine(config?: Partial<SelfImprovementConfig>): SelfImprovementEngine {
  return new SelfImprovementEngine(config);
}

export default SelfImprovementEngine;