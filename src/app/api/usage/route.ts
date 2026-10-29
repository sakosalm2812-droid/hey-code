import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/ai';
import { PLANS, type PlanKey } from '@/lib/stripe';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    const plan: PlanKey = (subscription?.plan || 'FREE') as PlanKey;
    const planLimits = PLANS[plan].limits;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await prisma.usage.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    const weeklyUsage = await prisma.usage.findMany({
      where: {
        userId,
        date: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { date: 'asc' },
    });

    const monthlyUsage = await prisma.usage.findMany({
      where: {
        userId,
        date: { gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { date: 'asc' },
    });

    const rateLimit = await checkRateLimit(userId, plan);

    return NextResponse.json({
      plan,
      limits: planLimits,
      today: {
        messages: usage?.messagesCount || 0,
        tokens: usage?.tokensUsed || 0,
        apiCalls: usage?.apiCalls || 0,
      },
      weekly: weeklyUsage.map(u => ({
        date: u.date,
        messages: u.messagesCount,
        tokens: u.tokensUsed,
      })),
      monthly: monthlyUsage.map(u => ({
        date: u.date,
        messages: u.messagesCount,
        tokens: u.tokensUsed,
      })),
      rateLimit: {
        allowed: rateLimit.allowed,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
}