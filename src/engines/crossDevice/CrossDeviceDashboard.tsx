// src/engines/crossDevice/CrossDeviceDashboard.tsx
// Dashboard UI for Cross-Device Organism Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { CrossDeviceEngine } from './CrossDeviceEngine';
import type { Device, DeviceState, SyncMessage, CrossDeviceEvent, CrossDeviceConfig } from './types';

export function CrossDeviceDashboard() {
  const { engine } = useEngine('crossDevice') as { engine: CrossDeviceEngine | null };
  const [health, setHealth] = useState<ReturnType<CrossDeviceEngine['getHealth']> | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceStates, setDeviceStates] = useState<Map<string, DeviceState>>(new Map());
  const [syncMessages, setSyncMessages] = useState<SyncMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!engine) return;

    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
      startPolling();
    };

    const unsubDiscovered = engine.onEvent('device_discovered', (e) => setDevices(engine.getDevices()));
    const unsubOffline = engine.onEvent('device_offline', () => setDevices(engine.getDevices()));
    const unsubSynced = engine.onEvent('state_synced', () => setDeviceStates(new Map(engine.getAllDeviceStates())));
    const unsubHandoff = engine.onEvent('handoff_initiated', () => { /* log handoff */ });
    const unsubMessage = engine.onEvent('sync_message', (e) => setSyncMessages(engine.getSyncMessages(50)));

    init();

    return () => {
      unsubDiscovered();
      unsubOffline();
      unsubSynced();
      unsubHandoff();
      unsubMessage();
    };
  }, [engine]);

  const startPolling = () => {
    if (!engine) return;
    const interval = setInterval(() => {
      setHealth(engine.getHealth());
      setDevices(engine.getDevices());
      setDeviceStates(new Map(engine.getAllDeviceStates()));
      setSyncMessages(engine.getSyncMessages(50));
    }, 3000);
    return () => clearInterval(interval);
  };

  if (!engine || !isInitialized) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Initializing Cross-Device Organism...
      </div>
    );
  }

  const statusColors = {
    online: 'text-green-400 bg-green-900/30 border-green-700/50',
    offline: 'text-gray-400 bg-gray-900/30 border-gray-700/50',
    sleeping: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50',
    error: 'text-red-400 bg-red-900/30 border-red-700/50',
  } as const;

  const typeIcons: Record<Device['type'], string> = {
    desktop: '🖥️',
    laptop: '💻',
    phone: '📱',
    tablet: '📟',
    watch: '⌚',
    tv: '📺',
    other: '❓',
  };

  const capabilityLabels: Record<string, string> = {
    display: 'Display',
    audio_output: 'Audio Out',
    microphone: 'Mic',
    camera: 'Camera',
    touch: 'Touch',
    keyboard: 'Keyboard',
    mouse: 'Mouse',
    sensors: 'Sensors',
    notifications: 'Notifications',
    location: 'Location',
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-background">
      {/* Header Stats */}
      <div className="flex gap-4 min-h-0 overflow-x-auto pb-2">
        <div className="flex-1 min-w-[180px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Total Devices</div>
          <div className="text-3xl font-bold text-white">{health?.totalDevices || 0}</div>
        </div>
        <div className="flex-1 min-w-[180px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Online</div>
          <div className="text-3xl font-bold text-green-400">{health?.onlineDevices || 0}</div>
        </div>
        <div className="flex-1 min-w-[180px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Sleeping</div>
          <div className="text-3xl font-bold text-yellow-400">{health?.sleepingDevices || 0}</div>
        </div>
        <div className="flex-1 min-w-[180px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Offline</div>
          <div className="text-3xl font-bold text-gray-400">{health?.offlineDevices || 0}</div>
        </div>
        <div className="flex-1 min-w-[180px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Sync Messages</div>
          <div className="text-3xl font-bold text-white">{health?.syncMessageCount || 0}</div>
        </div>
        <div className="flex-1 min-w-[180px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">HCU / Hour</div>
          <div className="text-3xl font-bold text-white">{health?.totalHCUSpent.toFixed(2) || 0} / {health?.hcuBudgetPerHour || 0}</div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Panel - Device Registry */}
        <div className="w-80 bg-card rounded-xl border border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-white">Discovered Devices</h3>
            <button
              onClick={() => {
                const types: Device['type'][] = ['phone', 'laptop', 'tablet', 'watch'];
                const type = types[Math.floor(Math.random() * types.length)];
                engine.registerDevice({
                  name: `Sim ${type}`,
                  type,
                  platform: type === 'phone' ? 'android' : type === 'watch' ? 'wearos' : 'windows',
                  capabilities: ['display', 'notifications'],
                  connectivity: { wifi: true, bluetooth: true, cellular: type === 'phone' },
                });
              }}
              className="px-3 py-1.5 bg-primary hover:bg-primary/85 text-white rounded-lg text-xs font-medium"
            >
              + Simulate Device
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {devices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                state={deviceStates.get(device.id)}
                statusColors={statusColors}
                typeIcons={typeIcons}
                capabilityLabels={capabilityLabels}
                onOffline={() => engine.markDeviceOffline(device.id)}
              />
            ))}
            {devices.length === 0 && (
              <div className="text-center text-gray-500 py-20">No devices discovered yet</div>
            )}
          </div>
        </div>

        {/* Center Panel - Device Details & State */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 bg-card rounded-xl border border-border flex items-center justify-between">
            <h3 className="font-semibold text-white">Device State & Sync</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Auto-refresh: 3s</span>
              <span className={`w-2 h-2 rounded-full ${health?.isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Active Device Detail */}
              <div className="bg-background/50 rounded-xl border border-border p-4">
                <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide mb-3">Active Device Details</h4>
                {devices.length > 0 ? (
                  <ActiveDeviceDetail device={devices[0]} state={deviceStates.get(devices[0].id)} capabilityLabels={capabilityLabels} />
                ) : (
                  <div className="text-center text-gray-500 py-8">No active device</div>
                )}
              </div>

              {/* Sync Status */}
              <div className="bg-background/50 rounded-xl border border-border p-4">
                <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide mb-3">Synchronization</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Sync Interval</span>
                    <span className="text-white font-mono">{engine.getConfig().syncIntervalMs}ms</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Heartbeat Interval</span>
                    <span className="text-white font-mono">{engine.getConfig().heartbeatIntervalMs}ms</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Auto Handoff</span>
                    <span className="text-white font-mono">{engine.getConfig().autoHandoff ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Discovery Interval</span>
                    <span className="text-white font-mono">{engine.getConfig().discoveryIntervalMs}ms</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Total Sync Messages</span>
                    <span className="text-white font-mono">{health?.syncMessageCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Sync Messages */}
            <div className="bg-background/50 rounded-xl border border-border p-4">
              <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide mb-3">Recent Sync Messages ({syncMessages.length})</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {syncMessages.slice(0, 20).map(msg => (
                  <SyncMessageRow key={msg.id} message={msg} />
                ))}
                {syncMessages.length === 0 && (
                  <div className="text-center text-gray-500 py-4">No sync messages yet</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Actions & Handoff */}
        <div className="w-80 bg-card rounded-xl border border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-white">Quick Actions</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Initiate Handoff */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Context Handoff</h4>
              <HandoffPanel
                devices={devices.filter(d => d.status === 'online')}
                onHandoff={(from, to, context) => engine.initiateHandoff(from, to, context)}
              />
            </div>

            {/* Send Test Sync Message */}
            <div className="border-t border-border pt-4 space-y-4">
              <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Test Sync</h4>
              <div className="space-y-3">
                <select
                  id="syncFrom"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
                  defaultValue={devices[0]?.id || ''}
                >
                  {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select
                  id="syncTo"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
                  defaultValue={devices[1]?.id || ''}
                >
                  {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select
                  id="syncType"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="state">State Sync</option>
                  <option value="handoff">Handoff</option>
                  <option value="continuation">Continuation</option>
                  <option value="notification">Notification</option>
                  <option value="sync_request">Sync Request</option>
                </select>
                <button
                  onClick={() => {
                    const from = (document.getElementById('syncFrom') as HTMLSelectElement)?.value;
                    const to = (document.getElementById('syncTo') as HTMLSelectElement)?.value;
                    const type = (document.getElementById('syncType') as HTMLSelectElement)?.value as SyncMessage['type'];
                    if (from && to) engine.sendSyncMessage(from, to, type, { test: true, timestamp: Date.now() });
                  }}
                  className="w-full bg-primary hover:bg-primary/85 text-white py-2 rounded-lg text-sm font-medium"
                >
                  Send Test Message
                </button>
              </div>
            </div>

            {/* Trigger Discovery */}
            <div className="border-t border-border pt-4 space-y-4">
              <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Discovery</h4>
              <button
                onClick={() => (engine as any).discoverDevices()}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm font-medium"
              >
                Trigger Device Discovery
              </button>
              <div className="text-xs text-gray-500">
                Simulates nearby device discovery (mDNS, BLE, etc.)
              </div>
            </div>

            {/* Engine Stats */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide mb-3">Engine Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Running</span><span className="text-white">{health?.isRunning ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Max Devices</span><span className="text-white">{engine.getConfig().maxDevices}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">HCU Budget/hr</span><span className="text-white">{health?.hcuBudgetPerHour}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">HCU Spent</span><span className="text-white">{health?.totalHCUSpent.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeviceCard({
  device,
  state,
  statusColors,
  typeIcons,
  capabilityLabels,
  onOffline,
}: {
  device: Device;
  state: DeviceState | undefined;
  statusColors: Record<string, string>;
  typeIcons: Record<Device['type'], string>;
  capabilityLabels: Record<string, string>;
  onOffline: () => void;
}) {
  const statusClass = statusColors[device.status] || statusColors.offline;

  return (
    <div className={`rounded-xl border p-3 ${statusClass}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{typeIcons[device.type]}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white truncate">{device.name}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide">{device.type} • {device.platform}</div>
        </div>
        <span className="text-xs font-medium uppercase">{device.status}</span>
      </div>

      {state && (
        <div className="grid grid-cols-2 gap-2 text-xs mb-2 p-2 bg-black/20 rounded-lg">
          <div>
            <span className="text-gray-400">Battery</span>
            <div className="text-white font-mono">{state.batteryLevel}%{state.isCharging ? ' ⚡' : ''}</div>
          </div>
          <div>
            <span className="text-gray-400">Activity</span>
            <div className="text-white font-mono">{(state.activityLevel * 100).toFixed(0)}%</div>
          </div>
          <div>
            <span className="text-gray-400">Screen</span>
            <div className="text-white font-mono">{state.screenOn ? 'On' : 'Off'}</div>
          </div>
          <div>
            <span className="text-gray-400">Foreground</span>
            <div className="text-white font-mono">{state.foreground ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1 mb-2">
        {device.capabilities.slice(0, 6).map(cap => (
          <span key={cap} className="text-[10px] text-gray-300 bg-white/10 px-1.5 py-0.5 rounded">
            {capabilityLabels[cap] || cap}
          </span>
        ))}
        {device.capabilities.length > 6 && (
          <span className="text-[10px] text-gray-500">+{device.capabilities.length - 6} more</span>
        )}
      </div>

      <div className="flex items-center gap-2 text-[10px] text-gray-500">
        <span>Wifi: {device.connectivity.wifi ? '✓' : '✗'}</span>
        <span>BT: {device.connectivity.bluetooth ? '✓' : '✗'}</span>
        <span>Cell: {device.connectivity.cellular ? '✓' : '✗'}</span>
        <span className="ml-auto">Seen: {new Date(device.lastSeen).toLocaleTimeString()}</span>
      </div>

      {device.status === 'online' && (
        <button
          onClick={onOffline}
          className="w-full mt-2 text-xs text-red-400 hover:text-red-300 py-1"
        >
          Mark Offline
        </button>
      )}
    </div>
  );
}

function ActiveDeviceDetail({
  device,
  state,
  capabilityLabels,
}: {
  device: Device;
  state: DeviceState | undefined;
  capabilityLabels: Record<string, string>;
}) {
  if (!state) {
    return <div className="text-center text-gray-500 py-8">No state data available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">
          {device.type === 'desktop' ? '🖥️' : device.type === 'laptop' ? '💻' : device.type === 'phone' ? '📱' : '📟'}
        </div>
        <div>
          <div className="font-bold text-white">{device.name}</div>
          <div className="text-xs text-gray-400">{device.platform} • {device.id}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricBox label="Battery" value={`${state.batteryLevel}%`} sub={state.isCharging ? 'Charging' : 'Discharging'} />
        <MetricBox label="Activity" value={`${(state.activityLevel * 100).toFixed(0)}%`} sub="Engagement" />
        <MetricBox label="Screen" value={state.screenOn ? 'On' : 'Off'} sub={state.audioPlaying ? 'Audio Playing' : 'Silent'} />
        <MetricBox label="Foreground" value={state.foreground ? 'Active' : 'Background'} sub={state.foreground ? 'User focused' : 'Backgrounded'} />
      </div>

      <div className="pt-2 border-t border-white/10">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Capabilities</div>
        <div className="flex flex-wrap gap-1">
          {device.capabilities.map(cap => (
            <span key={cap} className="text-[10px] text-gray-300 bg-white/10 px-2 py-1 rounded-full">
              {capabilityLabels[cap] || cap}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-white/10">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Connectivity</div>
        <div className="flex gap-4 text-sm">
          <span className={`flex items-center gap-1 ${device.connectivity.wifi ? 'text-green-400' : 'text-gray-500'}`}>
            {device.connectivity.wifi ? '●' : '○'} WiFi
          </span>
          <span className={`flex items-center gap-1 ${device.connectivity.bluetooth ? 'text-blue-400' : 'text-gray-500'}`}>
            {device.connectivity.bluetooth ? '●' : '○'} Bluetooth
          </span>
          <span className={`flex items-center gap-1 ${device.connectivity.cellular ? 'text-purple-400' : 'text-gray-500'}`}>
            {device.connectivity.cellular ? '●' : '○'} Cellular
          </span>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-black/20 rounded-lg p-3">
      <div className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[10px] text-gray-500">{sub}</div>
    </div>
  );
}

function SyncMessageRow({ message }: { message: SyncMessage }) {
  const typeColors: Record<SyncMessage['type'], string> = {
    state: 'text-blue-400',
    handoff: 'text-purple-400',
    continuation: 'text-green-400',
    notification: 'text-yellow-400',
    sync_request: 'text-orange-400',
  };

  const statusColors = {
    pending: 'text-yellow-400',
    delivered: 'text-green-400',
    failed: 'text-red-400',
  };

  return (
    <div className="flex items-center gap-2 text-xs p-2 bg-black/20 rounded-lg">
      <span className={typeColors[message.type]}>{message.type.toUpperCase()}</span>
      <span className="text-gray-500 font-mono truncate flex-1">{message.from} → {message.to}</span>
      <span className={statusColors[message.status]}>● {message.status}</span>
      <span className="text-gray-500 font-mono">{new Date(message.timestamp).toLocaleTimeString()}</span>
    </div>
  );
}

function HandoffPanel({
  devices,
  onHandoff,
}: {
  devices: Device[];
  onHandoff: (from: string, to: string, context: string) => boolean;
}) {
  const [fromDevice, setFromDevice] = useState<string>(devices[0]?.id || '');
  const [toDevice, setToDevice] = useState<string>(devices[1]?.id || '');
  const [context, setContext] = useState<string>('Continue current activity');

  if (devices.length < 2) {
    return (
      <div className="text-center text-gray-500 py-4 text-sm">
        Need at least 2 online devices for handoff
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <select
        value={fromDevice}
        onChange={e => setFromDevice(e.target.value)}
        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
      >
        {devices.map(d => <option key={d.id} value={d.id}>{d.name} (from)</option>)}
      </select>
      <select
        value={toDevice}
        onChange={e => setToDevice(e.target.value)}
        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
      >
        {devices.map(d => <option key={d.id} value={d.id}>{d.name} (to)</option>)}
      </select>
      <input
        type="text"
        value={context}
        onChange={e => setContext(e.target.value)}
        placeholder="Context description..."
        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
      />
      <button
        onClick={() => onHandoff(fromDevice, toDevice, context)}
        className="w-full bg-primary hover:bg-primary/85 text-white py-2 rounded-lg text-sm font-medium"
        disabled={fromDevice === toDevice}
      >
        Initiate Handoff
      </button>
      {fromDevice === toDevice && (
        <span className="text-xs text-red-400 text-center block">From and To devices must be different</span>
      )}
    </div>
  );
}

export default CrossDeviceDashboard;