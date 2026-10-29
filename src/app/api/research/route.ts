import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { chatRateLimiter } from '@/lib/rate-limit';
import { runWebResearch } from '@/lib/research';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resLimit = await chatRateLimiter(`research:${session.user.id}`);
    if (!resLimit.allowed) {
      return NextResponse.json(
        { error: 'Research rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(resLimit.retryAfter ?? 60) } }
      );
    }

    const body = await request.json();
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    if (query.length > 500) {
      return NextResponse.json({ error: 'Query is too long (max 500 characters)' }, { status: 400 });
    }

    const result = await runWebResearch(query, { limit: 8, maxSources: 8 });

    try {
      await auditLog(session.user.id, 'RESEARCH', 'research', { query, sources: result.sources.length, extractive: result.extractive, needsSetup: result.needsSetup }, request);
    } catch {}

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Research error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}