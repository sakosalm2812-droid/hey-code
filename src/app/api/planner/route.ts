import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlanner } from '@/lib/tasks';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    const date = dateParam ? new Date(dateParam) : new Date();
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }

    const planner = await getPlanner(session.user.id, date);
    return NextResponse.json({ planner });
  } catch (error) {
    console.error('Planner error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}