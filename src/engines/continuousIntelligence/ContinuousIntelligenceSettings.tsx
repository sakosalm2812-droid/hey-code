// src/engines/continuousIntelligence/ContinuousIntelligenceSettings.tsx
// Settings UI for Continuous Intelligence Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { ContinuousIntelligenceEngine } from './ContinuousIntelligenceEngine';
import type { IntelligenceConfig } from './types';

export function ContinuousIntelligenceSettings() {
  const { engine } = useEngine('continuousIntelligence') as { engine: ContinuousIntelligenceEngine | null };
  const [config, setConfig] = useState<IntelligenceConfig | null>(null);
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
        <h2 className="text-xl font-bold text-white">Continuous Intelligence Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure background reasoning, anomaly detection, and thought stream parameters.</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Background Reasoning */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Background Reasoning</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Reasoning Interval (ms)</label>
              <input
                type="number"
                min="10000"
                max="300000"
                value={config.backgroundReasoningIntervalMs}
                onChange={e => setConfig({ ...config, backgroundReasoningIntervalMs: parseInt(e.target.value) || 60000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Thought History</label>
              <input
                type="number"
                min="100"
                max="10000"
                value={config.maxThoughtHistory}
                onChange={e => setConfig({ ...config, maxThoughtHistory: parseInt(e.target.value) || 1000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">HCU Budget Per Minute</label>
            <input
              type="number"
              min="0.5"
              max="50"
              step="0.5"
              value={config.hcuBudgetPerMinute}
              onChange={e => setConfig({ ...config, hcuBudgetPerMinute: parseFloat(e.target.value) || 5.0 })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        </div>

        {/* Anomaly Detection */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Anomaly Detection</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Anomaly Check Interval (ms)</label>
              <input
                type="number"
                min="5000"
                max="120000"
                value={config.anomalyCheckIntervalMs}
                onChange={e => setConfig({ ...config, anomalyCheckIntervalMs: parseInt(e.target.value) || 30000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoEscalateCritical}
                  onChange={e => setConfig({ ...config, autoEscalateCritical: e.target.checked })}
                  className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-white">Auto-escalate critical anomalies</span>
              </label>
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

export default ContinuousIntelligenceSettings;