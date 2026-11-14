// src/engines/continuousIntelligence/ContinuousIntelligenceDashboard.tsx
// Dashboard UI for Continuous Intelligence Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { ContinuousIntelligenceEngine } from './ContinuousIntelligenceEngine';
import type { ThoughtStreamItem, BackgroundReasoningTask, AnomalyAlert, IntelligenceEvent } from './types';

export function ContinuousIntelligenceDashboard() {
  const { engine } = useEngine('continuousIntelligence') as { engine: ContinuousIntelligenceEngine | null };
  const [health, setHealth] = useState<ReturnType<ContinuousIntelligenceEngine['getHealth']> | null>(null);
  const [thoughts, setThoughts] = useState<ThoughtStreamItem[]>([]);
  const [tasks, setTasks] = useState<BackgroundReasoningTask[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPrompt, setNewTaskPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'thoughts' | 'reasoning' | 'anomalies'>('thoughts');

  useEffect(() => {
    if (!engine) return;

    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
      startPolling();
    };

    const unsubThought = engine.onEvent('thought_generated', (e) => setThoughts(prev => [e.thought, ...prev.slice(0, 99)]));
    const unsubAnomaly = engine.onEvent('anomaly_detected', (e) => setAnomalies(prev => [e.alert, ...prev.slice(0, 49)]));
    const unsubReasoning = engine.onEvent('reasoning_completed', (e) => setTasks(prev => [e.task, ...prev.slice(0, 49)]));

    init();

    return () => {
      unsubThought();
      unsubAnomaly();
      unsubReasoning();
    };
  }, [engine]);

  const startPolling = () => {
    if (!engine) return;
    const interval = setInterval(() => {
      setHealth(engine.getHealth());
      setThoughts(engine.getThoughts({ limit: 100 }));
      setTasks(engine.getReasoningTasks());
      setAnomalies(engine.getAnomalies());
    }, 2000);
    return () => clearInterval(interval);
  };

  const handleQueueReasoning = () => {
    if (!engine || !newTaskTitle.trim() || !newTaskPrompt.trim()) return;
    engine.queueReasoningTask(newTaskTitle, newTaskPrompt, 0.1);
    setNewTaskTitle('');
    setNewTaskPrompt('');
    setActiveTab('reasoning');
  };

  const handleResolveAnomaly = (id: string) => {
    engine?.resolveAnomaly(id);
  };

  const handleEscalateThought = (id: string) => {
    engine?.escalateThought(id);
  };

  const handleArchiveThought = (id: string) => {
    engine?.archiveThought(id);
  };

  if (!engine || !isInitialized) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Initializing Continuous Intelligence...
      </div>
    );
  }

  const severityColors: Record<AnomalyAlert['severity'], string> = {
    low: 'text-gray-400 bg-gray-900/30',
    medium: 'text-yellow-400 bg-yellow-900/30',
    high: 'text-orange-400 bg-orange-900/30',
    critical: 'text-red-400 bg-red-900/30',
  };

  const statusColors: Record<ThoughtStreamItem['status'], string> = {
    active: 'text-green-400',
    archived: 'text-gray-400',
    escalated: 'text-red-400',
  };

  const taskStatusColors: Record<BackgroundReasoningTask['status'], string> = {
    queued: 'text-yellow-400',
    processing: 'text-blue-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-background">
      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Active Thoughts</div>
          <div className="text-3xl font-bold text-green-400">{health?.activeThoughts || 0}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Queued Reasoning</div>
          <div className="text-3xl font-bold text-yellow-400">{health?.queuedReasoning || 0}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Completed Tasks</div>
          <div className="text-3xl font-bold text-blue-400">{health?.completedReasoning || 0}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Active Anomalies</div>
          <div className="text-3xl font-bold text-red-400">{health?.activeAnomalies || 0}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">HCU Spent</div>
          <div className="text-3xl font-bold text-white">{health?.totalHCUSpent.toFixed(2) || 0} / min</div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Panel - Thought Stream */}
        <div className="w-96 bg-card rounded-xl border border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-white">Thought Stream</h3>
            <span className="text-xs text-gray-400">{thoughts.length} thoughts</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {thoughts.slice(0, 50).map(thought => (
              <ThoughtCard
                key={thought.id}
                thought={thought}
                onEscalate={handleEscalateThought}
                onArchive={handleArchiveThought}
                statusColors={statusColors}
              />
            ))}
            {thoughts.length === 0 && (
              <div className="text-center text-gray-500 py-8 text-sm">No thoughts yet. Background reasoning will populate this.</div>
            )}
          </div>
        </div>

        {/* Center Panel - Tabbed Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex gap-1 bg-card rounded-xl border border-border p-1">
            <button
              onClick={() => setActiveTab('thoughts')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'thoughts' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Thoughts
            </button>
            <button
              onClick={() => setActiveTab('reasoning')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'reasoning' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Reasoning
            </button>
            <button
              onClick={() => setActiveTab('anomalies')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'anomalies' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Anomalies
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 mt-2 space-y-4">
            {activeTab === 'thoughts' && (
              <ThoughtsPanel thoughts={thoughts} onEscalate={handleEscalateThought} onArchive={handleArchiveThought} statusColors={statusColors} />
            )}
            {activeTab === 'reasoning' && (
              <ReasoningPanel tasks={tasks} engine={engine} taskStatusColors={taskStatusColors} />
            )}
            {activeTab === 'anomalies' && (
              <AnomaliesPanel anomalies={anomalies} onResolve={handleResolveAnomaly} severityColors={severityColors} />
            )}
          </div>
        </div>

        {/* Right Panel - Queue New Reasoning */}
        <div className="w-80 bg-card rounded-xl border border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-white">Queue Reasoning Task</h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Title</label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="e.g., Market Analysis"
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Prompt</label>
              <textarea
                value={newTaskPrompt}
                onChange={e => setNewTaskPrompt(e.target.value)}
                placeholder="Describe the reasoning task..."
                rows={4}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm"
              />
            </div>
            <button
              onClick={handleQueueReasoning}
              disabled={!newTaskTitle.trim() || !newTaskPrompt.trim()}
              className="w-full bg-primary hover:bg-primary/85 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Queue Background Reasoning
            </button>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => engine?.queueReasoningTask('System Health Check', 'Analyze system performance metrics and identify bottlenecks', 0.05)}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium text-left"
                >
                  System Health Check
                </button>
                <button
                  onClick={() => engine?.queueReasoningTask('Goal Alignment Review', 'Review current goals against recent actions and outcomes', 0.08)}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium text-left"
                >
                  Goal Alignment Review
                </button>
                <button
                  onClick={() => engine?.queueReasoningTask('Anomaly Pattern Analysis', 'Analyze recent anomalies for recurring patterns', 0.07)}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium text-left"
                >
                  Anomaly Pattern Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThoughtCard({
  thought,
  onEscalate,
  onArchive,
  statusColors,
}: {
  thought: ThoughtStreamItem;
  onEscalate: (id: string) => void;
  onArchive: (id: string) => void;
  statusColors: Record<ThoughtStreamItem['status'], string>;
}) {
  return (
    <div className={`bg-background/50 rounded-lg p-3 border-l-2 ${statusColors[thought.status]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${statusColors[thought.status]}`}>{thought.status.toUpperCase()}</span>
            <span className="text-xs text-gray-500">{thought.source}</span>
            <span className="text-xs text-gray-400">{new Date(thought.timestamp).toLocaleTimeString()}</span>
          </div>
          <p className="text-sm text-white line-clamp-2">{thought.content}</p>
          <div className="flex gap-1 mt-2">
            {thought.tags.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded">{tag}</span>
            ))}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {thought.status === 'active' && (
            <button
              onClick={() => onEscalate(thought.id)}
              className="p-1 text-red-400 hover:text-red-300 text-xs" title="Escalate"
            >
              ⬆
            </button>
          )}
          <button
            onClick={() => onArchive(thought.id)}
            className="p-1 text-gray-400 hover:text-gray-300 text-xs" title="Archive"
          >
            🗄
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
        <span className="text-xs text-gray-500">Confidence: {(thought.confidence * 100).toFixed(0)}%</span>
        <span className="text-xs text-gray-400 font-mono">{thought.id}</span>
      </div>
    </div>
  );
}

function ThoughtsPanel({
  thoughts,
  onEscalate,
  onArchive,
  statusColors,
}: {
  thoughts: ThoughtStreamItem[];
  onEscalate: (id: string) => void;
  onArchive: (id: string) => void;
  statusColors: Record<ThoughtStreamItem['status'], string>;
}) {
  const activeThoughts = thoughts.filter(t => t.status === 'active');
  const escalatedThoughts = thoughts.filter(t => t.status === 'escalated');
  const archivedThoughts = thoughts.filter(t => t.status === 'archived');

  return (
    <div className="space-y-6">
      {activeThoughts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-green-400 uppercase tracking-wide mb-2">Active ({activeThoughts.length})</h4>
          <div className="space-y-2">
            {activeThoughts.slice(0, 20).map(thought => (
              <ThoughtCard key={thought.id} thought={thought} onEscalate={onEscalate} onArchive={onArchive} statusColors={statusColors} />
            ))}
          </div>
        </div>
      )}
      {escalatedThoughts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-red-400 uppercase tracking-wide mb-2">Escalated ({escalatedThoughts.length})</h4>
          <div className="space-y-2">
            {escalatedThoughts.slice(0, 10).map(thought => (
              <ThoughtCard key={thought.id} thought={thought} onEscalate={onEscalate} onArchive={onArchive} statusColors={statusColors} />
            ))}
          </div>
        </div>
      )}
      {archivedThoughts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">Archived ({archivedThoughts.length})</h4>
          <div className="space-y-2">
            {archivedThoughts.slice(0, 10).map(thought => (
              <ThoughtCard key={thought.id} thought={thought} onEscalate={onEscalate} onArchive={onArchive} statusColors={statusColors} />
            ))}
          </div>
        </div>
      )}
      {thoughts.length === 0 && (
        <div className="text-center text-gray-500 py-12">No thoughts recorded yet</div>
      )}
    </div>
  );
}

function ReasoningPanel({
  tasks,
  engine,
  taskStatusColors,
}: {
  tasks: BackgroundReasoningTask[];
  engine: ContinuousIntelligenceEngine | null;
  taskStatusColors: Record<BackgroundReasoningTask['status'], string>;
}) {
  const queued = tasks.filter(t => t.status === 'queued');
  const processing = tasks.filter(t => t.status === 'processing');
  const completed = tasks.filter(t => t.status === 'completed');
  const failed = tasks.filter(t => t.status === 'failed');

  return (
    <div className="space-y-6">
      {processing.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-blue-400 uppercase tracking-wide mb-2">Processing ({processing.length})</h4>
          <div className="space-y-2">
            {processing.map(task => (
              <TaskCard key={task.id} task={task} taskStatusColors={taskStatusColors} />
            ))}
          </div>
        </div>
      )}
      {queued.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-yellow-400 uppercase tracking-wide mb-2">Queued ({queued.length})</h4>
          <div className="space-y-2">
            {queued.map(task => (
              <TaskCard key={task.id} task={task} taskStatusColors={taskStatusColors} />
            ))}
          </div>
        </div>
      )}
      {completed.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-green-400 uppercase tracking-wide mb-2">Completed ({completed.length})</h4>
          <div className="space-y-2">
            {completed.slice(0, 15).map(task => (
              <TaskCard key={task.id} task={task} taskStatusColors={taskStatusColors} />
            ))}
          </div>
        </div>
      )}
      {failed.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-red-400 uppercase tracking-wide mb-2">Failed ({failed.length})</h4>
          <div className="space-y-2">
            {failed.slice(0, 10).map(task => (
              <TaskCard key={task.id} task={task} taskStatusColors={taskStatusColors} />
            ))}
          </div>
        </div>
      )}
      {tasks.length === 0 && (
        <div className="text-center text-gray-500 py-12">No reasoning tasks yet. Queue one from the panel on the right.</div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  taskStatusColors,
}: {
  task: BackgroundReasoningTask;
  taskStatusColors: Record<BackgroundReasoningTask['status'], string>;
}) {
  return (
    <div className="bg-background/50 rounded-lg p-3 border-l-2 border-gray-700">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-white">{task.title}</span>
        <span className={`text-xs font-medium ${taskStatusColors[task.status]}`}>{task.status.toUpperCase()}</span>
      </div>
      <p className="text-sm text-gray-300 mb-2 line-clamp-1">{task.prompt}</p>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>HCU: {task.hcuCost}</span>
        <span>{new Date(task.createdAt).toLocaleTimeString()}</span>
        {task.completedAt && <span>Done: {new Date(task.completedAt).toLocaleTimeString()}</span>}
      </div>
      {task.result && (
        <div className="mt-2 pt-2 border-t border-white/10 text-sm text-gray-300 line-clamp-2">
          {task.result}
        </div>
      )}
      {task.status === 'failed' && task.result && (
        <div className="mt-2 pt-2 border-t border-red-500/30 text-sm text-red-400">
          Error: {task.result}
        </div>
      )}
    </div>
  );
}

function AnomaliesPanel({
  anomalies,
  onResolve,
  severityColors,
}: {
  anomalies: AnomalyAlert[];
  onResolve: (id: string) => void;
  severityColors: Record<AnomalyAlert['severity'], string>;
}) {
  const active = anomalies.filter(a => !a.resolved);
  const resolved = anomalies.filter(a => a.resolved);

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-red-400 uppercase tracking-wide mb-2">Active Anomalies ({active.length})</h4>
          <div className="space-y-2">
            {active.map(anomaly => (
              <AnomalyCard key={anomaly.id} anomaly={anomaly} onResolve={onResolve} severityColors={severityColors} />
            ))}
          </div>
        </div>
      )}
      {resolved.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">Resolved ({resolved.length})</h4>
          <div className="space-y-2">
            {resolved.slice(0, 10).map(anomaly => (
              <AnomalyCard key={anomaly.id} anomaly={anomaly} onResolve={onResolve} severityColors={severityColors} />
            ))}
          </div>
        </div>
      )}
      {anomalies.length === 0 && (
        <div className="text-center text-gray-500 py-12">No anomalies detected. System operating normally.</div>
      )}
    </div>
  );
}

function AnomalyCard({
  anomaly,
  onResolve,
  severityColors,
}: {
  anomaly: AnomalyAlert;
  onResolve: (id: string) => void;
  severityColors: Record<AnomalyAlert['severity'], string>;
}) {
  return (
    <div className={`bg-background/50 rounded-lg p-3 border-l-2 ${severityColors[anomaly.severity]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${severityColors[anomaly.severity]}`}>
              {anomaly.severity.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">{anomaly.sourceSystem}</span>
            <span className="text-xs text-gray-400">{new Date(anomaly.timestamp).toLocaleTimeString()}</span>
          </div>
          <h4 className="font-medium text-white mb-1">{anomaly.title}</h4>
          <p className="text-sm text-gray-300">{anomaly.description}</p>
        </div>
        {!anomaly.resolved && (
          <button
            onClick={() => onResolve(anomaly.id)}
            className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs font-medium hover:bg-green-900/50"
          >
            Resolve
          </button>
        )}
      </div>
      {anomaly.resolved && (
        <div className="mt-2 pt-2 border-t border-white/10 text-xs text-green-400">Resolved</div>
      )}
    </div>
  );
}

export default ContinuousIntelligenceDashboard;