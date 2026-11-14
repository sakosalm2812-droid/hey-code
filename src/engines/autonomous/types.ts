// src/engines/autonomous/types.ts
// Types for Autonomous Action Engine — OS/Browser control, Bézier mouse, Somatosensory verification

export interface Platform {
  value: 'desktop' | 'browser' | 'phone';
  label: string;
}

export interface ControlMode {
  value: 'guide' | 'assist' | 'act';
  label: string;
}

export interface CapabilityCategory {
  value: 'computer' | 'browser' | 'phone';
  label: string;
}

export interface RiskLevel {
  value: 'low' | 'medium' | 'high' | 'critical';
  label: string;
}

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  data?: unknown;
  error?: string;
  screenshot?: string;
  actualState?: unknown;
  expectedState?: unknown;
  diff?: string;
}

export interface ActionStep {
  id: string;
  capability: string;
  target?: string;
  parameters: Record<string, unknown>;
  expectedResult: unknown;
  verification: 'screenshot' | 'dom' | 'ocr' | 'state' | 'custom';
  retryOnFail: boolean;
  maxRetries: number;
}

export interface ActionPlan {
  id: string;
  goal: string;
  steps: ActionStep[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'rolled_back';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  currentStep: number;
  results: ActionStepResult[];
  rollbackPlan?: ActionStep[];
  hcuCost: number;
  hcuSpent: number;
}

export interface ActionStepResult {
  stepId: string;
  success: boolean;
  verified: boolean;
  data?: unknown;
  error?: string;
  screenshot?: string;
  durationMs: number;
  retries: number;
  hcuCost: number;
}

export interface MotorCortexConfig {
  bezierControlPoints: number;
  moveDurationRange: [number, number]; // ms
  clickDelayRange: [number, number]; // ms
  typeDelayRange: [number, number]; // ms per char
  scrollSmoothness: number;
  humanLikeJitter: boolean;
}

export interface SomatosensoryConfig {
  screenshotWaitMs: number;
  ocrConfidenceThreshold: number;
  domComparisonThreshold: number;
  stateCheckRetries: number;
  stateCheckIntervalMs: number;
}

export interface AutonomousConfig {
  motorCortex: MotorCortexConfig;
  somatosensory: SomatosensoryConfig;
  approvalGates: {
    moneyThresholdUsd: number;
    destructiveActionsRequireApproval: boolean;
    routineActionsAutoApprove: boolean;
  };
  reflexArc: {
    enabled: boolean;
    patterns: string[]; // CSS selectors for cookie banners, popups, etc.
  };
  rollback: {
    enabled: boolean;
    maxHistoryLength: number;
    snapshotIntervalMs: number;
  };
}

export interface ExecutionContext {
  platform: Platform;
  mode: ControlMode;
  userId: string;
  sessionId: string;
  workflowId?: string;
  approval?: unknown;
  hcuBudget: number;
}