// src/engines/situationalAwareness/SituationalAwarenessEngine.ts
// Engine 6: Situational Awareness — Environment monitoring, context analysis, proactive alerts

import type {
  EnvironmentSnapshot,
  SituationAssessment,
  SituationFactor,
  AwarenessConfig,
  AwarenessEvent,
} from './types';
import { logToCosmos } from '../../core/cosmosMemory';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CONFIG: AwarenessConfig = {
  snapshotIntervalMs: 10000, // 10 seconds
  assessmentIntervalMs: 30000, // 30 seconds
  historyRetentionMs: 3600000, // 1 hour
  hcuBudgetPerHour: 2.0,
  alertThreshold: 'elevated',
  autoActionEnabled: false,
};

export class SituationalAwarenessEngine {
  private config: AwarenessConfig;
  private snapshots: EnvironmentSnapshot[] = [];
  private assessments: SituationAssessment[] = [];
  private eventListeners: Map<string, Set<(event: AwarenessEvent) => void>> = new Map();
  private snapshotTimer: ReturnType<typeof setInterval> | null = null;
  private assessmentTimer: ReturnType<typeof setInterval> | null = null;
  private totalHCUSpent = 0;
  private isRunning = false;
  private lastSnapshotId: string | null = null;

  constructor(config: Partial<AwarenessConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    hcu.track('situationalAwareness_init', 0.01);
    pinpoint.verify('situationalAwareness');
    bossAgent.grade({ operation: 'init', engine: 'situationalAwareness' }, { engine: 'situationalAwareness' });

    this.snapshotTimer = setInterval(() => this.captureSnapshot(), this.config.snapshotIntervalMs);
    this.assessmentTimer = setInterval(() => this.generateAssessment(), this.config.assessmentIntervalMs);

    // Initial capture
    await this.captureSnapshot();
    await this.generateAssessment();

    await this.log('awareness_initialized', { config: this.config });
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    hcu.track('situationalAwareness_shutdown', 0.01);
    pinpoint.verify('situationalAwareness');
    bossAgent.grade({ operation: 'shutdown', engine: 'situationalAwareness' }, { engine: 'situationalAwareness' });

    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = null;
    }
    if (this.assessmentTimer) {
      clearInterval(this.assessmentTimer);
      this.assessmentTimer = null;
    }

    await this.log('awareness_shutdown', { totalHCUSpent: this.totalHCUSpent });
  }

  // ============================================
  // Environment Snapshots
  // ============================================

  private async captureSnapshot(): Promise<EnvironmentSnapshot> {
    if (!this.isRunning) return this.getEmptySnapshot();

    hcu.track('situationalAwareness_captureSnapshot', 0.001);
    pinpoint.verify('situationalAwareness');
    bossAgent.grade({ operation: 'captureSnapshot', engine: 'situationalAwareness' }, { engine: 'situationalAwareness' });

    const snapshot: EnvironmentSnapshot = {
      id: `snap_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      system: await this.getSystemMetrics(),
      application: await this.getApplicationState(),
      user: await this.getUserState(),
      context: this.getContextState(),
    };

    this.snapshots.unshift(snapshot);
    this.lastSnapshotId = snapshot.id;

    // Trim old snapshots
    const cutoff = Date.now() - this.config.historyRetentionMs;
    this.snapshots = this.snapshots.filter(s => new Date(s.timestamp).getTime() > cutoff);

    // Check HCU budget
    this.totalHCUSpent += 0.01;
    if (this.totalHCUSpent > this.config.hcuBudgetPerHour) {
      this.emitEvent({
        type: 'alert_triggered',
        assessment: this.createBudgetAlert(),
      });
    }

    this.emitEvent({ type: 'snapshot_captured', snapshot });
    return snapshot;
  }

  private async getSystemMetrics(): Promise<EnvironmentSnapshot['system']> {
    // In production, would use Tauri/system APIs
    // Simulated for now
    return {
      cpuUsage: Math.random() * 80 + 10,
      memoryUsage: Math.random() * 70 + 20,
      diskUsage: Math.random() * 50 + 10,
      networkIO: { rx: Math.random() * 1000000, tx: Math.random() * 500000 },
      uptime: Date.now() / 1000,
    };
  }

  private async getApplicationState(): Promise<EnvironmentSnapshot['application']> {
    return {
      activeWindows: ['HEY', 'VS Code', 'Terminal'],
      focusedApp: 'HEY',
      clipboardContent: undefined,
      keyboardLayout: 'en-US',
    };
  }

  private async getUserState(): Promise<EnvironmentSnapshot['user']> {
    return {
      idleTimeMs: Math.random() * 300000,
      lastInput: new Date(Date.now() - Math.random() * 60000).toISOString(),
      attentionState: this.determineAttentionState(),
    };
  }

  private determineAttentionState(): EnvironmentSnapshot['user']['attentionState'] {
    const rand = Math.random();
    if (rand < 0.6) return 'focused';
    if (rand < 0.85) return 'distracted';
    if (rand < 0.95) return 'away';
    return 'idle';
  }

  private getContextState(): EnvironmentSnapshot['context'] {
    return {
      currentGoal: 'Maintain system health and user productivity',
      activeTasks: ['Monitor environment', 'Generate assessments', 'Check anomalies'],
      recentDecisions: ['Captured snapshot', 'Assessed situation'],
    };
  }

  private getEmptySnapshot(): EnvironmentSnapshot {
    return {
      id: `snap_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      system: { cpuUsage: 0, memoryUsage: 0, diskUsage: 0, networkIO: { rx: 0, tx: 0 }, uptime: 0 },
      application: { activeWindows: [], focusedApp: '', keyboardLayout: '' },
      user: { idleTimeMs: 0, lastInput: new Date().toISOString(), attentionState: 'idle' },
      context: { activeTasks: [], recentDecisions: [] },
    };
  }

  getSnapshots(limit = 100): EnvironmentSnapshot[] {
    return this.snapshots.slice(0, limit);
  }

  getLatestSnapshot(): EnvironmentSnapshot | null {
    return this.snapshots[0] || null;
  }

  // ============================================
  // Situation Assessment
  // ============================================

  private async generateAssessment(): Promise<SituationAssessment> {
    hcu.track('situationalAwareness_generateAssessment', 0.001);
    pinpoint.verify('situationalAwareness');
    bossAgent.grade({ operation: 'generateAssessment', engine: 'situationalAwareness' }, { engine: 'situationalAwareness' });

    if (!this.isRunning || this.snapshots.length === 0) {
      return this.createEmptyAssessment();
    }

    const latest = this.snapshots[0];
    const factors = this.analyzeFactors(latest);
    const severity = this.calculateSeverity(factors);
    const summary = this.generateSummary(severity, factors);
    const recommendedActions = this.generateRecommendations(factors, severity);

    const assessment: SituationAssessment = {
      id: `assess_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      severity,
      summary,
      factors,
      recommendedActions,
    };

    this.assessments.unshift(assessment);
    if (this.assessments.length > 500) {
      this.assessments = this.assessments.slice(0, 500);
    }

    // Emit events based on severity
    this.emitEvent({ type: 'assessment_generated', assessment });

    if (this.shouldAlert(severity)) {
      this.emitEvent({ type: 'alert_triggered', assessment });
    }

    // Auto-action if enabled
    if (this.config.autoActionEnabled && severity === 'critical') {
      const action = await this.executeAutoAction(assessment);
      if (action) {
        assessment.autoActionTaken = action;
        this.emitEvent({ type: 'auto_action_executed', action, assessmentId: assessment.id });
      }
    }

    this.totalHCUSpent += 0.02;
    return assessment;
  }

  private analyzeFactors(snapshot: EnvironmentSnapshot): SituationFactor[] {
    const factors: SituationFactor[] = [];

    // Resource factors
    if (snapshot.system.cpuUsage > 85) {
      factors.push({
        type: 'resource',
        description: `High CPU usage: ${snapshot.system.cpuUsage.toFixed(1)}%`,
        impact: Math.min((snapshot.system.cpuUsage - 85) / 15, 1),
        source: 'system_monitor',
      });
    }

    if (snapshot.system.memoryUsage > 85) {
      factors.push({
        type: 'resource',
        description: `High memory usage: ${snapshot.system.memoryUsage.toFixed(1)}%`,
        impact: Math.min((snapshot.system.memoryUsage - 85) / 15, 1),
        source: 'system_monitor',
      });
    }

    if (snapshot.system.diskUsage > 90) {
      factors.push({
        type: 'resource',
        description: `Critical disk usage: ${snapshot.system.diskUsage.toFixed(1)}%`,
        impact: Math.min((snapshot.system.diskUsage - 90) / 10, 1),
        source: 'system_monitor',
      });
    }

    // User activity factors
    if (snapshot.user.attentionState === 'idle' && snapshot.user.idleTimeMs > 600000) {
      factors.push({
        type: 'activity',
        description: `User idle for ${(snapshot.user.idleTimeMs / 60000).toFixed(0)} minutes`,
        impact: 0.3,
        source: 'user_monitor',
      });
    }

    if (snapshot.user.attentionState === 'away') {
      factors.push({
        type: 'activity',
        description: 'User away from device',
        impact: 0.4,
        source: 'user_monitor',
      });
    }

    // Pattern factors
    const cpuTrend = this.getTrend('cpuUsage');
    if (cpuTrend > 10) {
      factors.push({
        type: 'pattern',
        description: `CPU usage trending up (${cpuTrend.toFixed(1)}% per interval)`,
        impact: Math.min(cpuTrend / 20, 0.6),
        source: 'trend_analyzer',
      });
    }

    // Goal drift (simulated)
    if (Math.random() < 0.05) {
      factors.push({
        type: 'goal_drift',
        description: 'Detected potential goal drift in active tasks',
        impact: 0.3,
        source: 'goal_monitor',
      });
    }

    return factors;
  }

  private getTrend(metric: 'cpuUsage' | 'memoryUsage'): number {
    if (this.snapshots.length < 3) return 0;
    const recent = this.snapshots.slice(0, 3).map(s => s.system[metric]);
    return recent[0] - recent[2]; // Simple slope
  }

  private calculateSeverity(factors: SituationFactor[]): SituationAssessment['severity'] {
    if (factors.length === 0) return 'normal';

    const maxImpact = Math.max(...factors.map(f => f.impact));
    const criticalCount = factors.filter(f => f.impact > 0.8).length;
    const highCount = factors.filter(f => f.impact > 0.5).length;

    if (criticalCount > 0 || maxImpact > 0.8) return 'critical';
    if (highCount > 1 || maxImpact > 0.5) return 'high';
    if (highCount > 0 || maxImpact > 0.3) return 'elevated';
    return 'normal';
  }

  private generateSummary(severity: SituationAssessment['severity'], factors: SituationFactor[]): string {
    const severityLabels = { normal: 'All systems normal', elevated: 'Elevated attention needed', high: 'High priority situation', critical: 'Critical situation detected' };
    const factorSummary = factors.slice(0, 3).map(f => f.description).join('; ');
    return `${severityLabels[severity]}. ${factorSummary}${factors.length > 3 ? ` (+${factors.length - 3} more)` : ''}`;
  }

  private generateRecommendations(factors: SituationFactor[], severity: SituationAssessment['severity']): string[] {
    const actions: string[] = [];

    for (const factor of factors) {
      switch (factor.type) {
        case 'resource':
          if (factor.description.includes('CPU')) actions.push('Consider closing CPU-intensive applications');
          if (factor.description.includes('memory')) actions.push('Free up memory by closing unused applications');
          if (factor.description.includes('disk')) actions.push('Clean up disk space immediately');
          break;
        case 'activity':
          if (factor.description.includes('idle')) actions.push('User has been idle — consider pausing background tasks');
          if (factor.description.includes('away')) actions.push('User away — reduce notification frequency');
          break;
        case 'pattern':
          actions.push('Investigate rising resource trend');
          break;
        case 'goal_drift':
          actions.push('Review current goals and task alignment');
          break;
      }
    }

    // General recommendations by severity
    if (severity === 'critical') actions.unshift('Immediate attention required');
    if (severity === 'high') actions.unshift('Schedule time to address within 15 minutes');
    if (severity === 'elevated') actions.unshift('Monitor situation closely');

    return [...new Set(actions)]; // Deduplicate
  }

  private shouldAlert(severity: SituationAssessment['severity']): boolean {
    const thresholds = { normal: 0, elevated: 1, high: 2, critical: 3 };
    const configThreshold = thresholds[this.config.alertThreshold];
    return thresholds[severity] >= configThreshold;
  }

  private createBudgetAlert(): SituationAssessment {
    return {
      id: `assess_budget_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      severity: 'high',
      summary: `HCU budget exceeded: ${this.totalHCUSpent.toFixed(2)}/${this.config.hcuBudgetPerHour} per hour`,
      factors: [{
        type: 'anomaly',
        description: 'Situational awareness HCU budget exceeded',
        impact: 0.7,
        source: 'cost_governor',
      }],
      recommendedActions: ['Reduce snapshot frequency', 'Pause non-critical assessments', 'Review HCU allocation'],
    };
  }

  private createEmptyAssessment(): SituationAssessment {
    return {
      id: `assess_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      severity: 'normal',
      summary: 'No data available for assessment',
      factors: [],
      recommendedActions: ['Wait for initial snapshots'],
    };
  }

  private async executeAutoAction(assessment: SituationAssessment): Promise<string | undefined> {
    // In production, would execute actual remediation
    // For now, simulate
    await new Promise(r => setTimeout(r, 100));
    return `Auto-mitigation: ${assessment.recommendedActions[0]}`;
  }

  getAssessments(limit = 50): SituationAssessment[] {
    return this.assessments.slice(0, limit);
  }

  getLatestAssessment(): SituationAssessment | null {
    return this.assessments[0] || null;
  }

  getAssessmentsBySeverity(severity: SituationAssessment['severity']): SituationAssessment[] {
    return this.assessments.filter(a => a.severity === severity);
  }

  // ============================================
  // Health & Config
  // ============================================

  getHealth(): {
    isRunning: boolean;
    snapshotCount: number;
    assessmentCount: number;
    totalHCUSpent: number;
    hcuBudgetPerHour: number;
    latestSeverity: SituationAssessment['severity'];
    lastSnapshotAge: number;
  } {
    return {
      isRunning: this.isRunning,
      snapshotCount: this.snapshots.length,
      assessmentCount: this.assessments.length,
      totalHCUSpent: this.totalHCUSpent,
      hcuBudgetPerHour: this.config.hcuBudgetPerHour,
      latestSeverity: this.assessments[0]?.severity || 'normal',
      lastSnapshotAge: this.snapshots[0] ? Date.now() - new Date(this.snapshots[0].timestamp).getTime() : -1,
    };
  }

  getConfig(): AwarenessConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<AwarenessConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // Event System
  // ============================================

  onEvent<K extends AwarenessEvent['type']>(
    eventType: K,
    listener: (event: Extract<AwarenessEvent, { type: K }>) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener as any);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener as any);
    };
  }

  private emitEvent(event: AwarenessEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error(`Awareness event listener error:`, e);
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
        type: `awareness_${type}`,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }
}

export function createSituationalAwarenessEngine(config?: Partial<AwarenessConfig>): SituationalAwarenessEngine {
  return new SituationalAwarenessEngine(config);
}

export default SituationalAwarenessEngine;