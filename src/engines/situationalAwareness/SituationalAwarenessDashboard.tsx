// src/engines/situationalAwareness/SituationalAwarenessDashboard.tsx
// Dashboard UI for Situational Awareness Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { SituationalAwarenessEngine } from './SituationalAwarenessEngine';
import type { EnvironmentSnapshot, SituationAssessment, AwarenessEvent } from './types';

export function SituationalAwarenessDashboard() {
  const { engine } = useEngine('situationalAwareness') as { engine: SituationalAwarenessEngine | null };
  const [health, setHealth] = useState<ReturnType<SituationalAwarenessEngine['getHealth']> | null>(null);
  const [snapshots, setSnapshots] = useState<EnvironmentSnapshot[]>([]);
  const [assessments, setAssessments] = useState<SituationAssessment[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'system' | 'assessments' | 'context'>('assessments');

  useEffect(() => {
    if (!engine) return;

    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
      startPolling();
    };

    const unsubSnap = engine.onEvent('snapshot_captured', (e) => setSnapshots(prev => [e.snapshot, ...prev.slice(0, 49)]));
    const unsubAssess = engine.onEvent('assessment_generated', (e) => setAssessments(prev => [e.assessment, ...prev.slice(0, 49)]));

    init();

    return () => {
      unsubSnap();
      unsubAssess();
    };
  }, [engine]);

  const startPolling = () => {
    if (!engine) return;
    const interval = setInterval(() => {
      setHealth(engine.getHealth());
      setSnapshots(engine.getSnapshots(50));
      setAssessments(engine.getAssessments(50));
    }, 2000);
    return () => clearInterval(interval);
  };

  if (!engine || !isInitialized) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Initializing Situational Awareness...
      </div>
    );
  }

  const latest = snapshots[0];
  const latestAssess = assessments[0];

  const severityColors = {
    normal: 'text-green-400 bg-green-900/30 border-green-900/50',
    elevated: 'text-yellow-400 bg-yellow-900/30 border-yellow-900/50',
    high: 'text-orange-400 bg-orange-900/30 border-orange-900/50',
    critical: 'text-red-400 bg-red-900/30 border-red-900/50',
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-background">
      {/* Top Status Bar */}
      <div className="flex gap-4 min-h-0 overflow-x-auto pb-2">
        <div className={`flex-1 min-w-[200px] p-4 rounded-xl border border-border ${severityColors[health?.latestSeverity || 'normal']}`}>
          <div className="text-xs uppercase tracking-wide opacity-70">Current Situation</div>
          <div className="text-2xl font-bold truncate">{(health?.latestSeverity || 'normal').toUpperCase()}</div>
          <div className="text-xs mt-1 opacity-70">{latestAssess?.summary || 'Assessing environment...'}</div>
        </div>
        <div className="flex-1 min-w-[150px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">CPU Usage</div>
          <div className="text-2xl font-bold text-white">{(latest?.system.cpuUsage || 0).toFixed(1)}%</div>
          <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${latest?.system.cpuUsage || 0}%` }}></div>
          </div>
        </div>
        <div className="flex-1 min-w-[150px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Memory Usage</div>
          <div className="text-2xl font-bold text-white">{(latest?.system.memoryUsage || 0).toFixed(1)}%</div>
          <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${latest?.system.memoryUsage || 0}%` }}></div>
          </div>
        </div>
        <div className="flex-1 min-w-[150px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">User State</div>
          <div className="text-2xl font-bold text-white">{(latest?.user.attentionState || 'idle').toUpperCase()}</div>
          <div className="text-xs text-gray-500 mt-1">Idle: {( (latest?.user.idleTimeMs || 0) / 1000).toFixed(0)}s</div>
        </div>
        <div className="flex-1 min-w-[150px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">HCU Utilization</div>
          <div className="text-2xl font-bold text-white">{health?.totalHCUSpent.toFixed(2)} / hr</div>
          <div className="text-xs text-gray-500 mt-1">Limit: {health?.hcuBudgetPerHour}</div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Panel - Detailed System Stats */}
        <div className="w-80 bg-card rounded-xl border border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-white">Environment</h3>
            <span className="text-xs text-gray-400">Live Snapshots</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">System Resources</h4>
              <div className="space-y-4">
                <ResourceMetric label="CPU" value={latest?.system.cpuUsage || 0} color="bg-blue-500" />
                <ResourceMetric label="Memory" value={latest?.system.memoryUsage || 0} color="bg-green-500" />
                <ResourceMetric label="Disk" value={latest?.system.diskUsage || 0} color="bg-purple-500" />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Network I/O</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-background/50 rounded-lg p-2">
                  <div className="text-xs text-gray-500 uppercase">RX</div>
                  <div className="text-sm font-mono text-white">{( (latest?.system.networkIO.rx || 0) / 1024).toFixed(0)} KB/s</div>
                </div>
                <div className="bg-background/50 rounded-lg p-2">
                  <div className="text-xs text-gray-500 uppercase">TX</div>
                  <div className="text-sm font-mono text-white">{( (latest?.system.networkIO.tx || 0) / 1024).toFixed(0)} KB/s</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Active Apps</h4>
              <div className="space-y-1">
                {latest?.application.activeWindows.map(win => (
                  <div key={win} className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${latest?.application.focusedApp === win ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-background/50 text-gray-400'}`}>
                    {win}
                    {latest?.application.focusedApp === win && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Main Stream */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex gap-1 bg-card rounded-xl border border-border p-1 mb-4">
            <button
              onClick={() => setActiveTab('assessments')}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'assessments' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Assessments
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'system' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Snapshot History
            </button>
            <button
              onClick={() => setActiveTab('context')}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'context' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Intelligence Context
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
            {activeTab === 'assessments' && (
              <div className="space-y-4">
                {assessments.map(assess => (
                  <AssessmentCard key={assess.id} assessment={assess} severityColors={severityColors} />
                ))}
                {assessments.length === 0 && (
                  <div className="text-center text-gray-500 py-20">Monitoring environment for situation assessments...</div>
                )}
              </div>
            )}

            {activeTab === 'system' && (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-background/50 text-gray-400 uppercase tracking-wider font-medium border-b border-border">
                    <tr>
                      <th className="px-4 py-2">Time</th>
                      <th className="px-4 py-2">CPU</th>
                      <th className="px-4 py-2">MEM</th>
                      <th className="px-4 py-2">State</th>
                      <th className="px-4 py-2">Focused App</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {snapshots.slice(0, 50).map(snap => (
                      <tr key={snap.id} className="hover:bg-white/5 transition-colors text-gray-300">
                        <td className="px-4 py-2 font-mono">{new Date(snap.timestamp).toLocaleTimeString()}</td>
                        <td className="px-4 py-2">{snap.system.cpuUsage.toFixed(1)}%</td>
                        <td className="px-4 py-2">{snap.system.memoryUsage.toFixed(1)}%</td>
                        <td className="px-4 py-2 capitalize">{snap.user.attentionState}</td>
                        <td className="px-4 py-2 truncate max-w-[150px]">{snap.application.focusedApp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'context' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ContextCard title="Current Goal" content={latest?.context.currentGoal || 'None'} />
                <ContextCard title="Active Intelligence Tasks" items={latest?.context.activeTasks || []} />
                <ContextCard title="Recent Autonomous Decisions" items={latest?.context.recentDecisions || []} />
                <ContextCard title="User Attention" content={`State: ${latest?.user.attentionState || 'unknown'}, Last input: ${latest ? new Date(latest.user.lastInput).toLocaleTimeString() : 'none'}`} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceMetric({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-mono">{value.toFixed(1)}%</span>
      </div>
      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}

function AssessmentCard({ assessment, severityColors }: { assessment: SituationAssessment, severityColors: any }) {
  return (
    <div className={`rounded-xl border p-4 ${severityColors[assessment.severity]}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold uppercase tracking-wider">{assessment.severity}</span>
            <span className="opacity-70 font-mono text-xs">{new Date(assessment.timestamp).toLocaleTimeString()}</span>
          </div>
          <p className="font-medium text-lg">{assessment.summary}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] opacity-60 font-mono">{assessment.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Situation Factors</h4>
          <div className="space-y-2">
            {assessment.factors.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm bg-black/20 p-2 rounded-lg">
                <span className="mt-1 w-2 h-2 rounded-full bg-current opacity-70"></span>
                <div>
                  <div className="font-medium">{f.description}</div>
                  <div className="text-[10px] opacity-60 uppercase">{f.type} • Source: {f.source}</div>
                </div>
              </div>
            ))}
            {assessment.factors.length === 0 && <div className="text-xs opacity-60 italic">No significant factors identified.</div>}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Recommended Actions</h4>
          <div className="space-y-2">
            {assessment.recommendedActions.map((action, i) => (
              <div key={i} className="flex items-center gap-2 text-sm font-medium">
                <span className="text-primary text-base">›</span>
                {action}
              </div>
            ))}
            {assessment.recommendedActions.length === 0 && <div className="text-xs opacity-60 italic">Maintain current state.</div>}
          </div>
          {assessment.autoActionTaken && (
            <div className="mt-3 p-2 bg-blue-900/40 rounded-lg border border-blue-700/50 text-xs font-bold text-blue-300">
              ⚡ AUTO-EXECUTED: {assessment.autoActionTaken}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContextCard({ title, content, items }: { title: string, content?: string, items?: string[] }) {
  return (
    <div className="bg-card p-4 rounded-xl border border-border">
      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">{title}</h4>
      {content && <p className="text-sm text-white font-medium">{content}</p>}
      {items && (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-white flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              {item}
            </li>
          ))}
          {items.length === 0 && <li className="text-sm text-gray-500 italic">None active</li>}
        </ul>
      )}
    </div>
  );
}

export default SituationalAwarenessDashboard;