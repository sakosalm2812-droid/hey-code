import { describe, it, expect, vi } from 'vitest';
import { cn, formatCurrency, formatDate, formatRelativeTime, truncate, slugify, generateId, sleep, debounce, throttle } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
      expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar');
    });

    it('merges tailwind classes correctly', () => {
      expect(cn('p-2 p-4')).toBe('p-4');
    });
  });

  describe('formatCurrency', () => {
    it('formats USD correctly', () => {
      expect(formatCurrency(2000)).toBe('$20.00');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(999)).toBe('$9.99');
    });

    it('handles different currencies', () => {
      expect(formatCurrency(2000, 'EUR')).toBe('€20.00');
      expect(formatCurrency(2000, 'GBP')).toBe('£20.00');
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2026-09-14');
      expect(formatDate(date)).toBe('Sep 14, 2026');
    });

    it('accepts string dates', () => {
      expect(formatDate('2026-09-14')).toBe('Sep 14, 2026');
    });

    it('respects options', () => {
      const date = new Date('2026-09-14');
      expect(formatDate(date, { year: 'numeric', month: 'long', day: 'numeric' })).toBe('September 14, 2026');
    });
  });

  describe('formatRelativeTime', () => {
    it('returns "just now" for recent times', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('returns minutes ago', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
    });

    it('returns hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
    });

    it('returns days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
    });

    it('returns formatted date for older times', () => {
      const oldDate = new Date('2026-01-01');
      expect(formatRelativeTime(oldDate)).toBe('Jan 1, 2026');
    });
  });

  describe('truncate', () => {
    it('truncates long strings', () => {
      expect(truncate('Hello world', 8)).toBe('Hello...');
    });

    it('returns original if shorter than length', () => {
      expect(truncate('Hi', 10)).toBe('Hi');
    });

    it('handles exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });
  });

  describe('slugify', () => {
    it('converts to lowercase', () => {
      expect(slugify('HELLO WORLD')).toBe('hello-world');
    });

    it('replaces spaces with hyphens', () => {
      expect(slugify('hello world')).toBe('hello-world');
    });

    it('removes special characters', () => {
      expect(slugify('Hello! @World#')).toBe('hello-world');
    });

    it('handles multiple spaces', () => {
      expect(slugify('hello   world')).toBe('hello-world');
    });

    it('trims leading/trailing hyphens', () => {
      expect(slugify('  hello world  ')).toBe('hello-world');
    });
  });

  describe('generateId', () => {
    it('generates unique ids', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });

    it('returns string of expected length', () => {
      expect(generateId().length).toBeGreaterThan(0);
    });
  });

  describe('sleep', () => {
    it('resolves after specified time', async () => {
      const start = Date.now();
      await sleep(50);
      expect(Date.now() - start).toBeGreaterThanOrEqual(40);
    });
  });

  describe('debounce', () => {
    it('delays function execution', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 50);
      
      debounced();
      debounced();
      debounced();
      
      expect(fn).not.toHaveBeenCalled();
      
      await sleep(60);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('limits function execution rate', async () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 50);
      
      throttled();
      throttled();
      throttled();
      
      expect(fn).toHaveBeenCalledTimes(1);
      
      await sleep(60);
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});