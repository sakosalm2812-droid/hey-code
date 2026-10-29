import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toIcs } from '@/lib/tasks';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id, status: { notIn: ['CANCELLED'] } },
      orderBy: { dueDate: 'asc' },
      take: 500,
    });

    const ics = toIcs(tasks as any);
    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="hey-tasks.ics"',
      },
    });
  } catch (error) {
    console.error('ICS export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}