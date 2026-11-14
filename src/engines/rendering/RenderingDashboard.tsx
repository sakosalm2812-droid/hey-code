// src/engines/rendering/RenderingDashboard.tsx
// Dashboard UI for Rendering Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { RenderingEngine } from './RenderingEngine';
import type { RenderingHealth, Frame, RenderingConfig } from './types';

export function RenderingDashboard() {
  const { engine } = useEngine('rendering') as { engine: RenderingEngine | null };
  const [health, setHealth] = useState<RenderingHealth | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!engine) return;

    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
      startPolling();
    };

    const unsub = engine.onEvent('frame_created', () => {
      setFrames(engine.getFrames());
    });

    init();

    return () => {
      unsub();
    };
  }, [engine]);

  const startPolling = () => {
    if (!engine) return;
    const interval = setInterval(() => {
      setHealth(engine.getHealth());
    }, 3000);
    return () => clearInterval(interval);
  };

  if (!engine || !isInitialized) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Initializing Rendering Engine...
      </div>
    );
  }

  // Keep state in sync
  useEffect(() => {
    setFrames(engine.getFrames());
  }, [engine]);

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-background">
      {/* Health Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">HCU Spent</div>
          <div className="text-2xl font-bold text-white">{health?.totalHCUSpent?.toFixed(3) || '0'}</div>
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

      {/* Frame Info */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Rendering Status</h3>
        <div className="text-sm text-gray-400">
          <div>Frames Per Second: {health?.isRunning ? '60' : 'N/A'}</div>
          <div>Max Frames In Flight: {health?.isRunning ? '2' : 'N/A'}</div>
          <div>Framebuffer: {(health?.isRunning ? '1920x1080' : 'N/A')}</div>
        </div>
      </div>
    </div>
  );
}

export default RenderingDashboard;