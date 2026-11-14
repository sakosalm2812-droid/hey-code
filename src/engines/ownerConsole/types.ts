// src/engines/ownerConsole/types.ts
// Types for Engine 13: Owner Console — Command, Control, Override

export interface EngineIdInterface =
  | 'agentWorkforce'
  | 'autonomous'
  | 'continuousIntelligence'
  | 'situationalAwareness'
  | 'multiSense'
  | 'selfImprovement'
  | 'performanceQuality'
  | 'crossDevice'
  | 'safetyTrio'
  | 'guidanceWorld';

export type EngineId = EngineIdInterface;

export type EngineStatus = 'running' | 'stopped' | 'error' | 'initializing' | 'degraded';

export type EngineState = {
  id: EngineId;
  name: string;
  status: EngineStatus;
  enabled: boolean;
  health: Record<string, unknown>;
  config: Record<string, unknown>;
  hcuBudget: number;
  hcuSpent: number;
  lastStarted?: string;
  lastError?: string;
};

export type SystemCommand = {
  id: string;
  type: 'start_engine' | 'stop_engine' | 'restart_engine' | 'enable_engine' | 'disable_engine'
    | 'global_stop' | 'emergency_override' | 'budget_realloc' | 'broadcast' | 'snapshot' | 'health_check';
  target?: EngineId | 'all';
  payload: Record<string, unknown>;
  requestedBy: string;
  timestamp: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  result?: Record<string, unknown>;
  error?: string;
};

export type BudgetAllocation = {
  engineId: EngineId;
  allocated: number;
  spent: number;
  reserved: number;
  priority: 'critical' | 'high' | 'normal' | 'low';
};

export type SystemNotification = {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actions?: { label: string; action: string }[];
};

export type OwnerConfig = {
  engines: Partial<Record<EngineId, { enabled: boolean; hcuBudget: number }>>;
  globalHCUBudgetPerHour: number;
  emergencyStopEnabled: boolean;
  autoRestartFailedEngines: boolean;
  maxConcurrentCommands: number;
  commandTimeoutMs: number;
  broadcastEnabled: boolean;
};

export type OwnerEvent =
  | { type: 'engine_state_changed'; engine: EngineState }
  | { type: 'command_executed'; command: SystemCommand }
  | { type: 'budget_changed'; allocations: BudgetAllocation[] }
  | { type: 'notification'; notification: SystemNotification }
  | { type: 'global_stop'; reason: string }
  | { type: 'emergency_override'; reason: string; by: string };

export type OwnerHealth = {
  isRunning: boolean;
  enginesRunning: number;
  enginesTotal: number;
  totalHCUAllocated: number;
  totalHCUSpent: number;
  globalHCUBudget: number;
  pendingCommands: number;
  activeNotifications: number;
  systemStatus: 'healthy' | 'degraded' | 'critical' | 'emergency_stop';
};