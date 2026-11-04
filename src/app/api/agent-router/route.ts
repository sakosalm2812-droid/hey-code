[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:

PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:

PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:

PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:


FILE TO UPGRADE: src\agents\BaseAgent.ts
CURRENT CODE:
We need answer only JSON code block with write_file. Need complete file content. Need escape JSON. Need produce entire BaseAgent.ts. Need ensure no markdown outside? User says output only raw code but format req

FILE TO UPGRADE: src\app\api\agent-router\route.ts
CURRENT CODE:
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
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.