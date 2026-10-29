/**
 * Mode effects — pure function mapping modeId to resolved UI settings.
 * No side effects, no persistence, no DOM.
 */

const MODE_EFFECTS = {
  teacher: {
    routes: ['/dashboard', '/forge', '/projects', '/tasks', '/calendar', '/studio', '/memory', '/settings'],
    defaultRoute: '/dashboard',
    panelOrder: ['navigation', 'forge', 'tasks', 'calendar', 'memory', 'settings'],
    verbosity: 'thorough',
    motion: 'normal',
    notificationDensity: 'normal',
    brightness: null, // no override
    backgroundScrim: null,
    description: 'Plan, prepare, print. Full nav, Forge panel, print shortcuts.',
  },
  coach: {
    routes: ['/dashboard', '/missions', '/cosmos', '/analytics', '/forge', '/memory', '/settings'],
    defaultRoute: '/dashboard',
    panelOrder: ['navigation', 'missions', 'evidence', 'metrics', 'trace', 'memory'],
    verbosity: 'evidence-first',
    motion: 'reduced',
    notificationDensity: 'low',
    brightness: null,
    backgroundScrim: null,
    description: 'Review runs, check evidence. Dense panels, trace drawer, metrics strip.',
  },
  study: {
    routes: ['/learn', '/memory', '/notes', '/journal', '/tasks'],
    defaultRoute: '/learn',
    panelOrder: ['content', 'notes', 'progress', 'practice'],
    verbosity: 'concise',
    motion: 'minimal',
    notificationDensity: 'silent',
    brightness: null,
    backgroundScrim: 0.15, // slight extra dim for focus
    description: 'Learn, be quizzed, take notes. Minimal chrome, distraction shield.',
  },
  focus: {
    routes: ['/tasks', '/notes', '/learn'],
    defaultRoute: '/tasks',
    panelOrder: ['task', 'timer', 'notes'],
    verbosity: 'minimal',
    motion: 'none',
    notificationDensity: 'deferred',
    brightness: 20, // floor 20% per F-01 range
    backgroundScrim: 0.25, // extra dim
    description: 'Deep work session. Timer, background dimmed to 20%, notifications deferred.',
    timerDurations: [25, 50, 90], // minutes
    defaultTimerDuration: 25,
    escapeControl: true, // Esc twice or button
  },
};

const ALL_MODES = Object.keys(MODE_EFFECTS);

/**
 * Applies a mode to get resolved UI settings.
 * @param {string} modeId - One of 'teacher', 'coach', 'study', 'focus'
 * @param {Object} current - Current settings to merge with (optional)
 * @returns {Object} Resolved settings
 */
export function applyMode(modeId, current = {}) {
  const mode = MODE_EFFECTS[modeId];
  if (!mode) {
    // Fallback to teacher mode
    return applyMode('teacher', current);
  }

  return {
    ...current,
    ...mode,
    modeId,
    // Ensure these are always present
    routes: mode.routes || current.routes || [],
    defaultRoute: mode.defaultRoute || current.defaultRoute || '/dashboard',
    panelOrder: mode.panelOrder || current.panelOrder || [],
    verbosity: mode.verbosity || current.verbosity || 'normal',
    motion: mode.motion || current.motion || 'normal',
    notificationDensity: mode.notificationDensity || current.notificationDensity || 'normal',
    brightness: mode.brightness !== null ? mode.brightness : (current.brightness ?? null),
    backgroundScrim: mode.backgroundScrim !== null ? mode.backgroundScrim : (current.backgroundScrim ?? null),
    // Focus-specific
    timerDurations: mode.timerDurations || current.timerDurations || [25, 50, 90],
    defaultTimerDuration: mode.defaultTimerDuration || current.defaultTimerDuration || 25,
    escapeControl: mode.escapeControl || current.escapeControl || false,
  };
}

export function getModeEffects(modeId) {
  return MODE_EFFECTS[modeId] || null;
}

export function listModes() {
  return ALL_MODES.map(id => ({ id, ...MODE_EFFECTS[id] }));
}

export function isValidMode(modeId) {
  return ALL_MODES.includes(modeId);
}

export function getDefaultMode() {
  return 'teacher';
}

export default {
  applyMode,
  getModeEffects,
  listModes,
  isValidMode,
  getDefaultMode,
};