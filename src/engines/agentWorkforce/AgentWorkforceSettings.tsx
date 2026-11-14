// src/engines/agentWorkforce/AgentWorkforceSettings.tsx
// Settings UI for Agent Workforce Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { AgentWorkforceEngine } from './AgentWorkforceEngine';
import type { WorkforceConfig } from './types';

export function AgentWorkforceSettings() {
  const { engine } = useEngine('agentWorkforce') as { engine: AgentWorkforceEngine | null };
  const [config, setConfig] = useState<WorkforceConfig | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!engine) return;
    setConfig(engine.getConfig());
  }, [engine]);

  const handleSave = () => {
    if (!engine || !config) return;
    engine.updateConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!config) {
    return <div className="p-6 text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="h-full overflow-y-auto p-6 max-w-2xl mx-auto space-y-6 bg-background">
      <div>
        <h2 className="text-xl font-bold text-white">Agent Workforce Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure hierarchical agent orchestration limits and budgets.</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Limits */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Orchestration Limits</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Agents</label>
              <input
                type="number"
                min="1"
                max="100"
                value={config.maxAgents}
                onChange={e => setConfig({ ...config, maxAgents: parseInt(e.target.value) || 1 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Hierarchy Depth</label>
              <input
                type="number"
                min="1"
                max="4"
                value={config.maxDepth}
                onChange={e => setConfig({ ...config, maxDepth: parseInt(e.target.value) || 1 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Default HCU Budget</label>
              <input
                type="number"
                min="10"
                max="1000"
                value={config.defaultHCUBudget}
                onChange={e => setConfig({ ...config, defaultHCUBudget: parseFloat(e.target.value) || 10 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Task Timeout (ms)</label>
              <input
                type="number"
                min="10000"
                max="600000"
                value={config.taskTimeoutMs}
                onChange={e => setConfig({ ...config, taskTimeoutMs: parseInt(e.target.value) || 30000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Sync & Features */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Sync & Memory</h3>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm text-white font-medium">Enable CRDT Sync</label>
              <p className="text-xs text-gray-400">Synchronize memory vectors across all agents via CRDT logs</p>
            </div>
            <input
              type="checkbox"
              checked={config.enableCRDTSync}
              onChange={e => setConfig({ ...config, enableCRDTSync: e.target.checked })}
              className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Memory Vector Dimension</label>
            <input
              type="number"
              disabled
              value={config.memoryVectorDimension}
              className="w-full bg-input/50 border border-border rounded-lg px-3 py-2 text-gray-400 text-sm cursor-not-allowed"
            />
            <span className="text-xs text-gray-500 mt-1 block">Fixed at 384 dimensions</span>
          </div>
        </div>

        {/* Cost Governor */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Cost Governor</h3>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm text-white font-medium">Enable Cost Governor</label>
              <p className="text-xs text-gray-400">Monitor total HCU spend and emit alerts at threshold</p>
            </div>
            <input
              type="checkbox"
              checked={config.costGovernor.enabled}
              onChange={e => setConfig({
                ...config,
                costGovernor: { ...config.costGovernor, enabled: e.target.checked }
              })}
              className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Total HCU</label>
              <input
                type="number"
                min="100"
                max="10000"
                value={config.costGovernor.maxTotalHCU}
                onChange={e => setConfig({
                  ...config,
                  costGovernor: { ...config.costGovernor, maxTotalHCU: parseFloat(e.target.value) || 1000 }
                })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Alert Threshold (0 - 1)</label>
              <input
                type="number"
                min="0.1"
                max="1"
                step="0.05"
                value={config.costGovernor.alertThreshold}
                onChange={e => setConfig({
                  ...config,
                  costGovernor: { ...config.costGovernor, alertThreshold: parseFloat(e.target.value) || 0.8 }
                })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
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

export default AgentWorkforceSettings;