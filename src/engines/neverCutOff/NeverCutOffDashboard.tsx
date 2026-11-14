// src/engines/neverCutOff/NeverCutOffDashboard.tsx
// Dashboard UI for Never Cut Off Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { NeverCutOffEngine } from './NeverCutOffEngine';
import type {
  ConnectivityState,
  NetworkProfile,
  OfflineQueue,
  SyncOperation,
  NeverCutOffHealth,
} from './types';

export function NeverCutOffDashboard() {
  const { engine } = useEngine('never_cutoff') as { engine: NeverCutOffEngine | null };
  const [health, setHealth] = useState<NeverCutOffHealth | null>(null);
  const [connectivityState, setConnectivityState] = useState<ConnectivityState>('offline');
  const [queue, setQueue] = useState<OfflineQueue[]>([]);
  const [syncOps, setSyncOps] = useState<SyncOperation[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!engine) return;

    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
      startPolling();
    };

    const unsubState = engine.onEvent('connectivity_changed', (event) => {
      setConnectivityState(event.state);
    });
    const unsubQueue = engine.onEvent('offline_queue_added', () => {
      setQueue(engine.getOfflineQueue());
    });
    const unsubSync = engine.onEvent('sync_started', () => {
      setSyncOps(engine.getSyncOperations());
    });

    init();

    return () => {
      unsubState();
      unsubQueue();
      unsubSync();
    };
  }, [engine]);

  const startPolling = () => {
    if (!engine) return;
    const interval = setInterval(() => {
      setHealth(engine.getHealth());
      setQueue(engine.getOfflineQueue());
      setSyncOps(engine.getSyncOperations());
    }, 3000);
    return () => clearInterval(interval);
  };

  if (!engine || !isInitialized) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Initializing Never Cut Off Engine...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-background">
      {/* Connectivity Status */}
      <div className="p-4 rounded-xl border border-primary/50 bg-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-white">{connectivityState}</div>
            <div className="text-xs text-gray-400">Connectivity State</div>
          </div>
          <div className={`w-8 h-8 rounded-full ${connectivityState === 'online' ? 'bg-green-500' : connectivityState === 'limited' ? 'bg-yellow-500' : 'bg-red-500'}`} aria-label={connectivityState} />
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {connectivityState === 'online' && 'Online — Full operations available'}
          {connectivityState === 'limited' && 'Limited — Reduced functionality'}
          {connectivityState === 'offline' && 'Offline — Queuing enabled'}
          {connectivityState === 'reconnecting' && 'Reconnecting — Retrying...'}
        </div>
      </div>

      {/* Offline Queue */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Offline Queue</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Pending</div>
            <div className="text-3xl font-bold text-white">{queue.filter(o => o.status === 'pending').length}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Processing</div>
            <div className="text-3xl font-bold text-yellow-400">{queue.filter(o => o.status === 'processing').length}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Completed</div>
            <div className="text-3xl font-bold text-green-400">{queue.filter(o => o.status === 'completed').length}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Failed</div>
            <div className="text-3xl font-bold text-red-400">{queue.filter(o => o.status === 'failed').length}</div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => engine.addToOfflineQueue('test_operation', { test: true }, 'normal')
            className="bg-primary hover:bg-primary/85 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Add Test Operation
          </button>
        </div>
      </div>

      {/* Sync Operations */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Sync Operations</h3>
        {syncOps.length === 0 ? (
          <div className="text-gray-500 py-4">No sync operations</div>
        ) : (
          <div className="space-y-3">
            {syncOps.slice(0, 5).map(op => (
              <div key={op.id} className="p-3 bg-background/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-primary">{op.type}</span>
                  <span className="text-gray-400">{op.resource}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">State: {op.state}</div>
              </div>
            ))}
            {syncOps.length > 5 && (
              <div className="text-xs text-gray-400">+{syncOps.length - 5} more</div>
            )}
          </div>
        )}
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">HCU Spent</div>
          <div className="text-2xl font-bold text-white">{health?.totalHCUSpent.toFixed(3) || '0'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Uptime %</div>
          <div className="text-2xl font-bold text-white">{health?.uptimePercentage?.toFixed(1) || '0'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Critical Ops</div>
          <div className="text-2xl font-bold text-white">{health?.offlineQueueSize || 0}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Pending Sync</div>
          <div className="text-2xl font-bold text-white">{health?.pendingSyncOperations || 0}</div>
        </div>
      </div>
    </div>
  );
}

export default NeverCutOffDashboard;