import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { modeEngine } from '../../core/modeEngine.js';
import { getSurfaceMode, allSurfaceModes } from '../../core/surfaceModes.js';
import { applyMode, listModes, isValidMode, getDefaultMode } from './modeEffects.js';
import { getSetting, setSetting, subscribeSettings } from '../../core/settingsRegistry.js';

const ModeContext = createContext(null);

/**
 * Maps F-11 mode IDs to surfaceModes.js IDs
 */
const F11_TO_SURFACE_MODE = {
  teacher: 'teach',
  coach: 'review',
  study: 'teach', // study uses teach mode
  focus: 'focus',
};

function getSurfaceModeId(f11ModeId) {
  return F11_TO_SURFACE_MODE[f11ModeId] || f11ModeId;
}

export function ModeProvider({ children }) {
  // Initialize from modeEngine (which reads from settingsRegistry)
  const [currentMode, setCurrentMode] = useState(() => {
    const stored = modeEngine.getCurrentMode();
    // Map modeEngine modes to F-11 modes
    const reverseMap = Object.fromEntries(
      Object.entries(F11_TO_SURFACE_MODE).map(([k, v]) => [v, k])
    );
    return reverseMap[stored] || getDefaultMode();
  });

  const [resolvedSettings, setResolvedSettings] = useState(() => applyMode(currentMode));
  const [surfaceModeInfo, setSurfaceModeInfo] = useState(null);

  // Subscribe to modeEngine changes
  useEffect(() => {
    const unsubscribe = modeEngine.subscribe((event, data) => {
      if (event === 'mode_changed') {
        const reverseMap = Object.fromEntries(
          Object.entries(F11_TO_SURFACE_MODE).map(([k, v]) => [v, k])
        );
        const f11Mode = reverseMap[data.newMode] || data.newMode;
        setCurrentMode(f11Mode);
      }
    });
    return unsubscribe;
  }, []);

  // Update resolved settings when mode changes
  useEffect(() => {
    const settings = applyMode(currentMode);
    setResolvedSettings(settings);

    // Get surface mode info for display
    const surfaceModeId = getSurfaceModeId(currentMode);
    const info = getSurfaceMode(surfaceModeId);
    setSurfaceModeInfo(info);
  }, [currentMode]);

  // Persist mode to settingsRegistry
  const setMode = useCallback((modeId) => {
    if (!isValidMode(modeId)) {
      console.warn(`Invalid mode: ${modeId}`);
      return { error: 'Invalid mode' };
    }

    const surfaceModeId = getSurfaceModeId(modeId);
    const result = modeEngine.setMode(surfaceModeId);

    if (result.success) {
      setCurrentMode(modeId);
      // Also persist F-11 mode ID separately for clarity
      setSetting('mode.f11', modeId);
    }

    return result;
  }, []);

  // Hotkey handler for Ctrl/⌘+1..4
  const handleModeHotkey = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
      const keyMap = {
        '1': 'teacher',
        '2': 'coach',
        '3': 'study',
        '4': 'focus',
      };
      const mode = keyMap[e.key];
      if (mode) {
        e.preventDefault();
        setMode(mode);
      }
    }
  }, [setMode]);

  useEffect(() => {
    document.addEventListener('keydown', handleModeHotkey);
    return () => document.removeEventListener('keydown', handleModeHotkey);
  }, [handleModeHotkey]);

  // Subscribe to settings changes for mode.f11
  useEffect(() => {
    const unsubscribe = subscribeSettings('mode.f11', (value) => {
      if (value && isValidMode(value) && value !== currentMode) {
        setMode(value);
      }
    });
    return unsubscribe;
  }, [currentMode, setMode]);

  const value = useMemo(() => ({
    currentMode,
    setMode,
    resolvedSettings,
    surfaceModeInfo,
    availableModes: listModes(),
    isValidMode,
    getDefaultMode,
  }), [currentMode, resolvedSettings, surfaceModeInfo]);

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}

export default ModeProvider;