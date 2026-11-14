// src/engines/agentFamilies/AgentFamiliesSettings.tsx
// Settings UI for Agent Families Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { AgentFamiliesEngine } from './AgentFamiliesEngine';
import type { AgentFamiliesConfig, AgentFamily, AgentFamilyMember } from './types';

export function AgentFamiliesSettings() {
  const { engine } = useEngine('agent_families') as { engine: AgentFamiliesEngine | null };
  const [config, setConfig] = useState<AgentFamiliesConfig>({
    families: [],
    maxFamilySize: 50,
    defaultFamily: 'general',
    hcuBudgetPerHour: 1.0,
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

  const addFamily = () => {
    if (!config.defaultFamily) return;
    const family = engine.createFamily(
      config.defaultFamily,
      `Family for ${config.defaultFamily}`
    );
    setConfig({ ...config, families: [...config.families, family] });
  };

  const removeFamily = (familyId: string) => {
    setConfig({ ...config, families: config.families.filter(f => f.id !== familyId) });
  };

  const addMember = (familyId: string, member: AgentFamilyMember) => {
    const result = engine.addMember(familyId, member);
    if (result) {
      setConfig({ ...config });
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 max-w-2xl mx-auto space-y-6 bg-background">
      <div>
        <h2 className="text-xl font-bold text-white">Agent Families Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Manage agent families and members</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Families Management */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Agent Families</h3>

          {config.families.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {config.families.map(family => (
                <div key={family.id} className="p-3 bg-background/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{family.name}</span>
                      <span className="text-sm text-gray-400">{family.description}</span>
                    </div>
                    <span className="text-xs text-red-400">✕</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Members: {family.members.length}/{family.memberLimit ?? config.maxFamilySize}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 py-4 text-sm">No families yet. Add one above.</div>
          )}

          {/* Add Family Form */}
          <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Add New Family</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Family Name</label>
                <input
                  defaultValue={config.defaultFamily}
                  onChange={e => setConfig({ ...config, defaultFamily: e.target.value })}
                  className="w-full bg-input border border-border rounded-lg px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Member Limit</label>
                <input
                  type="number"
                  min=1
                  max=100
                  value={config.maxFamilySize}
                  onChange={e => setConfig({ ...config, maxFamilySize: parseInt(e.target.value) || 50 })}
                  className="w-full bg-input border border-border rounded-lg px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
            <button
              onClick={addFamily}
              className="mt-2 w-full bg-primary hover:bg-primary/85 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Create Family
            </button>
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

export default AgentFamiliesSettings;