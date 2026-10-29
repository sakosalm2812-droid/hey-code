import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { chatRateLimiter } from '@/lib/rate-limit';
import { createJournalEntry, listJournalEntries, deleteJournalEntry } from '@/lib/life';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entries = await listJournalEntries(session.user.id, {
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
      tag: searchParams.get('tag') ?? undefined,
    });
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('List journal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await chatRateLimiter(`journal:${session.user.id}`);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content) {
      return NextResponse.json({ error: 'Journal content is required' }, { status: 400 });
    }

    const entry = await createJournalEntry(session.user.id, {
      title: typeof body?.title === 'string' ? body.title : undefined,
      content,
      mood: typeof body?.mood === 'string' ? body.mood : 'NEUTRAL',
      tags: Array.isArray(body?.tags) ? body.tags.filter((t: any) => typeof t === 'string') : [],
      date: typeof body?.date === 'string' ? body.date : undefined,
    });

    try {
      await auditLog(session.user.id, 'CREATE_JOURNAL', 'journal', { entryId: entry.id }, request);
    } catch {}

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Create journal error:', error);
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
    const entryId = searchParams.get('id');
    if (!entryId) {
      return NextResponse.json({ error: 'Entry id is required' }, { status: 400 });
    }

    const result = await deleteJournalEntry(session.user.id, entryId);
    if (result.count === 0) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    try {
      await auditLog(session.user.id, 'DELETE_JOURNAL', 'journal', { entryId }, request);
    } catch {}

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error('Delete journal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}