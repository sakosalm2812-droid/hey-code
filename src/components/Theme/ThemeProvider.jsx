/**
 * HEY Theme Provider
 * 
 * Applies data-theme to <html>, resolves ambient mode, persists via settingsRegistry.
 * This component mounts once at the app root.
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { THEMES, generateAllThemesCSS } from '../../core/designSystem';

const THEME_KEY = 'appearance.theme';
const AMBIENT_KEY = 'appearance.ambientMode';

// Ambient mode schedule: hour → theme
const AMBIENT_SCHEDULE = {
  dawn: { start: 6, end: 10 },    // 06:00–10:00
  day: { start: 10, end: 17 },    // 10:00–17:00 (uses dusk)
  dusk: { start: 17, end: 21 },   // 17:00–21:00
  night: { start: 21, end: 6 },   // 21:00–06:00 (wraps midnight)
};

function getAmbientTheme(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 6 && hour < 10) return 'dawn';
  if (hour >= 10 && hour < 17) return 'dusk'; // day maps to dusk
  if (hour >= 17 && hour < 21) return 'dusk';
  return 'night';
}

function isBusyState(appState) {
  // Don't auto-switch theme during these states
  return appState.modalOpen || 
         appState.voiceSessionActive || 
         appState.printPreviewActive || 
         appState.focusedInputActive;
}

export function ThemeProvider({ children, appState = {} }) {
  const { get, set, subscribe } = useSettings();
  
  const [themeId, setThemeId] = useState(() => get(THEME_KEY) || 'dusk');
  const [ambientMode, setAmbientMode] = useState(() => get(AMBIENT_KEY) || 'manual');
  const [resolvedTheme, setResolvedTheme] = useState(themeId);

  // Initialize: inject theme CSS into document
  useEffect(() => {
    const styleId = 'hey-theme-tokens';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = generateAllThemesCSS();
    
    // Apply initial theme
    applyTheme(resolvedTheme);
    
    return () => {
      // Keep CSS in document for other components
    };
  }, []);

  const applyTheme = useCallback((theme) => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.heyLight = String(THEMES[theme]?.tokens['--hey-bg']?.startsWith('#fa') || 
                                                      THEMES[theme]?.tokens['--hey-bg'] === '#ffffff');
  }, []);

  // Handle manual theme changes
  const handleThemeChange = useCallback((newThemeId) => {
    if (!THEMES[newThemeId]) return;
    setThemeId(newThemeId);
    set(AMBIENT_KEY, 'manual'); // Manual selection disables ambient
    set(THEME_KEY, newThemeId);
    applyTheme(newThemeId);
    setResolvedTheme(newThemeId);
  }, [set, applyTheme]);

  // Handle ambient mode changes
  const handleAmbientModeChange = useCallback((mode) => {
    if (!['auto', 'manual'].includes(mode)) return;
    setAmbientMode(mode);
    set(AMBIENT_KEY, mode);
    
    if (mode === 'auto') {
      const ambientTheme = getAmbientTheme();
      if (!isBusyState(appState)) {
        applyTheme(ambientTheme);
        setResolvedTheme(ambientTheme);
      }
    } else {
      // Manual mode: use stored theme
      applyTheme(themeId);
      setResolvedTheme(themeId);
    }
  }, [set, themeId, applyTheme, appState]);

  // Ambient mode timer: check every minute for time-based theme changes
  useEffect(() => {
    if (ambientMode !== 'auto') return;
    
    const checkAmbient = () => {
      if (isBusyState(appState)) return;
      const ambientTheme = getAmbientTheme();
      if (ambientTheme !== resolvedTheme) {
        // Cross-fade transition handled by CSS
        applyTheme(ambientTheme);
        setResolvedTheme(ambientTheme);
        // Announce to accessibility live region
        announceThemeChange(ambientTheme);
      }
    };
    
    checkAmbient(); // Initial check
    const interval = setInterval(checkAmbient, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [ambientMode, resolvedTheme, applyTheme, appState]);

  // Sync across tabs via storage event
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === THEME_KEY && e.newValue && THEMES[e.newValue]) {
        if (ambientMode === 'manual') {
          setThemeId(e.newValue);
          applyTheme(e.newValue);
          setResolvedTheme(e.newValue);
        }
      }
      if (e.key === AMBIENT_KEY && e.newValue) {
        setAmbientMode(e.newValue);
        if (e.newValue === 'auto' && !isBusyState(appState)) {
          const ambientTheme = getAmbientTheme();
          applyTheme(ambientTheme);
          setResolvedTheme(ambientTheme);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [ambientMode, applyTheme, appState]);

  // Announce theme changes to screen readers
  const announceThemeChange = useCallback((theme) => {
    const liveRegion = document.getElementById('hey-theme-announcer');
    if (liveRegion) {
      liveRegion.textContent = `Theme changed to ${THEMES[theme]?.name || theme}`;
    }
  }, []);

  // Ensure live region exists
  useEffect(() => {
    if (!document.getElementById('hey-theme-announcer')) {
      const el = document.createElement('div');
      el.id = 'hey-theme-announcer';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      el.style.position = 'absolute';
      el.style.width = '1px';
      el.style.height = '1px';
      el.style.padding = '0';
      el.style.margin = '-1px';
      el.style.overflow = 'hidden';
      el.style.clip = 'rect(0, 0, 0, 0)';
      el.style.whiteSpace = 'nowrap';
      el.style.border = '0';
      document.body.appendChild(el);
    }
  }, []);

  const value = useMemo(() => ({
    themeId,
    ambientMode,
    resolvedTheme,
    themes: THEMES,
    setTheme: handleThemeChange,
    setAmbientMode: handleAmbientModeChange,
  }), [themeId, ambientMode, resolvedTheme, handleThemeChange, handleAmbientModeChange]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export default ThemeProvider;