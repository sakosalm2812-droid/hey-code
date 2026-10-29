import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { chatRateLimiter } from '@/lib/rate-limit';
import { createTask, listTasks, getTaskById, updateTask, deleteTask } from '@/lib/tasks';
import { TASK_PRIORITIES, TASK_STATUSES } from '@/lib/tasks';
import { createNotification } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const priority = searchParams.get('priority') ?? undefined;
    const due = searchParams.get('due') ?? undefined;
    const search = searchParams.get('q') ?? undefined;

    const tasks = await listTasks(session.user.id, { status, priority, due, search });
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('List tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await chatRateLimiter(`tasks:${session.user.id}`);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Task rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }
    if (title.length > 300) {
      return NextResponse.json({ error: 'Task title is too long (max 300 characters)' }, { status: 400 });
    }

    const priority = TASK_PRIORITIES.includes(body?.priority) ? body.priority : 'MEDIUM';
    const tags = Array.isArray(body?.tags) ? body.tags.filter((t: any) => typeof t === 'string').slice(0, 20) : [];

    const task = await createTask(session.user.id, {
      title,
      description: typeof body?.description === 'string' ? body.description : undefined,
      priority,
      dueDate: typeof body?.dueDate === 'string' ? body.dueDate : null,
      tags,
    });

    try {
      await auditLog(session.user.id, 'CREATE_TASK', 'task', { taskId: task.id, title: task.title }, request);
    } catch {}

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    if (error instanceof Error && error.message.includes('due date')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
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
    const taskId = searchParams.get('id');
    if (!taskId) {
      return NextResponse.json({ error: 'Task id is required' }, { status: 400 });
    }

    const body = await request.json();

    const before = await getTaskById(session.user.id, taskId);

    const task = await updateTask(session.user.id, taskId, {
      ...(typeof body?.title === 'string' && body.title.trim() ? { title: body.title } : {}),
      ...(typeof body?.description === 'string' ? { description: body.description } : {}),
      ...(TASK_PRIORITIES.includes(body?.priority) ? { priority: body.priority } : {}),
      ...(TASK_STATUSES.includes(body?.status) ? { status: body.status } : {}),
      ...(body?.dueDate !== undefined ? { dueDate: typeof body.dueDate === 'string' ? body.dueDate : null } : {}),
      ...(Array.isArray(body?.tags) ? { tags: body.tags.filter((t: any) => typeof t === 'string').slice(0, 20) } : {}),
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.status === 'COMPLETED' && before?.status !== 'COMPLETED') {
      try {
        await createNotification({
          userId: session.user.id,
          type: 'GENERAL',
          title: 'Task completed',
          message: task.title,
          link: '/dashboard/tasks',
        });
      } catch {}
    }

    try {
      await auditLog(session.user.id, 'UPDATE_TASK', 'task', { taskId, status: task.status }, request);
    } catch {}

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Update task error:', error);
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
    const taskId = searchParams.get('id');
    if (!taskId) {
      return NextResponse.json({ error: 'Task id is required' }, { status: 400 });
    }

    const existing = await getTaskById(session.user.id, taskId);
    const result = await deleteTask(session.user.id, taskId);
    if (result.count === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    try {
      await auditLog(session.user.id, 'DELETE_TASK', 'task', { taskId, title: existing?.title }, request);
    } catch {}

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}