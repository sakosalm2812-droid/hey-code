// src/engines/digup/DigupSettings.tsx
// Settings UI for Digup Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { DigupEngine } from './DigupEngine';
import type { DigupConfig } from './types';

export function DigupSettings() {
  const { engine } = useEngine('digup') as { engine: DigupEngine | null };
  const [config, setConfig] = useState<DigupConfig>({
    enabled: false,
    indexRoots: ['~'],
    fileTypes: ['.txt', '.md', '.js', '.ts', '.jsx', '.tsx'],
    maxConcurrentScans: 2,
    hcuBudgetPerHour: 0.5,
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
        <h2 className="text-xl font-bold text-white">Digup Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure semantic file search and discovery</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Search Configuration */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Search Configuration</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Enabled</label>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={e => setConfig({ ...config, enabled: e.target.checked })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Enable semantic file search</span>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Index Roots</label>
              <input
                value={config.indexRoots.join(', ')}
                onChange={e => {
                  const roots = e.target.value.split(',').map(r => r.trim()).filter(r => r.length > 0);
                  setConfig({ ...config, indexRoots: roots });
                }}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
                placeholder="~/Documents, ~/Projects"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">File Types</label>
              <div className="grid grid-cols-3 gap-2">
                {['.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.pdf', '.html', '.css', '.json'].map(ft => (
                  <label key={ft} className="flex items-center gap-2 px-3 py-2 bg-background/50 rounded text-xs">
                    <input
                      type="checkbox"
                      checked={config.fileTypes.includes(ft)}
                      onChange={e => {
                        const types = config.fileTypes.includes(ft)
                          ? config.fileTypes.filter(t => t !== ft)
                          : [...config.fileTypes, ft];
                        setConfig({ ...config, fileTypes: types });
                      }}
                      className="w-3 h-3 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-white capitalize">{ft}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Concurrent Scans</label>
              <input
                type="number"
                min=1
                max=10
                value={config.maxConcurrentScans}
                onChange={e => setConfig({ ...config, maxConcurrentScans: parseInt(e.target.value) || 2 })}
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
                onChange={e => setConfig({ ...config, hcuBudgetPerHour: parseFloat(e.target.value) || 0.5 })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Index Status */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Index Status</h3>
          <div>
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded ${config.enabled ? 'bg-green-500' : 'bg-red-500'} aria-label={config.enabled ? 'Enabled' : 'Disabled'} />
              <span className="text-sm text-white">${config.enabled ? 'Indexing enabled' : 'Indexing disabled'}</span>
            </div>
          </div>
          {config.enabled && (
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
              <div>Indexed files: {config.indexRoots.length > 0 ? 'Calculating...' : '0'}</div>
              <div>Last indexed: Pending</div>
            </div>
          )}
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

export default DigupSettings;