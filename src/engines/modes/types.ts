// src/engines/modes/types.ts
// Engine 14: Modes — Type definitions with interfaces

export interface Mode {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  triggers: ModeTrigger[];
  engineConfigs: Record<string, unknown>;
  uiOverrides: { theme: string; notifications: string };
}

export interface ModeId {
  value: string;
  label: string;
}

export interface ModeTrigger {
  type: 'time' | 'schedule' | 'activity' | 'system_state' | 'manual';
  condition: Record<string, unknown>;
  priority: number;
}

export interface ModeTransition {
  from: string;
  to: string;
  timestamp: string;
  triggeredBy: string;
  reason: string;
}

export interface ModesConfig {
  defaultMode: string;
  allowManualOverride: boolean;
  transitionCooldownMs: number;
  persistActiveMode: boolean;
  hcuBudgetPerHour: number;
}

export interface ModesEvent {
  type: 'mode_activated' | 'mode_deactivated' | 'mode_transition' | 'trigger_evaluated' | 'schedule_changed';
  modeId?: string;
  trigger?: ModeTrigger;
  matched?: boolean;
  priority?: number;
}

export interface ModesHealth {
  isRunning: boolean;
  activeMode: ModeId | null;
  availableModes: number;
  enabledModes: number;
  totalTransitions: number;
  totalHCUSpent: number;
  hcuBudgetPerHour: number;
}