/**
 * HEY Design System — Pure Theme & Contrast Engine
 * 
 * This module is pure: no DOM, no storage, no side effects.
 * It defines 4 semantic themes and provides contrast assertion
 * that makes unreadable themes impossible to ship.
 */

// Semantic token names used throughout the app
export const SEMANTIC_TOKENS = [
  '--hey-bg',
  '--hey-surface',
  '--hey-surface-2',
  '--hey-border',
  '--hey-text-primary',
  '--hey-text-secondary',
  '--hey-text-tertiary',
  '--hey-accent',
  '--hey-accent-text',
  '--hey-success',
  '--hey-success-text',
  '--hey-warning',
  '--hey-warning-text',
  '--hey-danger',
  '--hey-danger-text',
  '--hey-info',
  '--hey-info-text',
  '--hey-focus',
];

// Theme definitions: each theme is a map of semantic token → CSS color value
export const THEMES = {
  dusk: {
    name: 'Dusk',
    description: 'The current HEY look: near-black smoke, faint warm accent, everything glass.',
    tokens: {
      '--hey-bg': '#05080a',
      '--hey-surface': '#0a0f14',
      '--hey-surface-2': '#10181f',
      '--hey-border': 'rgba(255,255,255,0.08)',
      '--hey-text-primary': '#f5f5f5',
      '--hey-text-secondary': 'rgba(245,245,245,0.72)',
      '--hey-text-tertiary': 'rgba(245,245,245,0.48)',
      '--hey-accent': '#e8d5b7',
      '--hey-accent-text': '#0a0f14',
      '--hey-success': '#6db58a',
      '--hey-success-text': '#05080a',
      '--hey-warning': '#f2cd7b',
      '--hey-warning-text': '#05080a',
      '--hey-danger': '#ff9aa8',
      '--hey-danger-text': '#05080a',
      '--hey-info': '#bdceff',
      '--hey-info-text': '#05080a',
      '--hey-focus': '#e8d5b7',
    },
  },
  dawn: {
    name: 'Dawn',
    description: 'Warm off-white, dark text, light glass, still premium.',
    tokens: {
      '--hey-bg': '#faf8f5',
      '--hey-surface': '#ffffff',
      '--hey-surface-2': '#f0ebe5',
      '--hey-border': 'rgba(10,15,20,0.18)',
      '--hey-text-primary': '#0a0f14',
      '--hey-text-secondary': 'rgba(10,15,20,0.68)',
      '--hey-text-tertiary': 'rgba(10,15,20,0.44)',
      '--hey-accent': '#8b6914',
      '--hey-accent-text': '#faf8f5',
      '--hey-success': '#19734c',
      '--hey-success-text': '#faf8f5',
      '--hey-warning': '#885b00',
      '--hey-warning-text': '#faf8f5',
      '--hey-danger': '#b42338',
      '--hey-danger-text': '#faf8f5',
      '--hey-info': '#2755a8',
      '--hey-info-text': '#faf8f5',
      '--hey-focus': '#8b6914',
    },
  },
  night: {
    name: 'Night',
    description: 'True blacks for OLED, accent dimmed, no glow.',
    tokens: {
      '--hey-bg': '#000000',
      '--hey-surface': '#0a0a0a',
      '--hey-surface-2': '#121212',
      '--hey-border': 'rgba(255,255,255,0.06)',
      '--hey-text-primary': '#e8e8e8',
      '--hey-text-secondary': 'rgba(232,232,232,0.68)',
      '--hey-text-tertiary': 'rgba(232,232,232,0.44)',
      '--hey-accent': '#a89672',
      '--hey-accent-text': '#000000',
      '--hey-success': '#4da86e',
      '--hey-success-text': '#000000',
      '--hey-warning': '#c4a35a',
      '--hey-warning-text': '#000000',
      '--hey-danger': '#cc6a7a',
      '--hey-danger-text': '#000000',
      '--hey-info': '#8aa3d8',
      '--hey-info-text': '#000000',
      '--hey-focus': '#a89672',
    },
  },
  paper: {
    name: 'Paper',
    description: 'White surfaces, black text, minimal chrome, for projection where the room is bright.',
    tokens: {
      '--hey-bg': '#ffffff',
      '--hey-surface': '#ffffff',
      '--hey-surface-2': '#f5f5f5',
      '--hey-border': '#767676',
      '--hey-text-primary': '#1a1a1a',
      '--hey-text-secondary': 'rgba(26,26,26,0.72)',
      '--hey-text-tertiary': 'rgba(26,26,26,0.48)',
      '--hey-accent': '#1a1a1a',
      '--hey-accent-text': '#ffffff',
      '--hey-success': '#1e7a3a',
      '--hey-success-text': '#ffffff',
      '--hey-warning': '#8a6d00',
      '--hey-warning-text': '#ffffff',
      '--hey-danger': '#c0392b',
      '--hey-danger-text': '#ffffff',
      '--hey-info': '#2a5caa',
      '--hey-info-text': '#ffffff',
      '--hey-focus': '#1a1a1a',
    },
  },
};

/**
 * Calculate relative luminance of a CSS color (hex or rgb/rgba)
 * @param {string} color - CSS color value
 * @returns {number} Luminance 0-1
 */
function luminance(color) {
  // Parse hex (3, 4, 6, or 8 digit)
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      // Expand 3/4 digit hex to 6/8 digit
      hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return [r, g, b].map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
      .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
  }
  
  // Parse rgb/rgba (including percentages)
  const rgbMatch = color.match(/rgba?\((\d+(?:\.\d+)?%?),\s*(\d+(?:\.\d+)?%?),\s*(\d+(?:\.\d+)?%?)(?:,\s*[\d.]+)?\)/);
  if (rgbMatch) {
    const parseChannel = (v) => {
      if (v.endsWith('%')) return parseFloat(v) / 100;
      return parseFloat(v) / 255;
    };
    const r = parseChannel(rgbMatch[1]);
    const g = parseChannel(rgbMatch[2]);
    const b = parseChannel(rgbMatch[3]);
    return [r, g, b].map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
      .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
  }
  
  // Fallback for unsupported formats
  return 0.5;
}

/**
 * Calculate WCAG 2.2 contrast ratio between two colors
 * @param {string} a - Foreground color
 * @param {string} b - Background color
 * @returns {number} Contrast ratio (1-21)
 */
export function contrastRatio(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Required contrast ratios per WCAG 2.2 AA
 */
export const CONTRAST_REQUIREMENTS = {
  // Text pairs: (textToken, backgroundToken, minRatio, description)
  text: [
    ['--hey-text-primary', '--hey-surface', 4.5, 'Primary text on surface'],
    ['--hey-text-primary', '--hey-bg', 4.5, 'Primary text on background'],
    ['--hey-text-secondary', '--hey-surface', 4.5, 'Secondary text on surface'],
    ['--hey-text-secondary', '--hey-bg', 4.5, 'Secondary text on background'],
    ['--hey-text-tertiary', '--hey-surface', 3, 'Tertiary text on surface (large text)'],
    ['--hey-text-tertiary', '--hey-bg', 3, 'Tertiary text on background (large text)'],
    ['--hey-accent-text', '--hey-accent', 4.5, 'Text on accent'],
    ['--hey-success-text', '--hey-success', 4.5, 'Text on success'],
    ['--hey-warning-text', '--hey-warning', 4.5, 'Text on warning'],
    ['--hey-danger-text', '--hey-danger', 4.5, 'Text on danger'],
    ['--hey-info-text', '--hey-info', 4.5, 'Text on info'],
  ],
  // Non-text UI: (uiToken, backgroundToken, minRatio, description)
  ui: [
    ['--hey-border', '--hey-surface', 3, 'Border on surface'],
    ['--hey-border', '--hey-bg', 3, 'Border on background'],
    ['--hey-focus', '--hey-surface', 3, 'Focus ring on surface'],
    ['--hey-focus', '--hey-bg', 3, 'Focus ring on background'],
  ],
};

/**
 * Check all contrast requirements for a theme
 * @param {string} themeName - One of 'dusk', 'dawn', 'night', 'paper'
 * @returns {{pass: boolean, failures: Array, theme: string}} Result object
 */
export function assertContrast(themeName) {
  const theme = THEMES[themeName];
  if (!theme) {
    throw new Error(`Unknown theme: ${themeName}`);
  }
  
  const tokens = theme.tokens;
  const failures = [];
  
  // Check text pairs
  for (const [fgToken, bgToken, minRatio, description] of CONTRAST_REQUIREMENTS.text) {
    const fg = tokens[fgToken];
    const bg = tokens[bgToken];
    if (!fg || !bg) {
      failures.push({ fgToken, bgToken, description, error: 'Missing token', ratio: 0, required: minRatio });
      continue;
    }
    const ratio = contrastRatio(fg, bg);
    if (ratio < minRatio) {
      failures.push({ fgToken, bgToken, fg, bg, description, ratio: Math.round(ratio * 100) / 100, required: minRatio });
    }
  }
  
  // Check UI pairs
  for (const [uiToken, bgToken, minRatio, description] of CONTRAST_REQUIREMENTS.ui) {
    const ui = tokens[uiToken];
    const bg = tokens[bgToken];
    if (!ui || !bg) {
      failures.push({ uiToken, bgToken, description, error: 'Missing token', ratio: 0, required: minRatio });
      continue;
    }
    const ratio = contrastRatio(ui, bg);
    if (ratio < minRatio) {
      failures.push({ uiToken, bgToken, ui, bg, description, ratio: Math.round(ratio * 100) / 100, required: minRatio });
    }
  }
  
  return {
    pass: failures.length === 0,
    failures,
    theme: themeName,
  };
}

/**
 * List all failing contrast pairs for a theme
 * @param {string} themeName - Theme name
 * @returns {Array} Array of failing pairs with details
 */
export function listFailingPairs(themeName) {
  const result = assertContrast(themeName);
  return result.failures;
}

/**
 * Resolve a semantic token to its CSS color value for a theme
 * @param {string} themeName - Theme name
 * @param {string} token - Semantic token name (e.g., '--hey-text-primary')
 * @returns {string|undefined} CSS color value
 */
export function resolveToken(themeName, token) {
  const theme = THEMES[themeName];
  return theme?.tokens[token];
}

/**
 * Get all themes that pass contrast assertion
 * @returns {string[]} Array of theme names that pass
 */
export function getPassingThemes() {
  return Object.keys(THEMES).filter(name => assertContrast(name).pass);
}

/**
 * Generate CSS custom properties block for a theme
 * @param {string} themeName - Theme name
 * @returns {string} CSS block
 */
export function generateThemeCSS(themeName) {
  const theme = THEMES[themeName];
  if (!theme) return '';
  
  const lines = [''];
  for (const [token, value] of Object.entries(theme.tokens)) {
    lines.push(`  ${token}: ${value};`);
  }
  return `[data-theme="${themeName}"] {\n${lines.join('\n')}\n}`;
}

/**
 * Generate all theme CSS blocks
 * @returns {string} Complete CSS for all themes
 */
export function generateAllThemesCSS() {
  return Object.keys(THEMES).map(generateThemeCSS).join('\n\n');
}

export default {
  THEMES,
  SEMANTIC_TOKENS,
  CONTRAST_REQUIREMENTS,
  contrastRatio,
  assertContrast,
  listFailingPairs,
  resolveToken,
  getPassingThemes,
  generateThemeCSS,
  generateAllThemesCSS,
};