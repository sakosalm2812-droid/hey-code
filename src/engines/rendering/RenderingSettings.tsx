// src/engines/rendering/RenderingSettings.tsx
// Settings UI for Rendering Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { RenderingEngine } from './RenderingEngine';
import type { RenderingConfig } from './types';

export function RenderingSettings() {
  const { engine } = useEngine('rendering') as { engine: RenderingEngine | null };
  const [config, setConfig] = useState<RenderingConfig>({
    framesPerSecond: 60,
    framebufferWidth: 1920,
    framebufferHeight: 1080,
    maxFramesInFlight: 2,
    hcuBudgetPerHour: 1.0,
    enableVSync: true,
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
        <h2 className="text-xl font-bold text-white">Rendering Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure frame rendering, framebuffer, and visual output settings</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Rendering Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Render Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Frames Per Second</label>
              <input
                type="number"
                min=1
                max=120
                value={config.framesPerSecond}
                onChange={e => setConfig({ ...config, framesPerSecond: parseInt(e.target.value) || 60 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Frames In Flight</label>
              <input
                type="number"
                min=1
                max=10
                value={config.maxFramesInFlight}
                onChange={e => setConfig({ ...config, maxFramesInFlight: parseInt(e.target.value) || 2 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Framebuffer Width (px)</label>
              <input
                type="number"
                min=100
                max=7680
                value={config.framebufferWidth}
                onChange={e => setConfig({ ...config, framebufferWidth: parseInt(e.target.value) || 1920 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Framebuffer Height (px)</label>
              <input
                type="number"
                min=100
                max=4320
                value={config.framebufferHeight}
                onChange={e => setConfig({ ...config, framebufferHeight: parseInt(e.target.value) || 1080 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">HCU Budget Per Hour</label>
              <input
                type="number"
                min=0.1
                max="10"
                step="0.1"
                value={config.hcuBudgetPerHour}
                onChange={e => setConfig({ ...config, hcuBudgetPerHour: parseFloat(e.target.value) || 1.0 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Enable VSync</label>
              <input
                type="checkbox"
                checked={config.enableVSync}
                onChange={e => setConfig({ ...config, enableVSync: e.target.checked })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Synchronize with display refresh rate</span>
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

export default RenderingSettings;