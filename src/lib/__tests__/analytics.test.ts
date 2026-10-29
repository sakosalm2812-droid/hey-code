import { describe, expect, it } from 'vitest';
import {
  buildDailyWindow,
  bucketize,
  startKey,
  maxBucket,
  percentage,
  topByCount,
} from '@/lib/analytics';

const loc = (y: number, m: number, day: number, h = 0) => new Date(y, m, day, h, 0, 0);
const now = loc(2026, 8, 17, 14);

describe('daily window', () => {
  it('builds N consecutive days ending today', () => {
    const window = buildDailyWindow(3, now);
    expect(window).toHaveLength(3);
    expect(startKey(window[2])).toBe(startKey(now));
    expect(startKey(window[1])).toBe(startKey(loc(2026, 8, 16)));
  });
});

describe('bucketize', () => {
  const records = [loc(2026, 8, 17, 9), loc(2026, 8, 17, 10), loc(2026, 8, 16, 9), loc(2026, 8, 14, 9)];
  const window = buildDailyWindow(3, now);

  it('counts records into their day bucket', () => {
    const buckets = bucketize(records.map((createdAt) => ({ createdAt })), window, now);
    expect(buckets).toHaveLength(3);
    expect(buckets[2].count).toBe(2);
    expect(buckets[1].count).toBe(1);
    expect(buckets[0].count).toBe(0);
  });

  it('ignores records older than the window', () => {
    const buckets = bucketize([{ createdAt: loc(2026, 8, 1) }], window, now);
    expect(buckets.every((b) => b.count === 0)).toBe(true);
  });

  it('ignores future records', () => {
    const buckets = bucketize([{ createdAt: loc(2026, 8, 18) }], window, now);
    expect(buckets.every((b) => b.count === 0)).toBe(true);
  });
});

describe('aggregate math', () => {
  it('finds the max bucket', () => {
    expect(maxBucket([{ date: 'a', count: 2 }, { date: 'b', count: 9 }])).toBe(9);
    expect(maxBucket([])).toBe(0);
  });

  it('computes percentages with safe zero division', () => {
    expect(percentage(3, 10)).toBe(30);
    expect(percentage(3, 0)).toBe(0);
  });

  it('ranks items by occurrence', () => {
    const top = topByCount(
      [{ m: 'a' }, { m: 'b' }, { m: 'a' }, { m: 'a' }, { m: 'c' }],
      (item) => item.m,
      2
    );
    expect(top.map((t) => t.label)).toEqual(['a', 'b']);
    expect(top[0].count).toBe(3);
  });
});