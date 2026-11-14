// src/engines/modes/ModesSettings.tsx
// Settings UI for Modes Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { ModesEngine } from './ModesEngine';
import type { ModesConfig, Mode, ModeId, ModeSchedule } from './types';

const MODE_IDS: ModeId[] = ['focus', 'creative', 'learning', 'rest', 'social', 'admin', 'emergency'];

export function ModesSettings() {
  const { engine } = useEngine('modes') as { engine: ModesEngine | null };
  const [config, setConfig] = useState<ModesConfig | null>(null);
  const [saved, setSaved] = useState(false);
  const [modeConfigs, setModeConfigs] = useState<Record<string, { enabled: boolean; schedule?: ModeSchedule }>>({});

  useEffect(() => {
    if (!engine) return;
    const cfg = engine.getConfig();
    setConfig(cfg);

    // Initialize mode configs
    const initial: Record<string, { enabled: boolean; schedule?: ModeSchedule }> = {};
    for (const id of MODE_IDS) {
      const mode = engine.getMode(id);
      if (mode) {
        initial[id] = { enabled: mode.enabled, schedule: mode.schedule };
      }
    }
    setModeConfigs(initial);
  }, [engine]);

  const handleSave = () => {
    if (!engine || !config) return;
    engine.updateConfig(config);
    // Apply mode-specific configs
    for (const [id, mc] of Object.entries(modeConfigs)) {
      const mode = engine.getMode(id as ModeId);
      if (mode) {
        engine.updateMode(id as ModeId, { enabled: mc.enabled, schedule: mc.schedule });
      }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!config) {
    return <div className="p-6 text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="h-full overflow-y-auto p-6 max-w-2xl mx-auto space-y-6 bg-background">
      <div>
        <h2 className="text-xl font-bold text-white">Modes Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure adaptive behavioral modes, triggers, and schedules.</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Global Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Global Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Default Mode</label>
              <select
                value={config.defaultMode}
                onChange={e => setConfig({ ...config, defaultMode: e.target.value as ModeId })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              >
                {MODE_IDS.map(id => {
                  const mode = engine?.getMode(id);
                  return <option key={id} value={id}>{mode?.name || id}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Transition Cooldown (ms)</label>
              <input
                type="number"
                min="1000"
                max="60000"
                value={config.transitionCooldownMs}
                onChange={e => setConfig({ ...config, transitionCooldownMs: parseInt(e.target.value) || 5000 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.allowManualOverride}
                onChange={e => setConfig({ ...config, allowManualOverride: e.target.checked })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Allow Manual Override</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.persistActiveMode}
                onChange={e => setConfig({ ...config, persistActiveMode: e.target.checked })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Persist Active Mode</span>
            </label>
          </div>
        </div>

        {/* Mode Configurations */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Mode Configurations</h3>

          {MODE_IDS.map(id => {
            const mode = engine?.getMode(id);
            const mc = modeConfigs[id] || { enabled: true };
            if (!mode) return null;

            return (
              <div key={id} className="bg-background/50 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{mode.icon}</span>
                    <div>
                      <div className="font-bold text-white">{mode.name}</div>
                      <div className="text-xs text-gray-400">{mode.description}</div>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mc.enabled}
                      onChange={e => setModeConfigs({ ...modeConfigs, [id]: { ...mc, enabled: e.target.checked } })}
                      className="w-5 h-5 rounded bg-input border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-white">Enabled</span>
                  </label>
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Schedule Days</label>
                    <div className="flex flex-wrap gap-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                        <label key={day} className="flex items-center gap-1 cursor-pointer px-2 py-1 bg-input/50 rounded text-xs">
                          <input
                            type="checkbox"
                            checked={mc.schedule?.days?.includes(i) || false}
                            onChange={e => {
                              const days = mc.schedule?.days || [];
                              const newDays = e.target.checked
                                ? [...days, i]
                                : days.filter(d => d !== i);
                              setModeConfigs({ ...modeConfigs, [id]: { ...mc, schedule: { ...mc.schedule, days: newDays } as ModeSchedule } });
                            }}
                            className="w-3 h-3 rounded border-border text-primary focus:ring-primary"
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={mc.schedule?.startTime || ''}
                        onChange={e => setModeConfigs({ ...modeConfigs, [id]: { ...mc, schedule: { ...mc.schedule, startTime: e.target.value } as ModeSchedule } })}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">End Time</label>
                      <input
                        type="time"
                        value={mc.schedule?.endTime || ''}
                        onChange={e => setModeConfigs({ ...modeConfigs, [id]: { ...mc, schedule: { ...mc.schedule, endTime: e.target.value } as ModeSchedule } })}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Timezone</label>
                    <input
                      type="text"
                      value={mc.schedule?.timezone || 'UTC'}
                      onChange={e => setModeConfigs({ ...modeConfigs, [id]: { ...mc, schedule: { ...mc.schedule, timezone: e.target.value } as ModeSchedule } })}
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>

                {/* Engine Config Preview */}
                <details className="mt-4">
                  <summary className="text-sm text-gray-400 cursor-pointer">Engine Config Overrides</summary>
                  <pre className="text-xs text-gray-500 mt-2 p-2 bg-black/20 rounded">{JSON.stringify(mode.engineConfigs, null, 2)}</pre>
                </details>
              </div>
            );
          })}
        </div>

        {/* Budget */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Resource Management</h3>

          <div>
            <label className="block text-sm text-gray-400 mb-1">HCU Budget Per Hour</label>
            <input
              type="number"
              min="0.1"
              max="5"
              step="0.1"
              value={config.hcuBudgetPerHour}
              onChange={e => setConfig({ ...config, hcuBudgetPerHour: parseFloat(e.target.value) || 0.5 })}
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

export default ModesSettings;