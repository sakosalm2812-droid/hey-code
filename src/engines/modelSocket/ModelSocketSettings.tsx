// src/engines/modelSocket/ModelSocketSettings.tsx
// Settings UI for Model Socket Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { ModelSocketEngine } from './ModelSocketEngine';
import type { ModelSocketConfig } from './types';

export function ModelSocketSettings() {
  const { engine } = useEngine('model_socket') as { engine: ModelSocketEngine | null };
  const [config, setConfig] = useState<ModelSocketConfig>({
    modelPath: '',
    host: 'localhost',
    port: 8080,
    modelName: 'default',
    contextLength: 4096,
    temperature: 0.7,
    maxTokens: 2048,
    hcuBudgetPerHour: 5.0,
    concurrentRequests: 4,
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
        <h2 className="text-xl font-bold text-white">Model Socket Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure 86B model inference via llama.cpp</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Model Configuration */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Model Configuration</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Model Path</label>
              <input
                value={config.modelPath}
                onChange={e => setConfig({ ...config, modelPath: e.target.value })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
                placeholder="/path/to/model.gguf"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Host</label>
              <input
                value={config.host}
                onChange={e => setConfig({ ...config, host: e.target.value })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
                placeholder="localhost"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Port</label>
              <input
                type="number"
                min=1
                max=65535
                value={config.port}
                onChange={e => setConfig({ ...config, port: parseInt(e.target.value) || 8080 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Model Name</label>
              <input
                value={config.modelName}
                onChange={e => setConfig({ ...config, modelName: e.target.value })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
                placeholder="default"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Context Length</label>
              <input
                type="number"
                min=128
                max=32768
                value={config.contextLength}
                onChange={e => setConfig({ ...config, contextLength: parseInt(e.target.value) || 4096 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Temperature</label>
              <input
                type="number"
                min=0
                max=2
                step="0.1"
                value={config.temperature}
                onChange={e => setConfig({ ...config, temperature: parseFloat(e.target.value) || 0.7 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Tokens</label>
              <input
                type="number"
                min=1
                max=8192
                value={config.maxTokens}
                onChange={e => setConfig({ ...config, maxTokens: parseInt(e.target.value) || 2048 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Concurrent Requests</label>
              <input
                type="number"
                min=1
                max=16
                value={config.concurrentRequests}
                onChange={e => setConfig({ ...config, concurrentRequests: parseInt(e.target.value) || 4 })}
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
                max="50"
                step="0.1"
                value={config.hcuBudgetPerHour}
                onChange={e => setConfig({ ...config, hcuBudgetPerHour: parseFloat(e.target.value) || 5.0 })}
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

export default ModelSocketSettings;