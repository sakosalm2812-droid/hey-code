import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auditLog } from '@/lib/audit';

const contactSchema = z.object({
  type: z.enum(['general', 'bug', 'feature', 'billing', 'security']),
  email: z.string().email(),
  subject: z.string().min(5).max(100),
  message: z.string().min(20).max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const data = contactSchema.parse(body);

    const userId = session?.user?.id;
    
    await prisma.auditLog.create({
      data: {
        userId: userId || 'anonymous',
        action: 'CONTACT_FORM',
        resource: 'contact',
        metadata: { ...data, userId },
      },
    });

    // In production, send to support system (Intercom, Zendesk, etc.)
    // For now, log and could send email to support team
    console.log('Contact form submission:', data);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit contact form' }, { status: 500 });
  }
}