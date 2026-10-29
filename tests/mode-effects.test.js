import { describe, it } from 'node:test';
import assert from 'node:assert';
import { applyMode, getModeEffects, listModes, isValidMode, getDefaultMode } from '../src/components/modes/modeEffects.js';

describe('modes/modeEffects.js', () => {
  describe('applyMode', () => {
    it('returns resolved settings for teacher mode', () => {
      const result = applyMode('teacher');
      assert.strictEqual(result.modeId, 'teacher');
      assert.ok(Array.isArray(result.routes));
      assert.ok(result.routes.length > 0);
      assert.strictEqual(result.defaultRoute, '/dashboard');
      assert.strictEqual(result.verbosity, 'thorough');
      assert.strictEqual(result.notificationDensity, 'normal');
      assert.strictEqual(result.motion, 'normal');
      assert.strictEqual(result.brightness, null);
    });

    it('returns resolved settings for coach mode', () => {
      const result = applyMode('coach');
      assert.strictEqual(result.modeId, 'coach');
      assert.strictEqual(result.verbosity, 'evidence-first');
      assert.strictEqual(result.notificationDensity, 'low');
      assert.strictEqual(result.motion, 'reduced');
    });

    it('returns resolved settings for study mode', () => {
      const result = applyMode('study');
      assert.strictEqual(result.modeId, 'study');
      assert.strictEqual(result.verbosity, 'concise');
      assert.strictEqual(result.notificationDensity, 'silent');
      assert.strictEqual(result.motion, 'minimal');
      assert.strictEqual(result.backgroundScrim, 0.15);
    });

    it('returns resolved settings for focus mode with all focus-specific fields', () => {
      const result = applyMode('focus');
      assert.strictEqual(result.modeId, 'focus');
      assert.strictEqual(result.verbosity, 'minimal');
      assert.strictEqual(result.notificationDensity, 'deferred');
      assert.strictEqual(result.motion, 'none');
      assert.strictEqual(result.brightness, 20);
      assert.strictEqual(result.backgroundScrim, 0.25);
      assert.ok(Array.isArray(result.timerDurations));
      assert.deepStrictEqual(result.timerDurations, [25, 50, 90]);
      assert.strictEqual(result.defaultTimerDuration, 25);
      assert.strictEqual(result.escapeControl, true);
    });

    it('falls back to teacher for unknown mode', () => {
      const result = applyMode('unknown');
      assert.strictEqual(result.modeId, 'teacher');
      assert.strictEqual(result.verbosity, 'thorough');
    });

    it('merges with current settings', () => {
      const current = { customSetting: 'value', brightness: 50 };
      const result = applyMode('focus', current);
      assert.strictEqual(result.customSetting, 'value');
      assert.strictEqual(result.brightness, 20); // mode overrides
      assert.strictEqual(result.modeId, 'focus');
    });

    it('preserves current settings not overridden by mode', () => {
      const current = { userPreference: 'dark', someFlag: true };
      const result = applyMode('study', current);
      assert.strictEqual(result.userPreference, 'dark');
      assert.strictEqual(result.someFlag, true);
    });
  });

  describe('getModeEffects', () => {
    it('returns mode effects for valid mode', () => {
      const effects = getModeEffects('teacher');
      assert.ok(effects);
      assert.strictEqual(effects.verbosity, 'thorough');
    });

    it('returns null for invalid mode', () => {
      const effects = getModeEffects('invalid');
      assert.strictEqual(effects, null);
    });
  });

  describe('listModes', () => {
    it('returns all four modes with their configs', () => {
      const modes = listModes();
      assert.strictEqual(modes.length, 4);
      const ids = modes.map(m => m.id).sort();
      assert.deepStrictEqual(ids, ['coach', 'focus', 'study', 'teacher']);
    });

    it('each mode has required fields', () => {
      const modes = listModes();
      for (const mode of modes) {
        assert.ok(mode.id);
        assert.ok(mode.routes);
        assert.ok(mode.defaultRoute);
        assert.ok(mode.panelOrder);
        assert.ok(mode.verbosity);
        assert.ok(mode.motion);
        assert.ok(mode.notificationDensity);
        assert.ok(mode.description);
      }
    });
  });

  describe('isValidMode', () => {
    it('returns true for valid modes', () => {
      assert.strictEqual(isValidMode('teacher'), true);
      assert.strictEqual(isValidMode('coach'), true);
      assert.strictEqual(isValidMode('study'), true);
      assert.strictEqual(isValidMode('focus'), true);
    });

    it('returns false for invalid modes', () => {
      assert.strictEqual(isValidMode('invalid'), false);
      assert.strictEqual(isValidMode(''), false);
      assert.strictEqual(isValidMode(null), false);
    });
  });

  describe('getDefaultMode', () => {
    it('returns teacher as default', () => {
      assert.strictEqual(getDefaultMode(), 'teacher');
    });
  });
});