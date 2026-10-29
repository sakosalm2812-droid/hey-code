import { prisma } from '@/lib/prisma';

export const MOODS = ['GREAT', 'GOOD', 'NEUTRAL', 'LOW', 'ROUGH'] as const;
export const HABIT_FREQUENCIES = ['DAILY', 'WEEKLY'] as const;

export function startOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function daysBetween(a: Date, b: Date): number {
  const msDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / msDay);
}

export function computeStreak(doneDates: Date[], today = new Date()): number {
  if (doneDates.length === 0) return 0;

  const days = new Set(doneDates.map((d) => startOfDay(d).getTime()));

  const todayStamp = startOfDay(today).getTime();
  const yesterdayStamp = todayStamp - 24 * 60 * 60 * 1000;

  if (!days.has(todayStamp) && !days.has(yesterdayStamp)) return 0;

  let streak = 0;
  let cursor = days.has(todayStamp) ? todayStamp : yesterdayStamp;
  while (days.has(cursor)) {
    streak++;
    cursor -= 24 * 60 * 60 * 1000;
  }
  return streak;
}

export function nextStreakAfter(doneToday: boolean, currentStreak: number, lastDoneAt: Date | null, now = new Date()): number {
  if (doneToday) return Math.max(1, currentStreak);
  if (!lastDoneAt) return 1;
  const gap = daysBetween(lastDoneAt, now);
  if (gap === 0) return currentStreak;
  if (gap === 1) return currentStreak + 1;
  return 1;
}

export function moodEmoji(mood: string | null | undefined): string {
  switch (mood) {
    case 'GREAT':
      return '😄';
    case 'GOOD':
      return '🙂';
    case 'NEUTRAL':
      return '😐';
    case 'LOW':
      return '😕';
    case 'ROUGH':
      return '😣';
    default:
      return '😐';
  }
}

export async function createJournalEntry(userId: string, data: { title?: string; content: string; mood?: string; tags?: string[]; date?: string }) {
  const content = (data.content || '').trim();
  if (!content) throw new Error('Journal content is required');

  return prisma.journalEntry.create({
    data: {
      userId,
      title: data.title?.trim().slice(0, 200) || null,
      content: content.slice(0, 10000),
      mood: MOODS.includes(data.mood as any) ? (data.mood as string) : 'NEUTRAL',
      tags: (data.tags ?? []).slice(0, 20),
      date: data.date ? new Date(data.date) : new Date(),
    },
  });
}

export async function listJournalEntries(userId: string, opts?: { from?: string; to?: string; tag?: string; limit?: number; offset?: number }) {
  const where: Record<string, any> = { userId };
  if (opts?.from || opts?.to) {
    where.date = {};
    if (opts?.from) where.date.gte = new Date(opts.from);
    if (opts?.to) where.date.lte = new Date(opts.to);
  }

  const entries = await prisma.journalEntry.findMany({
    where,
    orderBy: { date: 'desc' },
    take: opts?.limit ?? 50,
    skip: opts?.offset ?? 0,
  });

  if (opts?.tag) return entries.filter((e) => e.tags.includes(opts.tag!));
  return entries;
}

export async function deleteJournalEntry(userId: string, entryId: string) {
  return prisma.journalEntry.deleteMany({ where: { id: entryId, userId } });
}

export async function createHabit(userId: string, data: { name: string; frequency?: string; color?: string }) {
  const name = (data.name || '').trim();
  if (!name) throw new Error('Habit name is required');
  return prisma.habit.create({
    data: {
      userId,
      name: name.slice(0, 200),
      frequency: HABIT_FREQUENCIES.includes(data.frequency as any) ? (data.frequency as string) : 'DAILY',
      color: data.color ?? '#6366f1',
    },
  });
}

export async function listHabits(userId: string) {
  return prisma.habit.findMany({ where: { userId }, orderBy: [{ streak: 'desc' }, { createdAt: 'asc' }] });
}

export async function markHabitDone(userId: string, habitId: string, date = new Date()) {
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) return null;

  const doneAt = startOfDay(date);
  const dayMs = 24 * 60 * 60 * 1000;

  if (habit.lastDoneAt && doneAt.getTime() - startOfDay(habit.lastDoneAt).getTime() >= dayMs) {
    const gap = daysBetween(habit.lastDoneAt, date);
    const streak = gap === 1 ? habit.streak + 1 : 1;
    return prisma.habit.update({ where: { id: habitId }, data: { lastDoneAt: doneAt, streak } });
  }

  return prisma.habit.update({ where: { id: habitId }, data: { lastDoneAt: doneAt, streak: Math.max(1, habit.streak) } });
}

export async function resetHabitStreak(userId: string, habitId: string) {
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) return null;
  return prisma.habit.update({ where: { id: habitId }, data: { lastDoneAt: null, streak: 0 } });
}

export async function deleteHabit(userId: string, habitId: string) {
  return prisma.habit.deleteMany({ where: { id: habitId, userId } });
}

export async function createGoal(userId: string, data: { title: string; targetDate?: string | null; progress?: number }) {
  const title = (data.title || '').trim();
  if (!title) throw new Error('Goal title is required');

  let progress = Math.max(0, Math.min(100, Number(data.progress) || 0));

  return prisma.goal.create({
    data: {
      userId,
      title: title.slice(0, 300),
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      progress,
      status: progress >= 100 ? 'ACHIEVED' : 'ACTIVE',
    },
  });
}

export async function listGoals(userId: string) {
  return prisma.goal.findMany({ where: { userId }, orderBy: [{ status: 'asc' }, { targetDate: 'asc' }, { createdAt: 'desc' }] });
}

export async function updateGoalProgress(userId: string, goalId: string, progress: number) {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) return null;
  const clamped = Math.max(0, Math.min(100, Number(progress) || 0));
  return prisma.goal.update({
    where: { id: goalId },
    data: { progress: clamped, status: clamped >= 100 ? 'ACHIEVED' : goal.status === 'ACHIEVED' ? 'ACHIEVED' : 'ACTIVE' },
  });
}

export async function deleteGoal(userId: string, goalId: string) {
  return prisma.goal.deleteMany({ where: { id: goalId, userId } });
}