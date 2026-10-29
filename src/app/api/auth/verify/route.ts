import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body as { token?: string };

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const userId = await verifyEmailToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}