// src/engines/multiSense/MultiSenseDashboard.tsx
// Dashboard UI for Multi-Sense Control Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { MultiSenseEngine } from './MultiSenseEngine';
import type { SenseChannel, SensoryInput, SenseFusionResult, MultiSenseEvent, SenseType } from './types';

export function MultiSenseDashboard() {
  const { engine } = useEngine('multiSense') as { engine: MultiSenseEngine | null };
  const [health, setHealth] = useState<ReturnType<MultiSenseEngine['getHealth']> | null>(null);
  const [channels, setChannels] = useState<SenseChannel[]>([]);
  const [fusionHistory, setFusionHistory] = useState<SenseFusionResult[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'channels' | 'fusion' | 'input'>('fusion');

  useEffect(() => {
    if (!engine) return;

    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
      startPolling();
    };

    const unsubSenseAct = engine.onEvent('sense_activated', () => setChannels(engine.getChannels()));
    const unsubInput = engine.onEvent('sensory_input_received', () => {});
    const unsubFusion = engine.onEvent('senses_fused', (e) => setFusionHistory(prev => [e.result, ...prev.slice(0, 49)]));

    init();

    return () => {
      unsubSenseAct();
      unsubInput();
      unsubFusion();
    };
  }, [engine]);

  const startPolling = () => {
    if (!engine) return;
    const interval = setInterval(() => {
      setHealth(engine.getHealth());
      setChannels(engine.getChannels());
      setFusionHistory(engine.getFusionHistory(50));
    }, 2000);
    return () => clearInterval(interval);
  };

  const handleActivateSense = (type: SenseType) => {
    engine?.activateSense(type);
  };

  const handleDeactivateSense = (channelId: string) => {
    engine?.deactivateSense(channelId);
  };

  const handleSimulateInput = () => {
    // Simulate inputs across available active channels
    channels.filter(c => c.status === 'active').forEach(c => {
      switch (c.type) {
        case 'vision':
          engine?.simulateVisionInput({ elements: ['code editor', 'terminal', 'browser'], focusArea: 'code editor' });
          break;
        case 'audio':
          engine?.simulateAudioInput({ transcript: 'working on implementation', keywords: ['implementation', 'code'] });
          break;
        case 'spatial':
          engine?.simulateSpatialInput({ windows: ['VS Code', 'Terminal', 'Browser', 'HEY'], layout: 'tiled' });
          break;
        case 'tactile':
          engine?.simulateTactileInput({ actions: ['typing', 'scroll', 'click'], hotkeys: ['ctrl+s', 'ctrl+tab'] });
          break;
      }
    });
  };

  if (!engine || !isInitialized) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Initializing Multi-Sense Control...
      </div>
    );
  }

  const senseIcons: Record<SenseType, string> = {
    vision: '👁',
    audio: '👂',
    tactile: '✋',
    spatial: '📍',
    biometric: '💓',
  };

  const senseColors: Record<SenseType, string> = {
    vision: 'text-blue-400',
    audio: 'text-green-400',
    tactile: 'text-purple-400',
    spatial: 'text-orange-400',
    biometric: 'text-red-400',
  };

  const statusColors = {
    active: 'text-green-400 bg-green-900/30',
    inactive: 'text-gray-400 bg-gray-900/30',
    error: 'text-red-400 bg-red-900/30',
    calibrating: 'text-yellow-400 bg-yellow-900/30',
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-background">
      {/* Health Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Active Channels</div>
          <div className="text-3xl font-bold text-white">{health?.activeChannels || 0} / {health?.totalChannels || 0}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Buffered Inputs</div>
          <div className="text-3xl font-bold text-yellow-400">{health?.bufferedInputs || 0}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Fusions Generated</div>
          <div className="text-3xl font-bold text-purple-400">{health?.fusionCount || 0}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">HCU Spent/min</div>
          <div className="text-3xl font-bold text-white">{health?.totalHCUSpent.toFixed(2) || 0}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Latest Fusion</div>
          <div className="text-lg font-bold text-white truncate">{fusionHistory[0]?.unifiedInsight || 'None yet'}</div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Panel - Sense Channels */}
        <div className="w-72 bg-card rounded-xl border border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-white">Sense Channels</h3>
            <span className="text-xs text-gray-400">{channels.length} configured</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {channels.map(channel => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                senseIcons={senseIcons}
                senseColors={senseColors}
                statusColors={statusColors}
                onToggle={handleDeactivateSense}
              />
            ))}

            {/* Available but inactive senses */}
            <div className="pt-4 border-t border-border/50">
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Available Senses</h4>
              <div className="space-y-2">
                {(['vision', 'audio', 'tactile', 'spatial', 'biometric'] as SenseType[])
                  .filter(type => !channels.some(c => c.type === type))
                  .map(type => (
                    <button
                      key={type}
                      onClick={() => handleActivateSense(type)}
                      className="w-full flex items-center gap-3 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-left text-sm"
                    >
                      <span className="text-2xl">{senseIcons[type]}</span>
                      <div>
                        <div className="font-medium text-white capitalize">{type}</div>
                        <div className="text-xs text-gray-500">Click to activate</div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Fusion Stream */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex gap-1 bg-card rounded-xl border border-border p-1 mb-4">
            <button
              onClick={() => setActiveTab('fusion')}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'fusion' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Fusion Stream
            </button>
            <button
              onClick={() => setActiveTab('input')}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'input' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Raw Inputs
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
            {activeTab === 'fusion' && (
              <div className="space-y-3">
                {fusionHistory.map(fusion => (
                  <FusionCard key={fusion.id} fusion={fusion} senseColors={senseColors} senseIcons={senseIcons} />
                ))}
                {fusionHistory.length === 0 && (
                  <div className="text-center text-gray-500 py-20">
                    <div className="text-4xl mb-4">🧠</div>
                    <div>Waiting for multi-sense fusion...</div>
                    <div className="text-sm mt-2">Activate at least 2 senses and click "Simulate Inputs"</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'input' && (
              <div className="text-center text-gray-500 py-8">
                <div className="text-sm">Raw sensory input monitoring</div>
                <div className="text-xs mt-2">Latest: {channels.find(c => c.status === 'active')?.lastActivity || 'none'}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Controls */}
        <div className="w-72 bg-card rounded-xl border border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-white">Controls</h3>
          </div>
          <div className="p-4 space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide mb-3">Simulate Input</h4>
              <button
                onClick={handleSimulateInput}
                className="w-full bg-primary hover:bg-primary/85 text-white px-4 py-3 rounded-lg text-sm font-medium"
              >
                🎯 Simulate All Active Senses
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">Generates test data for each active channel</p>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide mb-3">Channel Status</h4>
              <div className="space-y-2">
                {channels.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className={`flex items-center gap-2 ${senseColors[c.type]}`}>
                      {senseIcons[c.type]} {c.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${statusColors[c.status]}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide mb-3">Latest Fusion Details</h4>
              {fusionHistory[0] ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Confidence</span>
                    <span className="text-white font-bold">{(fusionHistory[0].confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Senses</span>
                    <span className="text-white">{fusionHistory[0].contributingSenses.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Intent</span>
                    <span className="text-white font-medium">{fusionHistory[0].intent || 'unknown'}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-purple-500" style={{ width: `${fusionHistory[0].confidence * 100}%` }}></div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">No fusions yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelCard({
  channel,
  senseIcons,
  senseColors,
  statusColors,
  onToggle,
}: {
  channel: SenseChannel;
  senseIcons: Record<string, string>;
  senseColors: Record<string, string>;
  statusColors: Record<string, string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="bg-background/50 rounded-xl p-3 border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{senseIcons[channel.type]}</span>
          <div>
            <div className="font-medium text-white capitalize">{channel.type}</div>
            <div className="text-xs text-gray-500">{channel.name}</div>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs ${statusColors[channel.status]}`}>
          {channel.status}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className="text-gray-400">Sensitivity</span>
            <span className="text-white font-mono">{(channel.sensitivity * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full ${senseColors[channel.type]}`} style={{ width: `${channel.sensitivity * 100}%` }}></div>
          </div>
        </div>
        <span className="text-gray-500 font-mono">Last: {new Date(channel.lastActivity).toLocaleTimeString()}</span>
      </div>

      {channel.status === 'active' && (
        <button
          onClick={() => onToggle(channel.id)}
          className="w-full mt-2 px-2 py-1 text-xs text-red-400 hover:text-red-300 bg-red-900/20 rounded hover:bg-red-900/30 transition-colors"
        >
          Deactivate
        </button>
      )}
    </div>
  );
}

function FusionCard({
  fusion,
  senseColors,
  senseIcons,
}: {
  fusion: SenseFusionResult;
  senseColors: Record<string, string>;
  senseIcons: Record<string, string>;
}) {
  const senseBadges = fusion.contributingSenses.map(s => (
    <span key={s} className={`px-1.5 py-0.5 rounded text-xs ${senseColors[s]} bg-black/20 flex items-center gap-1`}>
      {senseIcons[s]} {s}
    </span>
  ));

  return (
    <div className="bg-card rounded-xl border border-purple-500/30 p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <p className="text-white font-medium">{fusion.unifiedInsight}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] opacity-60 font-mono">{fusion.id}</span>
          <div className="text-[10px] opacity-60 mt-1">{new Date(fusion.timestamp).toLocaleTimeString()}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {senseBadges}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className={`text-white font-bold ${fusion.confidence > 0.7 ? 'text-green-400' : fusion.confidence > 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
            Confidence: {(fusion.confidence * 100).toFixed(0)}%
          </span>
          {fusion.intent && (
            <span className="px-2 py-0.5 bg-purple-900/30 text-purple-400 rounded text-xs">
              Intent: {fusion.intent}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default MultiSenseDashboard;