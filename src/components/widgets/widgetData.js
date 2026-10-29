/**
 * Widget Data — derives each widget's view model from app state.
 * Pure functions, no side effects. Returns view models with freshness timestamps.
 */

import {
  getWidget,
  getAllWidgets,
  WIDGET_STATES,
  validateWidgetViewModel,
} from '../../core/widgetRegistry.js';

// Re-export for consumers
export { WIDGET_STATES } from '../../core/widgetRegistry.js';

/**
 * Base view model structure all widgets share.
 * @param {string} widgetId
 * @param {string} state
 * @param {Object} data
 * @returns {Object}
 */
function baseViewModel(widgetId, state, data = {}) {
  const now = Date.now();
  const widget = getWidget(widgetId);
  const maxAge = widget?.freshness?.maxAge ?? Infinity;
  const age = now - (data.timestamp || now);
  const isStale = age > maxAge && maxAge !== Infinity;

  return {
    widgetId,
    state: isStale ? WIDGET_STATES.STALE : state,
    timestamp: data.timestamp || now,
    freshness: {
      maxAge,
      age,
      isStale,
      updatedAt: new Date(data.timestamp || now).toISOString(),
    },
    deepLink: widget?.deepLink,
    ...data,
  };
}

/**
 * Derives the Today widget view model.
 * Shows up to 3 of today's items + current highlighted.
 * @param {Object} state - App state { missions, tasks, calendar }
 * @returns {Object}
 */
export function deriveTodayWidget(state) {
  const { missions = [], tasks = [], calendar = [] } = state || {};
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // Combine and filter today's items
  const items = [
    ...missions
      .filter(m => m.scheduledAt && new Date(m.scheduledAt) >= todayStart && new Date(m.scheduledAt) < todayEnd)
      .map(m => ({ ...m, type: 'mission', source: 'missions' })),
    ...tasks
      .filter(t => t.dueAt && new Date(t.dueAt) >= todayStart && new Date(t.dueAt) < todayEnd)
      .map(t => ({ ...t, type: 'task', source: 'tasks' })),
    ...calendar
      .filter(c => c.startAt && new Date(c.startAt) >= todayStart && new Date(c.startAt) < todayEnd)
      .map(c => ({ ...c, type: 'event', source: 'calendar' })),
  ].sort((a, b) => {
    const aTime = new Date(a.scheduledAt || a.dueAt || a.startAt || 0).getTime();
    const bTime = new Date(b.scheduledAt || b.dueAt || b.startAt || 0).getTime();
    return aTime - bTime;
  });

  // Find current item (happening now or next)
  const currentItem = items.find(item => {
    const start = new Date(item.scheduledAt || item.dueAt || item.startAt || 0).getTime();
    return start <= now.getTime() && (!item.endAt || new Date(item.endAt).getTime() > now.getTime());
  }) || items[0] || null;

  const upcoming = items.filter(item => item !== currentItem).slice(0, 2);

  if (items.length === 0) {
    return baseViewModel('today', WIDGET_STATES.EMPTY, {
      items: [],
      currentItem: null,
      upcoming: [],
      emptyState: getWidget('today').emptyState,
    });
  }

  return baseViewModel('today', WIDGET_STATES.ACTIVE, {
    items,
    currentItem: currentItem ? formatItem(currentItem) : null,
    upcoming: upcoming.map(formatItem),
    itemCount: items.length,
  });
}

/**
 * Derives the Mission widget view model.
 * Shows one running mission: name, progress ring, step count.
 * @param {Object} state - App state { missions }
 * @returns {Object}
 */
export function deriveMissionWidget(state) {
  const { missions = [] } = state || {};
  const running = missions.find(m =>
    ['running', 'paused', 'waiting-approval', 'failed'].includes(m.state)
  );

  if (!running) {
    return baseViewModel('mission', WIDGET_STATES.EMPTY, {
      mission: null,
      emptyState: getWidget('mission').emptyState,
    });
  }

  return baseViewModel('mission', WIDGET_STATES.ACTIVE, {
    mission: {
      id: running.id,
      title: running.title,
      progress: typeof running.progress === 'number' ? running.progress : 0,
      currentStep: running.currentStep || running.detail || 'In progress',
      totalSteps: running.totalSteps,
      state: running.state,
      eta: running.eta,
    },
  });
}

/**
 * Derives the Approval widget view model.
 * Shows one waiting approval + risk badge.
 * @param {Object} state - App state { approvals }
 * @returns {Object}
 */
export function deriveApprovalWidget(state) {
  const { approvals = [] } = state || {};
  const pending = approvals
    .filter(a => a.status === 'pending' && !a.expired)
    .sort((a, b) => {
      const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0);
    })[0];

  if (!pending) {
    return baseViewModel('approval', WIDGET_STATES.EMPTY, {
      approval: null,
      emptyState: getWidget('approval').emptyState,
    });
  }

  return baseViewModel('approval', WIDGET_STATES.ACTIVE, {
    approval: {
      id: pending.id,
      title: pending.title,
      description: pending.description,
      riskLevel: pending.riskLevel || 'medium',
      capability: pending.capability,
      expiresAt: pending.expiresAt,
      actionRequiresConfirmation: true,
    },
  });
}

/**
 * Derives the Quick Capture widget view model.
 * Always active — just provides action deep links.
 * @returns {Object}
 */
export function deriveQuickCaptureWidget() {
  return baseViewModel('quickCapture', WIDGET_STATES.ACTIVE, {
    actions: {
      voice: 'hey://capture?mode=voice',
      text: 'hey://capture?mode=text',
      image: 'hey://capture?mode=image',
      file: 'hey://capture?mode=file',
    },
  });
}

/**
 * Derives the Time Saved widget view model.
 * This week's total + 7-day sparkline.
 * @param {Object} state - App state { timeLedger }
 * @returns {Object}
 */
export function deriveTimeSavedWidget(state) {
  const { timeLedger = { weeklyTotal: 0, sparkline: [] } } = state || {};

  // If no data at all (not even zero), show empty
  if (timeLedger.weeklyTotal === 0 && (!timeLedger.sparkline || timeLedger.sparkline.length === 0)) {
    return baseViewModel('timeSaved', WIDGET_STATES.EMPTY, {
      weeklyTotal: 0,
      sparkline: [],
      formattedTotal: '0h 0m',
      emptyState: getWidget('timeSaved').emptyState,
    });
  }

  const hours = Math.floor(timeLedger.weeklyTotal / 3600);
  const minutes = Math.floor((timeLedger.weeklyTotal % 3600) / 60);

  return baseViewModel('timeSaved', WIDGET_STATES.ACTIVE, {
    weeklyTotal: timeLedger.weeklyTotal,
    sparkline: timeLedger.sparkline || [],
    formattedTotal: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
  });
}

/**
 * Derives the Capability widget view model.
 * Shows 3 key states: offline, relay, budget.
 * @param {Object} state - App state { capabilities, relay, cost }
 * @returns {Object}
 */
export function deriveCapabilityWidget(state) {
  const { capabilities = {}, relay = {}, cost = {} } = state || {};

  // Support both property naming conventions
  const spentCents = cost.spentCents ?? cost.todaySpentCents ?? 0;
  const envelopeCents = cost.envelopeCents ?? 0;
  const overEnvelope = cost.overEnvelope ?? (envelopeCents > 0 && spentCents > envelopeCents);
  const nearEnvelope = cost.nearEnvelope ?? (envelopeCents > 0 && !overEnvelope && (spentCents / envelopeCents) >= 0.8);

  return baseViewModel('capability', WIDGET_STATES.ACTIVE, {
    states: [
      {
        key: 'offline',
        label: 'Offline',
        status: capabilities.offline ? 'degraded' : 'ok',
        message: capabilities.offline ? 'Some features limited' : 'Fully online',
      },
      {
        key: 'relay',
        label: 'Relay',
        status: relay.connected ? 'ok' : 'disconnected',
        message: relay.connected ? `${relay.pairedDevices || 0} device${relay.pairedDevices !== 1 ? 's' : ''} paired` : 'Relay not running',
      },
      {
        key: 'budget',
        label: 'Budget',
        status: overEnvelope ? 'over' : nearEnvelope ? 'warning' : 'ok',
        message: envelopeCents > 0
          ? `$${(spentCents / 100).toFixed(2)} / $${(envelopeCents / 100).toFixed(2)}`
          : 'No envelope set',
      },
    ],
  });
}

/**
 * Derives the Cost widget view model.
 * Today's spend vs envelope.
 * @param {Object} state - App state { cost }
 * @returns {Object}
 */
export function deriveCostWidget(state) {
  const { cost = {} } = state || {};
  const spent = cost.todaySpentCents || 0;
  const envelope = cost.envelopeCents || 0;

  if (envelope === 0 && spent === 0) {
    return baseViewModel('cost', WIDGET_STATES.EMPTY, {
      spent: 0,
      envelope: 0,
      percentage: 0,
      formattedSpent: '$0.00',
      formattedEnvelope: '$0.00',
      emptyState: getWidget('cost').emptyState,
    });
  }

  const percentage = envelope > 0 ? Math.min(100, (spent / envelope) * 100) : 0;
  const over = spent > envelope;

  return baseViewModel('cost', WIDGET_STATES.ACTIVE, {
    spent,
    envelope,
    percentage,
    over,
    formattedSpent: `$${(spent / 100).toFixed(2)}`,
    formattedEnvelope: envelope > 0 ? `$${(envelope / 100).toFixed(2)}` : 'No limit',
  });
}

/**
 * Derives the Voice widget view model.
 * Push-to-talk action widget.
 * @returns {Object}
 */
export function deriveVoiceWidget() {
  return baseViewModel('voice', WIDGET_STATES.ACTIVE, {
    actions: {
      pushToTalk: 'hey://voice?mode=push-to-talk',
      tapToTalk: 'hey://voice?mode=tap',
    },
  });
}

/**
 * Derives ALL widget view models at once.
 * @param {Object} state - Full app state
 * @returns {Object} Map of widgetId -> viewModel
 */
export function deriveAllWidgets(state) {
  const widgets = getAllWidgets();
  const viewModels = {};

  for (const widget of widgets) {
    try {
      const deriveFn = DERIVE_FUNCTIONS[widget.id];
      if (deriveFn) {
        viewModels[widget.id] = deriveFn(state);
      } else {
        viewModels[widget.id] = baseViewModel(widget.id, WIDGET_STATES.ERROR, {
          error: `No derive function for ${widget.id}`,
        });
      }
    } catch (err) {
      viewModels[widget.id] = baseViewModel(widget.id, WIDGET_STATES.ERROR, {
        error: err.message,
      });
    }
  }

  return viewModels;
}

/**
 * Derives a single widget by ID.
 * @param {string} widgetId
 * @param {Object} state
 * @returns {Object}
 */
export function deriveWidget(widgetId, state) {
  const deriveFn = DERIVE_FUNCTIONS[widgetId];
  if (!deriveFn) {
    return baseViewModel(widgetId, WIDGET_STATES.ERROR, {
      error: `Unknown widget: ${widgetId}`,
    });
  }
  return deriveFn(state);
}

/**
 * Formats an item for the Today widget.
 */
function formatItem(item) {
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    time: item.scheduledAt || item.dueAt || item.startAt,
    location: item.location,
    progress: item.progress,
  };
}

// Map of widget ID to derive function
const DERIVE_FUNCTIONS = {
  today: deriveTodayWidget,
  mission: deriveMissionWidget,
  approval: deriveApprovalWidget,
  quickCapture: deriveQuickCaptureWidget,
  timeSaved: deriveTimeSavedWidget,
  capability: deriveCapabilityWidget,
  cost: deriveCostWidget,
  voice: deriveVoiceWidget,
};

export default {
  deriveAllWidgets,
  deriveWidget,
  deriveTodayWidget,
  deriveMissionWidget,
  deriveApprovalWidget,
  deriveQuickCaptureWidget,
  deriveTimeSavedWidget,
  deriveCapabilityWidget,
  deriveCostWidget,
  deriveVoiceWidget,
  baseViewModel,
};