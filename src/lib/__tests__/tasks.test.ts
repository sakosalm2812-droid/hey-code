import { describe, expect, it } from 'vitest';
import {
  priorityRank,
  isOverdue,
  sortByPriority,
  filterTasks,
  startOfDay,
  endOfDay,
  summarizeDay,
  toIcs,
} from '@/lib/tasks';

describe('priority ordering', () => {
  it('ranks urgent above low', () => {
    expect(priorityRank('URGENT')).toBeGreaterThan(priorityRank('LOW'));
    expect(priorityRank('HIGH')).toBeGreaterThan(priorityRank('MEDIUM'));
  });

  it('sorts tasks by descending priority', () => {
    const sorted = sortByPriority([
      { priority: 'LOW', title: 'a' },
      { priority: 'URGENT', title: 'b' },
      { priority: 'MEDIUM', title: 'c' },
    ]);
    expect(sorted.map((t) => t.title)).toEqual(['b', 'c', 'a']);
  });
});

describe('overdue detection', () => {
  const now = new Date('2026-09-17T12:00:00Z');

  it('flags pending tasks with a past due date', () => {
    expect(isOverdue({ status: 'PENDING', dueDate: new Date('2026-09-16T00:00:00Z') }, now)).toBe(true);
  });

  it('ignores completed and cancelled tasks', () => {
    expect(isOverdue({ status: 'COMPLETED', dueDate: new Date('2026-09-16T00:00:00Z') }, now)).toBe(false);
    expect(isOverdue({ status: 'CANCELLED', dueDate: new Date('2026-09-16T00:00:00Z') }, now)).toBe(false);
  });

  it('returns false without a due date or with a future due date', () => {
    expect(isOverdue({ status: 'PENDING', dueDate: null }, now)).toBe(false);
    expect(isOverdue({ status: 'PENDING', dueDate: new Date('2026-09-18T00:00:00Z') }, now)).toBe(false);
  });
});

describe('filtering', () => {
  const tasks = [
    { status: 'PENDING', title: 'Write report' },
    { status: 'COMPLETED', title: 'Write code' },
    { status: 'IN_PROGRESS', title: 'Review PR' },
  ];

  it('filters by status', () => {
    expect(filterTasks(tasks as any, { status: 'COMPLETED' })).toHaveLength(1);
    expect(filterTasks(tasks as any, { status: 'ALL' })).toHaveLength(3);
  });

  it('filters by search term', () => {
    const hits = filterTasks(tasks as any, { search: 'write' });
    expect(hits).toHaveLength(2);
  });
});

describe('day helpers', () => {
  it('bounds a day to midnight edges', () => {
    const base = new Date('2026-09-17T15:30:00Z');
    expect(startOfDay(base).getTime()).toBeLessThanOrEqual(base.getTime());
    expect(endOfDay(base).getTime()).toBeGreaterThanOrEqual(base.getTime());
    expect(endOfDay(base).getHours()).toBe(23);
  });

  it('summarizes completed, pending, and focus counts', () => {
    const summary = summarizeDay([
      { status: 'COMPLETED', priority: 'MEDIUM' },
      { status: 'PENDING', priority: 'URGENT' },
      { status: 'PENDING', priority: 'LOW' },
    ]);
    expect(summary.completed).toBe(1);
    expect(summary.pending).toBe(2);
    expect(summary.focus).toBe(1);
  });
});

describe('ics export', () => {
  it('serializes tasks into a vcalendar', () => {
    const ics = toIcs([
      { id: 't1', title: 'Call client', dueDate: new Date('2026-09-17T10:00:00Z') },
      { id: 't2', title: 'No date' },
    ]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('UID:t1@hey');
    expect(ics).toContain('SUMMARY:Call client');
    expect(ics).not.toContain('SUMMARY:No date');
  });

  it('escapes commas and semicolons in summaries', () => {
    const ics = toIcs([{ id: 't', title: 'a, b; c', dueDate: new Date() }]);
    expect(ics).not.toContain('SUMMARY:a, b');
  });
});