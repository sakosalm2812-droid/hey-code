import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getProactiveInsights } from '@/lib/proactive';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { insights, provider } = await getProactiveInsights(session.user.id);
    return NextResponse.json({
      insights,
      generatedAt: new Date().toISOString(),
      ...(provider ? { provider } : {}),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to build proactive insights' }, { status: 500 });
  }
}