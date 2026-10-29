import { describe, expect, it } from 'vitest';
import { buildBriefing, greetingFor, journalStreak } from '@/lib/briefing';

describe('greeting', () => {
  it('varies by hour', () => {
    expect(greetingFor(9)).toBe('Good morning');
    expect(greetingFor(14)).toBe('Good afternoon');
    expect(greetingFor(20)).toBe('Good evening');
  });
});

describe('briefing', () => {
  const now = new Date('2026-09-17T09:00:00');

  it('surfaces overdue tasks first', () => {
    const briefing = buildBriefing(
      { dueToday: 0, overdue: 2, completedToday: 0, focusToday: 0, pendingTasks: 5, journalEntriesLast7Days: [], bestHabitStreak: 0 },
      now
    );
    expect(briefing.greeting).toBe('Good morning');
    expect(briefing.bullets[0]).toContain('2 overdue tasks');
    expect(briefing.focus[0]).toBe('Clear overdue tasks');
  });

  it('mentions due tasks and high priority focus', () => {
    const briefing = buildBriefing(
      { dueToday: 3, overdue: 0, completedToday: 1, focusToday: 2, pendingTasks: 10, journalEntriesLast7Days: [], bestHabitStreak: 0 },
      now
    );
    expect(briefing.bullets.join(' ')).toContain('3 tasks due today');
    expect(briefing.bullets.join(' ')).toContain('completed 1 task today');
    expect(briefing.focus.join(' ')).toContain('2 high-priority');
  });

  it('praises journal consistency and habit streaks', () => {
    const briefing = buildBriefing(
      { dueToday: 0, overdue: 0, completedToday: 2, focusToday: 0, pendingTasks: 2, journalEntriesLast7Days: ['a', 'b', 'c', 'd'], bestHabitStreak: 7 },
      now
    );
    expect(briefing.bullets.join(' ')).toContain('4 journal entries');
    expect(briefing.bullets.join(' ')).toContain('best habit streak is 7 days');
    expect(briefing.focus.join(' ')).toContain('7-day habit streak');
  });

  it('always produces at least one bullet and one focus', () => {
    const briefing = buildBriefing(
      { dueToday: 0, overdue: 0, completedToday: 0, focusToday: 0, pendingTasks: 0, journalEntriesLast7Days: [], bestHabitStreak: 0 },
      now
    );
    expect(briefing.bullets.length).toBeGreaterThan(0);
    expect(briefing.focus.length).toBeGreaterThan(0);
  });
});

describe('journal streak', () => {
  const now = new Date('2026-09-17T09:00:00');
  const iso = (offsetDays: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString();
  };

  it('counts consecutive recent days', () => {
    expect(journalStreak([iso(0), iso(1), iso(2)], now)).toBe(3);
  });

  it('allows a missing today', () => {
    expect(journalStreak([iso(1), iso(2)], now)).toBe(2);
  });

  it('breaks the streak on a gap', () => {
    expect(journalStreak([iso(0), iso(1), iso(3)], now)).toBe(2);
  });
});