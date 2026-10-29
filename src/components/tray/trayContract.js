/**
 * HEY Tray Contract — Native Payload Contract
 *
 * Exact payload the native layer renders. Web layer is the ONLY source of truth for icon state.
 * Native layer never decides what the icon means — it only renders what web layer says.
 */

export const TRAY_CONTRACT_VERSION = 1;

export const TRAY_ICON_STATES = Object.freeze([
  'idle',
  'working',
  'waiting',
  'offline',
  'relay-off',
  'error',
]);

export const TRAY_ICON_SIZES = Object.freeze({
  windows: { width: 16, height: 16 },
  macos: { width: 18, height: 18 },  // Template image for menu bar
  linux: { width: 22, height: 22 },  // Panel indicator
});

/**
 * Creates the tray payload sent from web layer to native layer.
 * @param {Object} trayState - From deriveTrayState()
 * @param {Object} menuItems - From getTrayMenuItems()
 * @returns {Object} Native tray payload
 */
export function createTrayPayload(trayState, menuItems) {
  return {
    version: TRAY_CONTRACT_VERSION,
    timestamp: Date.now(),
    icon: {
      state: trayState.state,
      glyph: trayState.glyph,
      animating: trayState.animating,
      badge: trayState.badge,
      tooltip: trayState.tooltip,
    },
    menu: menuItems.map(item => ({
      id: item.id,
      label: item.label,
      action: item.action,
      enabled: item.enabled !== false,
      checked: item.checked,
      danger: item.danger,
      type: item.type || 'action',
    })).filter(item => item.type !== 'separator' || item.id), // Keep separators with ids
  };
}

/**
 * Validates a tray payload.
 * @param {Object} payload
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTrayPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    errors.push('Payload must be an object');
    return { valid: false, errors };
  }

  if (payload.version !== TRAY_CONTRACT_VERSION) {
    errors.push(`Unsupported contract version: ${payload.version}`);
  }

  if (!payload.icon || typeof payload.icon !== 'object') {
    errors.push('Missing icon object');
  } else {
    if (!TRAY_ICON_STATES.includes(payload.icon.state)) {
      errors.push(`Invalid icon state: ${payload.icon.state}`);
    }
    if (typeof payload.icon.animating !== 'boolean') {
      errors.push('icon.animating must be boolean');
    }
    if (payload.icon.badge !== null && payload.icon.badge !== undefined &&
        (typeof payload.icon.badge !== 'number' || payload.icon.badge < 0)) {
      errors.push('icon.badge must be null, undefined, or positive number');
    }
    if (typeof payload.icon.tooltip !== 'string') {
      errors.push('icon.tooltip must be string');
    }
  }

  if (!Array.isArray(payload.menu)) {
    errors.push('menu must be an array');
  } else {
    payload.menu.forEach((item, index) => {
      if (item.type === 'separator') return;
      if (!item.id) errors.push(`menu[${index}]: missing id`);
      if (!item.label) errors.push(`menu[${index}]: missing label`);
      if (!item.action) errors.push(`menu[${index}]: missing action`);
      if (typeof item.enabled !== 'boolean') errors.push(`menu[${index}]: enabled must be boolean`);
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Creates icon data for native rendering.
 * Native layer uses this to draw the icon.
 * @param {Object} iconState
 * @returns {Object}
 */
export function createIconData(iconState) {
  const { state, glyph, animating, badge, tooltip } = iconState;

  // Base icon is a template (monochrome) - native layer applies color
  return {
    state,
    glyph,
    animating,
    badge: badge !== null && badge !== undefined ? String(badge) : null,
    tooltip,
    // Animation hints for native layer
    animation: animating ? {
      type: 'rotation',
      duration: 1000, // ms per full rotation
      easing: 'linear',
    } : null,
    // Badge styling
    badgeStyle: {
      background: state === 'error' ? '#ff4444' : state === 'waiting' ? '#ffaa00' : '#00aaff',
      color: '#ffffff',
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      fontSize: 10,
    },
  };
}

/**
 * Creates menu item for native rendering.
 * @param {Object} item
 * @returns {Object}
 */
export function createMenuItem(item) {
  if (item.type === 'separator') {
    return { type: 'separator' };
  }

  return {
    id: item.id,
    label: item.label,
    action: item.action,
    enabled: item.enabled !== false,
    checked: item.checked === true,
    danger: item.danger === true,
    icon: getActionIcon(item.action),
  };
}

function getActionIcon(action) {
  const icons = {
    'ask-hey': 'message-circle',
    'quick-capture': 'camera',
    'today': 'calendar',
    'approvals': 'alert-triangle',
    'open-hey': 'window-maximize',
    'relay-toggle': 'plug',
    'settings': 'settings',
    'quit': 'x-circle',
  };
  return icons[action] || null;
}

/**
 * Native → Web events (for native layer to notify web layer)
 */
export const NATIVE_TO_WEB_EVENTS = Object.freeze({
  MENU_ITEM_CLICKED: 'tray:menu-item-clicked',
  ICON_CLICKED: 'tray:icon-clicked',
  ICON_RIGHT_CLICKED: 'tray:icon-right-clicked',
  RELAY_TOGGLED: 'tray:relay-toggled',
  QUIT_REQUESTED: 'tray:quit-requested',
});

/**
 * Web → Native commands (for web layer to control native tray)
 */
export const WEB_TO_NATIVE_COMMANDS = Object.freeze({
  UPDATE_ICON: 'tray:update-icon',
  UPDATE_MENU: 'tray:update-menu',
  SHOW_MENU: 'tray:show-menu',
  HIDE_MENU: 'tray:hide-menu',
  SET_ICON_TEMPLATE: 'tray:set-icon-template',
});

/**
 * Creates update icon command.
 * @param {Object} iconState
 * @returns {Object}
 */
export function createUpdateIconCommand(iconState) {
  return {
    command: WEB_TO_NATIVE_COMMANDS.UPDATE_ICON,
    payload: createIconData(iconState),
  };
}

/**
 * Creates update menu command.
 * @param {Array} menuItems
 * @returns {Object}
 */
export function createUpdateMenuCommand(menuItems) {
  return {
    command: WEB_TO_NATIVE_COMMANDS.UPDATE_MENU,
    payload: {
      items: menuItems.map(createMenuItem),
    },
  };
}

export default {
  TRAY_CONTRACT_VERSION,
  TRAY_ICON_STATES,
  TRAY_ICON_SIZES,
  createTrayPayload,
  validateTrayPayload,
  createIconData,
  createMenuItem,
  NATIVE_TO_WEB_EVENTS,
  WEB_TO_NATIVE_COMMANDS,
  createUpdateIconCommand,
  createUpdateMenuCommand,
};