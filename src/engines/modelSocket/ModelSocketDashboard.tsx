// src/engines/modelSocket/ModelSocketDashboard.tsx
// Dashboard UI for Model Socket Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { ModelSocketEngine } from './ModelSocketEngine';
import type { ModelSocketHealth, ModelSocketConfig } from './types';

export function ModelSocketDashboard() {
  const { engine } = useEngine('model_socket') as { engine: ModelSocketEngine | null };
  const [health, setHealth] = useState<ModelSocketHealth | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!engine) return;

    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
    };

    init();

    return () => {};
  }, [engine]);

  if (!engine || !isInitialized) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Initializing Model Socket Engine...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-background">
      {/* Health Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Model Loaded</div>
          <div className="text-2xl font-bold text-green-400">{health?.modelLoaded ? 'Yes' : 'No'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">HCU Spent</div>
          <div className="text-2xl font-bold text-white">{health?.totalHCUSpent?.toFixed(3) || '0'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Budget/Hour</div>
          <div className="text-2xl font-bold text-white">{health?.hcuBudgetPerHour || 5}</div>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Configuration</h3>
        <div className="text-sm text-gray-400">
          <div>Model: {health?.isRunning ? health.modelName || 'Not set' : 'Not initialized'}</div>
          <div>Context: {health?.isRunning ? health.contextLength + ' tokens' : 'Not set'}</div>
          <div>Temperature: {health?.isRunning ? health.temperature : 'Not set'}</div>
        </div>
      </div>
    </div>
  );
}

export default ModelSocketDashboard;