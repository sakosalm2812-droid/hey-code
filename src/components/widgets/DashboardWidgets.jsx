/**
 * DashboardWidgets — HEY widget dashboard using the new widget system.
 * Renders all 8 widgets as tiles using WidgetTile component.
 */

import { useState, useEffect, useMemo } from 'react';
import { deriveAllWidgets } from './widgetData.js';
import { getAllWidgets, getWidgetSizes } from '../../core/widgetRegistry.js';
import { WidgetTile } from './WidgetTile.jsx';
import styles from './DashboardWidgets.module.css';

/**
 * Mock state provider — in production this would connect to actual app state.
 * For now, provides demo data to show widgets in various states.
 */
function getMockAppState() {
  const now = Date.now();
  const oneHourAgo = now - 3600000;
  const oneHourFromNow = now + 3600000;

  return {
    missions: [
      {
        id: 'mission-1',
        title: 'Build worksheet pack',
        state: 'running',
        progress: 65,
        currentStep: 'Generating exercises',
        totalSteps: 5,
        scheduledAt: new Date(oneHourAgo).toISOString(),
        eta: new Date(now + 1800000).toISOString(),
      },
      {
        id: 'mission-2',
        title: 'Research photosynthesis',
        state: 'paused',
        progress: 30,
        currentStep: 'Gathering sources',
        totalSteps: 4,
      },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Review student submissions',
        dueAt: new Date(oneHourFromNow).toISOString(),
      },
      {
        id: 'task-2',
        title: 'Prepare tomorrow\'s lesson',
        dueAt: new Date(now + 7200000).toISOString(),
      },
    ],
    calendar: [
      {
        id: 'cal-1',
        title: 'Staff meeting',
        startAt: new Date(now + 10800000).toISOString(),
        endAt: new Date(now + 14400000).toISOString(),
        location: 'Room 204',
      },
    ],
    approvals: [
      {
        id: 'approval-1',
        title: 'Deploy to production',
        description: 'Version 2.4.0 includes database migrations',
        status: 'pending',
        riskLevel: 'high',
        capability: 'deploy.production',
        expiresAt: new Date(now + 3600000).toISOString(),
      },
    ],
    timeLedger: {
      weeklyTotal: 15120, // 4h 12m in seconds
      sparkline: [3600, 7200, 1800, 5400, 9000, 3600, 7200], // 7 days in seconds
    },
    capabilities: {
      offline: false,
    },
    relay: {
      connected: true,
      pairedDevices: 2,
    },
    cost: {
      todaySpentCents: 2500, // $25.00
      envelopeCents: 10000,  // $100.00
      spentCents: 2500,
      envelopeCents: 10000,
      overEnvelope: false,
      nearEnvelope: false,
    },
  };
}

export function DashboardWidgets() {
  const [widgetStates, setWidgetStates] = useState({});
  const [layout, setLayout] = useState('grid'); // 'grid' | 'list'

  // Derive all widgets from state
  const viewModels = useMemo(() => {
    const state = getMockAppState();
    return deriveAllWidgets(state);
  }, []);

  // Handle widget actions (deep links)
  const handleWidgetAction = (deepLink, widgetId) => {
    console.log('[DashboardWidgets] Action:', { deepLink, widgetId });
    // In production: navigate to deepLink or trigger native action
    if (deepLink?.startsWith('hey://')) {
      // Handle internal deep links
      const path = deepLink.replace('hey://', '/');
      window.location.hash = path; // or use router
    }
  };

  // Refresh widget data
  const refreshWidgets = () => {
    // In production: re-fetch state and re-derive
    setWidgetStates(prev => ({ ...prev, refreshedAt: Date.now() }));
  };

  const widgets = getAllWidgets();
  const widgetEntries = Object.entries(viewModels);

  return (
    <section className={styles.dashboard} data-layout={layout}>
      <header className={styles.header}>
        <h2 className={styles.title}>Widgets</h2>
        <div className={styles.headerActions}>
          <button
            className={styles.layoutBtn}
            onClick={() => setLayout(l => l === 'grid' ? 'list' : 'grid')}
            aria-pressed={layout === 'list'}
            aria-label={`Switch to ${layout === 'grid' ? 'list' : 'grid'} view`}
          >
            {layout === 'grid' ? '☰' : '⊞'}
          </button>
          <button
            className={styles.refreshBtn}
            onClick={refreshWidgets}
            aria-label="Refresh widgets"
          >
            ⟳
          </button>
        </div>
      </header>

      <div className={`${styles.grid} ${layout === 'list' ? styles.listLayout : ''}`}>
        {widgetEntries.map(([widgetId, viewModel]) => {
          const widgetDef = widgets.find(w => w.id === widgetId);
          const sizes = getWidgetSizes(widgetId, 'web');
          const defaultSize = sizes.includes('medium') ? 'medium' : sizes[0] || 'small';

          return (
            <div
              key={widgetId}
              className={styles.widgetWrapper}
              data-widget={widgetId}
            >
              <WidgetTile
                viewModel={viewModel}
                size={defaultSize}
                onAction={(action) => handleWidgetAction(action, widgetId)}
              />
              {widgetDef && (
                <div className={styles.widgetMeta}>
                  <span className={styles.widgetPlatforms}>
                    {Object.entries(widgetDef.platforms)
                      .filter(([, v]) => v !== 'unavailable')
                      .map(([k]) => k)
                      .join(', ')}
                  </span>
                  {viewModel.freshness?.isStale && (
                    <span className={styles.staleIndicator}>⚠ Stale</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.activeDot}`} />
          Active
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.staleDot}`} />
          Stale
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.emptyDot}`} />
          Empty
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.errorDot}`} />
          Error
        </span>
      </div>
    </section>
  );
}

export default DashboardWidgets;