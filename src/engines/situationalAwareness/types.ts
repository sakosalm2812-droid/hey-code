// src/engines/situationalAwareness/types.ts
// Types for Engine 6: Situational Awareness

export interface EnvironmentSnapshotInterface = {
  id: string;
  timestamp: string;
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: { rx: number; tx: number };
    uptime: number;
  };
  application: {
    activeWindows: string[];
    focusedApp: string;
    clipboardContent?: string;
    keyboardLayout: string;
  };
  user: {
    idleTimeMs: number;
    lastInput: string;
    attentionState: 'focused' | 'distracted' | 'away' | 'idle';
  };
  context: {
    currentGoal?: string;
    activeTasks: string[];
    recentDecisions: string[];
  };
}

export type EnvironmentSnapshot = EnvironmentSnapshotInterface;

export type SituationAssessment = {
  id: string;
  timestamp: string;
  severity: 'normal' | 'elevated' | 'high' | 'critical';
  summary: string;
  factors: SituationFactor[];
  recommendedActions: string[];
  autoActionTaken?: string;
};

export type SituationFactor = {
  type: 'resource' | 'activity' | 'pattern' | 'anomaly' | 'goal_drift';
  description: string;
  impact: number; // 0-1
  source: string;
};

export type AwarenessConfig = {
  snapshotIntervalMs: number;
  assessmentIntervalMs: number;
  historyRetentionMs: number;
  hcuBudgetPerHour: number;
  alertThreshold: 'normal' | 'elevated' | 'high' | 'critical';
  autoActionEnabled: boolean;
};

export type AwarenessEvent =
  | { type: 'snapshot_captured'; snapshot: EnvironmentSnapshot }
  | { type: 'assessment_generated'; assessment: SituationAssessment }
  | { type: 'alert_triggered'; assessment: SituationAssessment }
  | { type: 'auto_action_executed'; action: string; assessmentId: string };