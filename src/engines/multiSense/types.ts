// src/engines/multiSense/types.ts
// Types for Engine 7: Multi-Sense Control

export interface SenseTypeInterface = 'vision' | 'audio' | 'tactile' | 'spatial' | 'biometric';

export type SenseType = SenseTypeInterface;

export type SenseChannel = {
  id: string;
  type: SenseType;
  name: string;
  status: 'active' | 'inactive' | 'error' | 'calibrating';
  sensitivity: number; // 0-1
  lastActivity: string;
  metadata: Record<string, unknown>;
};

export type SensoryInput = {
  id: string;
  channelId: string;
  type: SenseType;
  data: unknown;
  timestamp: string;
  confidence: number;
  importance: number; // 0-1
};

export type SenseFusionResult = {
  id: string;
  timestamp: string;
  unifiedInsight: string;
  contributingSenses: SenseType[];
  confidence: number;
  intent?: string;
};

export type MultiSenseConfig = {
  enabledSenses: SenseType[];
  fusionIntervalMs: number;
  minConfidenceThreshold: number;
  hcuBudgetPerMinute: number;
  autoCalibrate: boolean;
};

export type MultiSenseEvent =
  | { type: 'sense_activated'; channelId: string; senseType: SenseType }
  | { type: 'sensory_input_received'; input: SensoryInput }
  | { type: 'senses_fused'; result: SenseFusionResult }
  | { type: 'sense_error'; channelId: string; error: string };
