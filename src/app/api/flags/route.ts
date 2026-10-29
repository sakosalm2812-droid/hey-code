import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAllFlags, setFlag, FLAGS } from '@/lib/flags';
import { z } from 'zod';
import { auditLog } from '@/lib/audit';

const flagSchema = z.object({
  key: z.enum(Object.values(FLAGS) as [string, ...string[]]),
  enabled: z.boolean(),
  metadata: z.record(z.any()).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const flags = await getAllFlags(session.user.id);
    return NextResponse.json({ flags });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch flags' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { key, enabled, metadata } = flagSchema.parse(body);

    await setFlag(session.user.id, key as any, enabled, metadata);
    await auditLog(session.user.id, 'UPDATE_FLAG', 'feature_flag', { key, enabled, metadata }, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update flag' }, { status: 500 });
  }
}