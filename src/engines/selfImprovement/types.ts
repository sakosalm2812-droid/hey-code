// src/engines/selfImprovement/types.ts
// Types for Engine 8: Self-Improvement

export interface ImprovementCycleInterface = {
  id: string;
  timestamp: string;
  status: 'planning' | 'executing' | 'evaluating' | 'completed' | 'rolled_back';
  focus: string;
  changes: ProposedChange[];
  results?: EvaluationResult;
  hcuCost: number;
}

export type ImprovementCycle = ImprovementCycleInterface;

export type ProposedChange = {
  id: string;
  target: string; // Engine or component identifier
  type: 'optimization' | 'refactor' | 'bug_fix' | 'feature' | 'config_tuning';
  description: string;
  estimatedImpact: number; // 0-1
  estimatedCost: number; // HCU
  riskLevel: 'low' | 'medium' | 'high';
  codeDiff?: string;
};

export type EvaluationResult = {
  performanceDelta: number; // -1 to 1
  qualityDelta: number; // -1 to 1
  stabilityImpact: number; // 0-1
  passedTests: boolean;
  metrics: Record<string, number>;
  verdict: 'accept' | 'reject' | 'partial';
};

export type SelfImprovementConfig = {
  cycleIntervalMs: number;
  maxCyclesPerHour: number;
  hcuBudgetPerCycle: number;
  autoApplyThreshold: number; // Minimum verdict score to auto-apply
  requireManualApprovalFor: ('high_risk' | 'config_change' | 'structural_change')[];
};

export type SelfImprovementEvent =
  | { type: 'cycle_started'; cycle: ImprovementCycle }
  | { type: 'change_proposed'; change: ProposedChange }
  | { type: 'cycle_completed'; cycle: ImprovementCycle; result: EvaluationResult }
  | { type: 'change_applied'; change: ProposedChange }
  | { type: 'change_rejected'; change: ProposedChange; reason: string };