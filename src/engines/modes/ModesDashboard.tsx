// src/engines/modes/ModesDashboard.tsx
// Dashboard UI for Modes Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { ModesEngine } from './ModesEngine';
import type { Mode, ActiveMode, ModeTransition, ModesEvent, ModesHealth } from './types';

export function ModesDashboard() {
  const { engine } = useEngine('modes') as { engine: ModesEngine | null };
  const [health, setHealth] = useState<ModesHealth | null>(null);
  const [modes, setModes] = useState<Mode[]>([]);
  const [transitions, setTransitions] = useState<ModeTransition[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!engine) return;

    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
      startPolling();
    };

    const unsubActivated = engine.onEvent('mode_activated', () => {
      setModes(engine.getAllModes());
      setTransitions(engine.getTransitions(50));
    });
    const unsubDeactivated = engine.onEvent('mode_deactivated', () => setModes(engine.getAllModes()));
    const unsubTransition = engine.onEvent('mode_transition', () => setTransitions(engine.getTransitions(50)));

    init();

    return () => {
      unsubActivated();
      unsubDeactivated();
      unsubTransition();
    };
  }, [engine]);

  const startPolling = () => {
    if (!engine) return;
    const interval = setInterval(() => {
      setHealth(engine.getHealth());
      setModes(engine.getAllModes());
      setTransitions(engine.getTransitions(50));
    }, 3000);
    return () => clearInterval(interval);
  };

  if (!engine || !isInitialized) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Initializing Modes Engine...
      </div>
    );
  }

  const activeMode = health?.activeMode;

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-background">
      {/* Active Mode Banner */}
      {activeMode && (
        <div className="p-4 rounded-xl border border-primary/50 bg-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl">
                {modes.find(m => m.id === activeMode.modeId)?.icon || '🎯'}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-white">{modes.find(m => m.id === activeMode.modeId)?.name || 'Active'}</span>
                  <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded uppercase">{activeMode.activatedBy}</span>
                </div>
                <div className="text-sm text-gray-400">{modes.find(m => m.id === activeMode.modeId)?.description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Activated: {new Date(activeMode.activatedAt).toLocaleString()}
                  {activeMode.previousModeId && ` • From: ${modes.find(m => m.id === activeMode.previousModeId)?.name}`}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Cooldown</div>
              <div className="text-sm font-mono text-yellow-400">5s</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="flex gap-4 min-h-0 overflow-x-auto pb-2">
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Available Modes</div>
          <div className="text-3xl font-bold text-white">{health?.availableModes || 0}</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Enabled</div>
          <div className="text-3xl font-bold text-green-400">{health?.enabledModes || 0}</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Transitions</div>
          <div className="text-3xl font-bold text-blue-400">{health?.totalTransitions || 0}</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">HCU / Hour</div>
          <div className="text-3xl font-bold text-white">{health?.totalHCUSpent.toFixed(3) || 0} / {health?.hcuBudgetPerHour || 0}</div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Panel - Mode Grid */}
        <div className="w-80 bg-card rounded-xl border border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-white">Available Modes</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {modes.map(mode => (
              <ModeCard
                key={mode.id}
                mode={mode}
                isActive={activeMode?.modeId === mode.id}
                onActivate={() => engine.activateMode(mode.id, 'manual', { reason: 'dashboard_click' })}
              />
            ))}
          </div>
        </div>

        {/* Center Panel - Active Mode Details */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeMode ? (
            <ActiveModeDetail
              mode={modes.find(m => m.id === activeMode.modeId)!}
              activeMode={activeMode}
              transitions={transitions.filter(t => t.to === activeMode.modeId || t.from === activeMode.modeId)}
            />
          ) : (
            <div className="flex-1 bg-card rounded-xl border border-border p-8 text-center text-gray-400">
              No active mode
            </div>
          )}
        </div>

        {/* Right Panel - Transition History */}
        <div className="w-80 bg-card rounded-xl border border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-white">Transition History ({transitions.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {transitions.length === 0 ? (
              <div className="text-center text-gray-500 py-20">No transitions yet</div>
            ) : (
              transitions.map(transition => (
                <TransitionCard key={transition.timestamp} transition={transition} modes={modes} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeCard({ mode, isActive, onActivate }: { mode: Mode, isActive: boolean, onActivate: () => void }) {
  return (
    <div
      onClick={onActivate}
      className={`p-3 rounded-xl border cursor-pointer transition-all ${isActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{mode.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white truncate">{mode.name}</div>
          <div className="text-[10px] text-gray-400 truncate">{mode.description}</div>
        </div>
        <div className="flex items-center gap-2">
          {mode.enabled ? (
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
          )}
          {isActive && <span className="text-xs text-primary font-medium">ACTIVE</span>}
        </div>
      </div>
    </div>
  );
}

function ActiveModeDetail({ mode, activeMode, transitions }: { mode: Mode, activeMode: ActiveMode, transitions: ModeTransition[] }) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-4 bg-background/50 rounded-xl border border-border mb-4">
        <h3 className="font-semibold text-white mb-3">Engine Configurations</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {Object.entries(mode.engineConfigs).map(([engineId, config]) => (
            <div key={engineId} className="p-2 bg-black/20 rounded-lg">
              <div className="text-xs font-medium text-gray-300 uppercase">{engineId}</div>
              <pre className="text-[10px] text-gray-400 mt-1">{JSON.stringify(config, null, 2)}</pre>
            </div>
          ))}
          {Object.keys(mode.engineConfigs).length === 0 && (
            <div className="text-center text-gray-500 py-4">No engine overrides for this mode</div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-card rounded-xl border border-border flex flex-col min-h-0">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-white">UI Overrides</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <pre className="text-xs text-gray-300">{JSON.stringify(mode.uiOverrides, null, 2)}</pre>
        </div>

        <div className="p-4 border-t border-border">
          <h3 className="font-semibold text-white mb-3">Triggers</h3>
          <div className="space-y-2">
            {mode.triggers.map((trigger, i) => (
              <div key={i} className="p-2 bg-background/50 rounded-lg text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 capitalize">{trigger.type}</span>
                  <span className={`text-xs font-medium ${trigger.priority >= 7 ? 'text-red-400' : trigger.priority >= 5 ? 'text-yellow-400' : 'text-gray-400'}`}>
                    Priority: {trigger.priority}
                  </span>
                </div>
                <pre className="text-[10px] text-gray-500 mt-1">{JSON.stringify(trigger.condition, null, 2)}</pre>
              </div>
            ))}
          </div>
        </div>

        {mode.schedule && (
          <div className="p-4 border-t border-border">
            <h3 className="font-semibold text-white mb-2">Schedule</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <div>Days: {mode.schedule.days.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}</div>
              <div>Time: {mode.schedule.startTime} - {mode.schedule.endTime}</div>
              <div>Timezone: {mode.schedule.timezone}</div>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-border">
          <h3 className="font-semibold text-white mb-2">Context</h3>
          <pre className="text-xs text-gray-300">{JSON.stringify(activeMode.context, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

function TransitionCard({ transition, modes }: { transition: ModeTransition, modes: Mode[] }) {
  const fromMode = modes.find(m => m.id === transition.from);
  const toMode = modes.find(m => m.id === transition.to);

  return (
    <div className="p-3 bg-background/50 rounded-lg border border-border">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{fromMode?.icon || '❓'}</span>
        <span className="text-primary text-xl">→</span>
        <span className="text-xl">{toMode?.icon || '❓'}</span>
      </div>
      <div className="text-xs text-gray-400 font-mono">{new Date(transition.timestamp).toLocaleTimeString()}</div>
      <div className="text-xs text-gray-500">{transition.triggeredBy} • {transition.reason}</div>
    </div>
  );
}

export default ModesDashboard;