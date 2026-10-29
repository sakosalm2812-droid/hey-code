/**
 * HEY Shortcut Registry — Pure Shortcut Definitions & Conflict Detection
 *
 * Central registry for all global hotkeys. Pure data — no I/O, no platform code.
 * Used by both web layer (window-scoped) and native layer (global).
 */

export const SHORTCUT_SCOPES = Object.freeze([
  'global',      // System-wide, requires tray/background process
  'window',      // Window-scoped, works in web layer
  'in-app',      // Only when HEY is focused
]);

export const SHORTCUT_ACTIONS = Object.freeze({
  // Global actions (require tray)
  'push-to-talk': { scope: 'global', description: 'Hold to talk to HEY', category: 'voice' },
  'quick-capture': { scope: 'global', description: 'Open capture sheet', category: 'capture' },
  'toggle-window': { scope: 'global', description: 'Show/hide HEY window', category: 'window' },
  'open-cockpit': { scope: 'global', description: 'Open teacher cockpit', category: 'mode' },

  // Window-scoped actions (work in web)
  'command-palette': { scope: 'window', description: 'Open command palette', category: 'navigation' },
  'print-studio': { scope: 'window', description: 'Open print studio', category: 'print' },
  'toggle-theme': { scope: 'window', description: 'Cycle theme', category: 'appearance' },
  'open-settings': { scope: 'window', description: 'Open settings', category: 'settings' },
  'close-top-surface': { scope: 'window', description: 'Close topmost HEY surface', category: 'navigation' },

  // In-app only
  'focus-search': { scope: 'in-app', description: 'Focus search input', category: 'navigation' },
  'new-chat': { scope: 'in-app', description: 'Start new chat', category: 'chat' },
});

export const DEFAULT_SHORTCUTS = Object.freeze([
  {
    id: 'push-to-talk',
    action: 'push-to-talk',
    defaultKeys: { win: 'Control+Space', mac: 'Meta+Space', linux: 'Control+Space' },
    scope: 'global',
    description: 'Hold to talk to HEY',
    category: 'voice',
    editable: true,
  },
  {
    id: 'command-palette',
    action: 'command-palette',
    defaultKeys: { win: 'Control+K', mac: 'Meta+K', linux: 'Control+K' },
    scope: 'window',
    description: 'Open command palette',
    category: 'navigation',
    editable: true,
  },
  {
    id: 'quick-capture',
    action: 'quick-capture',
    defaultKeys: { win: 'Control+Shift+C', mac: 'Meta+Shift+C', linux: 'Control+Shift+C' },
    scope: 'global',
    description: 'Open capture sheet',
    category: 'capture',
    editable: true,
  },
  {
    id: 'print-studio',
    action: 'print-studio',
    defaultKeys: { win: 'Control+Shift+P', mac: 'Meta+Shift+P', linux: 'Control+Shift+P' },
    scope: 'window',
    description: 'Open print studio',
    category: 'print',
    editable: true,
  },
  {
    id: 'open-cockpit',
    action: 'open-cockpit',
    defaultKeys: { win: 'Control+Shift+L', mac: 'Meta+Shift+L', linux: 'Control+Shift+L' },
    scope: 'global',
    description: 'Open teacher cockpit',
    category: 'mode',
    editable: true,
  },
  {
    id: 'toggle-window',
    action: 'toggle-window',
    defaultKeys: { win: 'Control+Shift+T', mac: 'Meta+Shift+T', linux: 'Control+Shift+T' },
    scope: 'global',
    description: 'Show/hide HEY window',
    category: 'window',
    editable: true,
  },
  {
    id: 'toggle-theme',
    action: 'toggle-theme',
    defaultKeys: { win: 'Control+Shift+D', mac: 'Meta+Shift+D', linux: 'Control+Shift+D' },
    scope: 'window',
    description: 'Cycle theme (dark/dawn/night/paper)',
    category: 'appearance',
    editable: true,
  },
  {
    id: 'open-settings',
    action: 'open-settings',
    defaultKeys: { win: 'Control+Comma', mac: 'Meta+Comma', linux: 'Control+Comma' },
    scope: 'window',
    description: 'Open settings',
    category: 'settings',
    editable: true,
  },
  {
    id: 'close-top-surface',
    action: 'close-top-surface',
    defaultKeys: { win: 'Escape', mac: 'Escape', linux: 'Escape' },
    scope: 'window',
    description: 'Close topmost HEY surface (modal, drawer, palette)',
    category: 'navigation',
    editable: false, // Escape is special
  },
]);

export const KEY_MODIFIERS = Object.freeze(['Control', 'Meta', 'Alt', 'Shift']);
export const KEY_SPECIAL = Object.freeze(['Escape', 'Space', 'Comma', 'Period', 'Slash', 'Backslash', 'BracketLeft', 'BracketRight', 'Quote', 'Semicolon', 'Minus', 'Equal', 'Backspace', 'Tab', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Insert', 'Delete', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12']);

function normalizeKey(key) {
  return key
    .replace(/^Control$/i, 'Control')
    .replace(/^Ctrl$/i, 'Control')
    .replace(/^Meta$/i, 'Meta')
    .replace(/^Cmd$/i, 'Meta')
    .replace(/^Command$/i, 'Meta')
    .replace(/^Alt$/i, 'Alt')
    .replace(/^Option$/i, 'Alt')
    .replace(/^Shift$/i, 'Shift')
    .replace(/^Esc$/i, 'Escape')
    .replace(/^Space$/i, 'Space')
    .replace(/^,/, 'Comma')
    .replace(/^\./, 'Period')
    .replace(/^\//, 'Slash')
    .replace(/^\[/, 'BracketLeft')
    .replace(/^\]/, 'BracketRight')
    .replace(/^`/, 'Backquote')
    .replace(/^\\$/, 'Backslash');
}

export function parseChord(chord) {
  if (!chord || typeof chord !== 'string') return { modifiers: [], key: null };
  const parts = chord.split('+').map(p => p.trim()).filter(Boolean);
  const modifiers = [];
  let key = null;

  for (const part of parts) {
    const norm = normalizeKey(part);
    if (KEY_MODIFIERS.includes(norm)) {
      modifiers.push(norm);
    } else {
      key = norm;
    }
  }

  return { modifiers: modifiers.sort(), key };
}

export function formatChord(modifiers, key, platform = 'win') {
  const modMap = {
    win: { Control: 'Ctrl', Meta: 'Ctrl', Alt: 'Alt', Shift: 'Shift' },
    mac: { Control: 'Ctrl', Meta: '⌘', Alt: '⌥', Shift: '⇧' },
    linux: { Control: 'Ctrl', Meta: 'Meta', Alt: 'Alt', Shift: 'Shift' },
  };
  const m = modMap[platform] || modMap.win;
  const mods = modifiers.map(mod => m[mod] || mod).join(platform === 'mac' ? '' : '+');
  const keyDisplay = key === 'Space' ? 'Space' : key === 'Comma' ? ',' : key === 'Escape' ? 'Esc' : key;
  return platform === 'mac' ? `${mods}${keyDisplay}` : `${mods}+${keyDisplay}`;
}

/**
 * Validates a chord string.
 * @param {string} chord
 * @returns {{ valid: boolean, error?: string, parsed?: { modifiers: string[], key: string } }}
 */
export function validateChord(chord) {
  if (!chord || typeof chord !== 'string') {
    return { valid: false, error: 'Chord is required' };
  }

  const parsed = parseChord(chord);

  if (parsed.modifiers.length === 0 && parsed.key) {
    // Single key - only allowed for specific keys
    const allowedSingleKeys = ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
    if (!allowedSingleKeys.includes(parsed.key)) {
      return { valid: false, error: 'Single-key bindings are not allowed (would swallow typing)', parsed };
    }
  }

  if (!parsed.key) {
    return { valid: false, error: 'Chord must have a main key', parsed };
  }

  if (parsed.modifiers.length > 3) {
    return { valid: false, error: 'Too many modifiers (max 3)', parsed };
  }

  // Check for duplicate modifiers
  const uniqueMods = new Set(parsed.modifiers);
  if (uniqueMods.size !== parsed.modifiers.length) {
    return { valid: false, error: 'Duplicate modifiers', parsed };
  }

  return { valid: true, parsed };
}

/**
 * Checks if two chords conflict.
 * @param {string} chordA
 * @param {string} chordB
 * @returns {boolean}
 */
export function chordsConflict(chordA, chordB) {
  const parsedA = parseChord(chordA);
  const parsedB = parseChord(chordB);
  return parsedA.modifiers.join(',') === parsedB.modifiers.join(',') && parsedA.key === parsedB.key;
}

/**
 * Detects conflicts between a proposed chord and existing shortcuts.
 * @param {string} proposedChord
 * @param {Object[]} existingShortcuts - Array of { id, keys: { win, mac, linux } }
 * @param {string} [platform='win']
 * @returns {{ hasConflict: boolean, conflicts: Array<{ id, action, keys }> }}
 */
export function detectConflicts(proposedChord, existingShortcuts, platform = 'win') {
  const conflicts = [];

  for (const shortcut of existingShortcuts) {
    const existingChord = shortcut.keys?.[platform] || shortcut.keys?.win;
    if (existingChord && chordsConflict(proposedChord, existingChord)) {
      conflicts.push({
        id: shortcut.id,
        action: shortcut.action,
        keys: shortcut.keys,
      });
    }
  }

  return { hasConflict: conflicts.length > 0, conflicts };
}

/**
 * Gets OS-level known conflicts for a chord.
 * @param {string} chord
 * @param {string} platform
 * @returns {Array<{ app: string, chord: string }>}
 */
export function getOSConflicts(chord, platform = 'win') {
  // Known OS-level shortcuts that commonly conflict
  const osShortcuts = {
    win: [
      { app: 'Windows', chord: 'Control+Space', desc: 'Input method switch (IME)' },
      { app: 'Windows', chord: 'Control+Shift', desc: 'Keyboard layout switch' },
      { app: 'Windows', chord: 'Meta+Space', desc: 'Windows Search' },
      { app: 'Windows', chord: 'Meta+K', desc: 'Connect to wireless display' },
      { app: 'Windows', chord: 'Control+Shift+P', desc: 'Print (some apps)' },
      { app: 'Windows', chord: 'Control+Shift+T', desc: 'Reopen closed tab (browsers)' },
      { app: 'Windows', chord: 'Control+Shift+D', desc: 'Bookmark all tabs (browsers)' },
      { app: 'Windows', chord: 'Control+Comma', desc: 'Settings (some apps)' },
    ],
    mac: [
      { app: 'macOS', chord: 'Meta+Space', desc: 'Spotlight Search' },
      { app: 'macOS', chord: 'Control+Space', desc: 'Input source switch' },
      { app: 'macOS', chord: 'Meta+K', desc: 'Connect to server (Finder)' },
      { app: 'macOS', chord: 'Meta+Shift+P', desc: 'Print (some apps)' },
      { app: 'macOS', chord: 'Meta+Shift+T', desc: 'Reopen closed tab (browsers)' },
      { app: 'macOS', chord: 'Meta+Shift+D', desc: 'Duplicate (Finder)' },
      { app: 'macOS', chord: 'Meta+Comma', desc: 'Preferences (standard)' },
    ],
    linux: [
      { app: 'GNOME/KDE', chord: 'Control+Space', desc: 'Input method switch' },
      { app: 'GNOME', chord: 'Meta+Space', desc: 'Activities overview' },
      { app: 'GNOME', chord: 'Control+Alt+T', desc: 'Terminal' },
    ],
  };

  const platformConflicts = osShortcuts[platform] || osShortcuts.win;
  return platformConflicts.filter(c => chordsConflict(chord, c.chord));
}

/**
 * Creates a shortcut registry with current bindings.
 * @param {Object} options
 * @param {Object[]} [options.customBindings] - User custom bindings
 * @returns {Object} Registry with lookup methods
 */
export function createShortcutRegistry(options = {}) {
  const { customBindings = [] } = options;

  // Merge defaults with custom
  const bindings = DEFAULT_SHORTCUTS.map(def => {
    const custom = customBindings.find(c => c.id === def.id);
    return custom ? { ...def, keys: custom.keys } : { ...def, keys: def.defaultKeys };
  });

  return {
    bindings: Object.freeze([...bindings]),

    getBinding(id) {
      return bindings.find(b => b.id === id) || null;
    },

    getBindingByAction(action) {
      return bindings.find(b => b.action === action) || null;
    },

    getBindingsByScope(scope) {
      return bindings.filter(b => b.scope === scope);
    },

    getBindingsByCategory(category) {
      return bindings.filter(b => b.category === category);
    },

    getChord(id, platform = 'win') {
      const binding = this.getBinding(id);
      return binding?.keys?.[platform] || binding?.keys?.win || '';
    },

    getDisplayChord(id, platform = 'win') {
      const chord = this.getChord(id, platform);
      return formatChord(...parseChord(chord), platform);
    },

    setBinding(id, keys, platform = 'win') {
      const binding = bindings.find(b => b.id === id);
      if (!binding) return { ok: false, error: 'Unknown shortcut id' };
      if (!binding.editable) return { ok: false, error: 'Shortcut not editable' };

      // Validate each platform's chord
      for (const [p, chord] of Object.entries(keys || {})) {
        const validation = validateChord(chord);
        if (!validation.valid) {
          return { ok: false, error: `Invalid chord for ${p}: ${validation.error}` };
        }
      }

      binding.keys = { ...binding.keys, ...keys };
      return { ok: true, binding };
    },

    resetBinding(id) {
      const binding = bindings.find(b => b.id === id);
      if (!binding) return { ok: false, error: 'Unknown shortcut id' };
      binding.keys = { ...binding.defaultKeys };
      return { ok: true, binding };
    },

    validateAll(platform = 'win') {
      const errors = [];
      const seen = new Map();

      for (const binding of bindings) {
        const chord = binding.keys?.[platform] || binding.keys?.win;
        if (!chord) continue;

        const validation = validateChord(chord);
        if (!validation.valid) {
          errors.push({ id: binding.id, error: validation.error });
        }

        const key = chord.toLowerCase();
        if (seen.has(key)) {
          errors.push({ id: binding.id, error: `Duplicate chord with ${seen.get(key)}` });
        } else {
          seen.set(key, binding.id);
        }
      }

      return { ok: errors.length === 0, errors };
    },

    export() {
      return bindings.map(b => ({
        id: b.id,
        action: b.action,
        keys: b.keys,
        scope: b.scope,
      }));
    },
  };
}

export default {
  SHORTCUT_SCOPES,
  SHORTCUT_ACTIONS,
  DEFAULT_SHORTCUTS,
  KEY_MODIFIERS,
  KEY_SPECIAL,
  validateChord,
  chordsConflict,
  detectConflicts,
  getOSConflicts,
  createShortcutRegistry,
  parseChord,
  formatChord,
};