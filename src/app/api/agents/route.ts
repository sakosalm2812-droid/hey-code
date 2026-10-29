import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { createAgent, listAgents, updateAgent, deleteAgent } from '@/lib/agents';
import { AGENT_TOOLS } from '@/lib/agents';

const PERMISSIONS = ['web', 'memory', 'compute', 'media', 'files', 'data', 'admin'];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agents = await listAgents(session.user.id);
    return NextResponse.json({ agents });
  } catch (error) {
    console.error('List agents error:', error);
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
    const { name, description, systemPrompt, model, tools, permissions } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Agent name is required' }, { status: 400 });
    }
    if (!systemPrompt || typeof systemPrompt !== 'string' || !systemPrompt.trim()) {
      return NextResponse.json({ error: 'System prompt is required' }, { status: 400 });
    }

    const selectedTools = Array.isArray(tools)
      ? tools.filter((t) => AGENT_TOOLS.some((def) => def.id === t))
      : [];
    const selectedPermissions = Array.isArray(permissions)
      ? permissions.filter((p) => PERMISSIONS.includes(p))
      : [];

    const agent = await createAgent({
      userId: session.user.id,
      name: name.trim(),
      description: typeof description === 'string' ? description : undefined,
      systemPrompt: systemPrompt.trim(),
      model: model || 'GPT_4O_MINI',
      tools: selectedTools,
      permissions: selectedPermissions,
    });

    await auditLog(session.user.id, 'CREATE_AGENT', 'agent', { agentId: agent.id, slug: agent.slug }, request);
    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error('Create agent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('id');
    if (!agentId) {
      return NextResponse.json({ error: 'Agent id is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, systemPrompt, model, status, tools, permissions } = body;

    const agent = await updateAgent(session.user.id, agentId, {
      ...(typeof name === 'string' && name.trim() ? { name: name.trim() } : {}),
      ...(typeof description === 'string' ? { description } : {}),
      ...(typeof systemPrompt === 'string' && systemPrompt.trim() ? { systemPrompt: systemPrompt.trim() } : {}),
      ...(typeof model === 'string' ? { model: model as any } : {}),
      ...(typeof status === 'string' ? { status: status as 'ACTIVE' | 'DISABLED' } : {}),
      ...(Array.isArray(tools) ? { tools: tools.filter((t) => AGENT_TOOLS.some((def) => def.id === t)) } : {}),
      ...(Array.isArray(permissions) ? { permissions: permissions.filter((p) => PERMISSIONS.includes(p)) } : {}),
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    await auditLog(session.user.id, 'UPDATE_AGENT', 'agent', { agentId }, request);
    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Update agent error:', error);
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
    const agentId = searchParams.get('id');
    if (!agentId) {
      return NextResponse.json({ error: 'Agent id is required' }, { status: 400 });
    }

    const result = await deleteAgent(session.user.id, agentId);
    if (result.count === 0) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    await auditLog(session.user.id, 'DELETE_AGENT', 'agent', { agentId }, request);
    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error('Delete agent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}