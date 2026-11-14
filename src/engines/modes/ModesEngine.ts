// src/engines/modes/ModesEngine.ts
// Engine 14: Modes — Adaptive behavioral modes

import type {
  Mode,
  ModeId,
  ModeTrigger,
  ModeSchedule,
  ActiveMode,
  ModeTransition,
  ModesConfig,
  ModesEvent,
  ModesHealth,
} from './types';
import * as hcu from '../../core/cost/costGovernor';
import { pinpoint } from '../../core/precision/pinpointPrecision';
import * as bossAgent from '../../core/engines/bossAgent';
import { logToCosmos } from '../../core/cosmosMemory';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_MODES: Mode[] = [
  {
    id: 'focus',
    name: 'Deep Focus',
    description: 'Minimize distractions, maximize productivity for deep work',
    icon: '🎯',
    color: '#3B82F6',
    enabled: true,
    triggers: [
      { type: 'time', condition: { start: '09:00', end: '12:00' }, priority: 5 },
      { type: 'activity', condition: { app: 'code', duration: 1800000 }, priority: 8 },
    ],
    engineConfigs: {
      agentWorkforce: { maxAgents: 2 },
      continuousIntelligence: { hcuBudgetPerHour: 3.0 },
      multiSense: { enabledSenses: ['vision', 'spatial'] },
      safetyTrio: { privacy: { localProcessingOnly: true } },
    },
    uiOverrides: { theme: 'focus', notifications: 'minimal' },
  },
  {
    id: 'creative',
    name: 'Creative Flow',
    description: 'Open exploration, inspiration gathering, divergent thinking',
    icon: '🎨',
    color: '#8B5CF6',
    enabled: true,
    triggers: [
      { type: 'time', condition: { start: '14:00', end: '17:00' }, priority: 4 },
      { type: 'activity', condition: { app: ['design', 'figma', 'blender'] }, priority: 7 },
    ],
    engineConfigs: {
      agentWorkforce: { maxAgents: 4 },
      continuousIntelligence: { hcuBudgetPerHour: 5.0 },
      multiSense: { enabledSenses: ['vision', 'audio', 'tactile', 'spatial'] },
      guidanceWorld: { autoGenerateInstructions: true },
    },
    uiOverrides: { theme: 'creative', notifications: 'normal' },
  },
  {
    id: 'learning',
    name: 'Learning Mode',
    description: 'Structured skill acquisition, tutoring, knowledge building',
    icon: '📚',
    color: '#10B981',
    enabled: true,
    triggers: [
      { type: 'calendar', condition: { keyword: 'learning' }, priority: 6 },
      { type: 'activity', condition: { app: ['browser', 'docs', 'notion'] }, priority: 5 },
    ],
    engineConfigs: {
      guidanceWorld: { defaultTutoringLevel: 'beginner', enableFeedbackLoop: true },
      continuousIntelligence: { hcuBudgetPerHour: 2.0 },
      agentWorkforce: { maxAgents: 1 },
    },
    uiOverrides: { theme: 'learning', notifications: 'educational' },
  },
  {
    id: 'rest',
    name: 'Rest & Recovery',
    description: 'Low stimulation, background processing only, privacy focused',
    icon: '🌙',
    color: '#6B7280',
    enabled: true,
    triggers: [
      { type: 'time', condition: { start: '22:00', end: '07:00' }, priority: 10 },
      { type: 'system_state', condition: { idle: 1800000 }, priority: 8 },
    ],
    engineConfigs: {
      agentWorkforce: { maxAgents: 0 },
      continuousIntelligence: { hcuBudgetPerHour: 0.5 },
      multiSense: { enabledSenses: [] },
      situationalAwareness: { snapshotIntervalMs: 60000 },
      safetyTrio: { privacy: { localProcessingOnly: true, telemetryEnabled: false } },
    },
    uiOverrides: { theme: 'dark', notifications: 'none' },
  },
  {
    id: 'social',
    name: 'Social & Communication',
    description: 'Optimized for messaging, calls, collaboration',
    icon: '💬',
    color: '#EC4899',
    enabled: true,
    triggers: [
      { type: 'activity', condition: { app: ['discord', 'slack', 'teams', 'zoom'] }, priority: 7 },
      { type: 'calendar', condition: { keyword: 'meeting' }, priority: 8 },
    ],
    engineConfigs: {
      agentWorkforce: { maxAgents: 1 },
      multiSense: { enabledSenses: ['audio', 'vision'] },
      nativeMessaging: { enabled: true },
      continuousIntelligence: { hcuBudgetPerHour: 1.0 },
    },
    uiOverrides: { theme: 'social', notifications: 'all' },
  },
  {
    id: 'admin',
    name: 'System Administration',
    description: 'Full system access, configuration, monitoring',
    icon: '⚙️',
    color: '#F59E0B',
    enabled: true,
    triggers: [
      { type: 'manual', condition: {}, priority: 10 },
    ],
    engineConfigs: {
      ownerConsole: { broadcastEnabled: true },
      performanceQuality: { qualityAlertThreshold: 50 },
      safetyTrio: { security: { requireMfa: true } },
    },
    uiOverrides: { theme: 'admin', notifications: 'verbose' },
  },
  {
    id: 'emergency',
    name: 'Emergency Mode',
    description: 'Critical operations only, maximum safety, minimal resources',
    icon: '🚨',
    color: '#EF4444',
    enabled: true,
    triggers: [
      { type: 'system_state', condition: { cpuUsage: 95 }, priority: 10 },
      { type: 'system_state', condition: { memoryUsage: 95 }, priority: 10 },
      { type: 'manual', condition: {}, priority: 10 },
    ],
    engineConfigs: {
      agentWorkforce: { maxAgents: 0 },
      continuousIntelligence: { hcuBudgetPerHour: 0.1 },
      multiSense: { enabledSenses: [] },
      safetyTrio: { security: { maxFailedAuthAttempts: 2, lockoutDurationMs: 60000 } },
      ownerConsole: { emergencyStopEnabled: true },
    },
    uiOverrides: { theme: 'emergency', notifications: 'critical_only' },
  },
];

const DEFAULT_CONFIG: ModesConfig = {
  defaultMode: 'focus',
  allowManualOverride: true,
  transitionCooldownMs: 5000,
  persistActiveMode: true,
  hcuBudgetPerHour: 0.5,
};

export class ModesEngine {
  private config: ModesConfig;
  private modes: Map<ModeId, Mode> = new Map();
  private activeMode: ActiveMode | null = null;
  private transitions: ModeTransition[] = [];
  private eventListeners: Map<string, Set<(event: ModesEvent) => void>> = new Map();
  private evaluationTimer: ReturnType<typeof setInterval> | null = null;
  private totalHCUSpent = 0;
  private isRunning = false;
  private lastTransitionTime = 0;

  constructor(config: Partial<ModesConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeModes();
  }

  private initializeModes(): void {
    for (const mode of DEFAULT_MODES) {
      this.modes.set(mode.id, { ...mode });
    }
  }

  async initialize(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    hcu.track('modes_init', 0.01);
    pinpoint.verify('modes');
    bossAgent.grade({ operation: 'init', engine: 'modes' }, { engine: 'modes' });

    // Activate default mode
    await this.activateMode(this.config.defaultMode, 'trigger', { reason: 'initialization' });

    // Start trigger evaluation timer
    this.evaluationTimer = setInterval(() => this.evaluateTriggers(), 30000);

    await this.log('modes_initialized', { config: this.config });
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
      this.evaluationTimer = null;
    }

    await this.log('modes_shutdown', { totalHCUSpent: this.totalHCUSpent });
  }

  // ============================================
  // Mode Management
  // ============================================

  getMode(modeId: ModeId): Mode | undefined {
    return this.modes.get(modeId);
  }

  getAllModes(): Mode[] {
    return Array.from(this.modes.values());
  }

  getEnabledModes(): Mode[] {
    return Array.from(this.modes.values()).filter(m => m.enabled);
  }

  getActiveMode(): ActiveMode | null {
    return this.activeMode;
  }

  async activateMode(
    modeId: ModeId,
    activatedBy: ActiveMode['activatedBy'] = 'manual',
    context: Record<string, unknown> = {}
  ): Promise<boolean> {
    const mode = this.modes.get(modeId);
    if (!mode || !mode.enabled) return false;

    hcu.track('modes_activate', 0.01);
    pinpoint.verify('modes');
    bossAgent.grade({ operation: 'activate', modeId: mode.id, activatedBy }, { engine: 'modes' });

    const now = Date.now();
    if (now - this.lastTransitionTime < this.config.transitionCooldownMs) {
      // Cooldown active, but allow manual override
      if (activatedBy === 'manual' && !this.config.allowManualOverride) {
        return false;
      }
    }

    const previousModeId = this.activeMode?.modeId;
    const previousMode = previousModeId ? this.modes.get(previousModeId) : null;

    // Deactivate current mode
    if (this.activeMode) {
      this.emitEvent({ type: 'mode_deactivated', modeId: this.activeMode.modeId });
    }

    // Activate new mode
    const activeMode: ActiveMode = {
      modeId,
      activatedAt: new Date().toISOString(),
      activatedBy,
      previousModeId,
      context: { ...context, previousModeConfig: previousMode?.engineConfigs },
    };

    this.activeMode = activeMode;
    this.lastTransitionTime = now;

    // Record transition
    if (previousModeId) {
      const transition: ModeTransition = {
        from: previousModeId,
        to: modeId,
        timestamp: new Date().toISOString(),
        triggeredBy: activatedBy,
        reason: context.reason as string || 'Manual activation',
      };
      this.transitions.unshift(transition);
      if (this.transitions.length > 500) this.transitions = this.transitions.slice(0, 400);
      this.emitEvent({ type: 'mode_transition', transition });
    }

    // Apply engine configs
    this.applyEngineConfigs(mode.engineConfigs);

    this.emitEvent({ type: 'mode_activated', mode: activeMode });
    this.totalHCUSpent += 0.01;
    return true;
  }

  private applyEngineConfigs(configs: Record<string, Record<string, unknown>>): void {
    // In production, would call each engine's updateConfig
    // For now, emit events for interested parties
    for (const [engineId, engineConfig] of Object.entries(configs)) {
      // Engine-specific config application would happen here
    }
  }

  // ============================================
  // Trigger Evaluation
  // ============================================

  private evaluateTriggers(): void {
    if (!this.isRunning || !this.config.allowManualOverride) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    const currentDay = now.getDay(); // 0 = Sunday

    for (const mode of this.getEnabledModes()) {
      if (mode.id === this.activeMode?.modeId) continue;

      for (const trigger of mode.triggers) {
        let matched = false;

        switch (trigger.type) {
          case 'time': {
            const { start, end } = trigger.condition as { start: string; end: string };
            if (this.isTimeInRange(currentTime, start, end)) matched = true;
            break;
          }
          case 'schedule': {
            if (mode.schedule) {
              const { days, startTime, endTime } = mode.schedule;
              if (days.includes(currentDay) && this.isTimeInRange(currentTime, startTime, endTime)) {
                matched = true;
              }
            }
            break;
          }
          // Other triggers would need system integration
        }

        this.emitEvent({ type: 'trigger_evaluated', trigger, matched });

        if (matched && trigger.priority >= 5) {
          this.activateMode(mode.id, 'trigger', { triggerType: trigger.type, priority: trigger.priority });
          return; // Only activate one mode per evaluation cycle
        }
      }
    }

    this.totalHCUSpent += 0.001;
  }

  private isTimeInRange(current: string, start: string, end: string): boolean {
    // Handle overnight ranges (e.g., 22:00 to 07:00)
    if (start > end) {
      return current >= start || current <= end;
    }
    return current >= start && current <= end;
  }

  // ============================================
  // Schedule Management
  // ============================================

  setModeSchedule(modeId: ModeId, schedule: ModeSchedule | undefined): boolean {
    const mode = this.modes.get(modeId);
    if (!mode) return false;

    mode.schedule = schedule;
    this.emitEvent({ type: 'schedule_changed', modeId, schedule });
    return true;
  }

  getModeSchedule(modeId: ModeId): ModeSchedule | undefined {
    return this.modes.get(modeId)?.schedule;
  }

  // ============================================
  // Mode Configuration
  // ============================================

  updateMode(modeId: ModeId, updates: Partial<Mode>): boolean {
    const mode = this.modes.get(modeId);
    if (!mode) return false;

    Object.assign(mode, updates);
    if (mode.id === this.activeMode?.modeId) {
      this.applyEngineConfigs(mode.engineConfigs);
    }
    return true;
  }

  enableMode(modeId: ModeId): boolean {
    const mode = this.modes.get(modeId);
    if (!mode) return false;
    mode.enabled = true;
    return true;
  }

  disableMode(modeId: ModeId): boolean {
    const mode = this.modes.get(modeId);
    if (!mode) return false;
    if (mode.id === this.activeMode?.modeId) {
      // Switch to default mode
      this.activateMode(this.config.defaultMode, 'trigger', { reason: 'mode_disabled' });
    }
    mode.enabled = false;
    return true;
  }

  addCustomMode(mode: Omit<Mode, 'id'> & { id: ModeId }): Mode {
    const newMode: Mode = {
      ...mode,
      id: mode.id,
      triggers: mode.triggers || [],
      engineConfigs: mode.engineConfigs || {},
      uiOverrides: mode.uiOverrides || {},
    };
    this.modes.set(newMode.id, newMode);
    return newMode;
  }

  // ============================================
  // Transitions History
  // ============================================

  getTransitions(limit = 50): ModeTransition[] {
    return this.transitions.slice(0, limit);
  }

  // ============================================
  // Health & Config
  // ============================================

  getHealth(): ModesHealth {
    return {
      isRunning: this.isRunning,
      activeMode: this.activeMode,
      availableModes: this.modes.size,
      enabledModes: this.getEnabledModes().length,
      totalTransitions: this.transitions.length,
      totalHCUSpent: this.totalHCUSpent,
      hcuBudgetPerHour: this.config.hcuBudgetPerHour,
    };
  }

  getConfig(): ModesConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<ModesConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // Event System
  // ============================================

  onEvent<K extends ModesEvent['type']>(
    eventType: K,
    listener: (event: Extract<ModesEvent, { type: K }>) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener as any);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener as any);
    };
  }

  private emitEvent(event: ModesEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error(`Modes event listener error:`, e);
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
        type: `modes_${type}`,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }
}

export function createModesEngine(config?: Partial<ModesConfig>): ModesEngine {
  return new ModesEngine(config);
}

export default ModesEngine;