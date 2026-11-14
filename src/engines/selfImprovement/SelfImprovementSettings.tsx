// src/engines/selfImprovement/SelfImprovementSettings.tsx
// Settings UI for Self-Improvement Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { SelfImprovementEngine } from './SelfImprovementEngine';
import type { SelfImprovementConfig } from './types';

export function SelfImprovementSettings() {
  const { engine } = useEngine('selfImprovement') as { engine: SelfImprovementEngine | null };
  const [config, setConfig] = useState<SelfImprovementConfig | null>(null);
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
        <h2 className="text-xl font-bold text-white">Self-Improvement Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure autonomous improvement cycles, approval thresholds, and safety controls.</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Cycle Parameters */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Improvement Cycle Parameters</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cycle Interval (ms)</label>
              <input
                type="number"
                min="60000"
                max="3600000"
                value={config.cycleIntervalMs}
                onChange={e => setConfig({ ...config, cycleIntervalMs: parseInt(e.target.value) || 300000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Cycles Per Hour</label>
              <input
                type="number"
                min="1"
                max="50"
                value={config.maxCyclesPerHour}
                onChange={e => setConfig({ ...config, maxCyclesPerHour: parseInt(e.target.value) || 10 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">HCU Budget Per Cycle</label>
            <input
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={config.hcuBudgetPerCycle}
              onChange={e => setConfig({ ...config, hcuBudgetPerCycle: parseFloat(e.target.value) || 2.0 })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        </div>

        {/* Auto-Apply Threshold */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Auto-Apply Controls</h3>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Auto-Apply Threshold (0 - 1)</label>
            <input
              type="number"
              min="0.1"
              max="1"
              step="0.05"
              value={config.autoApplyThreshold}
              onChange={e => setConfig({ ...config, autoApplyThreshold: parseFloat(e.target.value) || 0.7 })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            />
            <span className="text-[10px] text-gray-500 mt-1 block">Minimum evaluation score for automatic change application. Changes below this threshold require manual approval.</span>
          </div>

          <div>
            <label className="block text-sm text-white font-medium mb-2">Require Manual Approval For:</label>
            <div className="space-y-2">
              {(['high_risk', 'config_change', 'structural_change'] as const).map(item => (
                <label key={item} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.requireManualApprovalFor.includes(item)}
                    onChange={e => setConfig({
                      ...config,
                      requireManualApprovalFor: e.target.checked
                        ? [...config.requireManualApprovalFor, item]
                        : config.requireManualApprovalFor.filter(x => x !== item)
                    })}
                    className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-white capitalize">{item.replace(/_/g, ' ')}</span>
                </label>
              ))}
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

export default SelfImprovementSettings;