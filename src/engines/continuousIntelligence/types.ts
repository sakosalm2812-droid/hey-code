// src/engines/continuousIntelligence/types.ts
// Engine 5: Continuous Intelligence — Type definitions with interfaces

export interface ThoughtStreamItem {
  source: string;
  content: string;
  confidence: number;
  tags: string[];
  status: string;
}

export interface BackgroundReasoningTask {
  id: string;
  title: string;
  prompt: string;
  status: string;
  hcuCost: number;
  createdAt: string;
}

export interface AnomalyAlert {
  id: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  sourceSystem: string;
  timestamp: string;
  resolved: boolean;
}

export interface IntelligenceConfig {
  backgroundReasoningIntervalMs: number;
  maxThoughtHistory: number;
  anomalyCheckIntervalMs: number;
  hcuBudgetPerMinute: number;
  autoEscalateCritical: boolean;
}

export interface IntelligenceEvent =
  | { type: 'thought_generated'; thought: ThoughtStreamItem }
  | { type: 'reasoning_completed'; task: BackgroundReasoningTask }
  | { type: 'anomaly_detected'; alert: AnomalyAlert }
  | { type: 'intelligence_initialized'; config: IntelligenceConfig }
  | { type: 'intelligence_shutdown'; totalHCUSpent: number };