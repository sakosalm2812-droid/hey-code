/**
 * Tests for shortcutRegistry.js — Duplicate chord rejected, single-key rejected, conflict detection, remapping validation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
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
} from '../src/components/shortcuts/shortcutRegistry.js';

describe('shortcutRegistry.js — Constants', () => {
  it('exports SHORTCUT_SCOPES', () => {
    assert.deepStrictEqual(SHORTCUT_SCOPES, ['global', 'window', 'in-app']);
    assert.throws(() => SHORTCUT_SCOPES.push('new'));
  });

  it('exports SHORTCUT_ACTIONS with correct scopes', () => {
    assert.strictEqual(SHORTCUT_ACTIONS['push-to-talk'].scope, 'global');
    assert.strictEqual(SHORTCUT_ACTIONS['command-palette'].scope, 'window');
    assert.strictEqual(SHORTCUT_ACTIONS['focus-search'].scope, 'in-app');
  });

  it('exports DEFAULT_SHORTCUTS with 9 entries', () => {
    assert.strictEqual(DEFAULT_SHORTCUTS.length, 9);
    const ids = DEFAULT_SHORTCUTS.map(s => s.id);
    assert.deepStrictEqual(ids.sort(), [
      'close-top-surface',
      'command-palette',
      'open-cockpit',
      'open-settings',
      'print-studio',
      'push-to-talk',
      'quick-capture',
      'toggle-theme',
      'toggle-window',
    ]);
  });

  it('each default shortcut has required fields', () => {
    for (const s of DEFAULT_SHORTCUTS) {
      assert.ok(s.id);
      assert.ok(s.action);
      assert.ok(s.defaultKeys.win);
      assert.ok(s.defaultKeys.mac);
      assert.ok(s.defaultKeys.linux);
      assert.ok(SHORTCUT_SCOPES.includes(s.scope));
      assert.ok(typeof s.description === 'string');
      assert.ok(typeof s.category === 'string');
      assert.ok(typeof s.editable === 'boolean');
    }
  });

  it('Escape is not editable', () => {
    const escape = DEFAULT_SHORTCUTS.find(s => s.id === 'close-top-surface');
    assert.strictEqual(escape.editable, false);
  });

  it('KEY_MODIFIERS and KEY_SPECIAL are frozen', () => {
    assert.throws(() => KEY_MODIFIERS.push('Hyper'));
    assert.throws(() => KEY_SPECIAL.push('Hyper'));
  });
});

describe('shortcutRegistry.js — parseChord', () => {
  it('parses simple modifier+key', () => {
    const parsed = parseChord('Control+K');
    assert.deepStrictEqual(parsed.modifiers, ['Control']);
    assert.strictEqual(parsed.key, 'K');
  });

  it('parses multiple modifiers', () => {
    const parsed = parseChord('Control+Shift+C');
    assert.deepStrictEqual(parsed.modifiers.sort(), ['Control', 'Shift']);
    assert.strictEqual(parsed.key, 'C');
  });

  it('parses Mac Meta key', () => {
    const parsed = parseChord('Meta+K');
    assert.deepStrictEqual(parsed.modifiers, ['Meta']);
    assert.strictEqual(parsed.key, 'K');
  });

  it('normalizes Ctrl to Control', () => {
    const parsed = parseChord('Ctrl+K');
    assert.deepStrictEqual(parsed.modifiers, ['Control']);
  });

  it('normalizes Cmd to Meta', () => {
    const parsed = parseChord('Cmd+K');
    assert.deepStrictEqual(parsed.modifiers, ['Meta']);
  });

  it('normalizes Escape', () => {
    const parsed = parseChord('Esc');
    assert.strictEqual(parsed.key, 'Escape');
  });

  it('normalizes Comma', () => {
    const parsed = parseChord('Control+,');
    assert.strictEqual(parsed.key, 'Comma');
  });

  it('handles single key (no modifiers)', () => {
    const parsed = parseChord('Escape');
    assert.deepStrictEqual(parsed.modifiers, []);
    assert.strictEqual(parsed.key, 'Escape');
  });

  it('sorts modifiers consistently', () => {
    const parsed1 = parseChord('Shift+Control+K');
    const parsed2 = parseChord('Control+Shift+K');
    assert.deepStrictEqual(parsed1.modifiers, parsed2.modifiers);
  });
});

describe('shortcutRegistry.js — formatChord', () => {
  it('formats for Windows', () => {
    assert.strictEqual(formatChord(['Control'], 'K', 'win'), 'Ctrl+K');
    assert.strictEqual(formatChord(['Control', 'Shift'], 'C', 'win'), 'Ctrl+Shift+C');
    assert.strictEqual(formatChord([], 'Escape', 'win'), 'Esc');
  });

  it('formats for Mac', () => {
    assert.strictEqual(formatChord(['Meta'], 'K', 'mac'), '⌘K');
    assert.strictEqual(formatChord(['Meta', 'Shift'], 'C', 'mac'), '⌘⇧C');
    assert.strictEqual(formatChord([], 'Escape', 'mac'), 'Esc');
  });

  it('formats for Linux', () => {
    assert.strictEqual(formatChord(['Control'], 'K', 'linux'), 'Ctrl+K');
    assert.strictEqual(formatChord(['Meta'], 'Space', 'linux'), 'Meta+Space');
  });

  it('handles Space key display', () => {
    assert.strictEqual(formatChord(['Control'], 'Space', 'win'), 'Ctrl+Space');
    assert.strictEqual(formatChord(['Meta'], 'Space', 'mac'), '⌘Space');
  });
});

describe('shortcutRegistry.js — validateChord', () => {
  it('accepts valid chords', () => {
    const tests = [
      'Control+K',
      'Control+Shift+C',
      'Meta+Space',
      'Control+Shift+P',
      'Escape',
      'F1',
      'F12',
      'Control+Comma',
    ];
    for (const chord of tests) {
      const result = validateChord(chord);
      assert.strictEqual(result.valid, true, `Expected ${chord} to be valid`);
    }
  });

  it('rejects single-key bindings (except allowed)', () => {
    const tests = ['K', 'C', 'Space', 'A', '1', 'Tab', 'Enter'];
    for (const chord of tests) {
      const result = validateChord(chord);
      assert.strictEqual(result.valid, false, `Expected ${chord} to be invalid`);
      assert.ok(result.error.includes('Single-key') || result.error.includes('swallow'));
    }
  });

  it('allows single-key for Escape and F-keys', () => {
    const tests = ['Escape', 'F1', 'F5', 'F12'];
    for (const chord of tests) {
      const result = validateChord(chord);
      assert.strictEqual(result.valid, true, `Expected ${chord} to be valid`);
    }
  });

  it('rejects empty chord', () => {
    const result = validateChord('');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('required'));
  });

  it('rejects chord without main key', () => {
    const result = validateChord('Control+Shift');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('main key'));
  });

  it('rejects too many modifiers', () => {
    const result = validateChord('Control+Meta+Alt+Shift+K');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('Too many modifiers'));
  });

  it('rejects duplicate modifiers', () => {
    const result = validateChord('Control+Control+K');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('Duplicate'));
  });

  it('returns parsed structure on success', () => {
    const result = validateChord('Control+Shift+C');
    assert.strictEqual(result.valid, true);
    assert.deepStrictEqual(result.parsed.modifiers.sort(), ['Control', 'Shift']);
    assert.strictEqual(result.parsed.key, 'C');
  });
});

describe('shortcutRegistry.js — chordsConflict', () => {
  it('detects identical chords', () => {
    assert.strictEqual(chordsConflict('Control+K', 'Control+K'), true);
    assert.strictEqual(chordsConflict('Control+Shift+C', 'Control+Shift+C'), true);
  });

  it('detects equivalent chords with different modifier order', () => {
    assert.strictEqual(chordsConflict('Control+Shift+C', 'Shift+Control+C'), true);
    assert.strictEqual(chordsConflict('Meta+Control+K', 'Control+Meta+K'), true);
  });

  it('detects normalized conflicts', () => {
    assert.strictEqual(chordsConflict('Ctrl+K', 'Control+K'), true);
    assert.strictEqual(chordsConflict('Cmd+K', 'Meta+K'), true);
  });

  it('returns false for different chords', () => {
    assert.strictEqual(chordsConflict('Control+K', 'Control+L'), false);
    assert.strictEqual(chordsConflict('Control+K', 'Meta+K'), false);
    assert.strictEqual(chordsConflict('Control+Shift+C', 'Control+Shift+P'), false);
  });

  it('returns false for single key vs chord', () => {
    assert.strictEqual(chordsConflict('Escape', 'Control+Escape'), false);
  });
});

describe('shortcutRegistry.js — detectConflicts', () => {
  const existing = [
    { id: 'cmd-palette', action: 'command-palette', keys: { win: 'Control+K', mac: 'Meta+K' } },
    { id: 'quick-cap', action: 'quick-capture', keys: { win: 'Control+Shift+C', mac: 'Meta+Shift+C' } },
  ];

  it('detects conflict with existing', () => {
    const result = detectConflicts('Control+K', existing, 'win');
    assert.strictEqual(result.hasConflict, true);
    assert.strictEqual(result.conflicts.length, 1);
    assert.strictEqual(result.conflicts[0].id, 'cmd-palette');
  });

  it('detects conflict on Mac', () => {
    const result = detectConflicts('Meta+K', existing, 'mac');
    assert.strictEqual(result.hasConflict, true);
    assert.strictEqual(result.conflicts[0].id, 'cmd-palette');
  });

  it('returns no conflict for different chord', () => {
    const result = detectConflicts('Control+L', existing, 'win');
    assert.strictEqual(result.hasConflict, false);
    assert.deepStrictEqual(result.conflicts, []);
  });

  it('handles missing keys gracefully', () => {
    const existing2 = [{ id: 'test', action: 'test', keys: {} }];
    const result = detectConflicts('Control+K', existing2, 'win');
    assert.strictEqual(result.hasConflict, false);
  });
});

describe('shortcutRegistry.js — getOSConflicts', () => {
  it('returns known Windows conflicts', () => {
    const conflicts = getOSConflicts('Control+Space', 'win');
    assert.ok(conflicts.length > 0);
    assert.ok(conflicts.some(c => c.app === 'Windows' && c.chord === 'Control+Space'));
  });

  it('returns known Mac conflicts', () => {
    const conflicts = getOSConflicts('Meta+Space', 'mac');
    assert.ok(conflicts.length > 0);
    assert.ok(conflicts.some(c => c.app === 'macOS' && c.chord === 'Meta+Space'));
  });

  it('returns empty for non-conflicting chord', () => {
    const conflicts = getOSConflicts('Control+Shift+X', 'win');
    assert.strictEqual(conflicts.length, 0);
  });

  it('includes descriptions', () => {
    const conflicts = getOSConflicts('Control+Space', 'win');
    assert.ok(conflicts[0].desc);
  });
});

describe('shortcutRegistry.js — createShortcutRegistry', () => {
  it('creates registry with defaults', () => {
    const registry = createShortcutRegistry();
    assert.strictEqual(registry.bindings.length, 9);
  });

  it('merges custom bindings', () => {
    const registry = createShortcutRegistry({
      customBindings: [
        { id: 'command-palette', keys: { win: 'Control+L', mac: 'Meta+L', linux: 'Control+L' } },
      ],
    });
    const binding = registry.getBinding('command-palette');
    assert.strictEqual(binding.keys.win, 'Control+L');
  });

  it('getBinding returns correct binding', () => {
    const registry = createShortcutRegistry();
    const binding = registry.getBinding('push-to-talk');
    assert.strictEqual(binding.id, 'push-to-talk');
    assert.strictEqual(binding.action, 'push-to-talk');
    assert.strictEqual(binding.scope, 'global');
  });

  it('getBindingByAction works', () => {
    const registry = createShortcutRegistry();
    const binding = registry.getBindingByAction('push-to-talk');
    assert.strictEqual(binding.id, 'push-to-talk');
  });

  it('getBindingsByScope filters correctly', () => {
    const registry = createShortcutRegistry();
    const global = registry.getBindingsByScope('global');
    const window = registry.getBindingsByScope('window');
    const inApp = registry.getBindingsByScope('in-app');

    assert.strictEqual(global.length, 4); // push-to-talk, quick-capture, toggle-window, open-cockpit
    assert.strictEqual(window.length, 4); // command-palette, print-studio, toggle-theme, open-settings, close-top-surface
    assert.strictEqual(inApp.length, 1); // close-top-surface is window, focus-search would be in-app but not in defaults
  });

  it('getBindingsByCategory filters correctly', () => {
    const registry = createShortcutRegistry();
    const voice = registry.getBindingsByCategory('voice');
    assert.strictEqual(voice.length, 1);
    assert.strictEqual(voice[0].id, 'push-to-talk');
  });

  it('getChord returns platform-specific chord', () => {
    const registry = createShortcutRegistry();
    assert.strictEqual(registry.getChord('command-palette', 'win'), 'Control+K');
    assert.strictEqual(registry.getChord('command-palette', 'mac'), 'Meta+K');
    assert.strictEqual(registry.getChord('command-palette', 'linux'), 'Control+K');
  });

  it('getDisplayChord formats for platform', () => {
    const registry = createShortcutRegistry();
    assert.strictEqual(registry.getDisplayChord('command-palette', 'win'), 'Ctrl+K');
    assert.strictEqual(registry.getDisplayChord('command-palette', 'mac'), '⌘K');
  });

  it('setBinding validates and updates', () => {
    const registry = createShortcutRegistry();
    const result = registry.setBinding('command-palette', { win: 'Control+L' }, 'win');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.binding.keys.win, 'Control+L');
  });

  it('setBinding rejects invalid chord', () => {
    const registry = createShortcutRegistry();
    const result = registry.setBinding('command-palette', { win: 'K' }, 'win');
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('Single-key'));
  });

  it('setBinding rejects non-editable', () => {
    const registry = createShortcutRegistry();
    const result = registry.setBinding('close-top-surface', { win: 'Control+W' }, 'win');
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('not editable'));
  });

  it('setBinding rejects unknown id', () => {
    const registry = createShortcutRegistry();
    const result = registry.setBinding('unknown', { win: 'Control+L' }, 'win');
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('Unknown'));
  });

  it('resetBinding restores defaults', () => {
    const registry = createShortcutRegistry({
      customBindings: [{ id: 'command-palette', keys: { win: 'Control+L' } }],
    });
    registry.resetBinding('command-palette');
    assert.strictEqual(registry.getChord('command-palette', 'win'), 'Control+K');
  });

  it('validateAll detects duplicate chords', () => {
    const registry = createShortcutRegistry({
      customBindings: [
        { id: 'command-palette', keys: { win: 'Control+K' } },
        { id: 'quick-capture', keys: { win: 'Control+K' } }, // duplicate
      ],
    });
    const result = registry.validateAll('win');
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.error.includes('Duplicate')));
  });

  it('validateAll detects invalid chords', () => {
    const registry = createShortcutRegistry({
      customBindings: [{ id: 'command-palette', keys: { win: 'K' } }],
    });
    const result = registry.validateAll('win');
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.error.includes('Single-key')));
  });

  it('validateAll passes for valid registry', () => {
    const registry = createShortcutRegistry();
    const result = registry.validateAll('win');
    assert.strictEqual(result.ok, true);
    assert.deepStrictEqual(result.errors, []);
  });

  it('export returns serializable bindings', () => {
    const registry = createShortcutRegistry();
    const exported = registry.export();
    assert.strictEqual(exported.length, 9);
    for (const b of exported) {
      assert.ok(b.id);
      assert.ok(b.action);
      assert.ok(b.keys);
      assert.ok(b.scope);
    }
  });
});

describe('shortcutRegistry.js — Integration', () => {
  it('default shortcuts pass validation on all platforms', () => {
    for (const platform of ['win', 'mac', 'linux']) {
      const registry = createShortcutRegistry();
      const result = registry.validateAll(platform);
      assert.strictEqual(result.ok, true, `Platform ${platform}: ${JSON.stringify(result.errors)}`);
    }
  });

  it('no duplicate default chords on any platform', () => {
    for (const platform of ['win', 'mac', 'linux']) {
      const registry = createShortcutRegistry();
      const chords = registry.bindings.map(b => b.keys[platform]).filter(Boolean);
      const unique = new Set(chords);
      assert.strictEqual(chords.length, unique.size, `Duplicate chords on ${platform}`);
    }
  });

  it('global shortcuts require tray (scope=global)', () => {
    const registry = createShortcutRegistry();
    const global = registry.getBindingsByScope('global');
    for (const b of global) {
      assert.strictEqual(b.scope, 'global');
      assert.ok(['push-to-talk', 'quick-capture', 'toggle-window', 'open-cockpit'].includes(b.id));
    }
  });

  it('window shortcuts work without tray (scope=window)', () => {
    const registry = createShortcutRegistry();
    const window = registry.getBindingsByScope('window');
    for (const b of window) {
      assert.strictEqual(b.scope, 'window');
    }
  });
});