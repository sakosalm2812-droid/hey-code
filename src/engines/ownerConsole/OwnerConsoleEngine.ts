// src/engines/ownerConsole/OwnerConsoleEngine.ts
// Engine 13: Owner Console — Command, Control, Override

import type {
  EngineId,
  EngineState,
  SystemCommand,
  BudgetAllocation,
  SystemNotification,
  OwnerConfig,
  OwnerEvent,
  OwnerHealth,
  EngineStatus,
} from './types';
import { logToCosmos } from '../../core/cosmosMemory';
import { v4 as uuidv4 } from 'uuid';

const ALL_ENGINES: EngineId[] = [
  'agentWorkforce',
  'autonomous',
  'continuousIntelligence',
  'situationalAwareness',
  'multiSense',
  'selfImprovement',
  'performanceQuality',
  'crossDevice',
  'safetyTrio',
  'guidanceWorld',
];

const DEFAULT_CONFIG: OwnerConfig = {
  engines: {},
  globalHCUBudgetPerHour: 50.0,
  emergencyStopEnabled: true,
  autoRestartFailedEngines: false,
  maxConcurrentCommands: 5,
  commandTimeoutMs: 30000,
  broadcastEnabled: true,
};

export class OwnerConsoleEngine {
  private config: OwnerConfig;
  private engineStates: Map<EngineId, EngineState> = new Map();
  private commands: SystemCommand[] = [];
  private budgetAllocations: Map<EngineId, BudgetAllocation> = new Map();
  private notifications: SystemNotification[] = [];
  private eventListeners: Map<string, Set<(event: OwnerEvent) => void>> = new Map();
  private commandQueue: SystemCommand[] = [];
  private executingCommands = 0;
  private totalHCUSpent = 0;
  private isRunning = false;
  private globalStopped = false;
  private emergencyOverrideActive = false;

  constructor(config: Partial<OwnerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeEngineStates();
    this.initializeBudgetAllocations();
  }

  private initializeEngineStates(): void {
    for (const engineId of ALL_ENGINES) {
      const engineConfig = this.config.engines[engineId] || {};
      this.engineStates.set(engineId, {
        id: engineId,
        name: this.formatEngineName(engineId),
        status: 'stopped',
        enabled: engineConfig.enabled ?? true,
        health: {},
        config: {},
        hcuBudget: engineConfig.hcuBudget || this.getDefaultBudget(engineId),
        hcuSpent: 0,
      });
    }
  }

  private initializeBudgetAllocations(): void {
    for (const engineId of ALL_ENGINES) {
      const state = this.engineStates.get(engineId)!;
      this.budgetAllocations.set(engineId, {
        engineId,
        allocated: state.hcuBudget,
        spent: 0,
        reserved: 0,
        priority: engineId === 'safetyTrio' ? 'critical' : 'normal',
      });
    }
  }

  private formatEngineName(id: EngineId): string {
    return id
      .split(/(?=[A-Z])/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private getDefaultBudget(engineId: EngineId): number {
    const budgets: Partial<Record<EngineId, number>> = {
      agentWorkforce: 5.0,
      autonomous: 3.0,
      continuousIntelligence: 2.0,
      situationalAwareness: 2.0,
      multiSense: 3.0,
      selfImprovement: 1.0,
      performanceQuality: 1.0,
      crossDevice: 1.5,
      safetyTrio: 0.5,
      guidanceWorld: 1.0,
      ownerConsole: 0.5,
      modes: 0.5,
      neverCutOff: 1.0,
      nativeMessaging: 0.5,
      rendering: 0.5,
      entity: 0.5,
      digup: 1.0,
    };
    return budgets[engineId] || 1.0;
  }

  async initialize(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    hcu.track('ownerConsole_init', 0.01);
    pinpoint.verify('ownerConsole');
    bossAgent.grade({ operation: 'init', engine: 'ownerConsole' }, { engine: 'ownerConsole' });

    // Simulate starting enabled engines
    for (const [id, state] of this.engineStates) {
      if (state.enabled && !this.globalStopped) {
        await this.startEngineInternal(id);
      }
    }

    await this.log('owner_console_initialized', { config: this.config });
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    hcu.track('ownerConsole_shutdown', 0.01);
    pinpoint.verify('ownerConsole');
    bossAgent.grade({ operation: 'shutdown', engine: 'ownerConsole' }, { engine: 'ownerConsole' });

    // Stop all engines
    for (const id of this.engineStates.keys()) {
      await this.stopEngineInternal(id);
    }

    await this.log('owner_console_shutdown', { totalHCUSpent: this.totalHCUSpent });
  }

  // ============================================
  // Engine Management
  // ============================================

  async startEngine(engineId: EngineId, requestedBy = 'owner'): Promise<SystemCommand> {
    const command = this.createCommand('start_engine', engineId, {}, requestedBy);
    return this.executeCommand(command);
  }

  async stopEngine(engineId: EngineId, requestedBy = 'owner'): Promise<SystemCommand> {
    const command = this.createCommand('stop_engine', engineId, {}, requestedBy);
    return this.executeCommand(command);
  }

  async restartEngine(engineId: EngineId, requestedBy = 'owner'): Promise<SystemCommand> {
    const command = this.createCommand('restart_engine', engineId, {}, requestedBy);
    return this.executeCommand(command);
  }

  async enableEngine(engineId: EngineId, requestedBy = 'owner'): Promise<SystemCommand> {
    const command = this.createCommand('enable_engine', engineId, {}, requestedBy);
    return this.executeCommand(command);
  }

  async disableEngine(engineId: EngineId, requestedBy = 'owner'): Promise<SystemCommand> {
    const command = this.createCommand('disable_engine', engineId, {}, requestedBy);
    return this.executeCommand(command);
  }

  private async startEngineInternal(engineId: EngineId): Promise<void> {
    const state = this.engineStates.get(engineId);
    if (!state) return;

    state.status = 'initializing';
    this.emitEvent({ type: 'engine_state_changed', engine: { ...state } });

    // Simulate startup
    await new Promise(r => setTimeout(r, 100));

    state.status = 'running';
    state.lastStarted = new Date().toISOString();
    state.lastError = undefined;
    this.emitEvent({ type: 'engine_state_changed', engine: { ...state } });
  }

  private async stopEngineInternal(engineId: EngineId): Promise<void> {
    const state = this.engineStates.get(engineId);
    if (!state) return;

    state.status = 'stopped';
    this.emitEvent({ type: 'engine_state_changed', engine: { ...state } });
  }

  private async executeEngineCommand(command: SystemCommand): Promise<Record<string, unknown>> {
    const { type, target } = command;
    const engineId = target as EngineId;

    switch (type) {
      case 'start_engine':
        await this.startEngineInternal(engineId);
        return { success: true, engineId };
      case 'stop_engine':
        await this.stopEngineInternal(engineId);
        return { success: true, engineId };
      case 'restart_engine':
        await this.stopEngineInternal(engineId);
        await new Promise(r => setTimeout(r, 100));
        await this.startEngineInternal(engineId);
        return { success: true, engineId };
      case 'enable_engine': {
        const state = this.engineStates.get(engineId)!;
        state.enabled = true;
        if (!this.globalStopped) await this.startEngineInternal(engineId);
        return { success: true, engineId, enabled: true };
      }
      case 'disable_engine': {
        const state = this.engineStates.get(engineId)!;
        state.enabled = false;
        await this.stopEngineInternal(engineId);
        return { success: true, engineId, enabled: false };
      }
      default:
        return { success: false, error: 'Unknown command type' };
    }
  }

  // ============================================
  // System Commands
  // ============================================

  private createCommand(
    type: SystemCommand['type'],
    target: EngineId | 'all' | undefined,
    payload: Record<string, unknown>,
    requestedBy: string
  ): SystemCommand {
    return {
      id: `cmd_${uuidv4().slice(0, 8)}`,
      type,
      target,
      payload,
      requestedBy,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
  }

  private async executeCommand(command: SystemCommand): Promise<SystemCommand> {
    if (this.executingCommands >= this.config.maxConcurrentCommands) {
      this.commandQueue.push(command);
      return command;
    }

    this.executingCommands++;
    command.status = 'executing';
    this.commands.unshift(command);
    if (this.commands.length > 1000) this.commands = this.commands.slice(0, 800);

    try {
      let result: Record<string, unknown>;

      switch (command.type) {
        case 'start_engine':
          hcu.track(`start_${command.target}_engine`, 0.01);
          pinpoint.verify('ownerConsole');
          bossAgent.grade({ operation: 'start_engine', engine: command.target }, { engine: 'ownerConsole' });
          result = await this.executeEngineCommand(command);
          break;

        case 'stop_engine':
          hcu.track(`stop_${command.target}_engine`, 0.01);
          pinpoint.verify('ownerConsole');
          bossAgent.grade({ operation: 'stop_engine', engine: command.target }, { engine: 'ownerConsole' });
          result = await this.executeEngineCommand(command);
          break;

        case 'restart_engine':
          hcu.track('restart_engine', 0.01);
          pinpoint.verify('ownerConsole');
          bossAgent.grade({ operation: 'restart_engine', engine: command.target }, { engine: 'ownerConsole' });
          result = await this.executeEngineCommand(command);
          break;

        case 'enable_engine':
          hcu.track('enable_engine', 0.01);
          pinpoint.verify('ownerConsole');
          bossAgent.grade({ operation: 'enable_engine', engine: command.target }, { engine: 'ownerConsole' });
          result = await this.executeEngineCommand(command);
          break;

        case 'disable_engine':
          hcu.track('disable_engine', 0.01);
          pinpoint.verify('ownerConsole');
          bossAgent.grade({ operation: 'disable_engine', engine: command.target }, { engine: 'ownerConsole' });
          result = await this.executeEngineCommand(command);
          break;

        case 'global_stop':
          this.globalStopped = true;
          for (const id of this.engineStates.keys()) {
            await this.stopEngineInternal(id);
          }
          this.emitEvent({ type: 'global_stop', reason: command.payload.reason as string });
          result = { success: true, stoppedEngines: ALL_ENGINES.length };
          break;

        case 'emergency_override': {
          hcu.track('emergency_override', 0.01);
          pinpoint.verify('ownerConsole');
          bossAgent.grade({ operation: 'emergency_override', engine: 'ownerConsole' }, { engine: 'ownerConsole' });
          this.emergencyOverrideActive = true;
          this.globalStopped = true;
          for (const id of this.engineStates.keys()) {
            if (id !== 'safetyTrio' && id !== 'ownerConsole') {
              await this.stopEngineInternal(id);
            }
          }
          this.emitEvent({ type: 'emergency_override', reason: command.payload.reason as string, by: command.requestedBy });
          result = { success: true, preservedEngines: ['safetyTrio', 'ownerConsole'] };
          break;
        }

        case 'budget_realloc': {
          const { engineId, amount } = command.payload as { engineId: EngineId; amount: number };
          hcu.track('budget_realloc', 0.01);
          pinpoint.verify('ownerConsole');
          bossAgent.grade({ operation: 'budget_realloc', engine: engineId, amount }, { engine: 'ownerConsole' });
          const allocation = this.budgetAllocations.get(engineId);
          if (allocation) {
            allocation.allocated = Math.max(0, amount);
            const state = this.engineStates.get(engineId)!;
            state.hcuBudget = allocation.allocated;
            this.emitEvent({ type: 'budget_changed', allocations: this.getAllAllocations() });
            result = { success: true, engineId, newBudget: allocation.allocated };
          } else {
            result = { success: false, error: 'Engine not found' };
          }
          break;
        }

        case 'broadcast': {
          hcu.track('broadcast', 0.01);
          pinpoint.verify('ownerConsole');
          bossAgent.grade({ operation: 'broadcast', engine: 'ownerConsole' }, { engine: 'ownerConsole' });
          const notification = this.createNotification(
            command.payload.type as SystemNotification['type'],
            command.payload.title as string,
            command.payload.message as string,
            command.payload.actions as SystemNotification['actions']
          );
          result = { success: true, notificationId: notification.id };
          break;
        }

        case 'snapshot': {
          result = { success: true, snapshot: this.getSystemSnapshot() };
          break;
        }

        case 'health_check': {
          result = { success: true, health: this.getHealth() };
          break;
        }

        default:
          result = { success: false, error: 'Unknown command type' };
      }

      command.status = result.success ? 'completed' : 'failed';
      command.result = result;
      if (!result.success) command.error = result.error as string;

    } catch (error) {
      command.status = 'failed';
      command.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      this.executingCommands--;
      this.emitEvent({ type: 'command_executed', command });
      this.processQueue();
    }

    this.totalHCUSpent += 0.01;
    return command;
  }

  private processQueue(): void {
    while (this.commandQueue.length > 0 && this.executingCommands < this.config.maxConcurrentCommands) {
      const next = this.commandQueue.shift()!;
      this.executeCommand(next);
    }
  }

  // ============================================
  // Budget Management
  // ============================================

  getAllAllocations(): BudgetAllocation[] {
    return Array.from(this.budgetAllocations.values());
  }

  getAllocation(engineId: EngineId): BudgetAllocation | undefined {
    return this.budgetAllocations.get(engineId);
  }

  updateBudget(engineId: EngineId, allocated: number): boolean {
    const allocation = this.budgetAllocations.get(engineId);
    if (!allocation) return false;

    allocation.allocated = Math.max(0, allocated);
    const state = this.engineStates.get(engineId)!;
    state.hcuBudget = allocated;
    this.emitEvent({ type: 'budget_changed', allocations: this.getAllAllocations() });
    return true;
  }

  recordHCUSpent(engineId: EngineId, amount: number): void {
    const allocation = this.budgetAllocations.get(engineId);
    const state = this.engineStates.get(engineId);
    if (allocation) allocation.spent += amount;
    if (state) state.hcuSpent += amount;
  }

  // ============================================
  // Notifications
  // ============================================

  private createNotification(
    type: SystemNotification['type'],
    title: string,
    message: string,
    actions?: SystemNotification['actions']
  ): SystemNotification {
    const notification: SystemNotification = {
      id: `notif_${uuidv4().slice(0, 8)}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      actions,
    };

    this.notifications.unshift(notification);
    if (this.notifications.length > 500) this.notifications = this.notifications.slice(0, 400);

    this.emitEvent({ type: 'notification', notification });
    return notification;
  }

  broadcast(
    type: SystemNotification['type'],
    title: string,
    message: string,
    actions?: SystemNotification['actions']
  ): SystemNotification {
    if (!this.config.broadcastEnabled) {
      throw new Error('Broadcasting is disabled');
    }
    return this.createNotification(type, title, message, actions);
  }

  getNotifications(limit = 50): SystemNotification[] {
    return this.notifications.slice(0, limit);
  }

  markNotificationRead(id: string): boolean {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      return true;
    }
    return false;
  }

  // ============================================
  // Engine State Access
  // ============================================

  getEngineState(engineId: EngineId): EngineState | undefined {
    return this.engineStates.get(engineId);
  }

  getAllEngineStates(): EngineState[] {
    return Array.from(this.engineStates.values());
  }

  getRunningEngines(): EngineState[] {
    return Array.from(this.engineStates.values()).filter(s => s.status === 'running');
  }

  getFailedEngines(): EngineState[] {
    return Array.from(this.engineStates.values()).filter(s => s.status === 'error');
  }

  // ============================================
  // System Snapshot
  // ============================================

  getSystemSnapshot(): Record<string, unknown> {
    return {
      timestamp: new Date().toISOString(),
      engines: this.getAllEngineStates(),
      budget: this.getAllAllocations(),
      commands: this.commands.slice(0, 10),
      notifications: this.notifications.slice(0, 10),
      globalStopped: this.globalStopped,
      emergencyOverride: this.emergencyOverrideActive,
    };
  }

  // ============================================
  // Health & Config
  // ============================================

  getHealth(): OwnerHealth {
    const enginesRunning = this.getRunningEngines().length;
    const enginesTotal = this.engineStates.size;
    const totalHCUAllocated = Array.from(this.budgetAllocations.values()).reduce((sum, a) => sum + a.allocated, 0);
    const totalHCUSpent = Array.from(this.budgetAllocations.values()).reduce((sum, a) => sum + a.spent, 0);
    const pendingCommands = this.commands.filter(c => c.status === 'pending' || c.status === 'executing').length;
    const activeNotifications = this.notifications.filter(n => !n.read).length;

    let systemStatus: OwnerHealth['systemStatus'] = 'healthy';
    if (this.emergencyOverrideActive) systemStatus = 'emergency_stop';
    else if (this.globalStopped) systemStatus = 'critical';
    else if (enginesRunning < enginesTotal * 0.5) systemStatus = 'degraded';

    return {
      isRunning: this.isRunning,
      enginesRunning,
      enginesTotal,
      totalHCUAllocated,
      totalHCUSpent,
      globalHCUBudget: this.config.globalHCUBudgetPerHour,
      pendingCommands,
      activeNotifications,
      systemStatus,
    };
  }

  getConfig(): OwnerConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<OwnerConfig>): void {
    this.config = { ...this.config, ...config };

    // Update engine states with new config
    if (config.engines) {
      for (const [engineId, engineConfig] of Object.entries(config.engines)) {
        const state = this.engineStates.get(engineId as EngineId);
        if (state) {
          if (engineConfig.enabled !== undefined) state.enabled = engineConfig.enabled;
          if (engineConfig.hcuBudget !== undefined) {
            state.hcuBudget = engineConfig.hcuBudget;
            const allocation = this.budgetAllocations.get(engineId as EngineId);
            if (allocation) allocation.allocated = engineConfig.hcuBudget;
          }
        }
      }
    }
  }

  // ============================================
  // Emergency Controls
  // ============================================

  async globalStop(reason: string, requestedBy = 'owner'): Promise<SystemCommand> {
    const command = this.createCommand('global_stop', 'all', { reason }, requestedBy);
    return this.executeCommand(command);
  }

  async emergencyOverride(reason: string, requestedBy = 'owner'): Promise<SystemCommand> {
    if (!this.config.emergencyStopEnabled) {
      throw new Error('Emergency override is disabled in config');
    }
    const command = this.createCommand('emergency_override', 'all', { reason }, requestedBy);
    return this.executeCommand(command);
  }

  clearEmergencyOverride(): void {
    this.emergencyOverrideActive = false;
    this.globalStopped = false;
    // Auto-restart enabled engines
    for (const [id, state] of this.engineStates) {
      if (state.enabled && id !== 'safetyTrio' && id !== 'ownerConsole') {
        this.startEngineInternal(id);
      }
    }
  }

  isGlobalStopped(): boolean {
    return this.globalStopped;
  }

  isEmergencyOverrideActive(): boolean {
    return this.emergencyOverrideActive;
  }

  // ============================================
  // Event System
  // ============================================

  onEvent<K extends OwnerEvent['type']>(
    eventType: K,
    listener: (event: Extract<OwnerEvent, { type: K }>) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener as any);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener as any);
    };
  }

  private emitEvent(event: OwnerEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error(`OwnerConsole event listener error:`, e);
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
        type: `owner_console_${type}`,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }
}

export function createOwnerConsoleEngine(config?: Partial<OwnerConfig>): OwnerConsoleEngine {
  return new OwnerConsoleEngine(config);
}

export default OwnerConsoleEngine;