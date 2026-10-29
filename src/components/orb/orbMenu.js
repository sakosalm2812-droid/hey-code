/**
 * HEY Orb Menu — Pure Menu Items for Context
 *
 * Generates contextual menu items (max 6) based on current mode and recent actions.
 * Every orb item exists in a menu elsewhere.
 * Pure by construction: no I/O, no platform code.
 */

export const ORB_MENU_ACTIONS = Object.freeze({
  'ask-hey': { id: 'ask-hey', label: 'Ask HEY', shortcut: '⌘Space', category: 'voice', global: true },
  'quick-capture': { id: 'quick-capture', label: 'Quick capture', shortcut: '⌘⇧C', category: 'capture', global: true },
  'next-lesson-step': { id: 'next-lesson-step', label: 'Next lesson step', shortcut: '⌘→', category: 'mode', global: false },
  'print': { id: 'print', label: 'Print', shortcut: '⌘⇧P', category: 'print', global: true },
  'today': { id: 'today', label: 'Today', shortcut: '⌘1', category: 'navigation', global: true },
  'settings': { id: 'settings', label: 'Settings', shortcut: '⌘,', category: 'settings', global: false },
  'open-cockpit': { id: 'open-cockpit', label: 'Open cockpit', shortcut: '⌘⇧L', category: 'mode', global: true },
  'open-palette': { id: 'open-palette', label: 'Command palette', shortcut: '⌘K', category: 'navigation', global: true },
  'toggle-theme': { id: 'toggle-theme', label: 'Toggle theme', shortcut: '⌘⇧D', category: 'appearance', global: false },
  'toggle-window': { id: 'toggle-window', label: 'Toggle HEY window', shortcut: '⌘⇧T', category: 'window', global: true },
  'focus-mode': { id: 'focus-mode', label: 'Focus mode', shortcut: '⌘⇧F', category: 'mode', global: false },
  'voice-mode': { id: 'voice-mode', label: 'Voice mode', shortcut: '⌘⇧V', category: 'voice', global: false },
});

export const MODE_DEFAULT_ACTIONS = Object.freeze({
  teacher: ['open-cockpit', 'next-lesson-step', 'print', 'today', 'ask-hey', 'quick-capture'],
  coach: ['today', 'ask-hey', 'open-palette', 'quick-capture', 'print', 'settings'],
  study: ['ask-hey', 'quick-capture', 'today', 'focus-mode', 'toggle-theme', 'settings'],
  focus: ['focus-mode', 'ask-hey', 'quick-capture', 'today', 'toggle-theme', 'open-palette'],
  default: ['ask-hey', 'quick-capture', 'today', 'open-palette', 'print', 'settings'],
});

export const RECENT_ACTIONS_LIMIT = 10;

/**
 * Gets default actions for a surface mode.
 * @param {string} mode - Surface mode ID
 * @returns {string[]} Array of action IDs
 */
export function getDefaultActionsForMode(mode) {
  return MODE_DEFAULT_ACTIONS[mode] || MODE_DEFAULT_ACTIONS.default;
}

/**
 * Filters and orders menu items for the orb (max 6).
 * @param {Object} options
 * @param {string} options.mode - Current surface mode
 * @param {string[]} options.recentActions - Recent action IDs (most recent first)
 * @param {Object} options.pinnedActions - User-pinned action IDs
 * @param {boolean} options.hasGlobalHotkeys - Whether global hotkeys are available
 * @returns {Object[]} Menu items (max 6)
 */
export function getOrbMenuItems(options = {}) {
  const {
    mode = 'default',
    recentActions = [],
    pinnedActions = {},
    hasGlobalHotkeys = false,
  } = options;

  const defaults = getDefaultActionsForMode(mode);
  const seen = new Set();
  const items = [];

  // 1. Pinned actions first (user preference)
  for (const actionId of Object.keys(pinnedActions)) {
    if (items.length >= 6) break;
    if (seen.has(actionId)) continue;
    const action = ORB_MENU_ACTIONS[actionId];
    if (action && (action.global || hasGlobalHotkeys || !action.global)) {
      items.push({ ...action, pinned: true });
      seen.add(actionId);
    }
  }

  // 2. Recent actions (most recent first)
  for (const actionId of recentActions) {
    if (items.length >= 6) break;
    if (seen.has(actionId)) continue;
    const action = ORB_MENU_ACTIONS[actionId];
    if (action && (action.global || hasGlobalHotkeys || !action.global)) {
      items.push({ ...action, recent: true });
      seen.add(actionId);
    }
  }

  // 3. Default actions for mode
  for (const actionId of defaults) {
    if (items.length >= 6) break;
    if (seen.has(actionId)) continue;
    const action = ORB_MENU_ACTIONS[actionId];
    if (action && (action.global || hasGlobalHotkeys || !action.global)) {
      items.push({ ...action, default: true });
      seen.add(actionId);
    }
  }

  return items.slice(0, 6);
}

/**
 * Validates that all orb menu items exist in the global action catalog.
 * @param {Object[]} orbItems
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateOrbMenuItems(orbItems) {
  const missing = [];
  for (const item of orbItems) {
    if (!ORB_MENU_ACTIONS[item.id]) {
      missing.push(item.id);
    }
  }
  return { valid: missing.length === 0, missing };
}

/**
 * Gets the full action catalog for validation against navigation catalogue.
 * @returns {Object}
 */
export function getActionCatalog() {
  return { ...ORB_MENU_ACTIONS };
}

/**
 * Checks if an action is available in the current context.
 * @param {string} actionId
 * @param {Object} context
 * @returns {boolean}
 */
export function isActionAvailable(actionId, context = {}) {
  const action = ORB_MENU_ACTIONS[actionId];
  if (!action) return false;

  // Global actions need global hotkeys (relay/tray)
  if (action.global && !context.hasGlobalHotkeys) return false;

  // Mode-specific actions need appropriate mode
  if (action.category === 'mode' && context.mode && !getDefaultActionsForMode(context.mode).includes(actionId)) {
    return false;
  }

  return true;
}

export default {
  ORB_MENU_ACTIONS,
  MODE_DEFAULT_ACTIONS,
  RECENT_ACTIONS_LIMIT,
  getDefaultActionsForMode,
  getOrbMenuItems,
  validateOrbMenuItems,
  getActionCatalog,
  isActionAvailable,
};