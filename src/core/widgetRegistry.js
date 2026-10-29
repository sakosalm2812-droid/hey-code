/**
 * Widget Registry — pure definitions for HEY's 8 home screen widgets.
 * Each widget defines its metadata, platform support, and contract.
 * No side effects, no imports from React or DOM.
 */

export const WIDGET_SIZES = Object.freeze({
  SMALL: 'small',       // 2x2 / 160x160
  MEDIUM: 'medium',     // 4x2 / 360x160
  LARGE: 'large',       // 4x4 / 360x360
  ACCESSORY: 'accessory', // Lock screen / watch complications
});

export const PLATFORMS = Object.freeze([
  'web', 'windows', 'macos', 'linux', 'android', 'ios',
]);

export const WIDGET_STATES = Object.freeze({
  ACTIVE: 'active',       // Has data, fresh
  STALE: 'stale',         // Has data but past maxAge
  EMPTY: 'empty',         // No data available
  UNAVAILABLE: 'unavailable', // Platform doesn't support
  ERROR: 'error',         // Failed to derive data
});

/**
 * Widget definitions — the single source of truth for all widget metadata.
 * Native implementations read this (or a generated JSON) to know what to render.
 */
export const WIDGET_REGISTRY = Object.freeze({
  today: {
    id: 'today',
    title: 'Today',
    description: 'Up to 3 of today\'s items with the current one highlighted',
    sizes: [WIDGET_SIZES.SMALL, WIDGET_SIZES.MEDIUM, WIDGET_SIZES.ACCESSORY],
    platforms: {
      ios: 'native',
      android: 'native',
      macos: 'native',
      windows: 'bridged',
      linux: 'bridged',
      web: 'unavailable',
    },
    states: [WIDGET_STATES.ACTIVE, WIDGET_STATES.STALE, WIDGET_STATES.EMPTY],
    requiredCapabilities: ['mission.read', 'task.read'],
    deepLink: 'hey://today',
    freshness: { maxAge: 15 * 60 * 1000 }, // 15 minutes
    emptyState: {
      title: 'Nothing scheduled',
      message: 'Your day is clear. Enjoy the space.',
      action: null,
    },
  },

  mission: {
    id: 'mission',
    title: 'Mission',
    description: 'One running mission: name, progress ring, step count',
    sizes: [WIDGET_SIZES.SMALL, WIDGET_SIZES.ACCESSORY],
    platforms: {
      ios: 'native',
      android: 'native',
      macos: 'native',
      windows: 'bridged',
      linux: 'bridged',
      web: 'unavailable',
    },
    states: [WIDGET_STATES.ACTIVE, WIDGET_STATES.STALE, WIDGET_STATES.EMPTY],
    requiredCapabilities: ['mission.read'],
    deepLink: 'hey://missions?active=true',
    freshness: { maxAge: 5 * 60 * 1000 }, // 5 minutes
    emptyState: {
      title: 'No active mission',
      message: 'Start a mission from HEY to see progress here.',
      action: { label: 'Open Missions', deepLink: 'hey://missions' },
    },
  },

  approval: {
    id: 'approval',
    title: 'Approval',
    description: 'One waiting approval with risk badge — tap to confirm',
    sizes: [WIDGET_SIZES.SMALL, WIDGET_SIZES.ACCESSORY],
    platforms: {
      ios: 'native',
      android: 'native',
      macos: 'native',
      windows: 'bridged',
      linux: 'bridged',
      web: 'unavailable',
    },
    states: [WIDGET_STATES.ACTIVE, WIDGET_STATES.STALE, WIDGET_STATES.EMPTY],
    requiredCapabilities: ['trust.approve', 'trust.read'],
    deepLink: 'hey://approvals',
    freshness: { maxAge: 2 * 60 * 1000 }, // 2 minutes (approvals are urgent)
    emptyState: {
      title: 'No approvals waiting',
      message: 'All caught up.',
      action: null,
    },
    // Special: this widget has an action that requires confirmation
    actionRequiresConfirmation: true,
    action: {
      approve: { label: 'Approve', deepLink: 'hey://approvals?action=approve' },
      deny: { label: 'Deny', deepLink: 'hey://approvals?action=deny' },
    },
  },

  quickCapture: {
    id: 'quickCapture',
    title: 'Quick Capture',
    description: 'Mic button + text field for instant capture',
    sizes: [WIDGET_SIZES.SMALL, WIDGET_SIZES.MEDIUM],
    platforms: {
      ios: 'native',
      android: 'native',
      macos: 'native',
      windows: 'bridged',
      linux: 'bridged',
      web: 'unavailable',
    },
    states: [WIDGET_STATES.ACTIVE], // Always active (no data to be stale)
    requiredCapabilities: ['capture.create', 'voice.listen'],
    deepLink: 'hey://capture',
    freshness: { maxAge: Infinity }, // No staleness for action widgets
    emptyState: null, // Not applicable
  },

  timeSaved: {
    id: 'timeSaved',
    title: 'Time Saved',
    description: 'This week: "4h 12m" + 7-day sparkline',
    sizes: [WIDGET_SIZES.SMALL, WIDGET_SIZES.MEDIUM],
    platforms: {
      ios: 'native',
      android: 'native',
      macos: 'native',
      windows: 'bridged',
      linux: 'bridged',
      web: 'unavailable',
    },
    states: [WIDGET_STATES.ACTIVE, WIDGET_STATES.STALE, WIDGET_STATES.EMPTY],
    requiredCapabilities: ['timeLedger.read'],
    deepLink: 'hey://time-ledger',
    freshness: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
    emptyState: {
      title: 'No time tracked yet',
      message: 'Complete tasks to see time saved.',
      action: { label: 'Open Ledger', deepLink: 'hey://time-ledger' },
    },
  },

  capability: {
    id: 'capability',
    title: 'Capability',
    description: 'The 3 states that matter right now (offline / relay / budget)',
    sizes: [WIDGET_SIZES.MEDIUM, WIDGET_SIZES.LARGE],
    platforms: {
      ios: 'native',
      android: 'native',
      macos: 'native',
      windows: 'bridged',
      linux: 'bridged',
      web: 'unavailable',
    },
    states: [WIDGET_STATES.ACTIVE, WIDGET_STATES.STALE],
    requiredCapabilities: ['platform.capabilities.read'],
    deepLink: 'hey://capabilities',
    freshness: { maxAge: 2 * 60 * 1000 }, // 2 minutes (capabilities change often)
    emptyState: null, // Always has some state
  },

  cost: {
    id: 'cost',
    title: 'Cost',
    description: 'Today\'s spend vs envelope',
    sizes: [WIDGET_SIZES.SMALL, WIDGET_SIZES.ACCESSORY],
    platforms: {
      ios: 'native',
      android: 'native',
      macos: 'native',
      windows: 'bridged',
      linux: 'bridged',
      web: 'unavailable',
    },
    states: [WIDGET_STATES.ACTIVE, WIDGET_STATES.STALE, WIDGET_STATES.EMPTY],
    requiredCapabilities: ['cost.read'],
    deepLink: 'hey://cost',
    freshness: { maxAge: 30 * 60 * 1000 }, // 30 minutes
    emptyState: {
      title: 'No spend today',
      message: 'Your envelope is intact.',
      action: null,
    },
  },

  voice: {
    id: 'voice',
    title: 'Voice',
    description: 'Push-to-talk: hold to speak, release to send',
    sizes: [WIDGET_SIZES.SMALL, WIDGET_SIZES.ACCESSORY],
    platforms: {
      ios: 'native',
      android: 'native',
      macos: 'native',
      windows: 'bridged',
      linux: 'bridged',
      web: 'unavailable',
    },
    states: [WIDGET_STATES.ACTIVE], // Always active (action widget)
    requiredCapabilities: ['voice.listen', 'voice.speak'],
    deepLink: 'hey://voice',
    freshness: { maxAge: Infinity }, // No staleness for action widgets
    emptyState: null, // Not applicable
  },
});

/**
 * Gets a widget definition by ID.
 * @param {string} widgetId
 * @returns {Object|null}
 */
export function getWidget(widgetId) {
  return WIDGET_REGISTRY[widgetId] || null;
}

/**
 * Gets all widget definitions.
 * @returns {Array<Object>}
 */
export function getAllWidgets() {
  return Object.values(WIDGET_REGISTRY);
}

/**
 * Gets widgets supported on a platform.
 * @param {string} platform
 * @param {string} [state] - Optional state filter
 * @returns {Array<Object>}
 */
export function getWidgetsForPlatform(platform, state) {
  return Object.values(WIDGET_REGISTRY).filter(w => {
    const platformState = w.platforms[platform];
    if (!platformState || platformState === 'unavailable') return false;
    if (state && !w.states.includes(state)) return false;
    return true;
  });
}

/**
 * Gets available sizes for a widget on a platform.
 * @param {string} widgetId
 * @param {string} platform
 * @returns {Array<string>}
 */
export function getWidgetSizes(widgetId, platform) {
  const widget = getWidget(widgetId);
  if (!widget) return [];
  const platformState = widget.platforms[platform];
  if (!platformState || platformState === 'unavailable') return [];
  return widget.sizes;
}

/**
 * Checks if a widget is available on a platform (not 'unavailable').
 * @param {string} widgetId
 * @param {string} platform
 * @returns {boolean}
 */
export function isWidgetAvailable(widgetId, platform) {
  const widget = getWidget(widgetId);
  if (!widget) return false;
  const platformState = widget.platforms[platform];
  return platformState && platformState !== 'unavailable';
}

/**
 * Validates a widget view model against its definition.
 * @param {string} widgetId
 * @param {Object} viewModel
 * @returns {{ valid: boolean, errors: Array<string> }}
 */
export function validateWidgetViewModel(widgetId, viewModel) {
  const widget = getWidget(widgetId);
  if (!widget) return { valid: false, errors: [`Unknown widget: ${widgetId}`] };

  const errors = [];

  // Required fields for all widgets
  if (viewModel.widgetId !== widgetId) {
    errors.push(`widgetId mismatch: expected ${widgetId}, got ${viewModel.widgetId}`);
  }
  if (!viewModel.timestamp) {
    errors.push('Missing timestamp');
  }
  if (!viewModel.state || !widget.states.includes(viewModel.state)) {
    errors.push(`Invalid state: ${viewModel.state}. Must be one of ${widget.states.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

export default {
  WIDGET_REGISTRY,
  WIDGET_SIZES,
  PLATFORMS,
  WIDGET_STATES,
  getWidget,
  getAllWidgets,
  getWidgetsForPlatform,
  getWidgetSizes,
  isWidgetAvailable,
  validateWidgetViewModel,
};