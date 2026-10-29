import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { createPortalSession } from '@/lib/stripe';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = await createPortalSession(session.user.id);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}