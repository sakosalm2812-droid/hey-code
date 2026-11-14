// src/engines/performanceQuality/PerformanceQualitySettings.tsx
// Settings UI for Performance & Quality Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { PerformanceQualityEngine } from './PerformanceQualityEngine';
import type { PerformanceQualityConfig } from './types';

export function PerformanceQualitySettings() {
  const { engine } = useEngine('performanceQuality') as { engine: PerformanceQualityEngine | null };
  const [config, setConfig] = useState<PerformanceQualityConfig | null>(null);
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
        <h2 className="text-xl font-bold text-white">Performance & Quality Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure metrics monitoring, performance records retention, and quality alert thresholds.</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Monitoring */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Monitoring</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Metrics Refresh Interval (ms)</label>
              <input
                type="number"
                min="5000"
                max="600000"
                value={config.metricsRefreshIntervalMs}
                onChange={e => setConfig({ ...config, metricsRefreshIntervalMs: parseInt(e.target.value) || 30000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Performance Records</label>
              <input
                type="number"
                min="100"
                max="10000"
                value={config.maxPerformanceRecords}
                onChange={e => setConfig({ ...config, maxPerformanceRecords: parseInt(e.target.value) || 5000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Quality */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Quality Thresholds</h3>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Quality Alert Threshold (0-100)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={config.qualityAlertThreshold}
              onChange={e => setConfig({ ...config, qualityAlertThreshold: parseInt(e.target.value) || 70 })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            />
            <span className="text-[10px] text-gray-500 mt-1 block">Alert is triggered when quality score falls below this value.</span>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Performance Baseline (ms)</label>
            <input
              type="number"
              min="10"
              max="1000"
              value={config.performanceBaseline}
              onChange={e => setConfig({ ...config, performanceBaseline: parseInt(e.target.value) || 100 })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Resource Management</h3>

          <div>
            <label className="block text-sm text-gray-400 mb-1">HCU Budget Per Hour</label>
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={config.hcuBudgetPerHour}
              onChange={e => setConfig({ ...config, hcuBudgetPerHour: parseFloat(e.target.value) || 1.0 })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            />
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

export default PerformanceQualitySettings;