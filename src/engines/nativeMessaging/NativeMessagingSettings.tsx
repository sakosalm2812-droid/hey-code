// src/engines/nativeMessaging/NativeMessagingSettings.tsx
// Settings UI for Native Messaging Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { NativeMessagingEngine } from './nativeMessagingEngine';
import type { NativeMessagingConfig } from './types';

export function NativeMessagingSettings() {
  const { engine } = useEngine('native_messaging') as { engine: NativeMessagingEngine | null };
  const [config, setConfig] = useState<NativeMessagingConfig>({
    enabled: false,
    origin: '',
    platforms: ['windows', 'linux', 'mac'],
    hcuBudgetPerHour: 0.5,
    maxMessageSize: 65536,
    retryAttempts: 3,
  });
  const [saved, setSaved] = useState(false);

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
        <h2 className="text-xl font-bold text-white">Native Messaging Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure native messaging host integration</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Native Messaging Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Native Messaging Configuration</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Enabled</label>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={e => setConfig({ ...config, enabled: e.target.checked })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Allow native messaging host communication</span>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Origin</label>
              <input
                value={config.origin}
                onChange={e => setConfig({ ...config, origin: e.target.value })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
                placeholder="e.g., chrome-extension://abc123"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Platforms</label>
              <div className="grid grid-cols-3 gap-2">
                {['windows', 'linux', 'mac'].map(platform => (
                  <label key={platform} className="flex items-center gap-2 px-3 py-2 bg-background/50 rounded text-xs">
                    <input
                      type="checkbox"
                      checked={config.platforms.includes(platform)}
                      onChange={e => {
                        const platforms = config.platforms.includes(platform)
                          ? config.platforms.filter(p => p !== platform)
                          : [...config.platforms, platform];
                        setConfig({ ...config, platforms });
                      }}
                      className="w-3 h-3 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-white capitalize">{platform}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Message Size (bytes)</label>
              <input
                type="number"
                min=100
                max=1048576
                value={config.maxMessageSize}
                onChange={e => setConfig({ ...config, maxMessageSize: parseInt(e.target.value) || 65536 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Retry Attempts</label>
              <input
                type="number"
                min=0
                max=10
                value={config.retryAttempts}
                onChange={e => setConfig({ ...config, retryAttempts: parseInt(e.target.value) || 3 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">HCU Budget Per Hour</label>
              <input
                type="number"
                min=0.1
                max="10"
                step="0.1"
                value={config.hcuBudgetPerHour}
                onChange={e => setConfig({ ...config, hcuBudgetPerHour: parseFloat(e.target.value) || 0.5 })}
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

export default NativeMessagingSettings;