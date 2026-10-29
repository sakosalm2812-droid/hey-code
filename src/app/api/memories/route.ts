import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMemories, searchMemories, createMemory, deleteMemory, updateMemoryImportance, linkMemories } from '@/lib/memory';
import { auditLog } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || undefined;
    const category = url.searchParams.get('category') || undefined;
    const query = url.searchParams.get('q');
    const limit = Number(url.searchParams.get('limit') || 50);

    const memories = query
      ? await searchMemories(session.user.id, query, limit)
      : await getMemories(session.user.id, { type: type as any, category, limit });

    return NextResponse.json({ memories });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const memory = await createMemory({ userId: session.user.id, ...body });
    await auditLog(session.user.id, 'CREATE_MEMORY', 'memory', { memoryId: memory.id }, request);

    return NextResponse.json({ memory }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { memoryId, importance, linkToId, relation } = body;

    if (linkToId && relation) {
      const edge = await linkMemories(session.user.id, memoryId, linkToId, relation);
      return NextResponse.json({ edge });
    }

    if (typeof importance === 'number') {
      const memory = await updateMemoryImportance(session.user.id, memoryId, importance);
      if (!memory) return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
      return NextResponse.json({ memory });
    }

    return NextResponse.json({ error: 'No update target specified' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update memory' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const memoryId = url.searchParams.get('id');
    if (!memoryId) return NextResponse.json({ error: 'Memory id required' }, { status: 400 });

    const result = await deleteMemory(session.user.id, memoryId);
    if (result.count === 0) return NextResponse.json({ error: 'Memory not found' }, { status: 404 });

    await auditLog(session.user.id, 'DELETE_MEMORY', 'memory', { memoryId }, request);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 400 });
  }
}