// src/engines/situationalAwareness/SituationalAwarenessSettings.tsx
// Settings UI for Situational Awareness Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { SituationalAwarenessEngine } from './SituationalAwarenessEngine';
import type { AwarenessConfig } from './types';

export function SituationalAwarenessSettings() {
  const { engine } = useEngine('situationalAwareness') as { engine: SituationalAwarenessEngine | null };
  const [config, setConfig] = useState<AwarenessConfig | null>(null);
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
        <h2 className="text-xl font-bold text-white">Situational Awareness Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure environmental monitoring, snapshot intervals, and proactive alert thresholds.</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Intervals */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Monitoring Intervals</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Snapshot Interval (ms)</label>
              <input
                type="number"
                min="1000"
                max="60000"
                value={config.snapshotIntervalMs}
                onChange={e => setConfig({ ...config, snapshotIntervalMs: parseInt(e.target.value) || 10000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Assessment Interval (ms)</label>
              <input
                type="number"
                min="5000"
                max="300000"
                value={config.assessmentIntervalMs}
                onChange={e => setConfig({ ...config, assessmentIntervalMs: parseInt(e.target.value) || 30000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Alerts & Responses</h3>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Alert Threshold</label>
            <select
              value={config.alertThreshold}
              onChange={e => setConfig({ ...config, alertThreshold: e.target.value as AwarenessConfig['alertThreshold'] })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="normal">Alert on Normal (Every assessment)</option>
              <option value="elevated">Alert on Elevated</option>
              <option value="high">Alert on High</option>
              <option value="critical">Alert only on Critical</option>
            </select>
            <span className="text-[10px] text-gray-500 mt-1 block">Determines which severity levels trigger a proactive alert notification.</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm text-white font-medium">Enable Auto-Mitigation</label>
              <p className="text-xs text-gray-400">Automatically execute primary recommendation on CRITICAL assessments</p>
            </div>
            <input
              type="checkbox"
              checked={config.autoActionEnabled}
              onChange={e => setConfig({ ...config, autoActionEnabled: e.target.checked })}
              className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
            />
          </div>
        </div>

        {/* Resource Budget */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Resource Management</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">HCU Budget Per Hour</label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={config.hcuBudgetPerHour}
                onChange={e => setConfig({ ...config, hcuBudgetPerHour: parseFloat(e.target.value) || 2.0 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">History Retention (ms)</label>
              <input
                type="number"
                min="300000"
                max="86400000"
                value={config.historyRetentionMs}
                onChange={e => setConfig({ ...config, historyRetentionMs: parseInt(e.target.value) || 3600000 })}
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

export default SituationalAwarenessSettings;