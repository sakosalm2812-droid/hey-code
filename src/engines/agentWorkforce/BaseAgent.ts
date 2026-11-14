// src/engines/agentWorkforce/BaseAgent.ts
// Base Agent — Implements IPC, Memory Vectors, CRDT sync, and lifecycle

import type {
  AgentConfig,
  AgentState,
  AgentStatus,
  AgentCapability,
  IPCPacket,
  MemoryVector,
  Task,
  CRDTOperation,
  AgentRole,
  BaseAgent,
  WorkforceEvent,
} from './types';
import { logToCosmos } from '../../core/cosmosMemory';
import { v4 as uuidv4 } from 'uuid';

const MEMORY_VECTOR_DIMENSION = 384;

export abstract class BaseAgentImpl implements BaseAgent {
  public id: string;
  public config: AgentConfig;
  public state: AgentState;

  private ipcHandlers: Map<string, (packet: IPCPacket) => Promise<void>> = new Map();
  private ipcQueue: IPCPacket[] = [];
  private crdtLog: CRDTOperation[] = [];
  private crdtVersion: number = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private ipcProcessorTimer: ReturnType<typeof setInterval> | null = null;
  private eventListeners: Map<string, Set<(event: WorkforceEvent) => void>> = new Map();
  private isProcessingIPC = false;

  constructor(config: Partial<AgentConfig> = {}) {
    this.id = config.id || `agent_${uuidv4().slice(0, 8)}`;
    this.config = {
      id: this.id,
      name: config.name || this.id,
      role: config.role || 'primary',
      capabilities: config.capabilities || [],
      parentId: config.parentId,
      childIds: config.childIds || [],
      systemPrompt: config.systemPrompt || '',
      modelId: config.modelId || 'default',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      hcuBudget: config.hcuBudget ?? 100,
      hcuSpent: config.hcuSpent ?? 0,
      timeoutMs: config.timeoutMs ?? 300000,
      retryPolicy: config.retryPolicy || {
        maxRetries: 3,
        backoffMs: 1000,
        retryOn: ['timeout', 'network_error', 'rate_limit'],
      },
    };

    this.state = {
      config: this.config,
      status: 'idle',
      memoryVectors: [],
      ipcQueue: [],
      metrics: {
        tasksCompleted: 0,
        tasksFailed: 0,
        totalHCUSpent: 0,
        avgResponseTimeMs: 0,
        memorySize: 0,
      },
      lastHeartbeat: new Date().toISOString(),
    };
  }

  // ============================================
  // Lifecycle
  // ============================================

  async start(): Promise<void> {
    if (this.state.status !== 'idle' && this.state.status !== 'terminated') {
      throw new Error(`Cannot start agent in status: ${this.state.status}`);
    }

    this.setStatus('starting');
    await this.onStart();
    this.setStatus('running');
    this.state.startedAt = new Date().toISOString();
    this.state.lastHeartbeat = new Date().toISOString();

    // Start heartbeat
    this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), 5000);

    // Start IPC processor
    this.ipcProcessorTimer = setInterval(() => this.processIPCQueue(), 100);

    this.emitEvent({ type: 'agent_spawned', agentId: this.id, role: this.config.role, parentId: this.config.parentId });
    await this.log('agent_started', { agentId: this.id, role: this.config.role });
  }

  async pause(): Promise<void> {
    if (this.state.status !== 'running') return;
    this.setStatus('paused');
    await this.onPause();
    await this.log('agent_paused', { agentId: this.id });
  }

  async resume(): Promise<void> {
    if (this.state.status !== 'paused') return;
    this.setStatus('running');
    await this.onResume();
    await this.log('agent_resumed', { agentId: this.id });
  }

  async terminate(reason: string): Promise<void> {
    if (this.state.status === 'terminated') return;

    this.stopTimers();
    this.setStatus('terminated');
    this.state.completedAt = new Date().toISOString();
    await this.onTerminate(reason);

    this.emitEvent({ type: 'agent_terminated', agentId: this.id, reason });
    await this.log('agent_terminated', { agentId: this.id, reason });
  }

  protected async onStart(): Promise<void> {
    // Default no-op implementation
  }

  protected async onPause(): Promise<void> {
    // Default no-op implementation
  }

  protected async onResume(): Promise<void> {
    // Default no-op implementation
  }

  protected async onTerminate(reason: string): Promise<void> {
    // Default no-op implementation
  }

  protected abstract executeTaskImpl(task: Task): Promise<{ success: boolean; result?: unknown; error?: string }>;

  private stopTimers(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.ipcProcessorTimer) {
      clearInterval(this.ipcProcessorTimer);
      this.ipcProcessorTimer = null;
    }
  }

  private sendHeartbeat(): void {
    this.state.lastHeartbeat = new Date().toISOString();
    this.sendIPC({
      id: uuidv4(),
      from: this.id,
      to: 'broadcast',
      type: 'heartbeat',
      payload: { status: this.state.status, hcuSpent: this.config.hcuSpent },
      priority: 'low',
      timestamp: new Date().toISOString(),
    }).catch(() => {}); // Ignore heartbeat failures
  }

  // ============================================
  // Task Execution
  // ============================================

  async executeTask(task: Task): Promise<{ success: boolean; result?: unknown; error?: string }> {
    if (this.state.status !== 'running') {
      return { success: false, error: `Agent not running (status: ${this.state.status})` };
    }

    // Check HCU budget
    if (this.config.hcuSpent + task.hcuCost > this.config.hcuBudget) {
      return { success: false, error: `Insufficient HCU budget: ${this.config.hcuSpent + task.hcuCost} > ${this.config.hcuBudget}` };
    }

    // Check capabilities
    const missingCaps = task.requiredCapabilities.filter(c => !this.config.capabilities.includes(c));
    if (missingCaps.length > 0) {
      return { success: false, error: `Missing capabilities: ${missingCaps.join(', ')}` };
    }

    this.state.status = 'running';
    this.state.currentTask = task.description;
    this.state.currentTaskId = task.id;
    const startTime = Date.now();

    this.emitEvent({ type: 'task_assigned', taskId: task.id, agentId: this.id });
    await this.log('task_started', { taskId: task.id, agentId: this.id, description: task.description });

    try {
      const result = await this.executeTaskImpl(task);
      const duration = Date.now() - startTime;

      if (result.success) {
        this.state.metrics.tasksCompleted++;
        this.config.hcuSpent += task.hcuCost;
        this.state.metrics.totalHCUSpent += task.hcuCost;
        this.updateAvgResponseTime(duration);
        this.state.status = 'running'; // Return to running (idle-ready) state
        this.emitEvent({ type: 'task_completed', taskId: task.id, agentId: this.id, result: result.result });
        await this.log('task_completed', { taskId: task.id, agentId: this.id, durationMs: duration, hcuCost: task.hcuCost });
      } else {
        this.state.metrics.tasksFailed++;
        this.state.status = 'failed';
        this.state.error = result.error;
        this.emitEvent({ type: 'task_failed', taskId: task.id, agentId: this.id, error: result.error || 'Unknown error' });
        await this.log('task_failed', { taskId: task.id, agentId: this.id, error: result.error });
      }

      this.state.currentTask = undefined;
      this.state.currentTaskId = undefined;
      return result;
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Unknown error';
      this.state.metrics.tasksFailed++;
      this.state.status = 'failed';
      this.state.error = error;
      this.emitEvent({ type: 'task_failed', taskId: task.id, agentId: this.id, error });
      await this.log('task_error', { taskId: task.id, agentId: this.id, error });
      this.state.currentTask = undefined;
      this.state.currentTaskId = undefined;
      return { success: false, error };
    }
  }

  protected async executeTaskImpl(task: Task): Promise<{ success: boolean; result?: unknown; error?: string }> {
    // Default implementation - simulate work completion
    await new Promise(r => setTimeout(r, 10));
    return { success: true, result: { completed: true, taskId: task.id } };
  }

  private updateAvgResponseTime(durationMs: number): void {
    const total = this.state.metrics.tasksCompleted + this.state.metrics.tasksFailed;
    this.state.metrics.avgResponseTimeMs =
      (this.state.metrics.avgResponseTimeMs * (total - 1) + durationMs) / total;
  }

  // ============================================
  // IPC (Inter-Process Communication)
  // ============================================

  async sendIPC(packet: IPCPacket): Promise<void> {
    // Add metadata
    const enrichedPacket: IPCPacket = {
      ...packet,
      id: packet.id || uuidv4(),
      from: this.id,
      timestamp: packet.timestamp || new Date().toISOString(),
      ttl: packet.ttl ?? 10,
    };

    // Local queue for processing
    this.ipcQueue.push(enrichedPacket);
    if (this.ipcQueue.length > 1000) {
      this.ipcQueue.shift(); // Prevent memory buildup
    }

    this.state.ipcQueue = [...this.ipcQueue];

    // Emit event
    this.emitEvent({ type: 'ipc_sent', packet: enrichedPacket });
  }

  onIPC(handler: (packet: IPCPacket) => void): void {
    const handlerId = uuidv4();
    this.ipcHandlers.set(handlerId, handler);
  }

  private async processIPCQueue(): Promise<void> {
    if (this.isProcessingIPC || this.ipcQueue.length === 0) return;

    this.isProcessingIPC = true;

    while (this.ipcQueue.length > 0) {
      const packet = this.ipcQueue.shift()!;

      // Decrement TTL
      if (packet.ttl !== undefined && packet.ttl <= 0) continue;

      // Handle packet
      for (const handler of this.ipcHandlers.values()) {
        try {
          await handler(packet);
        } catch (e) {
          console.error(`IPC handler error in agent ${this.id}:`, e);
        }
      }
    }

    this.state.ipcQueue = [...this.ipcQueue];
    this.isProcessingIPC = false;
  }

  // ============================================
  // Memory Vectors (384-dim embeddings)
  // ============================================

  addMemoryVector(vector: MemoryVector): void {
    if (vector.vector.length !== MEMORY_VECTOR_DIMENSION) {
      throw new Error(`Memory vector must be ${MEMORY_VECTOR_DIMENSION} dimensions, got ${vector.vector.length}`);
    }

    const enrichedVector: MemoryVector = {
      ...vector,
      id: vector.id || uuidv4(),
      agentId: this.id,
      timestamp: vector.timestamp || new Date().toISOString(),
      accessCount: 0,
      lastAccessed: new Date().toISOString(),
    };

    this.state.memoryVectors.push(enrichedVector);
    this.state.metrics.memorySize = this.state.memoryVectors.length;

    // Trim if too many vectors (keep most recent/accessed)
    if (this.state.memoryVectors.length > 10000) {
      this.state.memoryVectors.sort((a, b) => b.lastAccessed.localeCompare(a.lastAccessed));
      this.state.memoryVectors = this.state.memoryVectors.slice(0, 8000);
    }

    // Add to CRDT log for sync
    this.addCRDTOperation({
      type: 'insert',
      key: `memory:${enrichedVector.id}`,
      value: enrichedVector,
      agentId: this.id,
      timestamp: new Date().toISOString(),
      version: ++this.crdtVersion,
    });
  }

  searchMemory(queryVector: number[], topK: number = 10): MemoryVector[] {
    if (queryVector.length !== MEMORY_VECTOR_DIMENSION) {
      throw new Error(`Query vector must be ${MEMORY_VECTOR_DIMENSION} dimensions`);
    }

    const results = this.state.memoryVectors
      .map(vec => ({
        vector: vec,
        similarity: this.cosineSimilarity(queryVector, vec.vector),
      }))
      .filter(r => r.similarity > 0.01) // Minimum similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(r => {
        // Update access stats
        r.vector.accessCount++;
        r.vector.lastAccessed = new Date().toISOString();
        return r.vector;
      });

    return results;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // ============================================
  // CRDT Sync
  // ============================================

  private addCRDTOperation(op: CRDTOperation): void {
    this.crdtLog.push(op);
    if (this.crdtLog.length > 5000) {
      this.crdtLog = this.crdtLog.slice(-4000);
    }
  }

  getCRDTOperations(sinceVersion: number): CRDTOperation[] {
    return this.crdtLog.filter(op => op.version > sinceVersion);
  }

  applyCRDTOperation(op: CRDTOperation): boolean {
    // Check if already applied
    if (this.crdtLog.some(existing => existing.id === op.id)) {
      return false;
    }

    switch (op.type) {
      case 'insert':
        if (op.key.startsWith('memory:') && op.value) {
          const vector = op.value as MemoryVector;
          if (!this.state.memoryVectors.some(v => v.id === vector.id)) {
            this.state.memoryVectors.push(vector);
            this.state.metrics.memorySize = this.state.memoryVectors.length;
          }
        }
        break;
      case 'update':
        if (op.key.startsWith('memory:') && op.value) {
          const vector = op.value as MemoryVector;
          const idx = this.state.memoryVectors.findIndex(v => v.id === vector.id);
          if (idx >= 0) {
            this.state.memoryVectors[idx] = vector;
          }
        }
        break;
      case 'delete':
        if (op.key.startsWith('memory:')) {
          const id = op.key.replace('memory:', '');
          this.state.memoryVectors = this.state.memoryVectors.filter(v => v.id !== id);
          this.state.metrics.memorySize = this.state.memoryVectors.length;
        }
        break;
    }

    this.crdtVersion = Math.max(this.crdtVersion, op.version);
    this.addCRDTOperation(op);
    return true;
  }

  // ============================================
  // Health & Metrics
  // ============================================

  getHealth(): { status: AgentStatus; metrics: AgentState['metrics']; hcuRemaining: number } {
    return {
      status: this.state.status,
      metrics: { ...this.state.metrics },
      hcuRemaining: this.config.hcuBudget - this.config.hcuSpent,
    };
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
          console.error(`Event listener error:`, e);
        }
      }
    }
  }

  // ============================================
  // Helpers
  // ============================================

  private setStatus(status: AgentStatus): void {
    this.state.status = status;
    this.state.config = { ...this.config }; // Keep config in sync
  }

  private async log(type: string, data: Record<string, unknown>): Promise<void> {
    try {
      await logToCosmos({
        type: `agent_${type}`,
        agentId: this.id,
        agentRole: this.config.role,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }

  // Utility: Create a task for delegation
  createTask(
    type: string,
    description: string,
    payload: unknown,
    requiredCapabilities: AgentCapability[],
    options: {
      priority?: Task['priority'];
      parentTaskId?: string;
      hcuCost?: number;
    } = {}
  ): Task {
    return {
      id: `task_${uuidv4().slice(0, 8)}`,
      type,
      description,
      payload,
      requiredCapabilities,
      priority: options.priority || 'normal',
      status: 'pending',
      createdAt: new Date().toISOString(),
      hcuCost: options.hcuCost || 0.01,
      hcuSpent: 0,
      childTaskIds: [],
      dependencies: [],
      parentTaskId: options.parentTaskId,
    };
  }
}

// Factory function
export function createBaseAgent(config: Partial<AgentConfig>): BaseAgent {
  // This would be implemented by concrete agent classes
  // For now, return a minimal implementation
  return new BaseAgentImpl(config) as unknown as BaseAgent;
}

export default BaseAgentImpl;