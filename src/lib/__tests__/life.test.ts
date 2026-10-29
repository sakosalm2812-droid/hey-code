import { describe, expect, it } from 'vitest';
import {
  isSameDay,
  daysBetween,
  computeStreak,
  nextStreakAfter,
  moodEmoji,
} from '@/lib/life';

const d = (iso: string) => new Date(iso);
const loc = (y: number, m: number, day: number, h = 0) => new Date(y, m, day, h, 0, 0);

describe('day math', () => {
  it('compares calendar days ignoring time', () => {
    expect(isSameDay(loc(2026, 8, 17, 9), loc(2026, 8, 17, 23))).toBe(true);
    expect(isSameDay(loc(2026, 8, 17, 9), loc(2026, 8, 18, 9))).toBe(false);
  });

  it('counts whole days between dates', () => {
    expect(daysBetween(loc(2026, 8, 15), loc(2026, 8, 17))).toBe(2);
  });
});

describe('habit streaks', () => {
  it('returns zero when nothing was ever done', () => {
    expect(computeStreak([])).toBe(0);
  });

  it('counts a run ending today or yesterday', () => {
    expect(computeStreak([loc(2026, 8, 17), loc(2026, 8, 16), loc(2026, 8, 15)], loc(2026, 8, 17))).toBe(3);
    expect(computeStreak([loc(2026, 8, 16), loc(2026, 8, 15)], loc(2026, 8, 17))).toBe(2);
  });

  it('resets when there is a gap', () => {
    expect(computeStreak([loc(2026, 8, 10), loc(2026, 8, 17)], loc(2026, 8, 17))).toBe(1);
  });

  it('computes the next streak after marking done', () => {
    const now = loc(2026, 8, 17, 12);
    expect(nextStreakAfter(true, 5, null, now)).toBe(5);
    expect(nextStreakAfter(false, 0, loc(2026, 8, 16), now)).toBe(1);
    expect(nextStreakAfter(false, 4, loc(2026, 8, 16), now)).toBe(5);
    expect(nextStreakAfter(false, 3, loc(2026, 8, 10), now)).toBe(1);
  });
});

describe('moods', () => {
  it('maps mood codes to emoji', () => {
    expect(moodEmoji('GREAT')).toBe('😄');
    expect(moodEmoji('ROUGH')).toBe('😣');
    expect(moodEmoji('LOW')).toBe('😕');
    expect(moodEmoji(undefined)).toBe('😐');
    expect(moodEmoji(null)).toBe('😐');
  });
});