// src/engines/entity/EntitySettings.tsx
// Settings UI for Entity Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { EntityEngine } from './EntityEngine';
import type { EntityConfig, EntityField, EntityFieldType, EntityIntegrations, EntityView } from './types';

export function EntitySettings() {
  const { engine } = useEngine('entity') as { engine: EntityEngine | null };
  const [config, setConfig] = useState<EntityConfig>({
    engine: 'entity',
    id: '',
    name: 'New Entity',
    path: '',
    icon: '📦',
    fields: [],
    views: ['list'],
    integrations: {
      voice: false,
      vision: false,
      gesture: false,
      memory: false,
      agent: undefined,
      proactive: false,
      crossDevice: false,
      automation: false,
      verification: false,
      pinsThroughTrust: false,
      senses: [],
    },
    derived: undefined,
  });
  const [saved, setSaved] = useState(false);
  const [newField, setNewField] = useState<EntityField>({
    name: '',
    label: '',
    type: 'text' as EntityFieldType,
  });
  const [newView, setNewView] = useState<'list' | 'kanban' | 'calendar' | 'timeline'>('list');

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

  const addField = () => {
    if (!newField.name || !newField.label) return;
    setConfig({ ...config, fields: [...config.fields, newField] });
    setNewField({ name: '', label: '', type: 'text' as EntityFieldType });
  };

  const removeField = (name: string) => {
    setConfig({ ...config, fields: config.fields.filter(f => f.name !== name) });
  };

  const addView = () => {
    if (!config.views.includes(newView) && newView !== 'list') {
      setConfig({ ...config, views: [...config.views, newView] });
    }
    setNewView('list');
  };

  const removeView = (view: EntityView) => {
    if (view !== 'list') {
      setConfig({ ...config, views: config.views.filter(v => v !== view) });
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 max-w-2xl mx-auto space-y-6 bg-background">
      <div>
        <h2 className="text-xl font-bold text-white">Entity Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure entity management, fields, views, and integrations</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Basic Config */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Basic Configuration</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name</label>
              <input
                value={config.name}
                onChange={e => setConfig({ ...config, name: e.target.value })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Icon</label>
              <input
                value={config.icon}
                onChange={e => setConfig({ ...config, icon: e.target.value })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Path</label>
            <input
              value={config.path}
              onChange={e => setConfig({ ...config, path: e.target.value })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Views</label>
            <div className="grid grid-cols-4 gap-2">
              {['list', 'kanban', 'calendar', 'timeline'].map(view => (
                <div key={view} className="flex items-center gap-2 px-3 py-2 bg-background/50 rounded text-sm">
                  <input
                    type="checkbox"
                    checked={config.views.includes(view)}
                    onChange={e => {
                      const views = config.views.includes(view)
                        ? config.views.filter(v => v !== view)
                        : [...config.views, view];
                      setConfig({ ...config, views });
                    }}
                    className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
                  />
                  <span className="text-white cursor-default capitalize">{view}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fields Management */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Fields</h3>
          <p className="text-xs text-gray-500 mb-2">Entity fields define the data structure</p>

          {config.fields.length > 0 ? (
            <div className="space-y-3">
              {config.fields.map(field => (
                <div key={field.name} className="p-3 bg-background/50 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl capitalize">{field.type}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white capitalize">{field.name}</div>
                      <div className="text-xs text-gray-400">{field.label}</div>
                    </div>
                    <button
                      onClick={() => removeField(field.name)}
                      className="text-red-400 text-sm hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 py-4 text-sm">No fields defined — add fields above</div>
          )}

          {/* Add New Field Form */}
          <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Add New Field</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Name</label>
                <input
                  value={newField.name}
                  onChange={e => setNewField({ ...newField, name: e.target.value })}
                  className="w-full bg-input border border-border rounded-lg px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Label</label>
                <input
                  value={newField.label}
                  onChange={e => setNewField({ ...newField, label: e.target.value })}
                  className="w-full bg-input border border-border rounded-lg px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Type</label>
                <select
                  value={newField.type}
                  onChange={e => setNewField({ ...newField, type: e.target.value as EntityFieldType })}
                  className="w-full bg-input border border-border rounded-lg px-2 py-1 text-white text-sm"
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="select">Select</option>
                  <option value="boolean">Boolean</option>
                  <option value="tags">Tags</option>
                </select>
              </div>
            </div>
            <button
              onClick={addField}
              className="mt-2 w-full bg-primary hover:bg-primary/85 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Add Field
            </button>
          </div>
        </div>

        {/* Integrations */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Integrations</h3>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.integrations.voice}
                onChange={e => setConfig({ ...config, integrations: { ...config.integrations, voice: e.target.checked } })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Voice</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.integrations.vision}
                onChange={e => setConfig({ ...config, integrations: { ...config.integrations, vision: e.target.checked } })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Vision</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.integrations.gesture}
                onChange={e => setConfig({ ...config, integrations: { ...config.integrations, gesture: e.target.checked } })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Gesture</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.integrations.memory}
                onChange={e => setConfig({ ...config, integrations: { ...config.integrations, memory: e.target.checked } })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Memory</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.integrations.proactive}
                onChange={e => setConfig({ ...config, integrations: { ...config.integrations, proactive: e.target.checked } })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Proactive</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.integrations.crossDevice}
                onChange={e => setConfig({ ...config, integrations: { ...config.integrations, crossDevice: e.target.checked } })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Cross-Device</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.integrations.automation}
                onChange={e => setConfig({ ...config, integrations: { ...config.integrations, automation: e.target.checked } })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Automation</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.integrations.verification}
                onChange={e => setConfig({ ...config, integrations: { ...config.integrations, verification: e.target.checked } })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Verification</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.integrations.pinsThroughTrust}
                onChange={e => setConfig({ ...config, integrations: { ...config.integrations, pinsThroughTrust: e.target.checked } })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Pins Through Trust</span>
            </label>
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

export default EntitySettings;