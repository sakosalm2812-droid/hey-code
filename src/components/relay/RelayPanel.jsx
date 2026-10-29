/**
 * HEY Relay Panel — Pairing, Status, Trust, Revoke
 *
 * UI for managing HEY Relay connections.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { subscribeToDeviceFabric } from '../../core/deviceFabric.js';
import { subscribeToDeviceGateway } from '../../core/deviceGateway.js';
import { getDeviceId } from '../../core/deviceFabric.js';
import {
  deriveRelayViewModel,
  createPairingRequest,
  validatePairCode,
  createStatusSummary,
  isSafeAction,
  SAFE_ACTIONS,
} from './relayState.js';

const SCOPE_LABELS = {
  'read-and-act': 'Read and act',
  'read-only': 'Read only',
  paused: 'Paused',
};

const SCOPE_DESCRIPTIONS = {
  'read-and-act': 'Can execute safe actions (open cockpit, quick capture, ask HEY, print) and read state',
  'read-only': 'Can only read HEY state, cannot execute actions',
  paused: 'Relay is temporarily disabled',
};

const STATUS_COLORS = {
  disconnected: 'status-disconnected',
  pairing: 'status-pairing',
  paired: 'status-paired',
  degraded: 'status-degraded',
  revoked: 'status-revoked',
};

function StatusBadge({ status, label }) {
  return (
    <span className={`status-badge ${STATUS_COLORS[status] || ''}`}>
      <span className="status-dot" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

function PairedDeviceCard({ device, onRevoke, onScopeChange, revoking }) {
  const isOnline = device.status === 'online';
  const lastSeen = device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never';

  return (
    <article className={`paired-device-card ${isOnline ? 'online' : 'offline'}`}>
      <div className="device-card-header">
        <div className="device-info">
          <span className="device-icon" aria-hidden="true">
            {device.deviceType === 'phone' ? '📱' : device.deviceType === 'desktop' ? '💻' : '🖥️'}
          </span>
          <div>
            <span className="device-name">{device.name}</span>
            <span className="device-platform">{device.platform} · {device.role}</span>
          </div>
        </div>
        <StatusBadge status={device.status} label={isOnline ? 'Online' : 'Offline'} />
      </div>

      <div className="device-card-details">
        <div className="device-detail">
          <span className="detail-label">Last seen</span>
          <span className="detail-value">{lastSeen}</span>
        </div>
        <div className="device-detail">
          <span className="detail-label">Scope</span>
          <select
            className="device-scope-select"
            value={device.scope}
            onChange={e => onScopeChange(device.id, e.target.value)}
            disabled={revoking}
          >
            <option value="read-and-act">Read and act</option>
            <option value="read-only">Read only</option>
            <option value="paused">Paused</option>
          </select>
        </div>
        <div className="device-detail">
          <span className="detail-label">Capabilities</span>
          <span className="detail-value">{device.capabilities?.length || 0}</span>
        </div>
      </div>

      <div className="device-card-actions">
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={() => onRevoke(device.id)}
          disabled={revoking}
        >
          {revoking ? 'Revoking…' : 'Revoke'}
        </button>
      </div>
    </article>
  );
}

function PairingCard({ viewModel, onStartPairing, onCancelPairing, onConfirmPairing, pairCodeInput, setPairCodeInput }) {
  if (viewModel.status === 'pairing') {
    return (
      <div className="pairing-card active">
        <div className="pair-code-display">
          <span className="pair-code-label">Pair Code</span>
          <code className="pair-code">{viewModel.pairCode}</code>
          <span className="pair-code-expires">
            Expires in {Math.max(0, Math.ceil((new Date(viewModel.pairCodeExpiresAt) - Date.now()) / 1000 / 60))} minutes
          </span>
        </div>
        <p className="pairing-instructions">
          Enter this code in HEY on the other device, or scan the QR code.
        </p>
        <div className="pairing-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancelPairing}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (viewModel.status === 'disconnected' || viewModel.status === 'degraded') {
    return (
      <div className="pairing-card inactive">
        <h3>Pair a New Device</h3>
        <p>Generate a pair code to connect another device to this HEY instance.</p>
        <button type="button" className="btn btn-primary" onClick={onStartPairing}>
          Generate Pair Code
        </button>
      </div>
    );
  }

  return null;
}

function SafeActionsList() {
  return (
    <details className="safe-actions-list">
      <summary>Safe actions allowed via relay ({SAFE_ACTIONS.length})</summary>
      <ul>
        {SAFE_ACTIONS.map(action => (
          <li key={action}>
            <code>{action}</code>
          </li>
        ))}
      </ul>
      <p className="safe-actions-note">
        Destructive actions (file delete, permission grant, spend budget, etc.) always require
        explicit approval through the Trust Kernel on the controlling device.
      </p>
    </details>
  );
}

export function RelayPanel({ className = '', onClose }) {
  const [deviceFabricState, setDeviceFabricState] = useState(null);
  const [gatewayState, setGatewayState] = useState(null);
  const [localDeviceId] = useState(() => getDeviceId());
  const [viewModel, setViewModel] = useState(() => deriveRelayViewModel(null, null, { localDeviceId }));
  const [pairCodeInput, setPairCodeInput] = useState('');
  const [revokingId, setRevokingId] = useState(null);
  const [error, setError] = useState(null);

  // Subscribe to device fabric
  useEffect(() => {
    const unsubscribeFabric = subscribeToDeviceFabric((event, data) => {
      setDeviceFabricState(prev => {
        // In a real implementation, we'd get the full state from the engine
        // For now, trigger a re-derivation
        return { ...prev, _trigger: Date.now() };
      });
    });

    const unsubscribeGateway = subscribeToDeviceGateway((event, data) => {
      setGatewayState(prev => ({ ...prev, _trigger: Date.now() }));
    });

    return () => {
      unsubscribeFabric();
      unsubscribeGateway();
    };
  }, []);

  // Derive view model when state changes
  useEffect(() => {
    const vm = deriveRelayViewModel(deviceFabricState, gatewayState, {
      localDeviceId,
      now: Date.now(),
    });
    setViewModel(vm);
  }, [deviceFabricState, gatewayState, localDeviceId]);

  const handleStartPairing = useCallback(async () => {
    try {
      // In real implementation, call deviceFabric.producePairCode()
      // For now, simulate
      const request = createPairingRequest({
        id: localDeviceId,
        name: navigator.platform.includes('Mac') ? 'Mac' : 'PC',
        platform: navigator.platform.includes('Mac') ? 'macos' : 'windows',
        deviceType: 'desktop',
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [localDeviceId]);

  const handleCancelPairing = useCallback(async () => {
    try {
      // In real implementation, clear pair code
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const handleConfirmPairing = useCallback(async () => {
    if (!validatePairCode(pairCodeInput)) {
      setError('Invalid pair code format');
      return;
    }
    try {
      // In real implementation, call deviceFabric.registerPairCode()
      setPairCodeInput('');
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [pairCodeInput]);

  const handleRevoke = useCallback(async (deviceId) => {
    setRevokingId(deviceId);
    try {
      // In real implementation, call deviceFabric.revokeDevice(deviceId)
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setRevokingId(null);
    }
  }, []);

  const handleScopeChange = useCallback(async (deviceId, scope) => {
    try {
      // In real implementation, update device scope
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const summary = useMemo(() => createStatusSummary(viewModel), [viewModel]);

  return (
    <div className={`relay-panel ${className}`}>
      <div className="relay-panel-header">
        <h2>HEY Relay</h2>
        <p className="relay-panel-description">
          HEY Relay lets other devices (like your phone) securely access HEY on this machine
          when the app is closed. Pair devices to enable global hotkeys, quick capture, and more.
        </p>
      </div>

      {error && (
        <div className="relay-error" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <div className="relay-status-card">
        <div className="relay-status-main">
          <StatusBadge status={viewModel.status} label={summary.statusLabel} />
          <div className="relay-status-meta">
            <span className="relay-scope">
              <span className="scope-label">Scope:</span>
              <span className="scope-value">{summary.scopeLabel}</span>
            </span>
            <span className="relay-devices">
              <span className="devices-label">Devices:</span>
              <span className="devices-value">{summary.onlineCount}/{summary.deviceCount} online</span>
            </span>
          </div>
        </div>
        {viewModel.lastActivity && (
          <div className="relay-last-activity">
            Last activity: {new Date(viewModel.lastActivity).toLocaleString()}
          </div>
        )}
      </div>

      <PairingCard
        viewModel={viewModel}
        onStartPairing={handleStartPairing}
        onCancelPairing={handleCancelPairing}
        onConfirmPairing={handleConfirmPairing}
        pairCodeInput={pairCodeInput}
        setPairCodeInput={setPairCodeInput}
      />

      <div className="relay-paired-devices">
        <h3>Paired Devices ({summary.deviceCount})</h3>
        {viewModel.pairedDevices.length === 0 ? (
          <p className="relay-empty">No devices paired yet. Generate a pair code to get started.</p>
        ) : (
          <div className="paired-devices-grid">
            {viewModel.pairedDevices.map(device => (
              <PairedDeviceCard
                key={device.id}
                device={device}
                onRevoke={handleRevoke}
                onScopeChange={handleScopeChange}
                revoking={revokingId === device.id}
              />
            ))}
          </div>
        )}
      </div>

      <SafeActionsList />

      <div className="relay-panel-footer">
        <p className="relay-footer-note">
          The relay runs locally on this machine. No data leaves your device.
          Pairing codes expire in 5 minutes. Tokens rotate every 24 hours.
        </p>
      </div>
    </div>
  );
}

export default RelayPanel;