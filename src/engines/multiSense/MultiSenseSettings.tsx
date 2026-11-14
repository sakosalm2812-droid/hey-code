// src/engines/multiSense/MultiSenseSettings.tsx
// Settings UI for Multi-Sense Control Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { MultiSenseEngine } from './MultiSenseEngine';
import type { MultiSenseConfig, SenseType } from './types';

export function MultiSenseSettings() {
  const { engine } = useEngine('multiSense') as { engine: MultiSenseEngine | null };
  const [config, setConfig] = useState<MultiSenseConfig | null>(null);
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

  const handleSenseToggle = (type: SenseType) => {
    if (!config) return;
    const newSenses = config.enabledSenses.includes(type)
      ? config.enabledSenses.filter(s => s !== type)
      : [...config.enabledSenses, type];
    setConfig({ ...config, enabledSenses: newSenses });
  };

  if (!config) {
    return <div className="p-6 text-gray-400">Loading settings...</div>;
  }

  const allSenses: SenseType[] = ['vision', 'audio', 'tactile', 'spatial', 'biometric'];
  const senseLabels: Record<SenseType, string> = {
    vision: '👁 Vision',
    audio: '👂 Audio',
    tactile: '✋ Tactile',
    spatial: '📍 Spatial',
    biometric: '💓 Biometric',
  };

  return (
    <div className="h-full overflow-y-auto p-6 max-w-2xl mx-auto space-y-6 bg-background">
      <div>
        <h2 className="text-xl font-bold text-white">Multi-Sense Control Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure which senses are active, fusion parameters, and calibration.</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Enabled Senses */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Enabled Senses</h3>
          <div className="grid grid-cols-2 gap-3">
            {allSenses.map(type => (
              <label key={type} className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50 cursor-pointer transition-colors hover:border-primary/50">
                <input
                  type="checkbox"
                  checked={config.enabledSenses.includes(type)}
                  onChange={() => handleSenseToggle(type)}
                  className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
                />
                <span className="text-white font-medium">{senseLabels[type]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Fusion Parameters */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Fusion Parameters</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Fusion Interval (ms)</label>
              <input
                type="number"
                min="1000"
                max="60000"
                value={config.fusionIntervalMs}
                onChange={e => setConfig({ ...config, fusionIntervalMs: parseInt(e.target.value) || 5000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Min Confidence Threshold</label>
              <input
                type="number"
                min="0.1"
                max="1"
                step="0.05"
                value={config.minConfidenceThreshold}
                onChange={e => setConfig({ ...config, minConfidenceThreshold: parseFloat(e.target.value) || 0.5 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Resource Budget */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Resource Management</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">HCU Budget Per Minute</label>
              <input
                type="number"
                min="0.5"
                max="20"
                step="0.5"
                value={config.hcuBudgetPerMinute}
                onChange={e => setConfig({ ...config, hcuBudgetPerMinute: parseFloat(e.target.value) || 3.0 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoCalibrate}
                  onChange={e => setConfig({ ...config, autoCalibrate: e.target.checked })}
                  className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-white">Auto-calibrate sensitivities</span>
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

export default MultiSenseSettings;