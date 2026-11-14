// src/engines/entity/EntityDashboard.tsx
// Dashboard UI for Entity Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { EntityEngine } from './EntityEngine';
import type {
  EntityItem,
  EntityConfig,
  EntityField,
  EntityFieldType,
  EntityView,
} from './types';

export function EntityDashboard() {
  const { engine } = useEngine('entity') as { engine: EntityEngine | null };
  const [health, setHealth] = useState<{
    isRunning: boolean;
    entityCount: number;
    totalHCUSpent: number;
    hcuBudgetPerHour: number;
  } | null>(null);
  const [entities, setEntities] = useState<EntityItem[]>([]);
  const [fields, setFields] = useState<EntityField[]>([]);
  const [views, setViews] = useState<EntityView[]>(['list']);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!engine) return;

    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
      startPolling();
    };

    const unsub = engine.onEvent('entity_created', () => {
      setEntities(engine.getAll());
    });
    const unsubUpdated = engine.onEvent('entity_updated', () => {
      setEntities(engine.getAll());
    });
    const unsubDeleted = engine.onEvent('entity_deleted', () => {
      setEntities(engine.getAll());
    });

    init();

    return () => {
      unsub();
      unsubUpdated();
      unsubDeleted();
    };
  }, [engine]);

  const startPolling = () => {
    if (!engine) return;
    const interval = setInterval(() => {
      setHealth(engine.getHealth());
      setEntities(engine.getAll());
    }, 3000);
    return () => clearInterval(interval);
  };

  if (!engine || !isInitialized) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Initializing Entity Engine...
      </div>
    );
  }

  // Keep state in sync
  useEffect(() => {
    setEntities(engine.getAll());
    setFields(engine.getConfig().fields);
    setViews(engine.getConfig().views);
  }, [engine]);

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-background">
      {/* Health Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Entities</div>
          <div className="text-2xl font-bold text-white">{health?.entityCount || 0}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">HCU Spent</div>
          <div className="text-2xl font-bold text-white">{health?.totalHCUSpent.toFixed(3) || '0'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Budget/Hour</div>
          <div className="text-2xl font-bold text-white">{health?.hcuBudgetPerHour || 1}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Running</div>
          <div className="text-2xl font-bold text-green-400">{health?.isRunning ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* Entities List */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Entities ({entities.length})</h3>
        {entities.length === 0 ? (
          <div className="text-gray-500 py-8 text-center">No entities yet. Add one above.</div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {entities.map(entity => (
              <div
                key={entity.id}
                className="p-3 bg-background/50 rounded-lg border border-border"
              >
                <div className="font-medium text-white truncate">{entity.id.substring(0, 8)}...</div>
                <div className="text-xs text-gray-400">
                  created: {new Date(entity.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fields Summary */}
      <div className="mt-6 p-4 bg-background/50 rounded-xl border border-border">
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Fields ({fields.length})</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          {fields.map(field => (
            <span key={field.name} className="capitalize">
              {field.name}: {field.type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EntityDashboard;