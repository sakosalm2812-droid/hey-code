import { NextRequest, NextResponse } from 'next/server';
import { getFile, isKeySafe } from '@/lib/storage';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ALLOWED_SCOPES = new Set(['files', 'chat']);

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const segments = Array.isArray(params.path) ? params.path : [params.path];
    const scope = segments[0];
    if (!scope || !ALLOWED_SCOPES.has(scope) || segments.length < 2) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const key = segments.join('/');
    if (!isKeySafe(key)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const stored = await getFile(key);
    if (!stored) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return new NextResponse(Uint8Array.from(stored.data), {
      headers: {
        'Content-Type': stored.contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Serve upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}