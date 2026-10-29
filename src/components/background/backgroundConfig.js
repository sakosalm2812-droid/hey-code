/**
 * backgroundConfig.js — Pure configuration helpers for the ambient background layer.
 * No DOM, no storage, no side effects.
 */

export const DEFAULT_BACKGROUND = {
  source: 'procedural',
  sceneId: null,
  imageDataUrl: null,
  blur: 48,
  brightness: 33,
  saturate: 70,
  scrim: 45,
  parallax: false,
  parallaxDepth: 0.25,
  motion: 'auto',
  rotateEvery: null,
  perRoute: {},
};

const CLAMP_RANGES = {
  blur: [0, 120],
  brightness: [0, 100],
  saturate: [0, 200],
  scrim: [0, 100],
  parallaxDepth: [0, 1],
};

const VALID_SOURCES = ['procedural', 'bundled', 'user-image', 'generated'];
const VALID_MOTION = ['auto', 'off', 'on'];

function clampValue(value, [min, max]) {
  if (typeof value !== 'number' || Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function clampConfig(config) {
  if (!config || typeof config !== 'object') return { ...DEFAULT_BACKGROUND };

  const clamped = { ...DEFAULT_BACKGROUND, ...config };

  // Clamp numeric ranges
  for (const [key, range] of Object.entries(CLAMP_RANGES)) {
    if (clamped[key] !== undefined) {
      clamped[key] = clampValue(clamped[key], range);
    }
  }

  // Validate enum fields
  if (!VALID_SOURCES.includes(clamped.source)) {
    clamped.source = DEFAULT_BACKGROUND.source;
  }
  if (!VALID_MOTION.includes(clamped.motion)) {
    clamped.motion = DEFAULT_BACKGROUND.motion;
  }

  // Ensure objects are objects
  if (!clamped.perRoute || typeof clamped.perRoute !== 'object') {
    clamped.perRoute = {};
  }

  // Ensure rotateEvery is null or a positive number >= 15
  if (clamped.rotateEvery !== null && clamped.rotateEvery !== undefined) {
    const n = Number(clamped.rotateEvery);
    clamped.rotateEvery = (Number.isFinite(n) && n >= 15) ? n : null;
  }

  // Ensure imageDataUrl is null or string
  if (clamped.imageDataUrl !== null && typeof clamped.imageDataUrl !== 'string') {
    clamped.imageDataUrl = null;
  }

  // Ensure sceneId is null or string
  if (clamped.sceneId !== null && typeof clamped.sceneId !== 'string') {
    clamped.sceneId = null;
  }

  return clamped;
}

export function validateConfig(config) {
  const errors = [];

  if (!config || typeof config !== 'object') {
    return { ok: false, errors: ['Config must be an object'] };
  }

  if (config.source !== undefined && !VALID_SOURCES.includes(config.source)) {
    errors.push(`source must be one of: ${VALID_SOURCES.join(', ')}`);
  }

  if (config.motion !== undefined && !VALID_MOTION.includes(config.motion)) {
    errors.push(`motion must be one of: ${VALID_MOTION.join(', ')}`);
  }

  for (const [key, range] of Object.entries(CLAMP_RANGES)) {
    const val = config[key];
    if (val !== undefined) {
      if (typeof val !== 'number' || Number.isNaN(val)) {
        errors.push(`${key} must be a number`);
      } else if (val < range[0] || val > range[1]) {
        errors.push(`${key} must be between ${range[0]} and ${range[1]}`);
      }
    }
  }

  if (config.rotateEvery !== undefined && config.rotateEvery !== null) {
    const n = Number(config.rotateEvery);
    if (!Number.isFinite(n) || n < 15) {
      errors.push('rotateEvery must be null or a number >= 15');
    }
  }

  if (config.perRoute !== undefined && (config.perRoute === null || typeof config.perRoute !== 'object')) {
    errors.push('perRoute must be an object');
  }

  if (config.imageDataUrl !== undefined && config.imageDataUrl !== null && typeof config.imageDataUrl !== 'string') {
    errors.push('imageDataUrl must be a string or null');
  }

  return { ok: errors.length === 0, errors };
}

export function mergeConfig(stored, incoming) {
  const base = stored && typeof stored === 'object' ? stored : {};
  const overlay = incoming && typeof incoming === 'object' ? incoming : {};

  // Deep merge perRoute
  const perRoute = {
    ...(base.perRoute || {}),
    ...(overlay.perRoute || {}),
  };

  const merged = {
    ...DEFAULT_BACKGROUND,
    ...base,
    ...overlay,
    perRoute,
  };

  return clampConfig(merged);
}

export function migrateConfig(version, raw) {
  // v1 is the current version; handle any legacy shapes
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_BACKGROUND;
  }

  // If it's already v1-shaped, just clamp
  if (raw.blur !== undefined || raw.brightness !== undefined || raw.saturate !== undefined || raw.scrim !== undefined) {
    return clampConfig(raw);
  }

  // Legacy migration: old config might have had different keys
  const migrated = { ...DEFAULT_BACKGROUND };

  // Old keys that might have existed
  if (typeof raw.backgroundBlur === 'number') migrated.blur = raw.backgroundBlur;
  if (typeof raw.backgroundBrightness === 'number') migrated.brightness = raw.backgroundBrightness;
  if (typeof raw.backgroundSaturate === 'number') migrated.saturate = raw.backgroundSaturate;
  if (typeof raw.backgroundScrim === 'number') migrated.scrim = raw.backgroundScrim;
  if (typeof raw.backgroundImage === 'string') {
    migrated.imageDataUrl = raw.backgroundImage;
    migrated.source = 'user-image';
  }
  if (typeof raw.backgroundSource === 'string' && VALID_SOURCES.includes(raw.backgroundSource)) {
    migrated.source = raw.backgroundSource;
  }
  if (typeof raw.backgroundSceneId === 'string') migrated.sceneId = raw.backgroundSceneId;
  if (typeof raw.parallaxEnabled === 'boolean') migrated.parallax = raw.parallaxEnabled;
  if (typeof raw.parallaxDepth === 'number') migrated.parallaxDepth = raw.parallaxDepth;
  if (typeof raw.motionMode === 'string' && VALID_MOTION.includes(raw.motionMode)) migrated.motion = raw.motionMode;
  if (typeof raw.rotateInterval === 'number' && raw.rotateInterval >= 15) migrated.rotateEvery = raw.rotateInterval;
  if (raw.perRoute && typeof raw.perRoute === 'object') migrated.perRoute = raw.perRoute;

  return clampConfig(migrated);
}

/**
 * Calculate the effective luminance of the background layer.
 * Returns a value 0-1 representing the perceived brightness after all filters.
 * This is used for contrast calculations with foreground content.
 */
export function effectiveLuminance(config) {
  const c = clampConfig(config);
  // Brightness filter: 33% = 0.33 multiplier
  const brightnessFactor = c.brightness / 100;
  // Scrim: 45% = 0.45 alpha overlay (dark)
  const scrimFactor = 1 - (c.scrim / 100);
  // Saturation doesn't affect luminance directly, but desaturated images
  // tend to appear slightly darker. Approximate with a small factor.
  const saturateFactor = 0.95 + (c.saturate / 100) * 0.05; // 0.95 to 1.05

  // Base luminance of a typical photo ~0.5 (middle gray)
  const baseLuminance = 0.5;

  return baseLuminance * brightnessFactor * scrimFactor * saturateFactor;
}