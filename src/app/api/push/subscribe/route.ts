import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { savePushSubscription, removePushSubscription } from '@/lib/push';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const clientEndpoint = body?.endpoint;
    if (typeof clientEndpoint !== 'string' || !clientEndpoint) {
      return NextResponse.json({ error: 'Push subscription endpoint is required' }, { status: 400 });
    }

    const saved = await savePushSubscription(session.user.id, {
      ...body,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    if (!saved) {
      return NextResponse.json({ error: 'Invalid push subscription (endpoint and keys required)' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save push subscription' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const endpoint = request.nextUrl.searchParams.get('endpoint');
    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint query param is required' }, { status: 400 });
    }

    await removePushSubscription(session.user.id, endpoint);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to remove push subscription' }, { status: 500 });
  }
}