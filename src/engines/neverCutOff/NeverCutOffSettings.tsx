// src/engines/neverCutOff/NeverCutOffSettings.tsx
// Settings UI for Never Cut Off Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { NeverCutOffEngine } from './NeverCutOffEngine';
import type { AvailabilityConfig } from './types';

export function NeverCutOffSettings() {
  const { engine } = useEngine('never_cutoff') as { engine: NeverCutOffEngine | null };
  const [config, setConfig] = useState<AvailabilityConfig>({
    minConnectivityCheckIntervalMs: 30000,
    maxOfflineQueueSize: 1000,
    syncIntervalMs: 60000,
    retryBaseDelayMs: 1000,
    maxRetryDelayMs: 60000,
    criticalOperations: ['computer_control', 'filesystem_write', 'external_communication'],
    hcuBudgetPerHour: 0.5,
  });
  const [saved, setSaved] = useState(false);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    if (!engine) return;
    setConfig(engine.getConfig());
  }, [engine]);

  const handleSave = () => {
    if (!engine) return;
    engine.updateConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto p-6 max-w-2xl mx-auto space-y-6 bg-background">
      <div>
        <h2 className="text-xl font-bold text-white">Never Cut Off Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure continuous availability and offline-first behavior</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Connectivity Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Connectivity Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Min Connectivity Check Interval (ms)</label>
              <input
                type="number"
                min="1000"
                max="300000"
                value={config.minConnectivityCheckIntervalMs}
                onChange={e => setConfig({ ...config, minConnectivityCheckIntervalMs: parseInt(e.target.value) || 30000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Offline Queue Size</label>
              <input
                type="number"
                min="10"
                max="5000"
                value={config.maxOfflineQueueSize}
                onChange={e => setConfig({ ...config, maxOfflineQueueSize: parseInt(e.target.value) || 1000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Sync Interval (ms)</label>
              <input
                type="number"
                min="1000"
                max="600000"
                value={config.syncIntervalMs}
                onChange={e => setConfig({ ...config, syncIntervalMs: parseInt(e.target.value) || 60000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Retry Base Delay (ms)</label>
              <input
                type="number"
                min="100"
                max="30000"
                value={config.retryBaseDelayMs}
                onChange={e => setConfig({ ...config, retryBaseDelayMs: parseInt(e.target.value) || 1000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Retry Delay (ms)</label>
              <input
                type="number"
                min="1000"
                max="300000"
                value={config.maxRetryDelayMs}
                onChange={e => setConfig({ ...config, maxRetryDelayMs: parseInt(e.target.value) || 60000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">HCU Budget Per Hour</label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={config.hcuBudgetPerHour}
                onChange={e => setConfig({ ...config, hcuBudgetPerHour: parseFloat(e.target.value) || 0.5 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Critical Operations */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Critical Operations</h3>
          <p className="text-xs text-gray-500 mb-2">Operations that can be processed even when offline</p>
          <div className="grid grid-cols-2 gap-2">
            {['computer_control', 'filesystem_write', 'external_communication', 'data_sync', 'notification'].map(op => (
              <div key={op} className="flex items-center gap-2 bg-background/50 rounded-lg p-2">
                <input
                  type="checkbox"
                  checked={config.criticalOperations.includes(op)}
                  onChange={() => setConfig({ ...config, criticalOperations: config.criticalOperations.includes(op) ? config.criticalOperations.filter(c => c !== op) : [...config.criticalOperations, op] })}
                  className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-white cursor-default">{op}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Queue Status */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Offline Queue Status</h3>
          <p className="text-xs text-gray-500">Current queue size: {queueSize}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Allowed</label>
              <p className="text-sm text-white font-medium">{config.maxOfflineQueueSize}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Utilization</label>
              <p className="text-sm text-white font-medium">{config.maxOfflineQueueSize > 0 ? ((queueSize / config.maxOfflineQueueSize) * 100).toFixed(1) + '%' : 'N/A'}</p>
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

export default NeverCutOffSettings;