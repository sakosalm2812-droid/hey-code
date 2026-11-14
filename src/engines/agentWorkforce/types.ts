// src/engines/agentWorkforce/types.ts
// Types for Agent Workforce Engine — Hierarchical agent orchestration

export interface AgentRoleInterface = 'primary' | 'secondary' | 'tertiary' | 'quaternary';

export type AgentRole = AgentRoleInterface;

export type AgentStatus = 'idle' | 'starting' | 'running' | 'paused' | 'completed' | 'failed' | 'terminated';

export type AgentCapability =
  | 'research'
  | 'analysis'
  | 'planning'
  | 'execution'
  | 'verification'
  | 'synthesis'
  | 'critique'
  | 'coordination'
  | 'memory'
  | 'tool_use';

export type IPCPacket = {
  id: string;
  from: string; // agentId
  to: string | 'broadcast'; // agentId or broadcast
  type: 'task' | 'result' | 'status' | 'memory' | 'control' | 'heartbeat';
  payload: unknown;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timestamp: string;
  correlationId?: string; // For request-response pairs
  ttl?: number; // Time to live in hops
};

export type MemoryVector = {
  id: string;
  agentId: string;
  vector: number[]; // 384-dimensional embedding
  content: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  accessCount: number;
  lastAccessed: string;
};

export type AgentConfig = {
  id: string;
  name: string;
  role: AgentRole;
  capabilities: AgentCapability[];
  parentId?: string; // For hierarchical structure
  childIds: string[];
  systemPrompt: string;
  modelId: string;
  temperature: number;
  maxTokens: number;
  hcuBudget: number;
  hcuSpent: number;
  timeoutMs: number;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
    retryOn: string[];
  };
};

export type AgentState = {
  config: AgentConfig;
  status: AgentStatus;
  currentTask?: string;
  currentTaskId?: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  lastHeartbeat: string;
  memoryVectors: MemoryVector[];
  ipcQueue: IPCPacket[];
  metrics: {
    tasksCompleted: number;
    tasksFailed: number;
    totalHCUSpent: number;
    avgResponseTimeMs: number;
    memorySize: number;
  };
};

export type Task = {
  id: string;
  type: string;
  description: string;
  payload: unknown;
  assignedAgentId?: string;
  requiredCapabilities: AgentCapability[];
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
  hcuCost: number;
  hcuSpent: number;
  parentTaskId?: string;
  childTaskIds: string[];
  dependencies: string[]; // Task IDs that must complete first
};

export type WorkforceConfig = {
  maxAgents: number;
  maxDepth: number; // Max hierarchy depth (4 for Primary→Quaternary)
  defaultHCUBudget: number;
  heartbeatIntervalMs: number;
  taskTimeoutMs: number;
  ipcBufferSize: number;
  memoryVectorDimension: number;
  enableCRDTSync: boolean;
  costGovernor: {
    enabled: boolean;
    maxTotalHCU: number;
    alertThreshold: number;
  };
};

export type AgentMessage = {
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification' | 'broadcast';
  content: string;
  metadata?: Record<string, unknown>;
};

export type WorkforceEvent =
  | { type: 'agent_spawned'; agentId: string; role: AgentRole; parentId?: string }
  | { type: 'agent_terminated'; agentId: string; reason: string }
  | { type: 'task_assigned'; taskId: string; agentId: string }
  | { type: 'task_completed'; taskId: string; agentId: string; result: unknown }
  | { type: 'task_failed'; taskId: string; agentId: string; error: string }
  | { type: 'ipc_sent'; packet: IPCPacket }
  | { type: 'memory_synced'; agentId: string; vectorCount: number }
  | { type: 'hcu_alert'; agentId: string; spent: number; budget: number };

export type CRDTOperation = {
  id: string;
  type: 'insert' | 'update' | 'delete';
  key: string;
  value?: unknown;
  vector?: number[];
  agentId: string;
  timestamp: string;
  version: number;
};

export interface BaseAgent {
  id: string;
  config: AgentConfig;
  state: AgentState;

  // Lifecycle
  start(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  terminate(reason: string): Promise<void>;

  // Task execution
  executeTask(task: Task): Promise<{ success: boolean; result?: unknown; error?: string }>;

  // Communication
  sendIPC(packet: IPCPacket): Promise<void>;
  onIPC(handler: (packet: IPCPacket) => void): void;

  // Memory
  addMemoryVector(vector: MemoryVector): void;
  searchMemory(query: number[], topK: number): MemoryVector[];

  // Health
  getHealth(): { status: AgentStatus; metrics: AgentState['metrics']; hcuRemaining: number };
}

export interface AgentFactory {
  createAgent(config: Partial<AgentConfig>): BaseAgent;
  createPrimaryAgent(name: string, systemPrompt: string, modelId: string): BaseAgent;
  createSecondaryAgent(parentId: string, name: string, capability: AgentCapability): BaseAgent;
  createTertiaryAgent(parentId: string, name: string, capability: AgentCapability): BaseAgent;
  createQuaternaryAgent(parentId: string, name: string, capability: AgentCapability): BaseAgent;
}