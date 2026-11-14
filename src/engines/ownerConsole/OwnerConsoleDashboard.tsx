// src/engines/ownerConsole/OwnerConsoleDashboard.tsx
// Dashboard UI for Owner Console Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { OwnerConsoleEngine } from './OwnerConsoleEngine';
import type { EngineState, SystemCommand, BudgetAllocation, SystemNotification, OwnerEvent, OwnerHealth, EngineId } from './types';

export function OwnerConsoleDashboard() {
  const { engine } = useEngine('ownerConsole') as { engine: OwnerConsoleEngine | null };
  const [health, setHealth] = useState<OwnerHealth | null>(null);
  const [engineStates, setEngineStates] = useState<EngineState[]>([]);
  const [commands, setCommands] = useState<SystemCommand[]>([]);
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'engines' | 'commands' | 'budget' | 'notifications' | 'emergency'>('engines');
  const [selectedEngine, setSelectedEngine] = useState<EngineState | null>(null);

  useEffect(() => {
    if (!engine) return;

    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
      startPolling();
    };

    const unsubEngine = engine.onEvent('engine_state_changed', (e) => setEngineStates(engine.getAllEngineStates()));
    const unsubCommand = engine.onEvent('command_executed', (e) => setCommands(engine.getCommands()));
    const unsubBudget = engine.onEvent('budget_changed', (e) => setAllocations(e.allocations));
    const unsubNotif = engine.onEvent('notification', () => setNotifications(engine.getNotifications(50)));
    const unsubGlobal = engine.onEvent('global_stop', () => setEngineStates(engine.getAllEngineStates()));
    const unsubEmergency = engine.onEvent('emergency_override', () => setEngineStates(engine.getAllEngineStates()));

    init();

    return () => {
      unsubEngine();
      unsubCommand();
      unsubBudget();
      unsubNotif();
      unsubGlobal();
      unsubEmergency();
    };
  }, [engine]);

  const startPolling = () => {
    if (!engine) return;
    const interval = setInterval(() => {
      setHealth(engine.getHealth());
      setEngineStates(engine.getAllEngineStates());
      setCommands(engine.getCommands());
      setAllocations(engine.getAllAllocations());
      setNotifications(engine.getNotifications(50));
    }, 3000);
    return () => clearInterval(interval);
  };

  if (!engine || !isInitialized) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Initializing Owner Console...
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    running: 'text-green-400 bg-green-900/30 border-green-700/50',
    stopped: 'text-gray-400 bg-gray-900/30 border-gray-700/50',
    error: 'text-red-400 bg-red-900/30 border-red-700/50',
    initializing: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50',
    degraded: 'text-orange-400 bg-orange-900/30 border-orange-700/50',
  };

  const statusIcons: Record<string, string> = {
    running: '●',
    stopped: '○',
    error: '✕',
    initializing: '◐',
    degraded: '⚠',
  };

  const priorityColors: Record<string, string> = {
    critical: 'text-red-400',
    high: 'text-orange-400',
    normal: 'text-blue-400',
    low: 'text-gray-400',
  };

  const systemStatusColors: Record<string, string> = {
    healthy: 'text-green-400 bg-green-900/30 border-green-700/50',
    degraded: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50',
    critical: 'text-red-400 bg-red-900/30 border-red-700/50',
    emergency_stop: 'text-red-400 bg-red-900/50 border-red-500',
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-background">
      {/* System Status Banner */}
      <div className={`p-4 rounded-xl border ${systemStatusColors[health?.systemStatus || 'healthy']}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl">{health?.systemStatus === 'emergency_stop' ? '🚨' : health?.systemStatus === 'critical' ? '🔴' : health?.systemStatus === 'degraded' ? '🟡' : '🟢'}</div>
            <div>
              <div className="font-bold text-white text-lg uppercase">{health?.systemStatus || 'HEALTHY'}</div>
              <div className="text-sm text-gray-400">
                {health?.enginesRunning || 0} / {health?.enginesTotal || 0} engines running • HCU: {health?.totalHCUSpent.toFixed(1) || 0} / {health?.globalHCUBudget || 0}/hr
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {health?.emergencyOverrideActive && (
              <span className="px-3 py-1 bg-red-600 text-white rounded text-xs font-bold animate-pulse">EMERGENCY OVERRIDE ACTIVE</span>
            )}
            {health?.globalStopped && !health?.emergencyOverrideActive && (
              <span className="px-3 py-1 bg-red-900/50 text-red-400 border border-red-500 rounded text-xs font-bold">GLOBAL STOP</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex gap-4 min-h-0 overflow-x-auto pb-2">
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Total HCU Allocated</div>
          <div className="text-3xl font-bold text-white">{health?.totalHCUAllocated.toFixed(1) || 0}</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">HCU Spent</div>
          <div className="text-3xl font-bold text-yellow-400">{health?.totalHCUSpent.toFixed(1) || 0}</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Pending Commands</div>
          <div className="text-3xl font-bold text-blue-400">{health?.pendingCommands || 0}</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Unread Notifications</div>
          <div className="text-3xl font-bold text-purple-400">{health?.activeNotifications || 0}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-card rounded-xl border border-border p-1">
        <button
          onClick={() => setActiveTab('engines')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'engines' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Engines ({engineStates.filter(e => e.status === 'running').length}/{engineStates.length})
        </button>
        <button
          onClick={() => setActiveTab('commands')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'commands' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Commands ({commands.filter(c => c.status === 'pending' || c.status === 'executing').length})
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'budget' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Budget
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Notifications ({notifications.filter(n => !n.read).length})
        </button>
        <button
          onClick={() => setActiveTab('emergency')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'emergency' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Emergency
        </button>
      </div>

      {/* Content Panels */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'engines' && (
          <EnginesPanel
            engines={engineStates}
            statusColors={statusColors}
            statusIcons={statusIcons}
            onSelect={setSelectedEngine}
            selectedEngine={selectedEngine}
            engine={engine}
          />
        )}
        {activeTab === 'commands' && (
          <CommandsPanel commands={commands} engine={engine} />
        )}
        {activeTab === 'budget' && (
          <BudgetPanel allocations={allocations} priorityColors={priorityColors} engine={engine} health={health} />
        )}
        {activeTab === 'notifications' && (
          <NotificationsPanel notifications={notifications} engine={engine} />
        )}
        {activeTab === 'emergency' && (
          <EmergencyPanel engine={engine} health={health} />
        )}
      </div>
    </div>
  );
}

function EnginesPanel({
  engines,
  statusColors,
  statusIcons,
  onSelect,
  selectedEngine,
  engine,
}: {
  engines: EngineState[];
  statusColors: Record<string, string>;
  statusIcons: Record<string, string>;
  onSelect: (e: EngineState) => void;
  selectedEngine: EngineState | null;
  engine: OwnerConsoleEngine;
}) {
  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {engines.map(state => (
          <EngineCard
            key={state.id}
            state={state}
            statusColors={statusColors}
            statusIcons={statusIcons}
            isSelected={selectedEngine?.id === state.id}
            onClick={() => onSelect(state)}
            engine={engine}
          />
        ))}
      </div>

      {selectedEngine && (
        <div className="mt-6 bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold text-white mb-4">Engine Details: {selectedEngine.name}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-400">ID</div>
              <div className="font-mono text-white">{selectedEngine.id}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Status</div>
              <div className="font-mono text-white capitalize">{selectedEngine.status}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Enabled</div>
              <div className="font-mono text-white">{selectedEngine.enabled ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">HCU Budget</div>
              <div className="font-mono text-white">{selectedEngine.hcuBudget}/hr</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">HCU Spent</div>
              <div className="font-mono text-yellow-400">{selectedEngine.hcuSpent.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Last Started</div>
              <div className="font-mono text-white">{selectedEngine.lastStarted ? new Date(selectedEngine.lastStarted).toLocaleString() : 'Never'}</div>
            </div>
            {selectedEngine.lastError && (
              <div className="col-span-2">
                <div className="text-xs text-gray-400">Last Error</div>
                <div className="font-mono text-red-400 bg-red-900/30 p-2 rounded">{selectedEngine.lastError}</div>
              </div>
            )}
            <div className="col-span-2">
              <div className="text-xs text-gray-400">Health</div>
              <pre className="text-xs text-gray-300 bg-black/30 p-2 rounded overflow-auto max-h-32">{JSON.stringify(selectedEngine.health, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EngineCard({
  state,
  statusColors,
  statusIcons,
  isSelected,
  onClick,
  engine,
}: {
  state: EngineState;
  statusColors: Record<string, string>;
  statusIcons: Record<string, string>;
  isSelected: boolean;
  onClick: () => void;
  engine: OwnerConsoleEngine;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/10' : statusColors[state.status]} hover:border-primary/50`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{statusIcons[state.status]}</span>
          <div>
            <div className="font-bold text-white">{state.name}</div>
            <div className="text-xs text-gray-400 font-mono">{state.id}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium uppercase ${state.enabled ? 'text-green-400' : 'text-gray-400'}`}>
            {state.enabled ? 'ENABLED' : 'DISABLED'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs mb-3">
        <span className="text-gray-400">Budget: <span className="text-white">{state.hcuBudget}/hr</span></span>
        <span className="text-yellow-400">Spent: {state.hcuSpent.toFixed(2)}</span>
      </div>

      <div className="flex gap-2">
        {state.status === 'running' && state.enabled && (
          <button
            onClick={(e) => { e.stopPropagation(); engine.stopEngine(state.id); }}
            className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-medium"
          >
            Stop
          </button>
        )}
        {state.status === 'stopped' && state.enabled && (
          <button
            onClick={(e) => { e.stopPropagation(); engine.startEngine(state.id); }}
            className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-medium"
          >
            Start
          </button>
        )}
        {!state.enabled && (
          <button
            onClick={(e) => { e.stopPropagation(); engine.enableEngine(state.id); }}
            className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium"
          >
            Enable
          </button>
        )}
        {state.enabled && state.status === 'running' && (
          <button
            onClick={(e) => { e.stopPropagation(); engine.disableEngine(state.id); }}
            className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs font-medium"
          >
            Disable
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); engine.restartEngine(state.id); }}
          className="flex-1 px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs font-medium"
        >
          Restart
        </button>
      </div>
    </div>
  );
}

function CommandsPanel({ commands, engine }: { commands: SystemCommand[], engine: OwnerConsoleEngine }) {
  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400',
    executing: 'text-blue-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
    cancelled: 'text-gray-400',
  };

  if (commands.length === 0) {
    return <div className="p-6 text-center text-gray-400">No commands executed yet</div>;
  }

  return (
    <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
      <div className="grid grid-cols-6 gap-2 text-[10px] font-medium text-gray-400 uppercase tracking-wider px-2 py-2 bg-background/50 rounded-lg">
        <span>Time</span>
        <span>Type</span>
        <span>Target</span>
        <span>Requested By</span>
        <span>Status</span>
        <span>Result</span>
      </div>
      <div className="space-y-1">
        {commands.slice(0, 50).map(cmd => (
          <div key={cmd.id} className="grid grid-cols-6 gap-2 text-xs px-2 py-2 bg-card rounded-lg border border-border hover:bg-white/5 transition-colors">
            <span className="font-mono text-gray-500">{new Date(cmd.timestamp).toLocaleTimeString()}</span>
            <span className="text-gray-300">{cmd.type.replace('_', ' ').toUpperCase()}</span>
            <span className="text-white font-mono truncate">{cmd.target || '—'}</span>
            <span className="text-gray-400 font-mono">{cmd.requestedBy}</span>
            <span className={statusColors[cmd.status]}>● {cmd.status.toUpperCase()}</span>
            <span className={cmd.status === 'completed' ? 'text-green-400' : cmd.status === 'failed' ? 'text-red-400' : 'text-gray-500'}>
              {cmd.status === 'completed' ? 'OK' : cmd.status === 'failed' ? (cmd.error || 'FAILED') : cmd.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetPanel({ allocations, priorityColors, engine, health }: { allocations: BudgetAllocation[], priorityColors: Record<string, string>, engine: OwnerConsoleEngine, health: OwnerHealth | null }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (allocation: BudgetAllocation) => {
    setEditingId(allocation.engineId);
    setEditValue(allocation.allocated.toString());
  };

  const handleSave = (engineId: EngineId) => {
    const value = parseFloat(editValue);
    if (!isNaN(value)) {
      engine.updateBudget(engineId, value);
    }
    setEditingId(null);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Budget Allocations</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">Global Budget: <span className="text-white">{health?.globalHCUBudget}/hr</span></span>
          <span className="text-yellow-400">Allocated: <span className="text-white">{health?.totalHCUAllocated.toFixed(1)}</span></span>
          <span className="text-green-400">Spent: <span className="text-white">{health?.totalHCUSpent.toFixed(1)}</span></span>
        </div>
      </div>

      <div className="space-y-2">
        {allocations.map(allocation => (
          <div key={allocation.engineId} className="p-3 bg-card rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="font-bold text-white">{allocation.engineId}</span>
                <span className={priorityColors[allocation.priority]}>● {allocation.priority.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                {editingId === allocation.engineId ? (
                  <>
                    <input
                      type="number"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="w-24 bg-input border border-border rounded px-2 py-1 text-white text-sm"
                    />
                    <button onClick={() => handleSave(allocation.engineId)} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-2 py-1 bg-gray-600 text-white rounded text-xs">Cancel</button>
                  </>
                ) : (
                  <button onClick={() => handleEdit(allocation)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs">Edit</button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-xs text-gray-400">Allocated</div>
                <div className="font-mono text-white">{allocation.allocated}/hr</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Spent</div>
                <div className="font-mono text-yellow-400">{allocation.spent.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Remaining</div>
                <div className="font-mono text-green-400">{Math.max(0, allocation.allocated - allocation.spent).toFixed(2)}</div>
              </div>
            </div>

            <div className="mt-2">
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${allocation.spent > allocation.allocated ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, (allocation.spent / Math.max(0.001, allocation.allocated)) * 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {allocation.spent > allocation.allocated ? '⚠ OVER BUDGET' : `${((allocation.spent / Math.max(0.001, allocation.allocated)) * 100).toFixed(1)}% utilized`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsPanel({ notifications, engine }: { notifications: SystemNotification[], engine: OwnerConsoleEngine }) {
  const typeColors: Record<SystemNotification['type'], string> = {
    info: 'text-blue-400 bg-blue-900/30 border-blue-700/50',
    warning: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50',
    error: 'text-red-400 bg-red-900/30 border-red-700/50',
    success: 'text-green-400 bg-green-900/30 border-green-700/50',
    critical: 'text-red-400 bg-red-900/50 border-red-500',
  };

  if (notifications.length === 0) {
    return <div className="p-6 text-center text-gray-400">No notifications</div>;
  }

  return (
    <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
      {notifications.map(notification => (
        <div key={notification.id} className={`p-4 rounded-xl border ${typeColors[notification.type]} ${notification.read ? 'opacity-60' : ''}`}>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white">{notification.title}</span>
                <span className="text-xs font-medium uppercase text-gray-400">{notification.type}</span>
                {!notification.read && <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>}
              </div>
              <p className="text-gray-300">{notification.message}</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-500 font-mono">{notification.id}</div>
              <div className="text-[10px] text-gray-400">{new Date(notification.timestamp).toLocaleString()}</div>
            </div>
          </div>

          {notification.actions && notification.actions.length > 0 && (
            <div className="flex gap-2">
              {notification.actions.map((action, i) => (
                <button key={i} className="px-3 py-1 bg-primary hover:bg-primary/85 text-white rounded text-xs">
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {!notification.read && (
            <button
              onClick={() => engine.markNotificationRead(notification.id)}
              className="mt-2 w-full px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-medium"
            >
              Mark as Read
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function EmergencyPanel({ engine, health }: { engine: OwnerConsoleEngine, health: OwnerHealth | null }) {
  const [globalStopReason, setGlobalStopReason] = useState('');
  const [emergencyReason, setEmergencyReason] = useState('');

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto">
      {/* Global Stop */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-white mb-2">Global Stop</h3>
        <p className="text-sm text-gray-400 mb-4">Stop all engines gracefully. Safety Trio and Owner Console remain running.</p>
        <div className="space-y-3">
          <input
            type="text"
            value={globalStopReason}
            onChange={e => setGlobalStopReason(e.target.value)}
            placeholder="Reason for global stop..."
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
          />
          <button
            onClick={async () => {
              if (globalStopReason.trim()) {
                await engine.globalStop(globalStopReason);
                setGlobalStopReason('');
              }
            }}
            disabled={!globalStopReason.trim() || health?.globalStopped}
            className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {health?.globalStopped ? 'GLOBAL STOP ACTIVE' : 'Execute Global Stop'}
          </button>
        </div>
      </div>

      {/* Emergency Override */}
      <div className="bg-card rounded-xl border border-red-500/50 p-6 bg-red-900/20">
        <h3 className="font-semibold text-red-400 mb-2">Emergency Override</h3>
        <p className="text-sm text-gray-400 mb-4">
          <strong>⚠️ DANGER:</strong> Immediately stops ALL engines except Safety Trio and Owner Console.
          Preserves only critical safety functions. Requires emergency stop to be enabled in config.
        </p>
        <div className="space-y-3">
          <input
            type="text"
            value={emergencyReason}
            onChange={e => setEmergencyReason(e.target.value)}
            placeholder="Reason for emergency override..."
            className="w-full bg-input border border-red-500/50 rounded-lg px-3 py-2 text-white text-sm"
          />
          <button
            onClick={async () => {
              if (emergencyReason.trim()) {
                await engine.emergencyOverride(emergencyReason);
                setEmergencyReason('');
              }
            }}
            disabled={!emergencyReason.trim() || health?.emergencyOverrideActive || !engine.getConfig().emergencyStopEnabled}
            className="w-full bg-red-700 hover:bg-red-600 text-white py-2 rounded-lg font-medium disabled:opacity-50 border border-red-500"
          >
            {health?.emergencyOverrideActive ? 'EMERGENCY OVERRIDE ACTIVE' : 'Execute Emergency Override'}
          </button>
          {health?.emergencyOverrideActive && (
            <button
              onClick={() => engine.clearEmergencyOverride()}
              className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-medium"
            >
              Clear Emergency Override (Restart Engines)
            </button>
          )}
        </div>
      </div>

      {/* System Snapshot */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-white mb-2">System Snapshot</h3>
        <button
          onClick={() => {
            const snapshot = engine.getSystemSnapshot();
            navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
            alert('Snapshot copied to clipboard');
          }}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm font-medium"
        >
          Copy Full System Snapshot
        </button>
      </div>
    </div>
  );
}

export default OwnerConsoleDashboard;