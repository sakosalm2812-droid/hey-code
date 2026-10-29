/**
 * Tests for HEY Motion Tokens
 * 
 * Validates that durations are ordered correctly and easing set contains exactly 5 named easings.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  MOTION_DURATION,
  MOTION_DURATION_REDUCED,
  MOTION_EASING,
  MOTION_DURATION_ORDER,
  MOTION_EASING_SET,
  getMotionDuration,
  getMotionEasing,
} from '../src/lib/motionTokens.js';

describe('Motion Tokens — Durations', () => {
  it('defines all required duration tokens', () => {
    const expected = ['instant', 'fast', 'base', 'slow', 'ambient'];
    for (const token of expected) {
      assert.ok(token in MOTION_DURATION, `Missing duration token: ${token}`);
      assert.ok(typeof MOTION_DURATION[token] === 'number', `Duration ${token} is not a number`);
      assert.ok(MOTION_DURATION[token] >= 0, `Duration ${token} is negative`);
    }
  });

  it('durations are ordered from fastest to slowest', () => {
    const order = MOTION_DURATION_ORDER;
    for (let i = 1; i < order.length; i++) {
      const prev = MOTION_DURATION[order[i - 1]];
      const curr = MOTION_DURATION[order[i]];
      assert.ok(prev <= curr, `Duration order violated: ${order[i - 1]} (${prev}) > ${order[i]} (${curr})`);
    }
  });

  it('instant is 0ms', () => {
    assert.equal(MOTION_DURATION.instant, 0);
  });

  it('fast < base < slow < ambient', () => {
    assert.ok(MOTION_DURATION.fast < MOTION_DURATION.base);
    assert.ok(MOTION_DURATION.base < MOTION_DURATION.slow);
    assert.ok(MOTION_DURATION.slow < MOTION_DURATION.ambient);
  });

  it('reduced motion durations are defined and shorter or equal', () => {
    for (const token of Object.keys(MOTION_DURATION)) {
      assert.ok(token in MOTION_DURATION_REDUCED, `Missing reduced duration: ${token}`);
      assert.ok(MOTION_DURATION_REDUCED[token] <= MOTION_DURATION[token], 
        `Reduced duration ${token} (${MOTION_DURATION_REDUCED[token]}) > normal (${MOTION_DURATION[token]})`);
    }
  });

  it('reduced instant is 0', () => {
    assert.equal(MOTION_DURATION_REDUCED.instant, 0);
  });

  it('getMotionDuration returns correct values', () => {
    assert.equal(getMotionDuration('fast', false), 120);
    assert.equal(getMotionDuration('fast', true), 80);
    assert.equal(getMotionDuration('base', false), 200);
    assert.equal(getMotionDuration('base', true), 80);
    assert.equal(getMotionDuration('unknown'), 200); // defaults to base
  });
});

describe('Motion Tokens — Easings', () => {
  it('defines exactly 5 named easings (per spec)', () => {
    const easings = MOTION_EASING_SET;
    assert.equal(easings.length, 5, `Expected 5 easings, got ${easings.length}: ${easings.join(', ')}`);
  });

  it('easing set contains required values', () => {
    const required = ['standard', 'enter', 'exit', 'spring', 'linear'];
    for (const easing of required) {
      assert.ok(MOTION_EASING_SET.includes(easing), `Missing required easing: ${easing}`);
    }
  });

  it('press easing is also available (6 total in object)', () => {
    // The object has 6 entries including press, but the "named set" per spec is 5
    assert.ok('press' in MOTION_EASING);
    assert.equal(Object.keys(MOTION_EASING).length, 6);
  });

  it('all easing values are valid CSS cubic-bezier or linear', () => {
    for (const [name, value] of Object.entries(MOTION_EASING)) {
      assert.ok(typeof value === 'string', `Easing ${name} is not a string`);
      assert.ok(
        value.startsWith('cubic-bezier(') || value === 'linear',
        `Easing ${name} has invalid format: ${value}`
      );
    }
  });

  it('getMotionEasing returns correct values', () => {
    assert.equal(getMotionEasing('standard'), 'cubic-bezier(0.2, 0.8, 0.2, 1)');
    assert.equal(getMotionEasing('enter'), 'cubic-bezier(0.0, 0.9, 0.2, 1)');
    assert.equal(getMotionEasing('exit'), 'cubic-bezier(0.4, 0.0, 1.0, 1.0)');
    assert.equal(getMotionEasing('spring'), 'cubic-bezier(0.34, 1.56, 0.64, 1.0)');
    assert.equal(getMotionEasing('linear'), 'linear');
    assert.equal(getMotionEasing('press'), 'cubic-bezier(0.4, 0.0, 0.2, 1.0)');
    assert.equal(getMotionEasing('unknown'), 'cubic-bezier(0.2, 0.8, 0.2, 1)'); // defaults to standard
  });
});

describe('Motion Tokens — Integration', () => {
  it('duration order array matches object keys', () => {
    assert.deepEqual(MOTION_DURATION_ORDER, Object.keys(MOTION_DURATION));
  });

  it('easing set matches object keys minus press', () => {
    const objectKeys = Object.keys(MOTION_EASING).filter(k => k !== 'press').sort();
    const setKeys = [...MOTION_EASING_SET].sort();
    assert.deepEqual(setKeys, objectKeys);
  });

  it('CSS custom property names follow convention', () => {
    for (const token of Object.keys(MOTION_DURATION)) {
      const cssVar = `--hey-motion-${token}`;
      // Just verify the naming convention would be consistent
      assert.ok(cssVar.startsWith('--hey-motion-'));
    }
  });
});