import { describe, it } from 'node:test';
import assert from 'node:assert';
import quietHours from '../src/components/notifications/quietHours.js';

const { isQuiet, deferUntil, getDefaultQuietHours, parseQuietHours, DEFAULT_QUIET_START, DEFAULT_QUIET_END } = quietHours;

describe('notifications/quietHours.js', () => {
  describe('isQuiet', () => {
    it('returns false for default hours at 12:00', () => {
      const date = new Date('2026-10-21T12:00:00');
      const result = isQuiet(getDefaultQuietHours(), date);
      assert.strictEqual(result, false);
    });

    it('returns true for default hours at 23:00', () => {
      const date = new Date('2026-10-21T23:00:00');
      const result = isQuiet(getDefaultQuietHours(), date);
      assert.strictEqual(result, true);
    });

    it('returns true for default hours at 03:00', () => {
      const date = new Date('2026-10-21T03:00:00');
      const result = isQuiet(getDefaultQuietHours(), date);
      assert.strictEqual(result, true);
    });

    it('returns false for default hours at 08:00', () => {
      const date = new Date('2026-10-21T08:00:00');
      const result = isQuiet(getDefaultQuietHours(), date);
      assert.strictEqual(result, false);
    });

    it('handles same-day quiet hours (e.g., 12:00-14:00)', () => {
      const hours = { start: 12, end: 14 };
      assert.strictEqual(isQuiet(hours, new Date('2026-10-21T11:00:00')), false);
      assert.strictEqual(isQuiet(hours, new Date('2026-10-21T12:00:00')), true);
      assert.strictEqual(isQuiet(hours, new Date('2026-10-21T13:30:00')), true);
      assert.strictEqual(isQuiet(hours, new Date('2026-10-21T14:00:00')), false);
      assert.strictEqual(isQuiet(hours, new Date('2026-10-21T15:00:00')), false);
    });

    it('handles overnight quiet hours (e.g., 22:00-07:00)', () => {
      const hours = { start: 22, end: 7 };
      assert.strictEqual(isQuiet(hours, new Date('2026-10-21T21:00:00')), false);
      assert.strictEqual(isQuiet(hours, new Date('2026-10-21T22:00:00')), true);
      assert.strictEqual(isQuiet(hours, new Date('2026-10-21T23:00:00')), true);
      assert.strictEqual(isQuiet(hours, new Date('2026-10-22T03:00:00')), true);
      assert.strictEqual(isQuiet(hours, new Date('2026-10-22T07:00:00')), false);
      assert.strictEqual(isQuiet(hours, new Date('2026-10-22T08:00:00')), false);
    });

    it('returns false when start === end (disabled)', () => {
      const hours = { start: 12, end: 12 };
      assert.strictEqual(isQuiet(hours, new Date('2026-10-21T12:00:00')), false);
      assert.strictEqual(isQuiet(hours, new Date('2026-10-21T00:00:00')), false);
    });

    it('accepts timestamp numbers', () => {
      const timestamp = new Date('2026-10-21T23:00:00').getTime();
      const result = isQuiet(getDefaultQuietHours(), timestamp);
      assert.strictEqual(result, true);
    });
  });

  describe('deferUntil', () => {
    it('returns same time if not in quiet hours', () => {
      const date = new Date('2026-10-21T12:00:00');
      const result = deferUntil(getDefaultQuietHours(), date);
      assert.strictEqual(result, date.getTime());
    });

    it('returns end of quiet hours if in overnight quiet period (after start)', () => {
      const date = new Date('2026-10-21T23:00:00');
      const result = deferUntil(getDefaultQuietHours(), date);
      const expected = new Date('2026-10-22T07:00:00').getTime();
      assert.strictEqual(result, expected);
    });

    it('returns end of quiet hours if in overnight quiet period (before end)', () => {
      const date = new Date('2026-10-22T03:00:00');
      const result = deferUntil(getDefaultQuietHours(), date);
      const expected = new Date('2026-10-22T07:00:00').getTime();
      assert.strictEqual(result, expected);
    });

    it('returns end of quiet hours if in same-day quiet period', () => {
      const hours = { start: 12, end: 14 };
      const date = new Date('2026-10-21T13:00:00');
      const result = deferUntil(hours, date);
      const expected = new Date('2026-10-21T14:00:00').getTime();
      assert.strictEqual(result, expected);
    });

    it('returns same time if quiet hours disabled', () => {
      const hours = { start: 12, end: 12 };
      const date = new Date('2026-10-21T12:00:00');
      const result = deferUntil(hours, date);
      assert.strictEqual(result, date.getTime());
    });
  });

  describe('getDefaultQuietHours', () => {
    it('returns { start: 22, end: 7 }', () => {
      const hours = getDefaultQuietHours();
      assert.strictEqual(hours.start, 22);
      assert.strictEqual(hours.end, 7);
    });
  });

  describe('parseQuietHours', () => {
    it('parses "22:00-07:00"', () => {
      const hours = parseQuietHours('22:00-07:00');
      assert.strictEqual(hours.start, 22);
      assert.strictEqual(hours.end, 7);
    });

    it('parses "12:00-14:00"', () => {
      const hours = parseQuietHours('12:00-14:00');
      assert.strictEqual(hours.start, 12);
      assert.strictEqual(hours.end, 14);
    });

    it('handles spaces around dash', () => {
      const hours = parseQuietHours('22:00 - 07:00');
      assert.strictEqual(hours.start, 22);
      assert.strictEqual(hours.end, 7);
    });

    it('returns default for invalid string', () => {
      const hours = parseQuietHours('invalid');
      assert.strictEqual(hours.start, 22);
      assert.strictEqual(hours.end, 7);
    });

    it('returns default for null/undefined', () => {
      const hours1 = parseQuietHours(null);
      const hours2 = parseQuietHours(undefined);
      assert.strictEqual(hours1.start, 22);
      assert.strictEqual(hours2.start, 22);
    });

    it('returns default for out-of-range hours', () => {
      const hours = parseQuietHours('25:00-07:00');
      assert.strictEqual(hours.start, 22);
      assert.strictEqual(hours.end, 7);
    });
  });

  describe('constants', () => {
    it('exports DEFAULT_QUIET_START = 22', () => {
      assert.strictEqual(DEFAULT_QUIET_START, 22);
    });

    it('exports DEFAULT_QUIET_END = 7', () => {
      assert.strictEqual(DEFAULT_QUIET_END, 7);
    });
  });
});