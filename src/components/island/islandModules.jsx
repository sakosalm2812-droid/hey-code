/**
 * Island Module Renderers — the 10 module types for the expanded island.
 * Each is a pure React component receiving props from the activity/module data.
 */

import { useState, useEffect } from 'react';

/**
 * Approval module — shows pending decision with Approve/Deny actions.
 * @param {Object} props
 * @param {Object} props.activity - The approval activity
 * @param {Function} props.onAction - Callback for approve/deny
 */
export function ApprovalModule({ activity, onAction }) {
  const riskLevel = activity.metadata?.riskLevel || 'medium';
  const riskColors = {
    low: 'var(--success)',
    medium: 'var(--warning)',
    high: 'var(--danger)',
    critical: 'var(--error)',
  };

  return (
    <div className="island-module approval-module" data-module="approval">
      <div className="island-module-header">
        <span className="island-module-title">Approval Required</span>
        <span
          className="island-module-risk"
          style={{ background: riskColors[riskLevel], color: 'var(--text-on-accent)' }}
        >
          {riskLevel.toUpperCase()}
        </span>
      </div>
      <div className="island-module-body">
        <p className="island-module-message">{activity.message || 'HEY needs your approval to proceed.'}</p>
        {activity.metadata?.details && (
          <details className="island-module-details">
            <summary>Details</summary>
            <pre>{activity.metadata.details}</pre>
          </details>
        )}
      </div>
      <div className="island-module-actions">
        <button
          className="island-action-btn island-action-secondary"
          onClick={() => onAction?.('deny', activity.id)}
          disabled={activity.metadata?.denyDisabled}
        >
          Deny
        </button>
        <button
          className="island-action-btn island-action-primary"
          onClick={() => onAction?.('approve', activity.id)}
          disabled={activity.metadata?.approveDisabled}
        >
          Approve
        </button>
      </div>
    </div>
  );
}

/**
 * Mission Progress module — shows mission name, step, percentage, ETA.
 * @param {Object} props
 * @param {Object} props.activity - The mission activity
 */
export function MissionProgressModule({ activity }) {
  const progress = typeof activity.progress === 'number' ? activity.progress : 0;
  const step = activity.metadata?.currentStep || 'Initializing…';
  const totalSteps = activity.metadata?.totalSteps;
  const eta = activity.metadata?.eta;

  return (
    <div className="island-module mission-progress-module" data-module="mission-progress">
      <div className="island-module-header">
        <span className="island-module-title">{activity.title || 'Mission'}</span>
        {activity.pinned && <span className="island-module-pin" title="Pinned">📌</span>}
      </div>
      <div className="island-module-body">
        <div className="island-progress-bar">
          <div
            className="island-progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <div className="island-progress-meta">
          <span>{step}{totalSteps ? ` / ${totalSteps}` : ''}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        {eta && (
          <div className="island-module-eta">ETA: {formatDuration(eta)}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Voice Session module — shows live transcript tail, state, duration.
 * @param {Object} props
 * @param {Object} props.activity - The voice activity
 */
export function VoiceSessionModule({ activity }) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (activity.type === 'listening' || activity.type === 'speaking') {
      const start = new Date(activity.createdAt).getTime();
      const update = () => setDuration(Math.floor((Date.now() - start) / 1000));
      update();
      const id = setInterval(update, 1000);
      return () => clearInterval(id);
    }
  }, [activity.type, activity.createdAt]);

  const transcript = activity.metadata?.transcriptTail || activity.message || '';

  return (
    <div className="island-module voice-session-module" data-module="voice-session">
      <div className="island-module-header">
        <span className="island-module-title">
          {activity.type === 'listening' ? 'Listening' :
           activity.type === 'thinking' ? 'Thinking' :
           activity.type === 'speaking' ? 'Speaking' : 'Voice'}
        </span>
        <span className="island-module-duration">{formatTime(duration)}</span>
      </div>
      <div className="island-module-body">
        {transcript && (
          <div className="island-transcript-tail" aria-live="polite">
            {transcript}
          </div>
        )}
        {!transcript && (
          <div className="island-module-empty">
            {activity.type === 'thinking' ? 'Processing…' : 'Waiting for speech…'}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Print Job module — shows pages, sheets, printer state.
 * @param {Object} props
 * @param {Object} props.activity - The print activity
 */
export function PrintJobModule({ activity }) {
  const pages = activity.metadata?.pages || 0;
  const sheets = activity.metadata?.sheets || Math.ceil(pages / 2);
  const printer = activity.metadata?.printer || 'Default Printer';
  const status = activity.metadata?.printStatus || 'queued';

  return (
    <div className="island-module print-job-module" data-module="print-job">
      <div className="island-module-header">
        <span className="island-module-title">Print Job</span>
        <span className="island-module-status status-{status}">{status}</span>
      </div>
      <div className="island-module-body">
        <div className="island-print-info">
          <div><strong>{pages}</strong> page{pages !== 1 ? 's' : ''}</div>
          <div><strong>{sheets}</strong> sheet{sheets !== 1 ? 's' : ''}</div>
          <div className="island-printer-name">{printer}</div>
        </div>
        {typeof activity.progress === 'number' && (
          <div className="island-progress-bar">
            <div
              className="island-progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, activity.progress))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Cost Warning module — shows spend vs envelope.
 * @param {Object} props
 * @param {Object} props.activity - The cost warning activity
 */
export function CostWarningModule({ activity }) {
  const spent = activity.metadata?.costCents || 0;
  const envelope = activity.metadata?.envelopeCents || 0;
  const pct = envelope > 0 ? (spent / envelope) * 100 : 0;
  const isOver = spent > envelope;

  return (
    <div className="island-module cost-warning-module" data-module="cost-warning">
      <div className="island-module-header">
        <span className="island-module-title">Cost Warning</span>
        {isOver && <span className="island-module-over">OVER</span>}
      </div>
      <div className="island-module-body">
        <div className="island-cost-display">
          <span className={isOver ? 'island-cost-over' : ''}>
            ${(spent / 100).toFixed(2)}
          </span>
          <span className="island-cost-envelope"> / ${(envelope / 100).toFixed(2)}</span>
        </div>
        <div className="island-progress-bar" style={{ height: '6px' }}>
          <div
            className={`island-progress-fill ${isOver ? 'island-progress-over' : ''}`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <div className="island-cost-pct">{Math.round(pct)}% of envelope</div>
      </div>
    </div>
  );
}

/**
 * Approval Timer module — countdown to action deadline.
 * @param {Object} props
 * @param {Object} props.activity - The activity with expiresAt
 */
export function ApprovalTimerModule({ activity }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!activity.expiresAt) {
      setRemaining(0);
      return;
    }

    const update = () => {
      const now = Date.now();
      const expires = new Date(activity.expiresAt).getTime();
      const diff = Math.max(0, expires - now);
      setRemaining(Math.ceil(diff / 1000));
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [activity.expiresAt]);

  const isCritical = remaining < 30;

  return (
    <div className="island-module approval-timer-module" data-module="approval-timer">
      <div className="island-module-header">
        <span className="island-module-title">Action Required</span>
        <span className={`island-timer ${isCritical ? 'island-timer-critical' : ''}`}>
          {formatTime(remaining)}
        </span>
      </div>
      <div className="island-module-body">
        <div className="island-timer-bar">
          <div
            className={`island-timer-fill ${isCritical ? 'island-timer-fill-critical' : ''}`}
            style={{ width: `${Math.min(100, (remaining / 300) * 100)}%` }}
          />
        </div>
        <p className="island-module-message">
          {activity.message || 'Respond before the timer expires.'}
        </p>
      </div>
    </div>
  );
}

/**
 * Sync State module — shows pending/queued work offline.
 * @param {Object} props
 * @param {Object} props.activity - The sync activity
 * @param {Array} props.allActivities - All activities for context
 */
export function SyncStateModule({ activity, allActivities }) {
  const pendingCount = allActivities.filter(a => a.metadata?.pendingSync).length;
  const queuedCount = allActivities.filter(a => a.metadata?.offlineQueue).length;
  const lastSync = activity.metadata?.lastSync;

  return (
    <div className="island-module sync-state-module" data-module="sync-state">
      <div className="island-module-header">
        <span className="island-module-title">Sync Status</span>
        {pendingCount > 0 && (
          <span className="island-module-badge">{pendingCount} pending</span>
        )}
      </div>
      <div className="island-module-body">
        <div className="island-sync-stats">
          <div><strong>{pendingCount}</strong> pending sync</div>
          <div><strong>{queuedCount}</strong> queued offline</div>
        </div>
        {lastSync && (
          <div className="island-module-last-sync">
            Last synced: {formatRelativeTime(lastSync)}
          </div>
        )}
        {pendingCount === 0 && queuedCount === 0 && (
          <div className="island-module-empty">All caught up</div>
        )}
      </div>
    </div>
  );
}

/**
 * Relay State module — shows relay connected/degraded.
 * @param {Object} props
 * @param {Object} props.activity - The relay activity
 */
export function RelayStateModule({ activity }) {
  const state = activity.metadata?.relayState || 'unknown';
  const pairedDevices = activity.metadata?.pairedDevices || 0;
  const lastHeartbeat = activity.metadata?.lastHeartbeat;

  const stateConfig = {
    connected: { label: 'Connected', class: 'status-connected' },
    degraded: { label: 'Degraded', class: 'status-degraded' },
    disconnected: { label: 'Disconnected', class: 'status-disconnected' },
    unknown: { label: 'Unknown', class: 'status-unknown' },
  };

  const config = stateConfig[state] || stateConfig.unknown;

  return (
    <div className="island-module relay-state-module" data-module="relay-state">
      <div className="island-module-header">
        <span className="island-module-title">HEY Relay</span>
        <span className={`island-module-status ${config.class}`}>{config.label}</span>
      </div>
      <div className="island-module-body">
        <div className="island-relay-info">
          <div><strong>{pairedDevices}</strong> paired device{pairedDevices !== 1 ? 's' : ''}</div>
          {lastHeartbeat && (
            <div>Last heartbeat: {formatRelativeTime(lastHeartbeat)}</div>
          )}
        </div>
        {state === 'disconnected' && (
          <p className="island-module-message">
            Relay is not running. Start it from the tray to enable background features.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Catch Up module — summarizes up to 3 notifications.
 * @param {Object} props
 * @param {Array} props.allActivities - All activities to summarize
 */
export function CatchUpModule({ allActivities }) {
  const notifications = allActivities
    .filter(a => a.type === 'notification' && !a.dismissed)
    .slice(0, 3);

  return (
    <div className="island-module catch-up-module" data-module="catch-up">
      <div className="island-module-header">
        <span className="island-module-title">Catch Up</span>
        {notifications.length > 3 && <span className="island-module-badge">+{notifications.length - 3} more</span>}
      </div>
      <div className="island-module-body">
        {notifications.length === 0 ? (
          <div className="island-module-empty">Nothing new</div>
        ) : (
          <ul className="island-notification-list">
            {notifications.map(n => (
              <li key={n.id} className="island-notification-item">
                <span className="island-notification-title">{n.title}</span>
                {n.message && <span className="island-notification-message">{n.message}</span>}
                <span className="island-notification-time">
                  {formatRelativeTime(n.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Capture Indicator module — shows mic/camera active indicator.
 * @param {Object} props
 * @param {Object} props.activity - The capture activity
 */
export function CaptureIndicatorModule({ activity }) {
  const [duration, setDuration] = useState(0);
  const isCapturing = activity.metadata?.capturing === true ||
    ['listening', 'speaking'].includes(activity.type);

  useEffect(() => {
    if (isCapturing) {
      const start = activity.metadata?.captureStartedAt
        ? new Date(activity.metadata.captureStartedAt).getTime()
        : new Date(activity.createdAt).getTime();
      const update = () => setDuration(Math.floor((Date.now() - start) / 1000));
      update();
      const id = setInterval(update, 1000);
      return () => clearInterval(id);
    }
  }, [isCapturing, activity.createdAt, activity.metadata?.captureStartedAt]);

  const captureType = activity.metadata?.captureType || 'microphone';

  return (
    <div className="island-module capture-indicator-module" data-module="capture-indicator">
      <div className="island-module-header">
        <span className="island-module-title">
          <span className="island-capture-dot" aria-hidden="true" />
          {captureType === 'camera' ? 'Camera Active' : 'Microphone Active'}
        </span>
        <span className="island-module-duration">{formatTime(duration)}</span>
      </div>
      <div className="island-module-body">
        <div className="island-capture-status">
          <span>Capturing {captureType}</span>
          <span>since {formatTime(duration)}</span>
        </div>
        <p className="island-module-message">
          {activity.metadata?.retention === 'none' ? 'Not saved' : 'Saved to inbox'}
        </p>
      </div>
    </div>
  );
}

/**
 * Format seconds as MM:SS or HH:MM:SS
 */
function formatTime(seconds) {
  if (seconds < 0) seconds = 0;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format milliseconds as human duration
 */
function formatDuration(ms) {
  if (ms < 1000) return '< 1s';
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

/**
 * Format timestamp as relative time
 */
function formatRelativeTime(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

// Module registry for dynamic lookup
export const ISLAND_MODULES = {
  approval: ApprovalModule,
  'mission-progress': MissionProgressModule,
  'voice-session': VoiceSessionModule,
  'print-job': PrintJobModule,
  'cost-warning': CostWarningModule,
  'approval-timer': ApprovalTimerModule,
  'sync-state': SyncStateModule,
  'relay-state': RelayStateModule,
  'catch-up': CatchUpModule,
  'capture-indicator': CaptureIndicatorModule,
};

export default ISLAND_MODULES;