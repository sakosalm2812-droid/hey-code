import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getHeyThought } from '@/lib/proactive';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { thought, source, provider } = await getHeyThought(session.user.id);
    return NextResponse.json({
      thought,
      source,
      ...(provider ? { provider } : {}),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate a thought' }, { status: 500 });
  }
}