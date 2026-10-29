import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildDailyWindow, bucketize, maxBucket, percentage, topByCount } from '@/lib/analytics';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const days = 14;
    const window = buildDailyWindow(days);

    const [messages, chats, tasks, journalEntries] = await Promise.all([
      prisma.message.findMany({ where: { userId }, select: { id: true, createdAt: true, tokens: true, model: true }, orderBy: { createdAt: 'desc' }, take: 5000 }),
      prisma.chat.findMany({ where: { userId }, select: { id: true, title: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 500 }),
      prisma.task.findMany({ where: { userId }, select: { status: true } }),
      prisma.journalEntry.findMany({ where: { userId }, select: { id: true, createdAt: true } }),
    ]);

    const messageBuckets = bucketize(messages, window);
    const tokenBuckets = bucketize(
      messages.filter((m) => (m.tokens ?? 0) > 0).map((m) => ({ createdAt: m.createdAt })),
      window
    );
    const journalBuckets = bucketize(journalEntries, window);

    const taskByStatus = topByCount(tasks, (t) => t.status);
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length;
    const topModels = topByCount(messages.filter((m) => m.model), (m) => m.model as string);

    const totalTokens = messages.reduce((sum, m) => sum + (m.tokens ?? 0), 0);

    return NextResponse.json({
      window: messageBuckets.map((b) => b.date),
      messagesPerDay: messageBuckets,
      tokensPerDay: tokenBuckets,
      journalPerDay: journalBuckets,
      totals: {
        messages: messages.length,
        chats: chats.length,
        tokens: totalTokens,
        journalEntries: journalEntries.length,
        completionRate: percentage(completedTasks, completedTasks + pendingTasks),
      },
      taskBreakdown: {
        byStatus: taskByStatus,
        completed: completedTasks,
        pending: pendingTasks,
      },
      topModels,
      maxMessages: maxBucket(messageBuckets),
      maxJournal: maxBucket(journalBuckets),
      recentChats: chats.slice(0, 10).map((c) => ({ id: c.id, title: c.title, createdAt: c.createdAt })),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}