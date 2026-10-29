import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { chatRateLimiter } from '@/lib/rate-limit';
import { createHabit, listHabits, markHabitDone, resetHabitStreak, deleteHabit } from '@/lib/life';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const habits = await listHabits(session.user.id);
    return NextResponse.json({ habits });
  } catch (error) {
    console.error('List habits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await chatRateLimiter(`habits:${session.user.id}`);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Habit name is required' }, { status: 400 });
    }

    const habit = await createHabit(session.user.id, {
      name,
      frequency: typeof body?.frequency === 'string' ? body.frequency : 'DAILY',
      color: typeof body?.color === 'string' ? body.color : undefined,
    });

    try {
      await auditLog(session.user.id, 'CREATE_HABIT', 'habit', { habitId: habit.id, name: habit.name }, request);
    } catch {}

    return NextResponse.json({ habit }, { status: 201 });
  } catch (error) {
    console.error('Create habit error:', error);
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
    const habitId = searchParams.get('id');
    if (!habitId) {
      return NextResponse.json({ error: 'Habit id is required' }, { status: 400 });
    }

    const body = await request.json();
    let habit;
    if (body?.done === true) {
      habit = await markHabitDone(session.user.id, habitId);
    } else if (body?.reset === true) {
      habit = await resetHabitStreak(session.user.id, habitId);
    } else {
      return NextResponse.json({ error: 'Unsupported habit action' }, { status: 400 });
    }

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    try {
      await auditLog(session.user.id, 'UPDATE_HABIT', 'habit', { habitId, streak: habit.streak }, request);
    } catch {}

    return NextResponse.json({ habit });
  } catch (error) {
    console.error('Update habit error:', error);
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
    const habitId = searchParams.get('id');
    if (!habitId) {
      return NextResponse.json({ error: 'Habit id is required' }, { status: 400 });
    }

    const result = await deleteHabit(session.user.id, habitId);
    if (result.count === 0) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    try {
      await auditLog(session.user.id, 'DELETE_HABIT', 'habit', { habitId }, request);
    } catch {}

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error('Delete habit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}