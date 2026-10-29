import { prisma } from '@/lib/prisma';
import { daysBetween } from '@/lib/life';
import { completeWithFailover } from '@/lib/provider-router';
import type { ProviderMessage } from '@/lib/providers';

export interface ProactiveInsight {
  id: string;
  kind: 'overdue' | 'due' | 'streak' | 'journal' | 'goal' | 'memory';
  title: string;
}

export interface ProactiveContext {
  hasData: boolean;
  providerLabel?: string;
}

const NOW = () => new Date();
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Collects lightweight, deterministic signals from the user's data.
 */
export async function collectProactiveSignals(userId: string) {
  const now = NOW();

  const [tasks, habits, lastJournal, goals, unreadCount, recentMemories] = await Promise.all([
    prisma.task.findMany({
      where: { userId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      orderBy: { dueDate: 'asc' },
      take: 50,
      select: { id: true, title: true, dueDate: true, priority: true },
    }),
    prisma.habit.findMany({ where: { userId }, orderBy: { streak: 'desc' }, take: 20 }),
    prisma.journalEntry.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.goal.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { updatedAt: 'asc' },
      take: 20,
      select: { id: true, title: true, progress: true, updatedAt: true, targetDate: true },
    }),
    prisma.notification.count({ where: { userId, read: false } }),
    prisma.memory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5, select: { content: true } }),
  ]);

  const overdueTasks = tasks.filter((t) => t.dueDate && t.dueDate.getTime() < now.getTime());
  const dueSoonTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate.getTime() >= now.getTime() && t.dueDate.getTime() < now.getTime() + 2 * DAY_MS
  );
  const bestHabit = habits[0] ?? null;
  const habitsNotLoggedToday = habits.filter((h) => !h.lastDoneAt || h.lastDoneAt < startOfDay(now));
  const lastJournalDays = lastJournal ? daysBetween(new Date(lastJournal.date), now) : null;
  const staleGoals = goals.filter((g) => g.progress < 100 && g.updatedAt.getTime() < now.getTime() - 7 * DAY_MS);

  return {
    overdueTasks,
    dueSoonTasks,
    bestHabit,
    bestStreak: bestHabit?.streak ?? 0,
    habitsNotLoggedToday,
    lastJournalDays,
    openGoals: goals,
    staleGoals,
    unreadCount,
    recentMemories,
    hasData:
      tasks.length > 0 ||
      habits.length > 0 ||
      goals.length > 0 ||
      lastJournal !== null ||
      recentMemories.length > 0,
  };
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Deterministic insight builder — always available, no LLM required.
 */
export function buildTemplateInsights(s: Awaited<ReturnType<typeof collectProactiveSignals>>): ProactiveInsight[] {
  const insights: ProactiveInsight[] = [];

  for (const t of s.overdueTasks.slice(0, 2)) {
    insights.push({ id: `overdue-${t.id}`, kind: 'overdue', title: `Overdue: "${t.title}"` });
  }
  for (const t of s.dueSoonTasks.slice(0, 2)) {
    insights.push({ id: `due-${t.id}`, kind: 'due', title: `Due soon: "${t.title}"` });
  }

  if (s.bestStreak > 0 && s.habitsNotLoggedToday.some((h) => h.id === s.bestHabit!.id)) {
    insights.push({
      id: 'streak-at-risk',
      kind: 'streak',
      title: `Keep your ${s.bestStreak}d "${s.bestHabit!.name}" streak alive today.`,
    });
  } else if (s.bestStreak > 0) {
    insights.push({ id: 'streak', kind: 'streak', title: `You're on a ${s.bestStreak}-day "${s.bestHabit!.name}" streak.` });
  }

  if (s.lastJournalDays !== null && s.lastJournalDays >= 3) {
    insights.push({ id: 'journal-gap', kind: 'journal', title: `No journal entry in ${s.lastJournalDays} days — worth a few lines tonight?` });
  } else if (s.lastJournalDays === null) {
    insights.push({ id: 'journal-start', kind: 'journal', title: 'Your journal is empty — a first entry only takes a minute.' });
  }

  for (const g of s.staleGoals.slice(0, 2)) {
    insights.push({ id: `goal-${g.id}`, kind: 'goal', title: `Goal "${g.title}" hasn't moved in a week (${g.progress}%).` });
  }

  if (s.unreadCount >= 3 && insights.length < 5) {
    insights.push({ id: 'unread', kind: 'memory', title: `${s.unreadCount} unread notifications are waiting.` });
  }

  return insights.slice(0, 5);
}

async function providerPrompt(s: Awaited<ReturnType<typeof collectProactiveSignals>>): Promise<{ content: string; providerLabel: string }> {
  const context: string[] = [];
  if (s.overdueTasks.length) context.push(`Overdue tasks: ${s.overdueTasks.map((t) => t.title).join(', ')}`);
  if (s.dueSoonTasks.length) context.push(`Due within 48h: ${s.dueSoonTasks.map((t) => t.title).join(', ')}`);
  if (s.bestHabit) context.push(`Best habit streak: ${s.bestHabit.name} at ${s.bestStreak} days; today not logged: ${s.habitsNotLoggedToday.map((h) => h.name).join(', ') || 'none'}`);
  if (s.lastJournalDays !== null) context.push(`Last journal entry ${s.lastJournalDays} days ago`);
  if (s.staleGoals.length) context.push(`Stale goals: ${s.staleGoals.map((g) => `${g.title} (${g.progress}%)`).join(', ')}`);
  if (s.unreadCount) context.push(`${s.unreadCount} unread notifications`);
  if (s.recentMemories.length) context.push(`Recent memories: ${s.recentMemories.map((m) => m.content).join(' | ')}`);

  const messages: ProviderMessage[] = [
    {
      role: 'system',
      content:
        'You are HEY\'s proactive engine. Given a user\'s current state, produce EXACTLY 3 short, warm, human proactive suggestions. ' +
        'Reply as a JSON array of objects like [{"title": "..."}]. Each title must be under 90 characters, specific to the user, and actionable. No markdown, no extra text.',
    },
    { role: 'user', content: context.join('\n') || 'The user is new and has no data yet.' },
  ];

  const result = await completeWithFailover(messages, 'GPT_4O_MINI', 300);
  return { content: result.content, providerLabel: result.usedTarget.providerId };
}

/**
 * LLM-synthesized proactive suggestions with graceful template fallback.
 */
export async function getProactiveInsights(userId: string): Promise<{ insights: ProactiveInsight[]; provider?: string }> {
  const signals = await collectProactiveSignals(userId);

  try {
    const { content, providerLabel } = await providerPrompt(signals);
    let parsed: Array<{ title?: string }> = [];
    try {
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      }
    } catch {}
    const insights = parsed
      .filter((i) => typeof i?.title === 'string' && i.title.trim())
      .slice(0, 3)
      .map((i, idx) => ({ id: `llm-${idx}-${signals.hasData ? 's' : 'e'}`, kind: 'memory' as const, title: i.title!.slice(0, 120) }));
    if (insights.length > 0) {
      return { insights, provider: providerLabel };
    }
  } catch {
    // provider down — fall through to template
  }

  return { insights: buildTemplateInsights(signals) };
}

const THOUGHTS = [
  'A small, consistent action today beats a grand plan that waits for a perfect moment.',
  'Your energy is a budget. Spend it on what you said mattered — that\'s the whole trick.',
  'The gap between who you are and who you want to be is mostly just unfinished conversations with yourself.',
  'Done is better than perfect. Perfect is a moving target; done is a fact you can stand on.',
  'Trade "should" for a calendar slot. Intentions live forever; calendars actually deliver.',
  'Every streak you keep is proof that future-you can be counted on.',
];

/**
 * HEY "thoughts" — a brief model-generated reflection, with template fallback.
 */
export async function getHeyThought(userId: string): Promise<{ thought: string; source: 'llm' | 'template'; provider?: string }> {
  const signals = await collectProactiveSignals(userId);

  try {
    const messages: ProviderMessage[] = [
      {
        role: 'system',
        content:
          'You are HEY — the user\'s calm, clever copilot. Write ONE short thought (under 40 words) reflecting on their current state. ' +
          'It can be encouragement, a gentle nudge, or quiet wisdom. Be warm and specific — reference their data (streaks, overdue tasks, journal gaps) directly. No quotation marks, no emojis, no prefixes.',
      },
      {
        role: 'user',
        content: [
          signals.bestStreak ? `Best habit: "${signals.bestHabit!.name}" on a ${signals.bestStreak} day streak` : '',
          signals.overdueTasks.length ? `${signals.overdueTasks.length} overdue task(s)` : '',
          signals.lastJournalDays !== null ? `Last journaled ${signals.lastJournalDays} day(s) ago` : 'Never journaled',
          signals.staleGoals.length ? `Stale goal: ${signals.staleGoals[0].title} at ${signals.staleGoals[0].progress}%` : '',
          signals.recentMemories.length ? `Memories: ${signals.recentMemories.map((m) => m.content).join(' | ')}` : 'No memories yet',
        ]
          .filter(Boolean)
          .join('; '),
      },
    ];
    const result = await completeWithFailover(messages, 'GPT_4O_MINI', 160);
    const thought = result.content.trim().replace(/^["'\s]+|["'\s]+$/g, '').slice(0, 220);
    if (thought) return { thought, source: 'llm', provider: result.usedTarget.providerId };
  } catch {
    // fall through
  }

  const idx = signals.bestStreak % THOUGHTS.length;
  return { thought: THOUGHTS[idx], source: 'template' };
}