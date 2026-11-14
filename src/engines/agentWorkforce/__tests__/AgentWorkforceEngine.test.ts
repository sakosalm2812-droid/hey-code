// src/engines/agentWorkforce/__tests__/AgentWorkforceEngine.test.ts
// Tests for Agent Workforce Engine

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AgentWorkforceEngine,
  createAgentWorkforceEngine,
} from '../AgentWorkforceEngine';
import { BaseAgentImpl } from '../BaseAgent';
import type {
  AgentConfig,
  AgentRole,
  AgentCapability,
  Task,
  WorkforceConfig,
  WorkforceEvent,
  IPCPacket,
} from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

// Mock logToCosmos
vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

// Concrete test agent implementation
class TestAgent extends BaseAgentImpl {
  private taskResults: Map<string, { success: boolean; result?: unknown; error?: string }> = new Map();

  constructor(config: Partial<AgentConfig> = {}) {
    super(config);
  }

  // Implement abstract methods
  protected async onStart(): Promise<void> {
    // No-op for test
  }

  protected async onPause(): Promise<void> {
    // No-op
  }

  protected async onResume(): Promise<void> {
    // No-op
  }

  protected async onTerminate(reason: string): Promise<void> {
    // No-op
  }

  protected async executeTaskImpl(task: Task): Promise<{ success: boolean; result?: unknown; error?: string }> {
    // Simulate work
    await new Promise(r => setTimeout(r, 10));

    const predefined = this.taskResults.get(task.id);
    if (predefined) {
      return predefined;
    }

    // Default success
    return { success: true, result: { completed: true, taskId: task.id } };
  }

  setTaskResult(taskId: string, result: { success: boolean; result?: unknown; error?: string }): void {
    this.taskResults.set(taskId, result);
  }
}

describe('BaseAgentImpl', () => {
  let agent: TestAgent;

  beforeEach(() => {
    agent = new TestAgent({
      name: 'Test Agent',
      role: 'secondary',
      capabilities: ['research', 'analysis'],
      hcuBudget: 100,
    });
  });

  afterEach(async () => {
    if (agent.state.status !== 'terminated') {
      await agent.terminate('test_cleanup');
    }
  });

  describe('Lifecycle', () => {
    it('starts successfully', async () => {
      await agent.start();
      expect(agent.state.status).toBe('running');
      expect(agent.state.startedAt).toBeDefined();
    });

    it('pauses and resumes', async () => {
      await agent.start();
      await agent.pause();
      expect(agent.state.status).toBe('paused');
      await agent.resume();
      expect(agent.state.status).toBe('running');
    });

    it('terminates', async () => {
      await agent.start();
      await agent.terminate('test_done');
      expect(agent.state.status).toBe('terminated');
      expect(agent.state.completedAt).toBeDefined();
    });

    it('prevents double start', async () => {
      await agent.start();
      await expect(agent.start()).rejects.toThrow();
    });
  });

  describe('Task Execution', () => {
    beforeEach(async () => {
      await agent.start();
    });

    it('executes task successfully', async () => {
      const task: Task = {
        id: 'task_1',
        type: 'research',
        description: 'Research topic',
        payload: { topic: 'AI' },
        requiredCapabilities: ['research'],
        priority: 'normal',
        status: 'pending',
        createdAt: new Date().toISOString(),
        hcuCost: 0.01,
        hcuSpent: 0,
        childTaskIds: [],
        dependencies: [],
      };

      const result = await agent.executeTask(task);
      expect(result.success).toBe(true);
      expect(agent.state.metrics.tasksCompleted).toBe(1);
      expect(agent.config.hcuSpent).toBe(0.01);
    });

    it('fails task when HCU budget exceeded', async () => {
      const task: Task = {
        id: 'task_2',
        type: 'research',
        description: 'Expensive task',
        payload: {},
        requiredCapabilities: ['research'],
        priority: 'normal',
        status: 'pending',
        createdAt: new Date().toISOString(),
        hcuCost: 200, // Exceeds budget of 100
        hcuSpent: 0,
        childTaskIds: [],
        dependencies: [],
      };

      const result = await agent.executeTask(task);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient HCU budget');
    });

    it('fails task when capability missing', async () => {
      const task: Task = {
        id: 'task_3',
        type: 'execution',
        description: 'Execute something',
        payload: {},
        requiredCapabilities: ['execution'], // Agent only has research, analysis
        priority: 'normal',
        status: 'pending',
        createdAt: new Date().toISOString(),
        hcuCost: 0.01,
        hcuSpent: 0,
        childTaskIds: [],
        dependencies: [],
      };

      const result = await agent.executeTask(task);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing capabilities');
    });

    it('returns predefined result for task', async () => {
      const task: Task = {
        id: 'task_4',
        type: 'analysis',
        description: 'Analyze data',
        payload: {},
        requiredCapabilities: ['analysis'],
        priority: 'normal',
        status: 'pending',
        createdAt: new Date().toISOString(),
        hcuCost: 0.01,
        hcuSpent: 0,
        childTaskIds: [],
        dependencies: [],
      };

      agent.setTaskResult('task_4', { success: false, error: 'Simulated failure' });
      const result = await agent.executeTask(task);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Simulated failure');
      expect(agent.state.metrics.tasksFailed).toBe(1);
    });

    it('tracks average response time', async () => {
      const task1: Task = {
        id: 'task_5a',
        type: 'research',
        description: 'Task 1',
        payload: {},
        requiredCapabilities: ['research'],
        priority: 'normal',
        status: 'pending',
        createdAt: new Date().toISOString(),
        hcuCost: 0.01,
        hcuSpent: 0,
        childTaskIds: [],
        dependencies: [],
      };

      const task2: Task = {
        id: 'task_5b',
        type: 'research',
        description: 'Task 2',
        payload: {},
        requiredCapabilities: ['research'],
        priority: 'normal',
        status: 'pending',
        createdAt: new Date().toISOString(),
        hcuCost: 0.01,
        hcuSpent: 0,
        childTaskIds: [],
        dependencies: [],
      };

      await agent.executeTask(task1);
      await agent.executeTask(task2);
      expect(agent.state.metrics.avgResponseTimeMs).toBeGreaterThan(0);
    });
  });

  describe('IPC', () => {
    beforeEach(async () => {
      await agent.start();
    });

    it('sends and receives IPC packets', async () => {
      let receivedPacket: IPCPacket | null = null;
      agent.onIPC(async (packet) => {
        receivedPacket = packet;
      });

      await agent.sendIPC({
        id: 'ipc_1',
        from: agent.id,
        to: 'other_agent',
        type: 'task',
        payload: { action: 'test' },
        priority: 'normal',
        timestamp: new Date().toISOString(),
      });

      // Wait for processing
      await new Promise(r => setTimeout(r, 200));

      expect(receivedPacket).not.toBeNull();
      expect(receivedPacket!.type).toBe('task');
      expect(receivedPacket!.payload).toEqual({ action: 'test' });
    });

    it('respects TTL', async () => {
      let receivedCount = 0;
      agent.onIPC(async () => {
        receivedCount++;
      });

      // Send packet with TTL=0 (should be dropped)
      await agent.sendIPC({
        id: 'ipc_2',
        from: agent.id,
        to: 'other',
        type: 'task',
        payload: {},
        priority: 'normal',
        timestamp: new Date().toISOString(),
        ttl: 0,
      });

      await new Promise(r => setTimeout(r, 200));
      expect(receivedCount).toBe(0);
    });
  });

  describe('Memory Vectors', () => {
    beforeEach(async () => {
      await agent.start();
    });

    it('adds memory vectors', () => {
      const vector: number[] = new Array(384).fill(0).map((_, i) => Math.sin(i * 0.1));
      agent.addMemoryVector({
        id: 'mem_1',
        agentId: agent.id,
        vector,
        content: 'Test memory',
        metadata: { source: 'test' },
        timestamp: new Date().toISOString(),
        accessCount: 0,
        lastAccessed: new Date().toISOString(),
      });

      expect(agent.state.memoryVectors.length).toBe(1);
      expect(agent.state.metrics.memorySize).toBe(1);
    });

    it('rejects wrong dimension vectors', () => {
      const vector: number[] = new Array(100).fill(0); // Wrong dimension
      expect(() => {
        agent.addMemoryVector({
          id: 'mem_2',
          agentId: agent.id,
          vector,
          content: 'Test',
          metadata: {},
          timestamp: new Date().toISOString(),
          accessCount: 0,
          lastAccessed: new Date().toISOString(),
        });
      }).toThrow('384 dimensions');
    });

    it('searches memory by similarity', () => {
      // Add vectors
      const v1 = new Array(384).fill(0).map((_, i) => i === 0 ? 1 : 0);
      const v2 = new Array(384).fill(0).map((_, i) => i === 1 ? 1 : 0);
      const v3 = new Array(384).fill(0).map((_, i) => i === 2 ? 1 : 0);

      agent.addMemoryVector({
        id: 'mem_a', agentId: agent.id, vector: v1, content: 'A', metadata: {},
        timestamp: new Date().toISOString(), accessCount: 0, lastAccessed: new Date().toISOString(),
      });
      agent.addMemoryVector({
        id: 'mem_b', agentId: agent.id, vector: v2, content: 'B', metadata: {},
        timestamp: new Date().toISOString(), accessCount: 0, lastAccessed: new Date().toISOString(),
      });
      agent.addMemoryVector({
        id: 'mem_c', agentId: agent.id, vector: v3, content: 'C', metadata: {},
        timestamp: new Date().toISOString(), accessCount: 0, lastAccessed: new Date().toISOString(),
      });

      // Search with query similar to v1
      const query = new Array(384).fill(0).map((_, i) => i === 0 ? 0.9 : 0.1);
      const results = agent.searchMemory(query, 2);

      expect(results.length).toBe(2);
      expect(results[0].id).toBe('mem_a'); // Most similar
      expect(results[0].accessCount).toBe(1); // Access count incremented
    });
  });

  describe('CRDT Sync', () => {
    beforeEach(async () => {
      await agent.start();
    });

    it('tracks CRDT operations', () => {
      const vector: number[] = new Array(384).fill(0.1);
      agent.addMemoryVector({
        id: 'mem_crdt', agentId: agent.id, vector, content: 'CRDT test', metadata: {},
        timestamp: new Date().toISOString(), accessCount: 0, lastAccessed: new Date().toISOString(),
      });

      const ops = agent.getCRDTOperations(0);
      expect(ops.length).toBeGreaterThan(0);
      expect(ops[0].type).toBe('insert');
      expect(ops[0].key).toBe('memory:mem_crdt');
    });

    it('applies remote CRDT operations', () => {
      const vector: number[] = new Array(384).fill(0.2);
      const op = {
        id: 'op_1',
        type: 'insert' as const,
        key: 'memory:remote_mem',
        value: {
          id: 'remote_mem',
          agentId: 'other_agent',
          vector,
          content: 'Remote memory',
          metadata: {},
          timestamp: new Date().toISOString(),
          accessCount: 0,
          lastAccessed: new Date().toISOString(),
        },
        agentId: 'other_agent',
        timestamp: new Date().toISOString(),
        version: 1,
      };

      const applied = agent.applyCRDTOperation(op);
      expect(applied).toBe(true);
      expect(agent.state.memoryVectors.some(v => v.id === 'remote_mem')).toBe(true);

      // Applying again should return false (already applied)
      const appliedAgain = agent.applyCRDTOperation(op);
      expect(appliedAgain).toBe(false);
    });
  });

  describe('Health', () => {
    beforeEach(async () => {
      await agent.start();
    });

    it('reports health correctly', async () => {
      const health = agent.getHealth();
      expect(health.status).toBe('running');
      expect(health.hcuRemaining).toBe(100);
      expect(health.metrics.tasksCompleted).toBe(0);
    });

    it('updates health after task completion', async () => {
      const task: Task = {
        id: 'health_task', type: 'research', description: 'Health test',
        payload: {}, requiredCapabilities: ['research'], priority: 'normal',
        status: 'pending', createdAt: new Date().toISOString(),
        hcuCost: 0.05, hcuSpent: 0, childTaskIds: [], dependencies: [],
      };

      await agent.executeTask(task);

      const health = agent.getHealth();
      expect(health.hcuRemaining).toBe(99.95);
      expect(health.metrics.tasksCompleted).toBe(1);
    });
  });
});

describe('AgentWorkforceEngine', () => {
  let workforce: AgentWorkforceEngine;

  const workforceConfig: Partial<WorkforceConfig> = {
    maxAgents: 10,
    maxDepth: 4,
    defaultHCUBudget: 100,
    costGovernor: { enabled: true, maxTotalHCU: 500, alertThreshold: 0.8 },
  };

  beforeEach(async () => {
    workforce = createAgentWorkforceEngine(workforceConfig);
    await workforce.initialize();
  });

  afterEach(async () => {
    await workforce.shutdown();
  });

  describe('Initialization', () => {
    it('creates primary agent on initialize', async () => {
      const primary = workforce.getPrimaryAgent();
      expect(primary).toBeDefined();
      expect(primary!.config.role).toBe('primary');
      expect(primary!.state.status).toBe('running');
    });

    it('tracks total HCU budget', () => {
      const health = workforce.getHealth();
      expect(health.totalAgents).toBe(1); // Primary agent
      expect(health.totalHCUBudget).toBeGreaterThan(0);
    });
  });

  describe('Agent Creation', () => {
    it('creates secondary agent under primary', async () => {
      const primary = workforce.getPrimaryAgent()!;
      const secondary = await workforce.createSecondaryAgent(primary.id, 'Researcher', 'research');

      expect(secondary.config.role).toBe('secondary');
      expect(secondary.config.parentId).toBe(primary.id);
      expect(secondary.config.capabilities).toContain('research');
      expect(primary.config.childIds).toContain(secondary.id);
    });

    it('creates tertiary agent under secondary', async () => {
      const primary = workforce.getPrimaryAgent()!;
      const secondary = await workforce.createSecondaryAgent(primary.id, 'Researcher', 'research');
      const tertiary = await workforce.createTertiaryAgent(secondary.id, 'WebSearcher', 'research');

      expect(tertiary.config.role).toBe('tertiary');
      expect(tertiary.config.parentId).toBe(secondary.id);
    });

    it('creates quaternary agent under tertiary', async () => {
      const primary = workforce.getPrimaryAgent()!;
      const secondary = await workforce.createSecondaryAgent(primary.id, 'Researcher', 'research');
      const tertiary = await workforce.createTertiaryAgent(secondary.id, 'WebSearcher', 'research');
      const quaternary = await workforce.createQuaternaryAgent(tertiary.id, 'PageFetcher', 'research');

      expect(quaternary.config.role).toBe('quaternary');
      expect(quaternary.config.parentId).toBe(tertiary.id);
    });

    it('enforces max depth', async () => {
      const primary = workforce.getPrimaryAgent()!;
      const secondary = await workforce.createSecondaryAgent(primary.id, 'L1', 'research');
      const tertiary = await workforce.createTertiaryAgent(secondary.id, 'L2', 'analysis');
      const quaternary = await workforce.createQuaternaryAgent(tertiary.id, 'L3', 'execution');

      // Try to create 5th level - should fail
      await expect(workforce.createAgent({
        parentId: quaternary.id,
        name: 'L4',
        capabilities: ['research'],
      })).rejects.toThrow('Max hierarchy depth reached');
    });

    it('enforces max agents', async () => {
      const smallWorkforce = createAgentWorkforceEngine({ maxAgents: 2, defaultHCUBudget: 10 });
      await smallWorkforce.initialize();

      // Primary + 1 secondary = 2 agents
      await smallWorkforce.createSecondaryAgent(smallWorkforce.getPrimaryAgent()!.id, 'S1', 'research');

      // Third should fail
      await expect(smallWorkforce.createAgent({
        name: 'S2', role: 'secondary', capabilities: ['research'],
      })).rejects.toThrow('Max agents reached');

      await smallWorkforce.shutdown();
    });
  });

  describe('Task Management', () => {
    it('submits and processes tasks', async () => {
      const primary = workforce.getPrimaryAgent()!;
      await workforce.createSecondaryAgent(primary.id, 'Worker', 'research');

      const taskId = workforce.submitTask({
        type: 'research',
        description: 'Research task',
        payload: { query: 'test' },
        requiredCapabilities: ['research'],
        priority: 'normal',
        hcuCost: 0.01,
      });

      expect(taskId).toMatch(/^task_/);

      // Wait for processing
      await new Promise(r => setTimeout(r, 1000));

      const task = workforce.getTask(taskId);
      expect(task).toBeDefined();
      expect(task!.status).toBe('completed');
    });

    it('respects task dependencies', async () => {
      const primary = workforce.getPrimaryAgent()!;
      await workforce.createSecondaryAgent(primary.id, 'Worker', 'research');

      const task1Id = workforce.submitTask({
        type: 'research', description: 'Task 1', payload: {},
        requiredCapabilities: ['research'], priority: 'normal', hcuCost: 0.01,
      });

      const task2Id = workforce.submitTask({
        type: 'research', description: 'Task 2 (depends on 1)', payload: {},
        requiredCapabilities: ['research'], priority: 'normal', hcuCost: 0.01,
        dependencies: [task1Id],
      });

      // Wait for both
      await new Promise(r => setTimeout(r, 2000));

      const task1 = workforce.getTask(task1Id);
      const task2 = workforce.getTask(task2Id);

      expect(task1!.status).toBe('completed');
      expect(task2!.status).toBe('completed');
    });

    it('assigns tasks to capable agents', async () => {
      const primary = workforce.getPrimaryAgent()!;
      await workforce.createSecondaryAgent(primary.id, 'Researcher', 'research');
      await workforce.createSecondaryAgent(primary.id, 'Analyst', 'analysis');

      const researchTaskId = workforce.submitTask({
        type: 'research', description: 'Research', payload: {},
        requiredCapabilities: ['research'], priority: 'normal', hcuCost: 0.01,
      });

      const analysisTaskId = workforce.submitTask({
        type: 'analysis', description: 'Analysis', payload: {},
        requiredCapabilities: ['analysis'], priority: 'normal', hcuCost: 0.01,
      });

      await new Promise(r => setTimeout(r, 1000));

      const researchTask = workforce.getTask(researchTaskId);
      const analysisTask = workforce.getTask(analysisTaskId);

      // Each should be assigned to the correct specialist
      expect(researchTask!.assignedAgentId).toBeDefined();
      expect(analysisTask!.assignedAgentId).toBeDefined();
      expect(researchTask!.assignedAgentId).not.toBe(analysisTask!.assignedAgentId);
    });
  });

  describe('IPC Broadcasting', () => {
    it('broadcasts to all agents', async () => {
      const primary = workforce.getPrimaryAgent()!;
      await workforce.createSecondaryAgent(primary.id, 'Agent1', 'research');
      await workforce.createSecondaryAgent(primary.id, 'Agent2', 'analysis');

      let receivedCount = 0;
      for (const agent of workforce.getAllAgents()) {
        agent.onIPC(async () => { receivedCount++; });
      }

      workforce.broadcastIPC({
        to: 'broadcast',
        type: 'notification',
        payload: { message: 'hello all' },
        priority: 'normal',
      });

      await new Promise(r => setTimeout(r, 500));
      // Primary + 2 secondaries = 3 agents
      expect(receivedCount).toBe(3);
    });

    it('sends direct IPC to specific agent', async () => {
      const primary = workforce.getPrimaryAgent()!;
      const secondary = await workforce.createSecondaryAgent(primary.id, 'Target', 'research');

      let received = false;
      secondary.onIPC(async () => { received = true; });

      workforce.sendIPCToAgent(secondary.id, {
        to: secondary.id,
        type: 'task',
        payload: { secret: 'for you' },
        priority: 'high',
      });

      await new Promise(r => setTimeout(r, 200));
      expect(received).toBe(true);
    });
  });

  describe('Memory & CRDT Sync', () => {
    it('performs global memory search', async () => {
      const primary = workforce.getPrimaryAgent()!;
      const secondary = await workforce.createSecondaryAgent(primary.id, 'MemAgent', 'memory');

      // Add memory to secondary
      const vector = new Array(384).fill(0).map((_, i) => i === 5 ? 1 : 0);
      secondary.addMemoryVector({
        id: 'global_mem', agentId: secondary.id, vector, content: 'Global', metadata: {},
        timestamp: new Date().toISOString(), accessCount: 0, lastAccessed: new Date().toISOString(),
      });

      // Search globally
      const query = new Array(384).fill(0).map((_, i) => i === 5 ? 0.9 : 0.1);
      const results = workforce.searchGlobalMemory(query, 5);

      expect(results.has(secondary.id)).toBe(true);
      expect(results.get(secondary.id)!.length).toBeGreaterThan(0);
    });
  });

  describe('Agent Termination', () => {
    it('terminates agent and children', async () => {
      const primary = workforce.getPrimaryAgent()!;
      const secondary = await workforce.createSecondaryAgent(primary.id, 'Parent', 'coordination');
      const tertiary = await workforce.createTertiaryAgent(secondary.id, 'Child', 'execution');

      expect(workforce.getAllAgents().length).toBe(3);

      await workforce.terminateAgent(secondary.id, 'test_terminate');

      // Both secondary and tertiary should be gone
      expect(workforce.getAllAgents().length).toBe(1); // Only primary remains
      expect(workforce.getAgent(secondary.id)).toBeUndefined();
      expect(workforce.getAgent(tertiary.id)).toBeUndefined();
    });
  });

  describe('Health & Metrics', () => {
    it('reports workforce health', async () => {
      const primary = workforce.getPrimaryAgent()!;
      await workforce.createSecondaryAgent(primary.id, 'S1', 'research');
      await workforce.createSecondaryAgent(primary.id, 'S2', 'analysis');

      const health = workforce.getHealth();
      expect(health.totalAgents).toBe(3);
      expect(health.agentsByRole.primary).toBe(1);
      expect(health.agentsByRole.secondary).toBe(2);
      expect(health.agentsByStatus.running).toBe(3);
    });

    it('tracks task completion metrics', async () => {
      const primary = workforce.getPrimaryAgent()!;
      await workforce.createSecondaryAgent(primary.id, 'Worker', 'research');

      workforce.submitTask({
        type: 'research', description: 'Task', payload: {},
        requiredCapabilities: ['research'], priority: 'normal', hcuCost: 0.01,
      });

      await new Promise(r => setTimeout(r, 1000));

      const health = workforce.getHealth();
      expect(health.tasksCompleted).toBeGreaterThan(0);
    });
  });

  describe('Cost Governor', () => {
    it('emits HCU alert at threshold', async () => {
      const alertWorkforce = createAgentWorkforceEngine({
        maxAgents: 5,
        defaultHCUBudget: 100,
        costGovernor: { enabled: true, maxTotalHCU: 10, alertThreshold: 0.5 }, // Alert at 5 HCU
      });
      await alertWorkforce.initialize();

      let alertReceived = false;
      alertWorkforce.onEvent('hcu_alert', () => { alertReceived = true; });

      const primary = alertWorkforce.getPrimaryAgent()!;
      await alertWorkforce.createSecondaryAgent(primary.id, 'Worker', 'research');

      // Submit multiple tasks to exceed threshold
      for (let i = 0; i < 10; i++) {
        alertWorkforce.submitTask({
          type: 'research', description: `Task ${i}`, payload: {},
          requiredCapabilities: ['research'], priority: 'normal', hcuCost: 0.6,
        });
      }

      await new Promise(r => setTimeout(r, 3000));
      expect(alertReceived).toBe(true);

      await alertWorkforce.shutdown();
    });
  });

  describe('Configuration', () => {
    it('allows config updates', () => {
      workforce.updateConfig({ maxAgents: 100, defaultHCUBudget: 200 });
      expect(workforce.getConfig().maxAgents).toBe(100);
      expect(workforce.getConfig().defaultHCUBudget).toBe(200);
    });
  });
});