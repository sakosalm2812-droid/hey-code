import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPlanner } from '@/lib/tasks';
import { listJournalEntries, listHabits } from '@/lib/life';
import { buildBriefing, journalStreak } from '@/lib/briefing';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const [planner, journal, habits] = await Promise.all([
      getPlanner(session.user.id, now),
      listJournalEntries(session.user.id, { from: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString() }),
      listHabits(session.user.id),
    ]);

    const journalDates = journal.map((e: any) => e.date.toISOString());
    const bestHabitStreak = habits.reduce((best, h) => Math.max(best, h.streak), 0);

    const briefing = buildBriefing(
      {
        dueToday: planner.dueToday.length,
        overdue: planner.overdue.length,
        completedToday: planner.completedToday.length,
        focusToday: planner.summary.focus,
        pendingTasks: planner.summary.pending,
        journalEntriesLast7Days: journalDates,
        bestHabitStreak,
      },
      now
    );

    return NextResponse.json({
      briefing: {
        ...briefing,
        journalStreak: journalStreak(journalDates, now),
        bestHabitStreak,
        tasks: {
          dueToday: planner.dueToday.map((t: any) => ({ id: t.id, title: t.title, priority: t.priority })),
          overdue: planner.overdue.map((t: any) => ({ id: t.id, title: t.title, priority: t.priority })),
        },
      },
    });
  } catch (error) {
    console.error('Briefing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}