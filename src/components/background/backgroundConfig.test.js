import { test, describe } from 'node:test';
import { strictEqual, deepStrictEqual, ok } from 'node:assert';
import {
  DEFAULT_BACKGROUND,
  clampConfig,
  validateConfig,
  mergeConfig,
  migrateConfig,
  effectiveLuminance,
} from './backgroundConfig.js';

describe('backgroundConfig', () => {
  describe('DEFAULT_BACKGROUND', () => {
    test('has correct default values', () => {
      strictEqual(DEFAULT_BACKGROUND.source, 'procedural');
      strictEqual(DEFAULT_BACKGROUND.blur, 48);
      strictEqual(DEFAULT_BACKGROUND.brightness, 33);
      strictEqual(DEFAULT_BACKGROUND.saturate, 70);
      strictEqual(DEFAULT_BACKGROUND.scrim, 45);
      strictEqual(DEFAULT_BACKGROUND.parallax, false);
      strictEqual(DEFAULT_BACKGROUND.parallaxDepth, 0.25);
      strictEqual(DEFAULT_BACKGROUND.motion, 'auto');
      strictEqual(DEFAULT_BACKGROUND.rotateEvery, null);
      deepStrictEqual(DEFAULT_BACKGROUND.perRoute, {});
    });
  });

  describe('clampConfig', () => {
    test('returns defaults for null/undefined input', () => {
      const result = clampConfig(null);
      deepStrictEqual(result, DEFAULT_BACKGROUND);

      const result2 = clampConfig(undefined);
      deepStrictEqual(result2, DEFAULT_BACKGROUND);
    });

    test('clamps blur to 0-120', () => {
      strictEqual(clampConfig({ blur: -10 }).blur, 0);
      strictEqual(clampConfig({ blur: 9999 }).blur, 120);
      strictEqual(clampConfig({ blur: 60 }).blur, 60);
    });

    test('clamps brightness to 0-100', () => {
      strictEqual(clampConfig({ brightness: -50 }).brightness, 0);
      strictEqual(clampConfig({ brightness: 150 }).brightness, 100);
      strictEqual(clampConfig({ brightness: 33 }).brightness, 33);
    });

    test('clamps saturate to 0-200', () => {
      strictEqual(clampConfig({ saturate: -10 }).saturate, 0);
      strictEqual(clampConfig({ saturate: 500 }).saturate, 200);
      strictEqual(clampConfig({ saturate: 70 }).saturate, 70);
    });

    test('clamps scrim to 0-100', () => {
      strictEqual(clampConfig({ scrim: -5 }).scrim, 0);
      strictEqual(clampConfig({ scrim: 200 }).scrim, 100);
      strictEqual(clampConfig({ scrim: 45 }).scrim, 45);
    });

    test('clamps parallaxDepth to 0-1', () => {
      strictEqual(clampConfig({ parallaxDepth: -1 }).parallaxDepth, 0);
      strictEqual(clampConfig({ parallaxDepth: 5 }).parallaxDepth, 1);
      strictEqual(clampConfig({ parallaxDepth: 0.5 }).parallaxDepth, 0.5);
    });

    test('validates source enum', () => {
      strictEqual(clampConfig({ source: 'invalid' }).source, 'procedural');
      strictEqual(clampConfig({ source: 'bundled' }).source, 'bundled');
      strictEqual(clampConfig({ source: 'user-image' }).source, 'user-image');
      strictEqual(clampConfig({ source: 'generated' }).source, 'generated');
    });

    test('validates motion enum', () => {
      strictEqual(clampConfig({ motion: 'invalid' }).motion, 'auto');
      strictEqual(clampConfig({ motion: 'off' }).motion, 'off');
      strictEqual(clampConfig({ motion: 'on' }).motion, 'on');
    });

    test('handles rotateEvery', () => {
      strictEqual(clampConfig({ rotateEvery: 10 }).rotateEvery, null);
      strictEqual(clampConfig({ rotateEvery: 15 }).rotateEvery, 15);
      strictEqual(clampConfig({ rotateEvery: 60 }).rotateEvery, 60);
      strictEqual(clampConfig({ rotateEvery: null }).rotateEvery, null);
    });

    test('ensures perRoute is object', () => {
      deepStrictEqual(clampConfig({ perRoute: null }).perRoute, {});
      deepStrictEqual(clampConfig({ perRoute: 'invalid' }).perRoute, {});
      deepStrictEqual(clampConfig({ perRoute: { '/dashboard': 'scene1' } }).perRoute, { '/dashboard': 'scene1' });
    });

    test('preserves unknown keys', () => {
      const result = clampConfig({ unknownKey: 'value', blur: 50 });
      strictEqual(result.unknownKey, 'value');
      strictEqual(result.blur, 50);
    });
  });

  describe('validateConfig', () => {
    test('returns ok for valid config', () => {
      const result = validateConfig(DEFAULT_BACKGROUND);
      strictEqual(result.ok, true);
      deepStrictEqual(result.errors, []);
    });

    test('rejects invalid source', () => {
      const result = validateConfig({ source: 'invalid' });
      strictEqual(result.ok, false);
      ok(result.errors.some(e => e.includes('source')));
    });

    test('rejects invalid motion', () => {
      const result = validateConfig({ motion: 'invalid' });
      strictEqual(result.ok, false);
      ok(result.errors.some(e => e.includes('motion')));
    });

    test('rejects out of range numeric values', () => {
      const result = validateConfig({ blur: 9999, brightness: -50, saturate: 500, scrim: 200, parallaxDepth: 5 });
      strictEqual(result.ok, false);
      ok(result.errors.length >= 5);
    });

    test('rejects invalid rotateEvery', () => {
      const result = validateConfig({ rotateEvery: 10 });
      strictEqual(result.ok, false);
      ok(result.errors.some(e => e.includes('rotateEvery')));
    });

    test('accepts valid rotateEvery', () => {
      const result = validateConfig({ rotateEvery: 30 });
      strictEqual(result.ok, true);
    });

    test('rejects non-object perRoute', () => {
      const result = validateConfig({ perRoute: 'invalid' });
      strictEqual(result.ok, false);
      ok(result.errors.some(e => e.includes('perRoute')));
    });

    test('rejects non-string imageDataUrl', () => {
      const result = validateConfig({ imageDataUrl: 123 });
      strictEqual(result.ok, false);
      ok(result.errors.some(e => e.includes('imageDataUrl')));
    });

    test('accepts null imageDataUrl', () => {
      const result = validateConfig({ imageDataUrl: null });
      strictEqual(result.ok, true);
    });
  });

  describe('mergeConfig', () => {
    test('merges incoming over stored', () => {
      const stored = { blur: 20, brightness: 50 };
      const incoming = { brightness: 80, saturate: 90 };
      const result = mergeConfig(stored, incoming);
      strictEqual(result.blur, 20);
      strictEqual(result.brightness, 80);
      strictEqual(result.saturate, 90);
    });

    test('deep merges perRoute', () => {
      const stored = { perRoute: { '/a': 'scene1' } };
      const incoming = { perRoute: { '/b': 'scene2' } };
      const result = mergeConfig(stored, incoming);
      deepStrictEqual(result.perRoute, { '/a': 'scene1', '/b': 'scene2' });
    });

    test('handles null inputs', () => {
      const result = mergeConfig(null, { brightness: 40 });
      strictEqual(result.brightness, 40);
      strictEqual(result.blur, DEFAULT_BACKGROUND.blur);
    });
  });

  describe('migrateConfig', () => {
    test('returns defaults for null/undefined', () => {
      deepStrictEqual(migrateConfig('v1', null), DEFAULT_BACKGROUND);
      deepStrictEqual(migrateConfig('v1', undefined), DEFAULT_BACKGROUND);
    });

    test('clamps already valid config', () => {
      const result = migrateConfig('v1', { blur: 9999, brightness: 33 });
      strictEqual(result.blur, 120);
      strictEqual(result.brightness, 33);
    });

    test('migrates legacy keys', () => {
      const legacy = {
        backgroundBlur: 30,
        backgroundBrightness: 50,
        backgroundSaturate: 80,
        backgroundScrim: 60,
        backgroundImage: 'data:image/png;base64,abc',
        backgroundSource: 'user-image',
        backgroundSceneId: 'forest-mist',
        parallaxEnabled: true,
        parallaxDepth: 0.5,
        motionMode: 'off',
        rotateInterval: 30,
        perRoute: { '/dashboard': 'mountain-dusk' },
      };
      const result = migrateConfig('v1', legacy);
      strictEqual(result.blur, 30);
      strictEqual(result.brightness, 50);
      strictEqual(result.saturate, 80);
      strictEqual(result.scrim, 60);
      strictEqual(result.imageDataUrl, 'data:image/png;base64,abc');
      strictEqual(result.source, 'user-image');
      strictEqual(result.sceneId, 'forest-mist');
      strictEqual(result.parallax, true);
      strictEqual(result.parallaxDepth, 0.5);
      strictEqual(result.motion, 'off');
      strictEqual(result.rotateEvery, 30);
      deepStrictEqual(result.perRoute, { '/dashboard': 'mountain-dusk' });
    });

    test('ignores unknown legacy keys', () => {
      const result = migrateConfig('v1', { unknownLegacyKey: 'value' });
      deepStrictEqual(result, DEFAULT_BACKGROUND);
    });
  });

  describe('effectiveLuminance', () => {
    test('returns a number between 0 and 1', () => {
      const lum = effectiveLuminance(DEFAULT_BACKGROUND);
      ok(typeof lum === 'number');
      ok(lum >= 0 && lum <= 1);
    });

    test('decreases with lower brightness', () => {
      const bright = effectiveLuminance({ ...DEFAULT_BACKGROUND, brightness: 100 });
      const dark = effectiveLuminance({ ...DEFAULT_BACKGROUND, brightness: 10 });
      ok(bright > dark);
    });

    test('decreases with higher scrim', () => {
      const lowScrim = effectiveLuminance({ ...DEFAULT_BACKGROUND, scrim: 10 });
      const highScrim = effectiveLuminance({ ...DEFAULT_BACKGROUND, scrim: 90 });
      ok(lowScrim > highScrim);
    });
  });
});