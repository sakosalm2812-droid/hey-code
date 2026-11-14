// src/engines/guidanceWorld/GuidanceWorldDashboard.tsx
// Dashboard UI for Guidance World Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { GuidanceWorldEngine } from './GuidanceWorldEngine';
import type { GuidanceSession, TutoringPath, MentorshipGoal, InstructionStep, GuidanceEvent, GuidanceHealth } from './types';

export function GuidanceWorldDashboard() {
  const { engine } = useEngine('guidanceWorld') as { engine: GuidanceWorldEngine | null };
  const [health, setHealth] = useState<GuidanceHealth | null>(null);
  const [sessions, setSessions] = useState<GuidanceSession[]>([]);
  const [tutoringPaths, setTutoringPaths] = useState<TutoringPath[]>([]);
  const [goals, setGoals] = useState<MentorshipGoal[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'tutoring' | 'goals' | 'instructions'>('sessions');
  const [generatedInstructions, setGeneratedInstructions] = useState<InstructionStep[]>([]);

  useEffect(() => {
    if (!engine) return;

    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
      startPolling();
    };

    const unsubSession = engine.onEvent('session_started', () => setSessions(engine.getSessions()));
    const unsubProgress = engine.onEvent('progress_updated', () => setSessions(engine.getSessions()));
    const unsubComplete = engine.onEvent('session_completed', () => setSessions(engine.getSessions()));
    const unsubGoal = engine.onEvent('goal_achieved', () => setGoals(engine.getAllMentorshipGoals()));
    const unsubInstruction = engine.onEvent('instruction_generated', (e) => setGeneratedInstructions(e.steps));

    init();

    return () => {
      unsubSession();
      unsubProgress();
      unsubComplete();
      unsubGoal();
      unsubInstruction();
    };
  }, [engine]);

  const startPolling = () => {
    if (!engine) return;
    const interval = setInterval(() => {
      setHealth(engine.getHealth());
      setSessions(engine.getSessions());
      setTutoringPaths(engine.getAllTutoringPaths());
      setGoals(engine.getAllMentorshipGoals());
    }, 3000);
    return () => clearInterval(interval);
  };

  if (!engine || !isInitialized) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Initializing Guidance World...
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'text-gray-400 bg-gray-900/30 border-gray-700/50',
    active: 'text-blue-400 bg-blue-900/30 border-blue-700/50',
    completed: 'text-green-400 bg-green-900/30 border-green-700/50',
    paused: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50',
    cancelled: 'text-red-400 bg-red-900/30 border-red-700/50',
  };

  const typeIcons: Record<string, string> = {
    instruction: '📋',
    tutoring: '🎓',
    mentorship: '🎯',
  };

  const goalStatusColors: Record<string, string> = {
    active: 'text-blue-400',
    achieved: 'text-green-400',
    missed: 'text-red-400',
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-background">
      {/* Header Stats */}
      <div className="flex gap-4 min-h-0 overflow-x-auto pb-2">
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Active Sessions</div>
          <div className="text-3xl font-bold text-blue-400">{health?.activeSessions || 0}</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Completed</div>
          <div className="text-3xl font-bold text-green-400">{health?.completedSessions || 0}</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Active Goals</div>
          <div className="text-3xl font-bold text-purple-400">{health?.activeGoals || 0}</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Avg Progress</div>
          <div className="text-3xl font-bold text-white">{health?.averageProgress.toFixed(0) || 0}%</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Tutoring Paths</div>
          <div className="text-3xl font-bold text-white">{tutoringPaths.length}</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">HCU / Hour</div>
          <div className="text-3xl font-bold text-white">{health?.totalHCUSpent.toFixed(3) || 0} / {health?.hcuBudgetPerHour || 0}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-card rounded-xl border border-border p-1">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'sessions' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Sessions ({sessions.length})
        </button>
        <button
          onClick={() => setActiveTab('tutoring')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'tutoring' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Tutoring ({tutoringPaths.length})
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'goals' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Goals ({goals.length})
        </button>
        <button
          onClick={() => setActiveTab('instructions')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'instructions' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Instructions
        </button>
      </div>

      {/* Content Panels */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'sessions' && (
          <SessionsPanel sessions={sessions} statusColors={statusColors} typeIcons={typeIcons} engine={engine} />
        )}
        {activeTab === 'tutoring' && (
          <TutoringPanel paths={tutoringPaths} engine={engine} />
        )}
        {activeTab === 'goals' && (
          <GoalsPanel goals={goals} goalStatusColors={goalStatusColors} engine={engine} />
        )}
        {activeTab === 'instructions' && (
          <InstructionsPanel instructions={generatedInstructions} engine={engine} />
        )}
      </div>
    </div>
  );
}

function SessionsPanel({ sessions, statusColors, typeIcons, engine }: { sessions: GuidanceSession[], statusColors: Record<string, string>, typeIcons: Record<string, string>, engine: GuidanceWorldEngine }) {
  if (sessions.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400 space-y-4">
        <div className="text-4xl">📋</div>
        <div>No guidance sessions yet</div>
        <button
          onClick={() => engine.createSession('instruction', 'New Instruction', 'Step-by-step guidance for a task')}
          className="mx-auto px-4 py-2 bg-primary hover:bg-primary/85 text-white rounded-lg"
        >
          Create Instruction Session
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {sessions.map(session => (
        <div key={session.id} className={`p-4 rounded-xl border ${statusColors[session.status]}`}>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{typeIcons[session.type]}</span>
              <div>
                <div className="font-bold text-white">{session.title}</div>
                <div className="text-sm text-gray-400">{session.description}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium uppercase ${statusColors[session.status]}`}>{session.status}</span>
              {session.status === 'active' && (
                <button
                  onClick={() => engine.completeSession(session.id)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs"
                >
                  Complete
                </button>
              )}
              {session.status === 'pending' && (
                <button
                  onClick={() => engine.startSession(session.id)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs"
                >
                  Start
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Progress</span>
                <span className="text-white font-mono">{session.progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${session.progress}%` }}></div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Started: {new Date(session.startTime).toLocaleString()}
              {session.endTime && <span className="ml-2">Ended: {new Date(session.endTime).toLocaleString()}</span>}
            </div>
          </div>

          {Object.keys(session.metadata).length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Metadata: {JSON.stringify(session.metadata)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TutoringPanel({ paths, engine }: { paths: TutoringPath[], engine: GuidanceWorldEngine }) {
  if (paths.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="text-4xl">🎓</div>
        <div>No tutoring paths</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {paths.map(path => (
        <div key={path.id} className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-white">{path.subject}</div>
              <div className="text-sm text-gray-400">Level: {path.level} • Progress: {path.overallProgress}%</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono">{path.id}</span>
            </div>
          </div>

          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${path.overallProgress}%` }}></div>
          </div>

          <div className="space-y-2">
            {path.modules.map(module => (
              <div key={module.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={module.completed}
                    onChange={() => engine.completeModule(path.id, module.id)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="font-medium text-white">{module.title}</div>
                    <div className="text-xs text-gray-400">{module.content}</div>
                    {module.score !== undefined && (
                      <div className="text-xs text-yellow-400">Score: {module.score}%</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {path.currentModuleId === module.id && !module.completed && (
                    <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded">Current</span>
                  )}
                  {module.completed && (
                    <span className="text-xs text-green-400">✓ Done</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GoalsPanel({ goals, goalStatusColors, engine }: { goals: MentorshipGoal[], goalStatusColors: Record<string, string>, engine: GuidanceWorldEngine }) {
  if (goals.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400 space-y-4">
        <div className="text-4xl">🎯</div>
        <div>No mentorship goals</div>
        <button
          onClick={() => engine.createMentorshipGoal('New Goal', new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], ['Milestone 1', 'Milestone 2'])}
          className="mx-auto px-4 py-2 bg-primary hover:bg-primary/85 text-white rounded-lg"
        >
          Create Goal
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {goals.map(goal => (
        <div key={goal.id} className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="font-bold text-white">{goal.title}</div>
              <div className="text-sm text-gray-400">Target: {new Date(goal.targetDate).toLocaleDateString()}</div>
            </div>
            <span className={`text-xs font-medium uppercase ${goalStatusColors[goal.status]}`}>{goal.status}</span>
          </div>

          {goal.milestones.length > 0 && (
            <div className="space-y-2 mb-4">
              {goal.milestones.map((milestone, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-background/50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={milestone.completed}
                    onChange={() => engine.updateGoalMilestone(goal.id, i, !milestone.completed)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-white flex-1">{milestone.title}</span>
                  {milestone.completed && <span className="text-green-400 text-sm">✓</span>}
                </div>
              ))}
            </div>
          )}

          {goal.feedbackHistory.length > 0 && (
            <div className="border-t border-border pt-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Feedback History</div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {goal.feedbackHistory.slice(-5).map((fb, i) => (
                  <div key={i} className="text-xs p-2 bg-background/50 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-yellow-400">★</span>
                      <span className="font-mono">{fb.rating}/5</span>
                      <span className="text-gray-500 font-mono">{new Date(fb.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-gray-300">{fb.note}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <input
              type="text"
              placeholder="Feedback note..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  engine.addFeedback(goal.id, e.currentTarget.value.trim(), 5);
                  e.currentTarget.value = '';
                }
              }}
              className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function InstructionsPanel({ instructions, engine }: { instructions: InstructionStep[], engine: GuidanceWorldEngine }) {
  const [taskId, setTaskId] = useState('');
  const [context, setContext] = useState('default');

  return (
    <div className="p-4 space-y-6">
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold text-white mb-4">Generate Instructions</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={taskId}
            onChange={e => setTaskId(e.target.value)}
            placeholder="Task ID (e.g., task_123)"
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
          />
          <select
            value={context}
            onChange={e => setContext(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="default">Default Instructions</option>
            <option value="agent_spawn">Agent Spawn</option>
            <option value="cross_device_handoff">Cross-Device Handoff</option>
          </select>
          <button
            onClick={() => {
              if (taskId) {
                const steps = engine.generateInstructions(taskId, context);
                // Steps are stored in state via event
              }
            }}
            className="w-full bg-primary hover:bg-primary/85 text-white py-2 rounded-lg text-sm font-medium"
            disabled={!taskId}
          >
            Generate Instructions
          </button>
        </div>
      </div>

      {instructions.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold text-white mb-4">Generated Instructions for {taskId}</h3>
          <div className="space-y-3">
            {instructions.map(step => (
              <div key={step.order} className="flex gap-3 p-3 bg-background/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                  {step.order}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">{step.text}</div>
                  {step.tips && step.tips.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {step.tips.map((tip, i) => (
                        <span key={i} className="text-xs text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded">💡 {tip}</span>
                      ))}
                    </div>
                  )}
                  {step.warning && (
                    <div className="mt-2 text-xs text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded inline-block">⚠ {step.warning}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {instructions.length === 0 && taskId && (
        <div className="text-center text-gray-500 py-8">
          Click "Generate Instructions" to create steps for task {taskId}
        </div>
      )}
    </div>
  );
}

export default GuidanceWorldDashboard;