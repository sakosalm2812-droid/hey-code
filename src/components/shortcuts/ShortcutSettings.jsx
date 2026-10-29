/**
 * HEY Shortcut Settings — Remapping Table with Conflict Detection
 *
 * Two-column table: Action | Key Chord | Change Button
 * Conflicts shown in amber with app name.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { createShortcutRegistry, validateChord, getOSConflicts, formatChord, parseChord } from './shortcutRegistry.js';
import { getSetting, setSetting, subscribeToSettings } from '../../core/settingsRegistry.js';

const CATEGORY_LABELS = {
  voice: 'Voice',
  capture: 'Capture',
  window: 'Window',
  mode: 'Mode',
  navigation: 'Navigation',
  print: 'Print',
  appearance: 'Appearance',
  settings: 'Settings',
};

const CATEGORY_ORDER = ['voice', 'capture', 'window', 'mode', 'navigation', 'print', 'appearance', 'settings'];

function KeyCap({ keys, platform = 'win', size = 'normal' }) {
  if (!keys) return <span className="keycap empty">—</span>;

  const chord = keys[platform] || keys.win;
  if (!chord) return <span className="keycap empty">—</span>;

  const parsed = parseChord(chord);
  const modMap = {
    win: { Control: 'Ctrl', Meta: 'Ctrl', Alt: 'Alt', Shift: 'Shift' },
    mac: { Control: 'Ctrl', Meta: '⌘', Alt: '⌥', Shift: '⇧' },
    linux: { Control: 'Ctrl', Meta: 'Meta', Alt: 'Alt', Shift: 'Shift' },
  };
  const m = modMap[platform] || modMap.win;

  return (
    <span className={`keycap keycap-${size}`}>
      {parsed.modifiers.map(mod => (
        <kbd key={mod} className="keycap-mod">{m[mod] || mod}</kbd>
      ))}
      {parsed.key && (
        <kbd key={parsed.key} className="keycap-key">
          {parsed.key === 'Space' ? 'Space' : parsed.key === 'Comma' ? ',' : parsed.key === 'Escape' ? 'Esc' : parsed.key}
        </kbd>
      )}
    </span>
  );
}

function ConflictBadge({ conflicts, platform }) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="shortcut-conflict-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="conflict-icon">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span className="conflict-text">
        {conflicts.map(c => `${c.app}: ${c.desc || c.chord}`).join('; ')}
      </span>
    </div>
  );
}

function ShortcutRow({ binding, registry, platform, onRemap, onReset, isRemapping, remapValue, remapError }) {
  const chord = binding.keys?.[platform] || binding.keys?.win;
  const osConflicts = getOSConflicts(chord, platform);
  const internalConflicts = registry.detectConflicts(chord, registry.bindings.filter(b => b.id !== binding.id), platform);
  const allConflicts = [...osConflicts, ...internalConflicts.conflicts.map(c => ({ app: c.action, chord: c.keys[platform] || c.keys.win, desc: `Used by ${c.action}` }))];

  const displayChord = formatChord(...parseChord(chord), platform);

  return (
    <tr className={`shortcut-row ${binding.editable ? '' : 'non-editable'} ${isRemapping ? 'remapping' : ''} ${allConflicts.length > 0 ? 'has-conflict' : ''}`}>
      <td className="shortcut-action">
        <div className="shortcut-action-info">
          <span className="shortcut-category-badge">{CATEGORY_LABELS[binding.category] || binding.category}</span>
          <span className="shortcut-action-label">{binding.description}</span>
          <span className="shortcut-scope-badge">{binding.scope}</span>
        </div>
      </td>
      <td className="shortcut-keys">
        {isRemapping ? (
          <div className="shortcut-remap-input">
            <input
              type="text"
              className="shortcut-chord-input"
              value={remapValue}
              onChange={e => onRemap(binding.id, e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onRemap(binding.id, remapValue, true);
                } else if (e.key === 'Escape') {
                  onRemap(binding.id, '', false);
                }
              }}
              placeholder="Press key combination..."
              autoFocus
              aria-label={`New shortcut for ${binding.description}`}
            />
            <div className="shortcut-remap-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => onRemap(binding.id, remapValue, true)} disabled={!remapValue || remapError}>
                Save
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onRemap(binding.id, '', false)}>
                Cancel
              </button>
            </div>
            {remapError && <span className="shortcut-remap-error">{remapError}</span>}
          </div>
        ) : (
          <>
            <KeyCap keys={binding.keys} platform={platform} size="normal" />
            {binding.editable && (
              <button
                type="button"
                className="shortcut-change-btn"
                onClick={() => onRemap(binding.id, chord, false)}
                aria-label={`Change shortcut for ${binding.description}`}
              >
                Change
              </button>
            )}
            {allConflicts.length > 0 && <ConflictBadge conflicts={allConflicts} platform={platform} />}
          </>
        )}
      </td>
    </tr>
  );
}

export function ShortcutSettings({ className = '', platform: initialPlatform }) {
  const [platform, setPlatform] = useState(initialPlatform || (navigator.platform.includes('Mac') ? 'mac' : 'win'));
  const [registry] = useState(() => createShortcutRegistry());
  const [remappingId, setRemappingId] = useState(null);
  const [remapValue, setRemapValue] = useState('');
  const [remapError, setRemapError] = useState(null);
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);

  // Load custom bindings from settings
  useEffect(() => {
    const custom = getSetting('shortcuts.customBindings', {}) || {};
    if (Object.keys(custom).length > 0) {
      // Registry is recreated with custom bindings in a real implementation
      // For now we just note the setting exists
    }
  }, []);

  const startRemap = useCallback((id, currentChord) => {
    setRemappingId(id);
    setRemapValue(currentChord || '');
    setRemapError(null);
  }, []);

  const handleRemap = useCallback((id, value, commit = false) => {
    setRemapValue(value);

    if (!commit) return;

    const validation = validateChord(value);
    if (!validation.valid) {
      setRemapError(validation.error);
      return;
    }

    const result = registry.setBinding(id, { [platform]: value }, platform);
    if (!result.ok) {
      setRemapError(result.error);
      return;
    }

    // Save to settings
    const customBindings = registry.bindings
      .filter(b => b.keys[platform] !== b.defaultKeys[platform])
      .map(b => ({ id: b.id, keys: b.keys }));
    setSetting('shortcuts.customBindings', customBindings);

    setRemappingId(null);
    setRemapValue('');
    setRemapError(null);
  }, [registry, platform]);

  const handleReset = useCallback((id) => {
    registry.resetBinding(id);
    const customBindings = registry.bindings
      .filter(b => b.keys[platform] !== b.defaultKeys[platform])
      .map(b => ({ id: b.id, keys: b.keys }));
    setSetting('shortcuts.customBindings', customBindings);
  }, [registry, platform]);

  const handleKeyDown = useCallback((e) => {
    if (!remappingId) return;

    // Build chord from key event
    const modifiers = [];
    if (e.ctrlKey) modifiers.push('Control');
    if (e.metaKey) modifiers.push('Meta');
    if (e.altKey) modifiers.push('Alt');
    if (e.shiftKey) modifiers.push('Shift');

    let key = e.key;
    if (key === ' ') key = 'Space';
    if (key === 'Escape') key = 'Escape';
    if (key === ',') key = 'Comma';
    if (key === '.') key = 'Period';
    if (key === '/') key = 'Slash';
    if (key === '[') key = 'BracketLeft';
    if (key === ']') key = 'BracketRight';
    if (key === '\\') key = 'Backslash';
    if (key === '`') key = 'Backquote';
    if (key === '-') key = 'Minus';
    if (key === '=') key = 'Equal';

    // Skip if only modifiers
    if (!modifiers.length && !['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(key)) {
      return;
    }

    const chord = [...modifiers, key].join('+');
    setRemapValue(chord);
    e.preventDefault();
  }, [remappingId]);

  useEffect(() => {
    if (remappingId) {
      document.addEventListener('keydown', handleKeyDown, true);
    }
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [remappingId, handleKeyDown]);

  // Group bindings by category
  const groupedBindings = useMemo(() => {
    const groups = {};
    for (const cat of CATEGORY_ORDER) {
      const bindings = registry.getBindingsByCategory(cat);
      if (bindings.length > 0) {
        groups[cat] = bindings;
      }
    }
    return groups;
  }, [registry]);

  const filteredGroups = showConflictsOnly
    ? Object.fromEntries(
        Object.entries(groupedBindings).map(([cat, bindings]) => [
          cat,
          bindings.filter(b => {
            const chord = b.keys[platform] || b.keys.win;
            const osConflicts = getOSConflicts(chord, platform);
            const internalConflicts = registry.detectConflicts(chord, registry.bindings.filter(x => x.id !== b.id), platform);
            return osConflicts.length > 0 || internalConflicts.hasConflict;
          }),
        ]).filter(([_, bindings]) => bindings.length > 0)
      )
    : groupedBindings;

  const hasAnyConflicts = useMemo(() => {
    for (const bindings of Object.values(groupedBindings)) {
      for (const b of bindings) {
        const chord = b.keys[platform] || b.keys.win;
        const osConflicts = getOSConflicts(chord, platform);
        const internalConflicts = registry.detectConflicts(chord, registry.bindings.filter(x => x.id !== b.id), platform);
        if (osConflicts.length > 0 || internalConflicts.hasConflict) return true;
      }
    }
    return false;
  }, [groupedBindings, registry, platform]);

  return (
    <div className={`shortcut-settings ${className}`}>
      <div className="shortcut-settings-header">
        <h2>Keyboard Shortcuts</h2>
        <p className="shortcut-settings-description">
          Customize keyboard shortcuts. Global shortcuts require the HEY tray app to be running.
          Conflicts with system shortcuts are shown in amber.
        </p>
        <div className="shortcut-settings-toolbar">
          <div className="platform-selector" role="group" aria-label="Platform">
            <label>
              <input type="radio" name="platform" value="win" checked={platform === 'win'} onChange={() => setPlatform('win')} />
              <span>Windows/Linux</span>
            </label>
            <label>
              <input type="radio" name="platform" value="mac" checked={platform === 'mac'} onChange={() => setPlatform('mac')} />
              <span>macOS</span>
            </label>
          </div>
          {hasAnyConflicts && (
            <label className="conflict-filter">
              <input
                type="checkbox"
                checked={showConflictsOnly}
                onChange={e => setShowConflictsOnly(e.target.checked)}
              />
              Show conflicts only
            </label>
          )}
        </div>
      </div>

      <div className="shortcut-settings-table-wrapper">
        <table className="shortcut-settings-table" role="table">
          <thead>
            <tr>
              <th scope="col">Action</th>
              <th scope="col">Shortcut</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(filteredGroups).map(([category, bindings]) => (
              <thead key={category}>
                <tr className="shortcut-category-header">
                  <th scope="row" colSpan="2">{CATEGORY_LABELS[category] || category}</th>
                </tr>
              </thead>
            ))}
            {Object.entries(filteredGroups).flatMap(([_, bindings]) =>
              bindings.map(binding => (
                <ShortcutRow
                  key={binding.id}
                  binding={binding}
                  registry={registry}
                  platform={platform}
                  onRemap={startRemap}
                  onReset={handleReset}
                  isRemapping={remappingId === binding.id}
                  remapValue={remappingId === binding.id ? remapValue : ''}
                  remapError={remappingId === binding.id ? remapError : null}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="shortcut-settings-legend">
        <h3>Legend</h3>
        <dl>
          <dt><span className="legend-scope global">Global</span></dt>
          <dd>Works system-wide (requires tray app)</dd>
          <dt><span className="legend-scope window">Window</span></dt>
          <dd>Works when HEY window is open</dd>
          <dt><span className="legend-scope in-app">In-App</span></dt>
          <dd>Only works when HEY is focused</dd>
          <dt><span className="legend-conflict">⚠ Amber</span></dt>
          <dd>Conflicts with system or another HEY shortcut</dd>
        </dl>
      </div>

      <div className="shortcut-settings-actions">
        <button type="button" className="btn btn-secondary" onClick={() => {
          registry.bindings.forEach(b => registry.resetBinding(b.id));
          setSetting('shortcuts.customBindings', []);
        }}>
          Reset All to Defaults
        </button>
      </div>
    </div>
  );
}

export default ShortcutSettings;