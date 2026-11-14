// src/engines/crossDevice/CrossDeviceSettings.tsx
// Settings UI for Cross-Device Organism Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { CrossDeviceEngine } from './CrossDeviceEngine';
import type { CrossDeviceConfig } from './types';

export function CrossDeviceSettings() {
  const { engine } = useEngine('crossDevice') as { engine: CrossDeviceEngine | null };
  const [config, setConfig] = useState<CrossDeviceConfig | null>(null);
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
        <h2 className="text-xl font-bold text-white">Cross-Device Organism Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure device discovery, synchronization intervals, and context handoff behavior.</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Intervals */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Sync & Discovery Intervals</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Discovery Interval (ms)</label>
              <input
                type="number"
                min="5000"
                max="300000"
                value={config.discoveryIntervalMs}
                onChange={e => setConfig({ ...config, discoveryIntervalMs: parseInt(e.target.value) || 30000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Sync Interval (ms)</label>
              <input
                type="number"
                min="5000"
                max="300000"
                value={config.syncIntervalMs}
                onChange={e => setConfig({ ...config, syncIntervalMs: parseInt(e.target.value) || 15000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Heartbeat Interval (ms)</label>
              <input
                type="number"
                min="5000"
                max="300000"
                value={config.heartbeatIntervalMs}
                onChange={e => setConfig({ ...config, heartbeatIntervalMs: parseInt(e.target.value) || 10000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Device Limits */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Device Limits</h3>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Maximum Devices</label>
            <input
              type="number"
              min="2"
              max="50"
              value={config.maxDevices}
              onChange={e => setConfig({ ...config, maxDevices: parseInt(e.target.value) || 10 })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            />
            <span className="text-[10px] text-gray-500 mt-1 block">Maximum number of devices to track simultaneously.</span>
          </div>
        </div>

        {/* Handoff Settings */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Context Handoff</h3>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm text-white font-medium">Auto Handoff Enabled</label>
              <p className="text-xs text-gray-400">Automatically allow context handoff between online devices</p>
            </div>
            <input
              type="checkbox"
              checked={config.autoHandoff}
              onChange={e => setConfig({ ...config, autoHandoff: e.target.checked })}
              className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
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
              onChange={e => setConfig({ ...config, hcuBudgetPerHour: parseFloat(e.target.value) || 1.5 })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            />
            <span className="text-[10px] text-gray-500 mt-1 block">Maximum HEY Compute Units this engine may consume per hour.</span>
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

export default CrossDeviceSettings;