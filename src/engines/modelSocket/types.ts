// src/engines/modelSocket/types.ts
// Engine 18: ModelSocket — Type definitions with interfaces

export interface ModelSocketConfig {
  modelPath: string;
  host: string;
  port: number;
  modelName: string;
  contextLength: number;
  temperature: number;
  maxTokens: number;
  hcuBudgetPerHour: number;
  concurrentRequests: number;
}

export interface ModelSocketHealth {
  isRunning: boolean;
  totalHCUSpent: number;
  hcuBudgetPerHour: number;
  concurrentRequests: number;
  modelLoaded: boolean;
}

export interface ModelSocketEvent {
  type: 'inference_started' | 'inference_completed' | 'inference_failed' | 'model_loaded' | 'model_unloaded';
  prompt?: string;
  success?: boolean;
  response?: string;
  tokensUsed?: number;
  hcuCost?: number;
  error?: string;
}

export interface ModelSocketRequest {
  id: string;
  prompt: string;
  options?: { temperature?: number; maxTokens?: number };
}