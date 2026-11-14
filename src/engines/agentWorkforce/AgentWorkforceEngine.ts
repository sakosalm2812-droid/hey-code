// src/engines/agentWorkforce/AgentWorkforceEngine.ts
// Agent Workforce Engine — Hierarchical agent orchestration (Primary→Secondary→Tertiary→Quaternary)

import type {
  AgentConfig,
  AgentState,
  AgentRole,
  AgentCapability,
  AgentStatus,
  IPCPacket,
  Task,
  WorkforceConfig,
  WorkforceEvent,
  MemoryVector,
  CRDTOperation,
  BaseAgent,
  AgentFactory,
} from './types';
import { BaseAgentImpl, createBaseAgent } from './BaseAgent';
import * as hcu from '../../core/cost/costGovernor';
import { pinpoint } from '../../core/precision/pinpointPrecision';
import * as bossAgent from '../../core/engines/bossAgent';
import { logToCosmos } from '../../core/cosmosMemory';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CONFIG: WorkforceConfig = {
  maxAgents: 50,
  maxDepth: 4,
  defaultHCUBudget: 100,
  heartbeatIntervalMs: 5000,
  taskTimeoutMs: 300000,
  ipcBufferSize: 1000,
  memoryVectorDimension: 384,
  enableCRDTSync: true,
  costGovernor: {
    enabled: true,
    maxTotalHCU: 1000,
    alertThreshold: 0.8,
  },
};

export class AgentWorkforceEngine {
  private config: WorkforceConfig;
  private agents: Map<string, BaseAgentImpl> = new Map();
  private tasks: Map<string, Task> = new Map();
  private taskQueue: Task[] = [];
  private primaryAgentId: string | null = null;
  private eventListeners: Map<string, Set<(event: WorkforceEvent) => void>> = new Map();
  private totalHCUSpent = 0;
  private crdtSyncTimer: ReturnType<typeof setInterval> | null = null;
  private taskProcessorTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<WorkforceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================
  // Initialization
  // ============================================

  async initialize(): Promise<void> {
    hcu.track('agentWorkforce_init', 0.01);
    pinpoint.verify('agentWorkforce');
    bossAgent.grade({ operation: 'init', engine: 'agentWorkforce' }, { engine: 'agentWorkforce' });

    // Create primary agent
    const primary = await this.createAgent({
      name: 'Primary Orchestrator',
      role: 'primary',
      capabilities: ['coordination', 'planning', 'memory'],
      systemPrompt: 'You are the primary orchestrator. Decompose goals, delegate to subordinates, synthesize results.',
      modelId: 'primary-model',
      hcuBudget: this.config.defaultHCUBudget * 2,
    });

    this.primaryAgentId = primary.id;

    // Start background processes
    this.startTaskProcessor();
    if (this.config.enableCRDTSync) {
      this.startCRDTSync();
    }

    await this.log('workforce_initialized', { primaryAgentId: this.primaryAgentId });
  }

  async shutdown(): Promise<void> {
    this.stopTimers();

    // Terminate all agents
    for (const agent of this.agents.values()) {
      if (agent.state.status !== 'terminated') {
        await agent.terminate('workforce_shutdown');
      }
    }

    this.agents.clear();
    this.tasks.clear();
    this.taskQueue = [];
    this.primaryAgentId = null;

    await this.log('workforce_shutdown', {});
  }

  private stopTimers(): void {
    if (this.crdtSyncTimer) {
      clearInterval(this.crdtSyncTimer);
      this.crdtSyncTimer = null;
    }
    if (this.taskProcessorTimer) {
      clearInterval(this.taskProcessorTimer);
      this.taskProcessorTimer = null;
    }
  }

  // ============================================
  // Agent Factory
  // ============================================

  async createAgent(config: Partial<AgentConfig>): Promise<BaseAgentImpl> {
    if (this.agents.size >= this.config.maxAgents) {
      hcu.track('agentWorkforce_maxAgents', 0.001);
      pinpoint.verify('agentWorkforce');
      bossAgent.grade({ operation: 'createAgent', error: 'max_agents_reached', engine: 'agentWorkforce' }, { engine: 'agentWorkforce' });
      throw new Error(`Max agents reached: ${this.config.maxAgents}`);
    }

    hcu.track('agentWorkforce_createAgent_start', 0.01);
    pinpoint.verify('agentWorkforce');
    bossAgent.grade({ operation: 'createAgent', role: config.role, parentId: config.parentId, engine: 'agentWorkforce' }, { engine: 'agentWorkforce' });

    // Check hierarchy depth
    if (config.parentId) {
      const parent = this.agents.get(config.parentId);
      if (!parent) throw new Error(`Parent agent not found: ${config.parentId}`);

      const childDepth = this.getChildDepth(config.parentId);
      if (childDepth >= this.config.maxDepth) {
        hcu.track('agentWorkforce_maxDepth', 0.001);
        pinpoint.verify('agentWorkforce');
        bossAgent.grade({ operation: 'createAgent', error: 'max_depth_reached', engine: 'agentWorkforce' }, { engine: 'agentWorkforce' });
        throw new Error(`Max hierarchy depth reached: ${this.config.maxDepth}`);
      }

      // Assign role based on child depth
      const roles: AgentRole[] = ['primary', 'secondary', 'tertiary', 'quaternary'];
      config.role = roles[childDepth] || 'quaternary';
    } else if (!config.role) {
      config.role = 'primary';
    }

    // Set default HCU budget by role
    const roleBudgets: Record<AgentRole, number> = {
      primary: this.config.defaultHCUBudget * 2,
      secondary: this.config.defaultHCUBudget,
      tertiary: this.config.defaultHCUBudget * 0.7,
      quaternary: this.config.defaultHCUBudget * 0.5,
    };
    config.hcuBudget = config.hcuBudget ?? roleBudgets[config.role];

    // Create agent
    const agent = new BaseAgentImpl(config);
    this.agents.set(agent.id, agent);

    // Register parent-child relationship
    if (config.parentId) {
      const parent = this.agents.get(config.parentId);
      if (parent) {
        parent.config.childIds.push(agent.id);
      }
    }

    // Forward agent events
    agent.onEvent('agent_spawned', e => this.emitEvent(e));
    agent.onEvent('agent_terminated', e => this.emitEvent(e));
    agent.onEvent('task_assigned', e => this.emitEvent(e));
    agent.onEvent('task_completed', e => this.emitEvent(e));
    agent.onEvent('task_failed', e => this.emitEvent(e));
    agent.onEvent('ipc_sent', e => this.emitEvent(e));
    agent.onEvent('memory_synced', e => this.emitEvent(e));
    agent.onEvent('hcu_alert', e => this.emitEvent(e));

    // Start the agent so it can process IPC and tasks
    await agent.start();

    return agent;
  }

  private getAgentDepth(agentId: string): number {
    let depth = 0;
    let currentId: string | undefined = agentId;

    while (currentId) {
      const agent = this.agents.get(currentId);
      if (!agent) break;
      if (agent.config.parentId) {
        depth++;
        currentId = agent.config.parentId;
      } else {
        break;
      }
    }

    return depth;
  }

  private getChildDepth(parentId: string): number {
    // Returns the depth a child of this parent would have
    return this.getAgentDepth(parentId) + 1;
  }

  // Convenience methods for creating agents at specific levels
  async createSecondaryAgent(parentId: string, name: string, capability: AgentCapability): Promise<BaseAgentImpl> {
    return this.createAgent({
      parentId,
      name,
      capabilities: [capability],
      systemPrompt: `You are a ${capability} specialist. Execute tasks assigned by your parent.`,
    });
  }

  async createTertiaryAgent(parentId: string, name: string, capability: AgentCapability): Promise<BaseAgentImpl> {
    return this.createAgent({
      parentId,
      name,
      capabilities: [capability],
      systemPrompt: `You are a ${capability} worker. Execute specific sub-tasks efficiently.`,
    });
  }

  async createQuaternaryAgent(parentId: string, name: string, capability: AgentCapability): Promise<BaseAgentImpl> {
    return this.createAgent({
      parentId,
      name,
      capabilities: [capability],
      systemPrompt: `You are a ${capability} executor. Perform atomic operations.`,
    });
  }

  // ============================================
  // Task Management
  // ============================================

  submitTask(task: Omit<Task, 'id' | 'status' | 'createdAt' | 'hcuSpent' | 'childTaskIds' | 'dependencies'>): string {
    const fullTask: Task = {
      ...task,
      id: `task_${uuidv4().slice(0, 8)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      hcuSpent: 0,
      childTaskIds: [],
      dependencies: task.dependencies || [],
    };

    this.tasks.set(fullTask.id, fullTask);
    this.taskQueue.push(fullTask);
    this.taskQueue.sort((a, b) => this.priorityValue(b.priority) - this.priorityValue(a.priority));

    return fullTask.id;
  }

  private priorityValue(priority: Task['priority']): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
    }
  }

  private startTaskProcessor(): void {
    this.taskProcessorTimer = setInterval(() => this.processTaskQueue(), 100);
  }

  private async processTaskQueue(): Promise<void> {
    if (this.taskQueue.length === 0) return;

    // Find next executable task (dependencies met, agent available)
    const taskIndex = this.taskQueue.findIndex(task => {
      if (task.status !== 'pending') return false;

      // Check dependencies
      const depsMet = task.dependencies.every(depId => {
        const dep = this.tasks.get(depId);
        return dep && dep.status === 'completed';
      });
      if (!depsMet) return false;

      // Find available agent with required capabilities
      const agent = this.findAvailableAgent(task.requiredCapabilities);
      return !!agent;
    });

    if (taskIndex === -1) return;

    const task = this.taskQueue.splice(taskIndex, 1)[0];
    const agent = this.findAvailableAgent(task.requiredCapabilities);
    if (!agent) {
      // Put back
      this.taskQueue.unshift(task);
      return;
    }

    task.status = 'assigned';
    task.assignedAgentId = agent.id;
    task.startedAt = new Date().toISOString();

    // Execute asynchronously
    this.executeTaskAsync(agent, task);
  }

  private findAvailableAgent(requiredCapabilities: AgentCapability[]): BaseAgentImpl | null {
    // Prefer agents with exact capability match, then by role priority (primary > secondary > ...)
    const candidates = Array.from(this.agents.values())
      .filter(a => a.state.status === 'running' || a.state.status === 'idle')
      .filter(a => requiredCapabilities.every(c => a.config.capabilities.includes(c)))
      .filter(a => a.config.hcuSpent + 0.01 <= a.config.hcuBudget); // Minimum HCU buffer

    if (candidates.length === 0) return null;

    // Sort by role priority (primary first for coordination, quaternary first for execution)
    const rolePriority: Record<AgentRole, number> = {
      primary: 1,
      secondary: 2,
      tertiary: 3,
      quaternary: 4,
    };

    candidates.sort((a, b) => rolePriority[a.config.role] - rolePriority[b.config.role]);

    return candidates[0];
  }

  private async executeTaskAsync(agent: BaseAgentImpl, task: Task): Promise<void> {
    const result = await agent.executeTask(task);

    task.status = result.success ? 'completed' : 'failed';
    task.completedAt = new Date().toISOString();
    task.result = result.result;
    task.error = result.error;
    task.hcuSpent = task.hcuCost;

    if (result.success) {
      this.totalHCUSpent += task.hcuCost;
    }

    // Check cost governor
    if (this.config.costGovernor.enabled && this.totalHCUSpent >= this.config.costGovernor.maxTotalHCU * this.config.costGovernor.alertThreshold) {
      this.emitEvent({
        type: 'hcu_alert',
        agentId: agent.id,
        spent: this.totalHCUSpent,
        budget: this.config.costGovernor.maxTotalHCU,
      });
    }

    // If task created subtasks, process them
    if (result.result && typeof result.result === 'object' && 'subtasks' in result.result) {
      const subtasks = (result.result as { subtasks: Omit<Task, 'id' | 'status' | 'createdAt' | 'hcuSpent' | 'childTaskIds' | 'dependencies'>[] }).subtasks;
      for (const subtask of subtasks) {
        const subtaskId = this.submitTask({
          ...subtask,
          parentTaskId: task.id,
          dependencies: [task.id],
        });
        task.childTaskIds.push(subtaskId);
      }
    }
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getTasksByStatus(status: Task['status']): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }

  // ============================================
  // IPC Broadcasting
  // ============================================

  broadcastIPC(packet: Omit<IPCPacket, 'from' | 'id' | 'timestamp'>): void {
    const fullPacket: IPCPacket = {
      ...packet,
      id: uuidv4(),
      from: 'workforce',
      timestamp: new Date().toISOString(),
    };

    for (const agent of this.agents.values()) {
      agent.sendIPC(fullPacket).catch(() => {});
    }
  }

  sendIPCToAgent(agentId: string, packet: Omit<IPCPacket, 'from' | 'id' | 'timestamp' | 'to'>): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.sendIPC({
        ...packet,
        id: uuidv4(),
        from: 'workforce',
        to: agentId,
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }
  }

  // ============================================
  // Memory & CRDT Sync
  // ============================================

  private startCRDTSync(): void {
    this.crdtSyncTimer = setInterval(() => this.syncCRDT(), 10000); // Every 10 seconds
  }

  private syncCRDT(): void {
    // Get all CRDT operations from all agents
    const allOps: CRDTOperation[] = [];
    for (const agent of this.agents.values()) {
      allOps.push(...agent.getCRDTOperations(0)); // Get all for simplicity
    }

    // Apply to all other agents (simplified - in production would use vector clocks)
    for (const agent of this.agents.values()) {
      for (const op of allOps) {
        if (op.agentId !== agent.id) {
          agent.applyCRDTOperation(op);
        }
      }
    }

    this.emitEvent({ type: 'memory_synced', agentId: 'workforce', vectorCount: allOps.length });
  }

  // Cross-agent memory search
  searchGlobalMemory(queryVector: number[], topK: number = 10): Map<string, MemoryVector[]> {
    const results = new Map<string, MemoryVector[]>();

    for (const agent of this.agents.values()) {
      const agentResults = agent.searchMemory(queryVector, topK);
      if (agentResults.length > 0) {
        results.set(agent.id, agentResults);
      }
    }

    return results;
  }

  // ============================================
  // Agent Management
  // ============================================

  getAgent(agentId: string): BaseAgentImpl | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): BaseAgentImpl[] {
    return Array.from(this.agents.values());
  }

  getAgentsByRole(role: AgentRole): BaseAgentImpl[] {
    return Array.from(this.agents.values()).filter(a => a.config.role === role);
  }

  getPrimaryAgent(): BaseAgentImpl | undefined {
    return this.primaryAgentId ? this.agents.get(this.primaryAgentId) : undefined;
  }

  async terminateAgent(agentId: string, reason: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    // Terminate children first
    for (const childId of agent.config.childIds) {
      await this.terminateAgent(childId, `parent_terminated: ${reason}`);
    }

    await agent.terminate(reason);
    this.agents.delete(agentId);

    // Remove from parent's childIds
    if (agent.config.parentId) {
      const parent = this.agents.get(agent.config.parentId);
      if (parent) {
        parent.config.childIds = parent.config.childIds.filter(id => id !== agentId);
      }
    }

    return true;
  }

  // ============================================
  // Event System
  // ============================================

  onEvent(eventType: WorkforceEvent['type'], listener: (event: WorkforceEvent) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener);
    };
  }

  private emitEvent(event: WorkforceEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error(`Workforce event listener error:`, e);
        }
      }
    }
  }

  // ============================================
  // Health & Metrics
  // ============================================

  getHealth(): {
    totalAgents: number;
    agentsByRole: Record<AgentRole, number>;
    agentsByStatus: Record<AgentStatus, number>;
    totalHCUSpent: number;
    totalHCUBudget: number;
    taskQueueLength: number;
    tasksCompleted: number;
    tasksFailed: number;
  } {
    const agentsByRole: Record<AgentRole, number> = {
      primary: 0,
      secondary: 0,
      tertiary: 0,
      quaternary: 0,
    };

    const agentsByStatus: Record<AgentStatus, number> = {
      idle: 0,
      starting: 0,
      running: 0,
      paused: 0,
      completed: 0,
      failed: 0,
      terminated: 0,
    };

    let totalHCUBudget = 0;
    let tasksCompleted = 0;
    let tasksFailed = 0;

    for (const agent of this.agents.values()) {
      agentsByRole[agent.config.role]++;
      agentsByStatus[agent.state.status]++;
      totalHCUBudget += agent.config.hcuBudget;
      tasksCompleted += agent.state.metrics.tasksCompleted;
      tasksFailed += agent.state.metrics.tasksFailed;
    }

    return {
      totalAgents: this.agents.size,
      agentsByRole,
      agentsByStatus,
      totalHCUSpent: this.totalHCUSpent,
      totalHCUBudget,
      taskQueueLength: this.taskQueue.length,
      tasksCompleted,
      tasksFailed,
    };
  }

  getConfig(): WorkforceConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<WorkforceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // Logging
  // ============================================

  private async log(type: string, data: Record<string, unknown>): Promise<void> {
    try {
      await logToCosmos({
        type: `workforce_${type}`,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }
}

export function createAgentWorkforceEngine(config?: Partial<WorkforceConfig>): AgentWorkforceEngine {
  return new AgentWorkforceEngine(config);
}

export default AgentWorkforceEngine;