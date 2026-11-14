// src/engines/selfImprovement/SelfImprovementDashboard.tsx
// Dashboard UI for Self-Improvement Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { SelfImprovementEngine } from './SelfImprovementEngine';
import type { ImprovementCycle, ProposedChange, SelfImprovementEvent } from './types';

export function SelfImprovementDashboard() {
  const { engine } = useEngine('selfImprovement') as { engine: SelfImprovementEngine | null };
  const [health, setHealth] = useState<ReturnType<SelfImprovementEngine['getHealth']> | null>(null);
  const [cycles, setCycles] = useState<ImprovementCycle[]>([]);
  const [pendingChanges, setPendingChanges] = useState<ProposedChange[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!engine) return;

    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
      startPolling();
    };

    const unsubCycle = engine.onEvent('cycle_started', (e) => setCycles(prev => [e.cycle, ...prev.slice(0, 49)]));
    const unsubChange = engine.onEvent('change_proposed', (e) => setPendingChanges(prev => [...prev, e.change]));
    const unsubApplied = engine.onEvent('change_applied', () => {
      setPendingChanges(engine.getPendingChanges());
      setCycles(engine.getCycles(50));
    });
    const unsubRejected = engine.onEvent('change_rejected', () => {
      setPendingChanges(engine.getPendingChanges());
      setCycles(engine.getCycles(50));
    });

    init();

    return () => {
      unsubCycle();
      unsubChange();
      unsubApplied();
      unsubRejected();
    };
  }, [engine]);

  const startPolling = () => {
    if (!engine) return;
    const interval = setInterval(() => {
      setHealth(engine.getHealth());
      setCycles(engine.getCycles(50));
      setPendingChanges(engine.getPendingChanges());
    }, 3000);
    return () => clearInterval(interval);
  };

  const handleForceCycle = () => {
    engine?.forceCycle();
  };

  const handleApprove = (changeId: string) => {
    engine?.approveChange(changeId);
    setPendingChanges(engine.getPendingChanges());
  };

  const handleReject = (changeId: string) => {
    const reason = prompt('Rejection reason:') || 'Manual rejection';
    if (reason) {
      engine?.rejectChange(changeId, reason);
      setPendingChanges(engine.getPendingChanges());
    }
  };

  if (!engine || !isInitialized) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Initializing Self-Improvement...
      </div>
    );
  }

  const statusColors = {
    planning: 'text-blue-400 bg-blue-900/30',
    executing: 'text-yellow-400 bg-yellow-900/30',
    evaluating: 'text-purple-400 bg-purple-900/30',
    completed: 'text-green-400 bg-green-900/30',
    rolled_back: 'text-red-400 bg-red-900/30',
  };

  const verdictColors = {
    accept: 'text-green-400',
    reject: 'text-red-400',
    partial: 'text-yellow-400',
  };

  const riskColors = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-red-400',
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-background">
      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Total Cycles</div>
          <div className="text-3xl font-bold text-white">{health?.totalCycles || 0}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">This Hour</div>
          <div className="text-3xl font-bold text-yellow-400">{health?.cyclesThisHour || 0} / {health?.maxCyclesPerHour}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Applied Changes</div>
          <div className="text-3xl font-bold text-green-400">{health?.appliedChanges || 0}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Pending Review</div>
          <div className="text-3xl font-bold text-blue-400">{health?.pendingChanges || 0}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">HCU Spent</div>
          <div className="text-3xl font-bold text-white">{health?.totalHCUSpent.toFixed(2) || 0}</div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Panel - Cycle History */}
        <div className="w-80 bg-card rounded-xl border border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-white">Improvement Cycles</h3>
            <button
              onClick={handleForceCycle}
              className="px-3 py-1.5 bg-primary hover:bg-primary/85 text-white rounded-lg text-xs font-medium"
            >
              Force Cycle
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {cycles.slice(0, 30).map(cycle => (
              <CycleCard key={cycle.id} cycle={cycle} statusColors={statusColors} verdictColors={verdictColors} />
            ))}
            {cycles.length === 0 && (
              <div className="text-center text-gray-500 py-8 text-sm">No cycles completed yet. Waiting for first cycle...</div>
            )}
          </div>
        </div>

        {/* Center Panel - Pending Changes */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b border-border flex items-center justify-between bg-card rounded-xl border border-border">
            <h3 className="font-semibold text-white">Pending Changes ({pendingChanges.length})</h3>
            <div className="text-xs text-gray-400">Requires review</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {pendingChanges.map(change => (
              <PendingChangeCard
                key={change.id}
                change={change}
                onApprove={handleApprove}
                onReject={handleReject}
                riskColors={riskColors}
              />
            ))}
            {pendingChanges.length === 0 && (
              <div className="text-center text-gray-500 py-20">
                <div className="text-4xl mb-4">⏳</div>
                <div>No changes awaiting review</div>
                <div className="text-sm mt-2">Changes will appear here after each improvement cycle</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Applied & Stats */}
        <div className="w-72 bg-card rounded-xl border border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-white">Recently Applied</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {engine.getAppliedChanges(10).map(change => (
              <div key={change.id} className="bg-green-900/20 border border-green-900/30 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-green-400">{change.target}</span>
                  <span className={`text-xs ${riskColors[change.riskLevel]}`}>{change.riskLevel}</span>
                </div>
                <div className="text-gray-300 truncate">{change.description}</div>
                <div className="text-xs text-gray-500 mt-1 font-mono">{change.id}</div>
              </div>
            ))}
            {engine.getAppliedChanges(10).length === 0 && (
              <div className="text-center text-gray-500 py-8 text-sm">No changes applied yet</div>
            )}
          </div>

          <div className="border-t border-border p-4">
            <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide mb-3">Cycle Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Auto-apply threshold</span>
                <span className="text-white font-mono">{(engine.getConfig().autoApplyThreshold * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Budget per cycle</span>
                <span className="text-white font-mono">{health?.hcuBudgetPerCycle} HCU</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Interval</span>
                <span className="text-white font-mono">{(engine.getConfig().cycleIntervalMs / 1000).toFixed(0)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max cycles/hour</span>
                <span className="text-white font-mono">{health?.maxCyclesPerHour}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CycleCard({
  cycle,
  statusColors,
  verdictColors,
}: {
  cycle: ImprovementCycle;
  statusColors: Record<string, string>;
  verdictColors: Record<string, string>;
}) {
  return (
    <div className="bg-background/50 rounded-lg p-3 border-l-2 border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-white truncate pr-2">{cycle.focus}</span>
        <span className={`px-2 py-0.5 rounded text-xs ${statusColors[cycle.status]}`}>
          {cycle.status}
        </span>
      </div>
      <div className="text-xs text-gray-500 font-mono mb-2">{new Date(cycle.timestamp).toLocaleTimeString()}</div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-400">{cycle.changes.length} changes</span>
        <span className="text-xs text-gray-400">Cost: {cycle.hcuCost.toFixed(2)} HCU</span>
      </div>
      {cycle.results && (
        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
          <span className={`text-xs font-bold ${verdictColors[cycle.results.verdict]}`}>
            {cycle.results.verdict.toUpperCase()}
          </span>
          <span className="text-[10px] text-gray-500">
            Perf: {(cycle.results.performanceDelta * 100).toFixed(1)}% | Quality: {(cycle.results.qualityDelta * 100).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

function PendingChangeCard({
  change,
  onApprove,
  onReject,
  riskColors,
}: {
  change: ProposedChange;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  riskColors: Record<string, string>;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white">{change.target}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs bg-black/20 ${riskColors[change.riskLevel]}`}>
              {change.riskLevel.toUpperCase()}
            </span>
            <span className="px-1.5 py-0.5 rounded text-xs bg-black/20 text-blue-400">
              {change.type}
            </span>
          </div>
          <p className="text-gray-300 mb-2">{change.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>Impact: {(change.estimatedImpact * 100).toFixed(0)}%</span>
            <span>Cost: {change.estimatedCost.toFixed(2)} HCU</span>
          </div>
        </div>
        <span className="text-[10px] font-mono opacity-50">{change.id}</span>
      </div>

      {change.codeDiff && (
        <details className="mb-3 group">
          <summary className="text-xs text-gray-400 cursor-pointer flex items-center gap-1">
            <span className="transition-transform group-open:rotate-90">›</span>
            Show Diff
          </summary>
          <pre className="mt-2 p-2 bg-black/30 rounded text-[10px] text-gray-300 overflow-x-auto max-h-32">
            {change.codeDiff}
          </pre>
        </details>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onApprove(change.id)}
          className="flex-1 px-3 py-2 bg-green-900/30 hover:bg-green-900/50 text-green-400 rounded-lg text-sm font-medium"
        >
          Approve & Apply
        </button>
        <button
          onClick={() => onReject(change.id)}
          className="flex-1 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-sm font-medium"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export default SelfImprovementDashboard;