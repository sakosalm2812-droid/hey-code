import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { THEMES as DESIGN_THEMES, generateAllThemesCSS } from '../core/designSystem';
import { HEY_THEMES as DECORATIVE_THEMES } from '../lib/themes.js';
import { themeTokens, validAccent } from '../lib/themeTokens.js';

const ThemeContext = createContext(null);

// Merge design system themes (4 core) with decorative themes (27 variants)
// Design themes take precedence for the core 4 names
const ALL_THEMES = {
  ...DESIGN_THEMES,
  ...DECORATIVE_THEMES,
};

function read(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    const saved = read('hey_theme', 'dusk');
    return ALL_THEMES[saved] ? saved : 'dusk';
  });
  const [customAccent, updateAccent] = useState(() => validAccent(read('hey_custom_accent', '#B9C6FF')));
  const [reduceTransparency, setReduceTransparency] = useState(() => read('hey_reduce_transparency', 'false') === 'true');
  const [ambientMode, setAmbientMode] = useState(() => read('hey_ambient_mode', 'manual'));
  
  const theme = ALL_THEMES[themeId];
  const isDesignTheme = !!DESIGN_THEMES[themeId];
  
  // Inject design system CSS once
  useEffect(() => {
    const styleId = 'hey-design-theme-tokens';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = generateAllThemesCSS();
  }, []);
  
  useEffect(() => {
    const root = document.documentElement;
    let tokens;
    
    if (isDesignTheme) {
      // Use design system tokens directly (they're already in CSS via data-theme)
      root.dataset.theme = themeId;
      tokens = DESIGN_THEMES[themeId].tokens;
    } else {
      // Use legacy themeTokens for decorative themes
      tokens = themeTokens(theme, themeId === 'custom' ? customAccent : undefined);
      root.dataset.heyTheme = themeId;
    }
    
    Object.entries(tokens).forEach(([key, value]) => root.style.setProperty(key, value));
    root.dataset.heyLight = String(Boolean(theme.light));
    root.dataset.reduceTransparency = String(reduceTransparency);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.bg);
    
    try {
      localStorage.setItem('hey_theme', themeId);
      localStorage.setItem('hey_custom_accent', customAccent);
      localStorage.setItem('hey_theme_css', JSON.stringify(tokens));
      localStorage.setItem('hey_theme_light', String(Boolean(theme.light)));
      localStorage.setItem('hey_reduce_transparency', String(reduceTransparency));
      localStorage.setItem('hey_ambient_mode', ambientMode);
    } catch { /* Themes still work when browser storage is unavailable. */ }
  }, [theme, themeId, customAccent, reduceTransparency, ambientMode, isDesignTheme]);
  
  useEffect(() => {
    const sync = (event) => {
      if (event.key === 'hey_theme' && ALL_THEMES[event.newValue]) setThemeId(event.newValue);
      if (event.key === 'hey_custom_accent') updateAccent(validAccent(event.newValue));
      if (event.key === 'hey_reduce_transparency') setReduceTransparency(event.newValue === 'true');
      if (event.key === 'hey_ambient_mode') setAmbientMode(event.newValue);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  
  const value = useMemo(() => ({
    theme,
    themeId,
    themes: ALL_THEMES,
    designThemes: DESIGN_THEMES,
    customAccent,
    reduceTransparency,
    ambientMode,
    setReduceTransparency,
    setAmbientMode,
    setTheme: id => { if (ALL_THEMES[id]) setThemeId(id); },
    setCustomAccent: color => updateAccent(validAccent(color)),
    isDesignTheme,
  }), [theme, themeId, customAccent, reduceTransparency, ambientMode, isDesignTheme]);
  
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHEYTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useHEYTheme must be used inside ThemeProvider');
  return value;
}

export { DESIGN_THEMES as CORE_THEMES, DECORATIVE_THEMES };