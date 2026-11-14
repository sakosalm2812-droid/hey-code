// src/engines/agentFamilies/AgentFamiliesDashboard.tsx
// Dashboard UI for Agent Families Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { AgentFamiliesEngine } from './AgentFamiliesEngine';
import type { AgentFamiliesHealth, AgentFamily } from './types';

export function AgentFamiliesDashboard() {
  const { engine } = useEngine('agent_families') as { engine: AgentFamiliesEngine | null };
  const [health, setHealth] = useState<AgentFamiliesHealth | null>(null);
  const [families, setFamilies] = useState<AgentFamily[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!engine) return;

    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
      startPolling();
    };

    const unsub = engine.onEvent('family_created', () => {
      setFamilies(engine.getAllFamilies());
    });
    const unsubMember = engine.onEvent('member_added', () => {
      setFamilies(engine.getAllFamilies());
    });

    init();

    return () => {
      unsub();
      unsubMember();
    };
  }, [engine]);

  const startPolling = () => {
    if (!engine) return;
    const interval = setInterval(() => {
      setHealth(engine.getHealth());
      setFamilies(engine.getAllFamilies());
    }, 3000);
    return () => clearInterval(interval);
  };

  if (!engine || !isInitialized) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Initializing Agent Families Engine...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-background">
      {/* Health Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Families</div>
          <div className="text-2xl font-bold text-white">{health?.totalFamilies || 0}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Total Members</div>
          <div className="text-2xl font-bold text-white">{health?.totalMembers || 0}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">HCU Spent</div>
          <div className="text-2xl font-bold text-white">{health?.totalHCUSpent?.toFixed(3) || '0'}</div>
        </div>
      </div>

      {/* Families List */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Families ({families.length})</h3>
        {families.length === 0 ? (
          <div className="text-gray-500 py-8 text-center">No families yet.</div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {families.map(family => (
              <div key={family.id} className="p-3 bg-background/50 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-bold text-white">{family.name}</span>
                    <span className="text-xs text-gray-400">{family.description}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {family.members.length}/{family.memberLimit ?? '?'} members
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentFamiliesDashboard;