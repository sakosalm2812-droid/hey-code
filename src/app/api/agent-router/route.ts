import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { routeRequest, routeRequestToTeam, getRegistryHealthSummary } from '@/lib/agents';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ summary: getRegistryHealthSummary() });
  } catch (error) {
    console.error('Agent router summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { input, teamOnly, teamId } = body;
    if (typeof input !== 'string' || !input.trim()) {
      return NextResponse.json({ error: 'input is required' }, { status: 400 });
    }

    const decision = teamId
      ? await routeRequestToTeam(input.trim().slice(0, 2000), teamId)
      : teamOnly
        ? await routeRequestToTeam(input.trim().slice(0, 2000))
        : routeRequest(input.trim().slice(0, 2000));

    await auditLog(session.user.id, 'ROUTE_REQUESTS', 'agent', { input: input.trim().slice(0, 120) }, request);
    return NextResponse.json({ decision });
  } catch (error) {
    console.error('Route request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}