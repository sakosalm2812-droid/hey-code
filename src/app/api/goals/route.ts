import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { chatRateLimiter } from '@/lib/rate-limit';
import { createGoal, listGoals, updateGoalProgress, deleteGoal } from '@/lib/life';
import { createNotification } from '@/lib/notifications';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goals = await listGoals(session.user.id);
    return NextResponse.json({ goals });
  } catch (error) {
    console.error('List goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await chatRateLimiter(`goals:${session.user.id}`);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return NextResponse.json({ error: 'Goal title is required' }, { status: 400 });
    }

    const goal = await createGoal(session.user.id, {
      title,
      targetDate: typeof body?.targetDate === 'string' ? body.targetDate : null,
      progress: typeof body?.progress === 'number' ? body.progress : 0,
    });

    try {
      await auditLog(session.user.id, 'CREATE_GOAL', 'goal', { goalId: goal.id, title: goal.title }, request);
    } catch {}

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error('Create goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('id');
    if (!goalId) {
      return NextResponse.json({ error: 'Goal id is required' }, { status: 400 });
    }

    const body = await request.json();
    if (typeof body?.progress !== 'number') {
      return NextResponse.json({ error: 'Progress is required' }, { status: 400 });
    }

    const before = (await listGoals(session.user.id)).find((g) => g.id === goalId);

    const goal = await updateGoalProgress(session.user.id, goalId, body.progress);
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (goal.status === 'ACHIEVED' && before?.status !== 'ACHIEVED') {
      try {
        await createNotification({
          userId: session.user.id,
          type: 'GENERAL',
          title: 'Goal achieved',
          message: goal.title,
          link: '/dashboard/journal?tab=goals',
        });
      } catch {}
    }

    try {
      await auditLog(session.user.id, 'UPDATE_GOAL', 'goal', { goalId, progress: goal.progress }, request);
    } catch {}

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Update goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('id');
    if (!goalId) {
      return NextResponse.json({ error: 'Goal id is required' }, { status: 400 });
    }

    const result = await deleteGoal(session.user.id, goalId);
    if (result.count === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    try {
      await auditLog(session.user.id, 'DELETE_GOAL', 'goal', { goalId }, request);
    } catch {}

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error('Delete goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}