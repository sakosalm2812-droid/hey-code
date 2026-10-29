/**
 * WidgetTile — in-app renderer for a single widget.
 * Receives a view model from widgetData.js and renders it.
 * Matches the native widget appearance using glass tokens.
 */

import { useState, useMemo } from 'react';
import { getWidget } from '../../core/widgetRegistry.js';
import { WIDGET_STATES } from '../../core/widgetRegistry.js';
import styles from './WidgetTile.module.css';

/**
 * Main WidgetTile component.
 * @param {Object} props
 * @param {Object} props.viewModel - View model from deriveWidget()
 * @param {string} props.size - 'small' | 'medium' | 'large' | 'accessory'
 * @param {Function} props.onAction - Callback for widget actions (deep links)
 */
export function WidgetTile({ viewModel, size = 'small', onAction }) {
  if (!viewModel) {
    return <div className={styles.tile} data-empty="true" />;
  }

  const widgetDef = getWidget(viewModel.widgetId);
  const isStale = viewModel.freshness?.isStale;
  const isError = viewModel.state === WIDGET_STATES.ERROR;
  const isEmpty = viewModel.state === WIDGET_STATES.EMPTY;

  // Determine display state
  const displayState = isError ? 'error' : isStale ? 'stale' : isEmpty ? 'empty' : 'active';

  return (
    <article
      className={`${styles.tile} ${styles[size]} ${styles[displayState]}`}
      data-widget={viewModel.widgetId}
      data-size={size}
      data-state={displayState}
    >
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{widgetDef?.title || viewModel.widgetId}</h3>
          {(isStale || isError) && (
            <span className={`${styles.badge} ${isStale ? styles.staleBadge : styles.errorBadge}`}>
              {isStale ? 'Stale' : 'Error'}
            </span>
          )}
        </div>
        {viewModel.freshness && (
          <time className={styles.timestamp} dateTime={viewModel.freshness.updatedAt}>
            {formatFreshness(viewModel.freshness)}
          </time>
        )}
      </header>

      <div className={styles.content}>
        {isEmpty && widgetDef?.emptyState && (
          <EmptyStateWidget emptyState={widgetDef.emptyState} onAction={onAction} />
        )}

        {isError && (
          <ErrorStateWidget error={viewModel.error} />
        )}

        {!isEmpty && !isError && (
          <WidgetContent widgetId={viewModel.widgetId} viewModel={viewModel} onAction={onAction} />
        )}
      </div>

      {viewModel.deepLink && !isEmpty && !isError && (
        <footer className={styles.footer}>
          <a
            href={viewModel.deepLink}
            className={styles.deepLink}
            onClick={(e) => { e.preventDefault(); onAction?.(viewModel.deepLink); }}
          >
            Open in HEY
          </a>
        </footer>
      )}
    </article>
  );
}

/**
 * Renders widget-specific content based on widgetId.
 */
function WidgetContent({ widgetId, viewModel, onAction }) {
  const renderers = {
    today: renderTodayContent,
    mission: renderMissionContent,
    approval: renderApprovalContent,
    quickCapture: renderQuickCaptureContent,
    timeSaved: renderTimeSavedContent,
    capability: renderCapabilityContent,
    cost: renderCostContent,
    voice: renderVoiceContent,
  };

  const renderer = renderers[widgetId];
  if (!renderer) {
    return <div className={styles.unknownWidget}>No renderer for {widgetId}</div>;
  }

  return renderer(viewModel, onAction);
}

/* --- Individual Widget Renderers --- */

function renderTodayContent(vm) {
  if (!vm.currentItem && !vm.upcoming?.length) {
    return <div className={styles.noItems}>Nothing scheduled</div>;
  }

  return (
    <div className={styles.todayContent}>
      {vm.currentItem && (
        <div className={`${styles.item} ${styles.currentItem}`}>
          <span className={styles.itemType}>{vm.currentItem.type}</span>
          <span className={styles.itemTitle}>{vm.currentItem.title}</span>
          {vm.currentItem.time && (
            <time className={styles.itemTime}>{formatTime(vm.currentItem.time)}</time>
          )}
          {vm.currentItem.progress !== undefined && (
            <div className={styles.miniProgress}>
              <div className={styles.miniProgressFill} style={{ width: `${vm.currentItem.progress}%` }} />
            </div>
          )}
        </div>
      )}
      {vm.upcoming?.map(item => (
        <div key={item.id} className={styles.item}>
          <span className={styles.itemType}>{item.type}</span>
          <span className={styles.itemTitle}>{item.title}</span>
          {item.time && <time className={styles.itemTime}>{formatTime(item.time)}</time>}
        </div>
      ))}
    </div>
  );
}

function renderMissionContent(vm) {
  if (!vm.mission) return <div className={styles.noItems}>No active mission</div>;

  const { title, progress, currentStep, totalSteps, state } = vm.mission;

  return (
    <div className={styles.missionContent}>
      <div className={styles.missionHeader}>
        <h4 className={styles.missionTitle}>{title}</h4>
        <span className={`${styles.missionState} ${styles[state]}`}>{state}</span>
      </div>
      <div className={styles.progressRingWrapper}>
        <svg className={styles.progressRing} viewBox="0 0 120 120">
          <circle
            className={styles.progressRingBg}
            cx="60" cy="60" r="54"
            fill="none" stroke="var(--hey-border)" strokeWidth="8"
          />
          <circle
            className={styles.progressRingFg}
            cx="60" cy="60" r="54"
            fill="none" stroke="var(--hey-accent)" strokeWidth="8"
            strokeDasharray="339.3"
            strokeDashoffset={`${339.3 * (1 - progress / 100)}`}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
          <text x="60" y="65" textAnchor="middle" className={styles.progressText} fill="var(--hey-text-primary)">
            {Math.round(progress)}%
          </text>
        </svg>
      </div>
      <div className={styles.missionMeta}>
        <span>{currentStep}</span>
        {totalSteps && <span>{totalSteps} steps</span>}
      </div>
    </div>
  );
}

function renderApprovalContent(vm) {
  if (!vm.approval) return <div className={styles.noItems}>No approvals waiting</div>;

  const { title, description, riskLevel, capability, expiresAt } = vm.approval;
  const riskColors = {
    low: 'var(--success)',
    medium: 'var(--warning)',
    high: 'var(--danger)',
    critical: 'var(--error)',
  };

  return (
    <div className={styles.approvalContent}>
      <div className={styles.approvalHeader}>
        <h4 className={styles.approvalTitle}>{title}</h4>
        <span
          className={styles.riskBadge}
          style={{ background: riskColors[riskLevel] || riskColors.medium }}
        >
          {riskLevel?.toUpperCase() || 'MEDIUM'}
        </span>
      </div>
      {description && <p className={styles.approvalDesc}>{description}</p>}
      {capability && <p className={styles.approvalCap}>Capability: {capability}</p>}
      {expiresAt && (
        <p className={styles.approvalExpires}>
          Expires: {formatRelativeTime(expiresAt)}
        </p>
      )}
      <div className={styles.approvalActions}>
        <button
          className={`${styles.actionBtn} ${styles.denyBtn}`}
          onClick={() => onAction?.('deny', vm.approval.id)}
        >
          Deny
        </button>
        <button
          className={`${styles.actionBtn} ${styles.approveBtn}`}
          onClick={() => onAction?.('approve', vm.approval.id)}
        >
          Approve
        </button>
      </div>
    </div>
  );
}

function renderQuickCaptureContent(vm) {
  return (
    <div className={styles.quickCaptureContent}>
      <button className={styles.captureBtn} onClick={() => onAction?.(vm.actions.voice)}>
        <svg className={styles.micIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
        <span>Hold to speak</span>
      </button>
      <div className={styles.captureActions}>
        <button className={styles.captureActionBtn} onClick={() => onAction?.(vm.actions.text)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="M15 5l4 4" />
          </svg>
          Text
        </button>
        <button className={styles.captureActionBtn} onClick={() => onAction?.(vm.actions.image)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Photo
        </button>
      </div>
    </div>
  );
}

function renderTimeSavedContent(vm) {
  return (
    <div className={styles.timeSavedContent}>
      <div className={styles.timeSavedTotal}>{vm.formattedTotal}</div>
      <div className={styles.timeSavedLabel}>saved this week</div>
      {vm.sparkline?.length > 0 && (
        <div className={styles.sparkline} role="img" aria-label="7 day activity">
          {vm.sparkline.map((val, i) => (
            <div
              key={i}
              className={styles.sparklineBar}
              style={{ height: `${Math.max(10, (val / Math.max(1, ...vm.sparkline)) * 100)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function renderCapabilityContent(vm) {
  return (
    <div className={styles.capabilityContent}>
      {vm.states?.map(s => (
        <div key={s.key} className={`${styles.capabilityItem} ${styles[s.status]}`}>
          <span className={styles.capabilityLabel}>{s.label}</span>
          <span className={styles.capabilityStatus}>
            <span className={`${styles.statusDot} ${styles[s.status]}`} />
            {s.message}
          </span>
        </div>
      ))}
    </div>
  );
}

function renderCostContent(vm) {
  return (
    <div className={styles.costContent}>
      <div className={styles.costMain}>
        <span className={`${styles.costAmount} ${vm.over ? styles.over : ''}`}>{vm.formattedSpent}</span>
        <span className={styles.costEnvelope}> / {vm.formattedEnvelope}</span>
      </div>
      <div className={styles.costProgress}>
        <div className={styles.costProgressBar}>
          <div
            className={`${styles.costProgressFill} ${vm.over ? styles.over : ''}`}
            style={{ width: `${vm.percentage}%` }}
          />
        </div>
        <span className={styles.costPct}>{Math.round(vm.percentage)}%</span>
      </div>
    </div>
  );
}

function renderVoiceContent(vm) {
  return (
    <div className={styles.voiceContent}>
      <button className={styles.voiceBtn} onClick={() => onAction?.(vm.actions.pushToTalk)}>
        <svg className={styles.micIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
        <span>Push to talk</span>
      </button>
    </div>
  );
}

function EmptyStateWidget({ emptyState, onAction }) {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyTitle}>{emptyState.title}</p>
      {emptyState.message && <p className={styles.emptyMessage}>{emptyState.message}</p>}
      {emptyState.action && (
        <button className={styles.emptyAction} onClick={() => onAction?.(emptyState.action.deepLink)}>
          {emptyState.action.label}
        </button>
      )}
    </div>
  );
}

function ErrorStateWidget({ error }) {
  return (
    <div className={styles.errorState}>
      <p className={styles.errorMessage}>Failed to load widget</p>
      <pre className={styles.errorDetail}>{error}</pre>
    </div>
  );
}

/* --- Format helpers --- */

function formatFreshness(freshness) {
  if (freshness.isStale) {
    return `Stale (${Math.round(freshness.age / 60000)}m old)`;
  }
  const mins = Math.floor(freshness.age / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

export default WidgetTile;