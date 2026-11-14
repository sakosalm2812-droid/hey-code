// src/engines/guidanceWorld/GuidanceWorldSettings.tsx
// Settings UI for Guidance World Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { GuidanceWorldEngine } from './GuidanceWorldEngine';
import type { GuidanceConfig, DifficultyLevel } from './types';

export function GuidanceWorldSettings() {
  const { engine } = useEngine('guidanceWorld') as { engine: GuidanceWorldEngine | null };
  const [config, setConfig] = useState<GuidanceConfig | null>(null);
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
        <h2 className="text-xl font-bold text-white">Guidance World Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure instruction generation, tutoring defaults, and mentorship check-ins.</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* General Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">General</h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoGenerateInstructions}
                onChange={e => setConfig({ ...config, autoGenerateInstructions: e.target.checked })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Auto-Generate Instructions</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableFeedbackLoop}
                onChange={e => setConfig({ ...config, enableFeedbackLoop: e.target.checked })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Enable Feedback Loop</span>
            </label>
          </div>
        </div>

        {/* Tutoring Settings */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Tutoring</h3>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Default Difficulty Level</label>
            <select
              value={config.defaultTutoringLevel}
              onChange={e => setConfig({ ...config, defaultTutoringLevel: e.target.value as DifficultyLevel })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        {/* Mentorship Settings */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Mentorship</h3>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Check-In Interval (ms)</label>
            <input
              type="number"
              min="3600000"
              max="604800000"
              value={config.mentorshipCheckInIntervalMs}
              onChange={e => setConfig({ ...config, mentorshipCheckInIntervalMs: parseInt(e.target.value) || 86400000 })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            />
            <span className="text-[10px] text-gray-500 mt-1 block">How often to check on active mentorship goals (default: 24 hours).</span>
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

export default GuidanceWorldSettings;