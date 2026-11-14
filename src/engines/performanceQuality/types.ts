// src/engines/performanceQuality/types.ts
// Types for Engine 9: Performance & Quality

export interface QualityMetricInterface {
  id: string;
  name: string;
  category: 'performance' | 'reliability' | 'correctness' | 'efficiency' | 'user_experience';
  value: number;
  target: number;
  unit: string;
  timestamp: string;
  trend: 'improving' | 'stable' | 'declining';
}

export type QualityMetric = QualityMetricInterface;

export type PerformanceRecord = {
  id: string;
  timestamp: string;
  operation: string;
  durationMs: number;
  hcuCost: number;
  success: boolean;
  error?: string;
};

export type QualityScore = {
  id: string;
  timestamp: string;
  overall: number; // 0-100
  performance: number;
  reliability: number;
  correctness: number;
  efficiency: number;
  userExperience: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
};

export type PerformanceQualityConfig = {
  metricsRefreshIntervalMs: number;
  maxPerformanceRecords: number;
  hcuBudgetPerHour: number;
  qualityAlertThreshold: number; // 0-100
  performanceBaseline: number;
};

export type PerformanceQualityEvent =
  | { type: 'metrics_updated'; metrics: QualityMetric[] }
  | { type: 'quality_score_computed'; score: QualityScore }
  | { type: 'performance_recorded'; record: PerformanceRecord }
  | { type: 'quality_alert'; score: QualityScore; message: string };