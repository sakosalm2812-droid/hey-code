import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { verifyPasswordResetToken } from '@/lib/email';

const schema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }
    const userId = await verifyPasswordResetToken(token);
    return NextResponse.json({ valid: Boolean(userId) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to verify reset token' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = schema.parse(body);

    const userId = await verifyPasswordResetToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    const { consumePasswordResetToken } = await import('@/lib/email');
    await consumePasswordResetToken(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}