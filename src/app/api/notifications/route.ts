import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getNotifications, getUnreadCount, markNotificationRead, markAllRead } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || 50);
    const unreadOnly = url.searchParams.get('unread') === 'true';

    const [notifications, unread] = await Promise.all([
      getNotifications(session.user.id, { limit, unreadOnly }),
      getUnreadCount(session.user.id),
    ]);

    return NextResponse.json({ notifications, unread });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, all } = body;

    if (all) {
      const result = await markAllRead(session.user.id);
      return NextResponse.json({ updated: result.count });
    }

    if (id) {
      const result = await markNotificationRead(session.user.id, id);
      if (result.count === 0) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      return NextResponse.json({ updated: result.count });
    }

    return NextResponse.json({ error: 'Must specify id or all' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 400 });
  }
}