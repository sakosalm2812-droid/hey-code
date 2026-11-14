// src/engines/agentWorkforce/AgentWorkforceDashboard.tsx
// Dashboard UI for Agent Workforce Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { AgentWorkforceEngine } from './AgentWorkforceEngine';
import type { AgentRole, AgentStatus, AgentCapability, Task, WorkforceEvent } from './types';

export function AgentWorkforceDashboard() {
  const { engine } = useEngine('agentWorkforce') as { engine: AgentWorkforceEngine | null };
  const [health, setHealth] = useState<ReturnType<AgentWorkforceEngine['getHealth']> | null>(null);
  const [agents, setAgents] = useState<Array<{ id: string; config: any; state: any }>>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [events, setEvents] = useState<WorkforceEvent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentCapability, setNewAgentCapability] = useState<AgentCapability>('research');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskCapability, setNewTaskCapability] = useState<AgentCapability>('research');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  useEffect(() => {
    if (!engine) return;

    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
      startPolling();
    };

    // Subscribe to events
    const unsubSpawned = engine.onEvent('agent_spawned', (e) => setEvents(prev => [...prev.slice(-99), e]));
    const unsubTerminated = engine.onEvent('agent_terminated', (e) => setEvents(prev => [...prev.slice(-99), e]));
    const unsubTaskAssigned = engine.onEvent('task_assigned', (e) => setEvents(prev => [...prev.slice(-99), e]));
    const unsubTaskCompleted = engine.onEvent('task_completed', (e) => setEvents(prev => [...prev.slice(-99), e]));
    const unsubTaskFailed = engine.onEvent('task_failed', (e) => setEvents(prev => [...prev.slice(-99), e]));
    const unsubHCUAlert = engine.onEvent('hcu_alert', (e) => setEvents(prev => [...prev.slice(-99), e]));
    const unsubMemorySynced = engine.onEvent('memory_synced', (e) => setEvents(prev => [...prev.slice(-99), e]));

    init();

    return () => {
      unsubSpawned();
      unsubTerminated();
      unsubTaskAssigned();
      unsubTaskCompleted();
      unsubTaskFailed();
      unsubHCUAlert();
      unsubMemorySynced();
    };
  }, [engine]);

  const startPolling = () => {
    if (!engine) return;
    const interval = setInterval(() => {
      setHealth(engine.getHealth());
      setAgents(engine.getAllAgents().map(a => ({ id: a.id, config: a.config, state: a.state })));
      setTasks(engine.getAllTasks());
    }, 1000);
    return () => clearInterval(interval);
  };

  const handleCreateAgent = async (role: AgentRole) => {
    if (!engine || !newAgentName.trim()) return;
    const parentId = selectedAgentId || engine.getPrimaryAgent()?.id;
    if (!parentId) return;

    try {
      switch (role) {
        case 'secondary':
          await engine.createSecondaryAgent(parentId, newAgentName, newAgentCapability);
          break;
        case 'tertiary':
          await engine.createTertiaryAgent(parentId, newAgentName, newAgentCapability);
          break;
        case 'quaternary':
          await engine.createQuaternaryAgent(parentId, newAgentName, newAgentCapability);
          break;
      }
      setNewAgentName('');
    } catch (e) {
      console.error('Failed to create agent:', e);
      alert(`Failed to create agent: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleSubmitTask = async () => {
    if (!engine || !newTaskDesc.trim()) return;
    try {
      engine.submitTask({
        type: newTaskCapability,
        description: newTaskDesc,
        payload: {},
        requiredCapabilities: [newTaskCapability],
        priority: 'normal',
        hcuCost: 0.01,
      });
      setNewTaskDesc('');
    } catch (e) {
      console.error('Failed to submit task:', e);
      alert(`Failed to submit task: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleBroadcast = async () => {
    if (!engine || !broadcastMessage.trim()) return;
    engine.broadcastIPC({
      to: 'broadcast',
      type: 'notification',
      payload: { message: broadcastMessage },
      priority: 'normal',
    });
    setBroadcastMessage('');
  };

  const handleTerminateAgent = async (agentId: string) => {
    if (!engine) return;
    if (!confirm('Terminate this agent and all its children?')) return;
    await engine.terminateAgent(agentId, 'user_requested');
  };

  const roleColors: Record<AgentRole, string> = {
    primary: 'text-purple-400 bg-purple-900/30',
    secondary: 'text-blue-400 bg-blue-900/30',
    tertiary: 'text-green-400 bg-green-900/30',
    quaternary: 'text-yellow-400 bg-yellow-900/30',
  };

  const statusColors: Record<AgentStatus, string> = {
    idle: 'text-gray-400',
    starting: 'text-yellow-400',
    running: 'text-green-400',
    paused: 'text-orange-400',
    completed: 'text-blue-400',
    failed: 'text-red-400',
    terminated: 'text-gray-500',
  };

  if (!engine || !isInitialized) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Initializing Agent Workforce...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-background">
      {/* Header & Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Total Agents</div>
          <div className="text-3xl font-bold text-white">{health?.totalAgents || 0}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">HCU Spent / Budget</div>
          <div className="text-3xl font-bold text-white">
            {(health?.totalHCUSpent || 0).toFixed(2)} / {health?.totalHCUBudget || 0}
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Tasks Completed</div>
          <div className="text-3xl font-bold text-green-400">{health?.tasksCompleted || 0}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Queue Length</div>
          <div className="text-3xl font-bold text-yellow-400">{health?.taskQueueLength || 0}</div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Panel - Agent Tree */}
        <div className="w-80 bg-card rounded-xl border border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-white">Agent Hierarchy</h3>
            <span className="text-xs text-gray-400">{agents.length} agents</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {agents
              .filter(a => !a.config.parentId || agents.some(p => p.id === a.config.parentId))
              .sort((a, b) => {
                const roleOrder: Record<AgentRole, number> = { primary: 0, secondary: 1, tertiary: 2, quaternary: 3 };
                return (roleOrder[a.config.role] || 99) - (roleOrder[b.config.role] || 99);
              })
              .map(agent => (
                <AgentTreeNode
                  key={agent.id}
                  agent={agent}
                  allAgents={agents}
                  selected={selectedAgentId === agent.id}
                  onSelect={setSelectedAgentId}
                  onTerminate={handleTerminateAgent}
                  roleColors={roleColors}
                  statusColors={statusColors}
                />
              ))}
            {agents.length === 1 && (
              <div className="text-center text-gray-500 py-8 text-sm">
                Only primary agent exists. Create subordinates to build workforce.
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Selected Agent Details / Task Queue */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedAgentId ? (
            <AgentDetailPanel
              agent={agents.find(a => a.id === selectedAgentId)}
              engine={engine}
              roleColors={roleColors}
              statusColors={statusColors}
            />
          ) : (
            <TaskQueuePanel tasks={tasks} engine={engine} />
          )}
        </div>

        {/* Right Panel - Controls & Events */}
        <div className="w-80 bg-card rounded-xl border border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-white">Controls</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Create Agent */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Spawn Agent</h4>
              <input
                type="text"
                value={newAgentName}
                onChange={e => setNewAgentName(e.target.value)}
                placeholder="Agent name"
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm"
              />
              <select
                value={newAgentCapability}
                onChange={e => setNewAgentCapability(e.target.value as AgentCapability)}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="research">Research</option>
                <option value="analysis">Analysis</option>
                <option value="planning">Planning</option>
                <option value="execution">Execution</option>
                <option value="verification">Verification</option>
                <option value="synthesis">Synthesis</option>
                <option value="critique">Critique</option>
                <option value="coordination">Coordination</option>
                <option value="memory">Memory</option>
                <option value="tool_use">Tool Use</option>
              </select>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleCreateAgent('secondary')}
                  disabled={!selectedAgentId || !newAgentName.trim()}
                  className="bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  Secondary
                </button>
                <button
                  onClick={() => handleCreateAgent('tertiary')}
                  disabled={!selectedAgentId || !newAgentName.trim()}
                  className="bg-green-900/30 hover:bg-green-900/50 text-green-400 px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  Tertiary
                </button>
                <button
                  onClick={() => handleCreateAgent('quaternary')}
                  disabled={!selectedAgentId || !newAgentName.trim()}
                  className="bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  Quaternary
                </button>
              </div>
            </div>

            {/* Submit Task */}
            <div className="space-y-3 border-t border-border pt-4">
              <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Submit Task</h4>
              <textarea
                value={newTaskDesc}
                onChange={e => setNewTaskDesc(e.target.value)}
                placeholder="Task description"
                rows={2}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm"
              />
              <select
                value={newTaskCapability}
                onChange={e => setNewTaskCapability(e.target.value as AgentCapability)}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="research">Research</option>
                <option value="analysis">Analysis</option>
                <option value="planning">Planning</option>
                <option value="execution">Execution</option>
                <option value="verification">Verification</option>
                <option value="synthesis">Synthesis</option>
                <option value="critique">Critique</option>
                <option value="coordination">Coordination</option>
                <option value="memory">Memory</option>
                <option value="tool_use">Tool Use</option>
              </select>
              <button
                onClick={handleSubmitTask}
                disabled={!newTaskDesc.trim()}
                className="w-full bg-primary hover:bg-primary/80 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Submit Task
              </button>
            </div>

            {/* Broadcast IPC */}
            <div className="space-y-3 border-t border-border pt-4">
              <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Broadcast IPC</h4>
              <input
                type="text"
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                placeholder="Message to all agents"
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm"
              />
              <button
                onClick={handleBroadcast}
                disabled={!broadcastMessage.trim()}
                className="w-full bg-purple-900/30 hover:bg-purple-900/50 text-purple-400 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Broadcast
              </button>
            </div>

            {/* Workforce Actions */}
            <div className="space-y-2 border-t border-border pt-4">
              <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Workforce</h4>
              <button
                onClick={() => engine.shutdown()}
                className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-2 rounded-lg text-sm font-medium"
              >
                Shutdown Workforce
              </button>
            </div>
          </div>

          {/* Events Log */}
          <div className="border-t border-border">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Event Log</h4>
              <span className="text-xs text-gray-400">{events.length} events</span>
            </div>
            <div className="max-h-48 overflow-y-auto p-2 space-y-1">
              {events.slice(-20).reverse().map((event, i) => (
                <div key={i} className="text-xs text-gray-300 font-mono bg-background/50 rounded p-2">
                  <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>{' '}
                  <span className="text-primary">{event.type}</span>{' '}
                  <span className="text-gray-400">{
                    'agentId' in event ? `agent:${event.agentId?.slice(-6)}` :
                    'taskId' in event ? `task:${event.taskId?.slice(-6)}` :
                    'vectorCount' in event ? `vectors:${event.vectorCount}` :
                    'spent' in event ? `HCU:${event.spent.toFixed(2)}/${event.budget}` : ''
                  }</span>
                </div>
              ))}
              {events.length === 0 && (
                <div className="text-center text-gray-500 py-4 text-sm">No events yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentTreeNode({
  agent,
  allAgents,
  selected,
  onSelect,
  onTerminate,
  roleColors,
  statusColors,
}: {
  agent: { id: string; config: any; state: any };
  allAgents: Array<{ id: string; config: any; state: any }>;
  selected: boolean;
  onSelect: (id: string) => void;
  onTerminate: (id: string) => void;
  roleColors: Record<string, string>;
  statusColors: Record<string, string>;
}) {
  const children = allAgents.filter(a => a.config.parentId === agent.id);
  const isExpanded = true; // Could add state for this

  return (
    <div className={`group relative pl-4 ${selected ? 'bg-primary/10' : ''} rounded-lg`}>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-white/5 ${selected ? 'bg-primary/20' : ''}`}
        onClick={() => onSelect(agent.id)}
      >
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${roleColors[agent.config.role] || 'text-gray-400'}`}>
          {agent.config.role}
        </span>
        <span className="font-mono text-xs text-gray-300 flex-1 truncate">{agent.config.name}</span>
        <span className={`text-xs ${statusColors[agent.state.status] || 'text-gray-400'}`}>
          ● {agent.state.status}
        </span>
        <span className="text-xs text-gray-500">HCU: {agent.config.hcuSpent.toFixed(1)}/{agent.config.hcuBudget}</span>
        <button
          onClick={e => { e.stopPropagation(); onTerminate(agent.id); }}
          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 transition-opacity"
          title="Terminate"
        >
          ✕
        </button>
      </div>

      {isExpanded && children.length > 0 && (
        <div className="border-l-2 border-border/50 ml-2 mt-1">
          {children.map(child => (
            <AgentTreeNode
              key={child.id}
              agent={child}
              allAgents={allAgents}
              selected={selected}
              onSelect={onSelect}
              onTerminate={onTerminate}
              roleColors={roleColors}
              statusColors={statusColors}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AgentDetailPanel({
  agent,
  engine,
  roleColors,
  statusColors,
}: {
  agent: { id: string; config: any; state: any } | undefined;
  engine: any;
  roleColors: Record<string, string>;
  statusColors: Record<string, string>;
}) {
  if (!agent) return null;

  return (
    <div className="flex-1 flex flex-col bg-card rounded-xl border border-border min-h-0">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[agent.config.role] || 'text-gray-400'}`}>
          {agent.config.role.toUpperCase()}
        </span>
        <h3 className="font-semibold text-white flex-1">{agent.config.name}</h3>
        <span className={`text-xs ${statusColors[agent.state.status] || 'text-gray-400'}`}>
          ● {agent.state.status.toUpperCase()}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Capabilities */}
        <div>
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Capabilities</h4>
          <div className="flex flex-wrap gap-1">
            {agent.config.capabilities.map((cap: string) => (
              <span key={cap} className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded">
                {cap}
              </span>
            ))}
          </div>
        </div>

        {/* HCU Budget */}
        <div>
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">HCU Budget</h4>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${(agent.config.hcuSpent / agent.config.hcuBudget) * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {agent.config.hcuSpent.toFixed(2)} / {agent.config.hcuBudget} spent
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Tasks Completed</div>
            <div className="text-2xl font-bold text-green-400">{agent.state.metrics.tasksCompleted}</div>
          </div>
          <div className="bg-background/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Tasks Failed</div>
            <div className="text-2xl font-bold text-red-400">{agent.state.metrics.tasksFailed}</div>
          </div>
          <div className="bg-background/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Total HCU Spent</div>
            <div className="text-2xl font-bold text-yellow-400">{agent.state.metrics.totalHCUSpent.toFixed(2)}</div>
          </div>
          <div className="bg-background/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Avg Response (ms)</div>
            <div className="text-2xl font-bold text-white">{Math.round(agent.state.metrics.avgResponseTimeMs)}</div>
          </div>
        </div>

        {/* Memory Vectors */}
        <div>
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Memory Vectors ({agent.state.memoryVectors.length})
          </h4>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {agent.state.memoryVectors.slice(0, 10).map((vec: any) => (
              <div key={vec.id} className="text-xs text-gray-300 bg-background/50 rounded p-2 font-mono">
                {vec.id.slice(0, 12)}... <span className="text-gray-500">{vec.content.slice(0, 40)}</span>
                <span className="text-gray-400 ml-2">sim: {vec.accessCount} accesses</span>
              </div>
            ))}
            {agent.state.memoryVectors.length === 0 && (
              <div className="text-center text-gray-500 py-4 text-sm">No memory vectors</div>
            )}
            {agent.state.memoryVectors.length > 10 && (
              <div className="text-center text-gray-500 text-xs">+{agent.state.memoryVectors.length - 10} more</div>
            )}
          </div>
        </div>

        {/* Current Task */}
        {agent.state.currentTask && (
          <div className="bg-yellow-900/20 border border-yellow-900/30 rounded-lg p-3">
            <div className="text-xs text-yellow-400 font-medium">Current Task</div>
            <div className="text-sm text-white mt-1">{agent.state.currentTask}</div>
            <div className="text-xs text-gray-400 mt-1">Task ID: {agent.state.currentTaskId}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskQueuePanel({
  tasks,
  engine,
}: {
  tasks: Task[];
  engine: any;
}) {
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'assigned');
  const runningTasks = tasks.filter(t => t.status === 'running');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const failedTasks = tasks.filter(t => t.status === 'failed');

  return (
    <div className="flex-1 flex flex-col bg-card rounded-xl border border-border min-h-0">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-white">Task Queue</h3>
        <div className="flex gap-2 text-xs">
          <span className="text-yellow-400">Pending: {pendingTasks.length}</span>
          <span className="text-blue-400">Running: {runningTasks.length}</span>
          <span className="text-green-400">Done: {completedTasks.length}</span>
          <span className="text-red-400">Failed: {failedTasks.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {[
          { label: 'Running', tasks: runningTasks, color: 'text-blue-400' },
          { label: 'Pending', tasks: pendingTasks, color: 'text-yellow-400' },
          { label: 'Completed', tasks: completedTasks, color: 'text-green-400' },
          { label: 'Failed', tasks: failedTasks, color: 'text-red-400' },
        ].map(({ label, tasks: taskList, color }) => (
          taskList.length > 0 && (
            <div key={label} className="space-y-1">
              <div className={`text-xs font-medium uppercase tracking-wide ${color}`}>{label} ({taskList.length})</div>
              {taskList.slice(0, 10).map(task => (
                <div
                  key={task.id}
                  className="text-sm text-gray-300 bg-background/50 rounded p-2 font-mono hover:bg-background/70 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{task.description}</span>
                    <span className="text-xs text-gray-400 ml-2">{task.id.slice(-6)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span>Cap: {task.requiredCapabilities.join(', ')}</span>
                    <span>HCU: {task.hcuCost}</span>
                    {task.assignedAgentId && (
                      <span>→ {task.assignedAgentId.slice(-6)}</span>
                    )}
                  </div>
                </div>
              ))}
              {taskList.length > 10 && (
                <div className="text-center text-gray-500 text-xs py-1">+{taskList.length - 10} more</div>
              )}
            </div>
          )
        ))}

        {tasks.length === 0 && (
          <div className="text-center text-gray-500 py-12 text-sm">
            No tasks yet. Submit a task from the controls panel.
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentWorkforceDashboard;