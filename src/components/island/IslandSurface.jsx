/**
 * IslandSurface — collapsed/expanded renderer for the Dynamic Island.
 * Collapsed: 32px capsule, primary activity + badge.
 * Expanded: ≤220px, up to 3 modules.
 * Idle: 8px breathing dot (static under reduced motion).
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useReducedMotion } from '../../lib/motion/hooks.js';
import { pickPrimary, badgeCount, visibleModules, activityIcon, activityLabel } from './islandSelectors.js';
import { IslandModuleStack } from './IslandModule.jsx';
import styles from './IslandSurface.module.css';

/**
 * Main island surface component.
 * @param {Object} props
 * @param {Object} props.island - The island state from dynamicIslandEngine
 * @param {Array} props.activities - Visible activities from engine
 * @param {Function} props.onAction - Callback for module actions
 * @param {Function} props.onExpand - Callback when island expands
 * @param {Function} props.onCollapse - Callback when island collapses
 */
export function IslandSurface({
  island,
  activities,
  onAction,
  onExpand,
  onCollapse,
}) {
  const reducedMotion = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(false);
  const [breathing, setBreathing] = useState(false);
  const islandRef = useRef(null);

  // Derive primary activity and modules
  const primary = useMemo(() => pickPrimary(activities), [activities]);
  const badge = useMemo(() => badgeCount(activities, primary), [activities, primary]);
  const moduleTypes = useMemo(() => visibleModules(activities, primary), [activities, primary]);

  // Breathing animation for idle state
  useEffect(() => {
    if (reducedMotion || primary) {
      setBreathing(false);
      return;
    }

    setBreathing(true);
    // Breathing is handled via CSS animation
  }, [reducedMotion, primary]);

  // Handle click to expand/collapse
  const handleClick = useCallback(() => {
    if (isExpanded) {
      setIsExpanded(false);
      onCollapse?.();
    } else {
      setIsExpanded(true);
      onExpand?.();
    }
  }, [isExpanded, onExpand, onCollapse]);

  // Keyboard support
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    } else if (e.key === 'Escape' && isExpanded) {
      setIsExpanded(false);
      onCollapse?.();
    }
  }, [handleClick, isExpanded, onCollapse]);

  // Get icon for primary activity
  const PrimaryIcon = useMemo(() => {
    if (!primary) return null;
    // We'll use a simple SVG based on activity type
    return primary.type;
  }, [primary]);

  // Collapsed state (32px capsule or 8px breathing dot)
  if (!isExpanded) {
    if (!primary) {
      // Idle state: 8px breathing dot
      return (
        <div
          ref={islandRef}
          className={`${styles.island} ${styles.collapsed} ${styles.idle} ${breathing ? styles.breathing : ''}`}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label="HEY Dynamic Island - idle"
          aria-expanded={false}
        >
          <div className={styles.idleDot} aria-hidden="true" />
        </div>
      );
    }

    // Collapsed with primary activity: 32px capsule
    return (
      <div
        ref={islandRef}
        className={`${styles.island} ${styles.collapsed} ${styles.hasActivity}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label={`HEY Dynamic Island - ${activityLabel(primary.type)}`}
        aria-expanded={false}
      >
        <div className={styles.collapsedContent}>
          <span className={styles.activityIcon} data-type={primary.type}>
            {renderActivityIcon(primary.type)}
          </span>
          <span className={styles.activityLabel}>{activity.title}</span>
          {typeof primary.progress === 'number' && (
            <div className={styles.collapsedProgress}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.min(100, Math.max(0, primary.progress))}%` }}
              />
            </div>
          )}
          {badge > 0 && (
            <span className={styles.badge} aria-label={`${badge} more activit${badge === 1 ? 'y' : 'ies'}`}>
              +{badge}
            </span>
          )}
        </div>
        <span className={styles.expandHint} aria-hidden="true">⌘I</span>
      </div>
    );
  }

  // Expanded state (≤220px height, up to 3 modules)
  return (
    <div
      ref={islandRef}
      className={`${styles.island} ${styles.expanded}`}
      role="region"
      aria-label={`HEY Dynamic Island - ${activityLabel(primary?.type || 'expanded')}`}
      aria-expanded={true}
    >
      <div className={styles.expandedHeader}>
        <div className={styles.primaryActivity}>
          <span className={styles.activityIcon} data-type={primary?.type}>
            {primary ? renderActivityIcon(primary.type) : null}
          </span>
          <div className={styles.primaryInfo}>
            <strong>{primary?.title || 'HEY'}</strong>
            <small>{primary?.message || 'Expanded view'}</small>
          </div>
        </div>
        <button
          className={styles.collapseBtn}
          onClick={(e) => { e.stopPropagation(); setIsExpanded(false); onCollapse?.(); }}
          aria-label="Collapse island"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>

      <div className={styles.moduleArea}>
        <IslandModuleStack
          moduleTypes={moduleTypes}
          activity={primary}
          allActivities={activities}
          onAction={onAction}
        />
        {moduleTypes.length === 0 && primary && (
          <div className={styles.noModules}>
            <p>No modules available for this activity.</p>
            <small>Type: {primary.type}</small>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Renders an activity icon as inline SVG.
 * @param {string} type - Activity type
 * @returns {React.ReactNode}
 */
function renderActivityIcon(type) {
  const icons = {
    task: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    workflow: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    agent: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 17h8"/><path d="M12 11v6"/></svg>,
    timer: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    reminder: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    media: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>,
    download: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    upload: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    file_transfer: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    notification: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    pending_confirmation: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    success: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    error: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    recovery: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
    device_handoff: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
    calendar_event: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    prayer_countdown: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v10"/><path d="M4.93 10.93a7.5 7.5 0 0 1 10.14 0"/><path d="M8 14H6"/><path d="M16 14h2"/><path d="M12 18v4"/></svg>,
    generation: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    render: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    research: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    listening: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>,
    thinking: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 17h8"/><path d="M12 11v6"/></svg>,
    speaking: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="19" y1="9" x2="14" y2="14"/><line x1="22" y1="9" x2="17" y2="14"/></svg>,
    muted: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/></svg>,
    custom: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>,
  };

  return icons[type] || icons.custom;
}

export default IslandSurface;