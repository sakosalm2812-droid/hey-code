import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendPasswordResetEmail } from '@/lib/email';

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: true });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: 'This account uses OAuth. Please sign in with your provider.' }, { status: 400 });
    }

    await sendPasswordResetEmail(email, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
  }
}