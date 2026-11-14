// src/engines/ownerConsole/OwnerConsoleSettings.tsx
// Settings UI for Owner Console Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { OwnerConsoleEngine } from './OwnerConsoleEngine';
import type { OwnerConfig, EngineId } from './types';

const ALL_ENGINES: EngineId[] = [
  'agentWorkforce',
  'autonomous',
  'continuousIntelligence',
  'situationalAwareness',
  'multiSense',
  'selfImprovement',
  'performanceQuality',
  'crossDevice',
  'safetyTrio',
  'guidanceWorld',
  'ownerConsole',
  'modes',
  'neverCutOff',
  'nativeMessaging',
  'rendering',
  'entity',
  'digup',
];

export function OwnerConsoleSettings() {
  const { engine } = useEngine('ownerConsole') as { engine: OwnerConsoleEngine | null };
  const [config, setConfig] = useState<OwnerConfig | null>(null);
  const [saved, setSaved] = useState(false);
  const [engineConfigs, setEngineConfigs] = useState<Record<string, { enabled: boolean; hcuBudget: number }>>({});

  useEffect(() => {
    if (!engine) return;
    const cfg = engine.getConfig();
    setConfig(cfg);
    // Initialize engine configs
    const initial: Record<string, { enabled: boolean; hcuBudget: number }> = {};
    for (const id of ALL_ENGINES) {
      const state = engine.getEngineState(id);
      if (state) {
        initial[id] = { enabled: state.enabled, hcuBudget: state.hcuBudget };
      }
    }
    setEngineConfigs(initial);
  }, [engine]);

  const handleSave = () => {
    if (!engine || !config) return;
    engine.updateConfig(config);
    // Also apply engine-specific configs
    const engineConfigsForUpdate: OwnerConfig['engines'] = {};
    for (const [id, ec] of Object.entries(engineConfigs)) {
      engineConfigsForUpdate[id as EngineId] = ec;
    }
    engine.updateConfig({ engines: engineConfigsForUpdate });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!config) {
    return <div className="p-6 text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto space-y-6 bg-background">
      <div>
        <h2 className="text-xl font-bold text-white">Owner Console Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure system-wide engine control, budgets, and emergency capabilities.</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Global Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Global Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Global HCU Budget Per Hour</label>
              <input
                type="number"
                min="1"
                max="200"
                step="0.5"
                value={config.globalHCUBudgetPerHour}
                onChange={e => setConfig({ ...config, globalHCUBudgetPerHour: parseFloat(e.target.value) || 50.0 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Concurrent Commands</label>
              <input
                type="number"
                min="1"
                max="20"
                value={config.maxConcurrentCommands}
                onChange={e => setConfig({ ...config, maxConcurrentCommands: parseInt(e.target.value) || 5 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Command Timeout (ms)</label>
              <input
                type="number"
                min="5000"
                max="300000"
                value={config.commandTimeoutMs}
                onChange={e => setConfig({ ...config, commandTimeoutMs: parseInt(e.target.value) || 30000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.emergencyStopEnabled}
                onChange={e => setConfig({ ...config, emergencyStopEnabled: e.target.checked })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Enable Emergency Stop / Override</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoRestartFailedEngines}
                onChange={e => setConfig({ ...config, autoRestartFailedEngines: e.target.checked })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Auto-Restart Failed Engines</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.broadcastEnabled}
                onChange={e => setConfig({ ...config, broadcastEnabled: e.target.checked })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Enable Broadcast Notifications</span>
            </label>
          </div>
        </div>

        {/* Engine Configurations */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Engine Configurations</h3>
          <p className="text-xs text-gray-500">Configure individual engine enable/disable and HCU budget allocation.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background/50 text-gray-400 uppercase tracking-wider font-medium border-b border-border">
                <tr>
                  <th className="px-4 py-2">Engine</th>
                  <th className="px-4 py-2">Enabled</th>
                  <th className="px-4 py-2">HCU Budget (/hr)</th>
                  <th className="px-4 py-2">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ALL_ENGINES.map(id => {
                  const ec = engineConfigs[id] || { enabled: true, hcuBudget: 1.0 };
                  const isSafety = id === 'safetyTrio';
                  const isOwner = id === 'ownerConsole';
                  return (
                    <tr key={id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{id}</div>
                        <div className="text-xs text-gray-500">{isSafety ? 'Critical Safety' : isOwner ? 'System Control' : ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={ec.enabled}
                          onChange={e => setEngineConfigs({ ...engineConfigs, [id]: { ...ec, enabled: e.target.checked } })}
                          className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
                          disabled={isSafety || isOwner}
                        />
                        {isSafety || isOwner ? <span className="text-xs text-gray-500 ml-2">(Required)</span> : null}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          max="50"
                          step="0.5"
                          value={ec.hcuBudget}
                          onChange={e => setEngineConfigs({ ...engineConfigs, [id]: { ...ec, hcuBudget: parseFloat(e.target.value) || 0 } })}
                          className="w-24 bg-input border border-border rounded-lg px-2 py-1.5 text-white text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${isSafety ? 'text-red-400' : 'text-gray-400'}`}>
                          {isSafety ? 'CRITICAL' : 'NORMAL'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border pt-6">
          {saved ? (
            <span className="text-xs text-green-400 font-medium">Settings saved successfully!</span>
          ) : (
            <span></span>
          )}
          <button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/85 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default OwnerConsoleSettings;