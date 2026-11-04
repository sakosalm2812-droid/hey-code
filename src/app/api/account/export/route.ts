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


FILE TO UPGRADE: src\agents\BaseAgent.ts
CURRENT CODE:
We need answer only JSON code block with write_file. Need complete file content. Need escape JSON. Need produce entire BaseAgent.ts. Need ensure no markdown outside? User says output only raw code but format requirement says wrap JSON in code block. We must obey format requirement. Final should be 

FILE TO UPGRADE: src\app\api\account\export\route.ts
CURRENT CODE:
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const rateLimit = await checkRateLimit(userId, { windowMs: 60 * 1000, maxRequests: 5, keyPrefix: 'export' });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Export rate limit exceeded' }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        preferences: true,
        subscription: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const [accounts, apiKeys, chats, memories, memoryEdges, files, projects, tasks, journalEntries, goals, habits, notifications, agents, ownedTeams, teamMemberships] =
      await Promise.all([
        prisma.account.findMany({ where: { userId }, select: { provider: true } }),
        prisma.apiKey.findMany({ where: { userId }, select: { id: true, name: true, prefix: true, lastUsed: true, createdAt: true } }),
        prisma.chat.findMany({
          where: { userId },
          orderBy: { updatedAt: 'asc' },
          select: { id: true, title: true, model: true, createdAt: true, updatedAt: true, messages: { orderBy: { createdAt: 'asc' }, select: { id: true, role: true, content: true, model: true, createdAt: true } } },
        }),
        prisma.memory.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
        prisma.memoryEdge.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
        prisma.fileRecord.findMany({
          where: { userId },
          orderBy: { createdAt: 'asc' },
          select: { id: true, name: true, mimeType: true, size: true, storageUrl: true, summary: true, keywords: true, confidence: true, status: true, createdAt: true },
        }),
        prisma.project.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
        prisma.task.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
        prisma.journalEntry.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
        prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
        prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
        prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
        prisma.agent.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
        prisma.team.findMany({
          where: { ownerId: userId },
          include: { members: true, chats: { include: { messages: true } }, invitations: true },
        }),
        prisma.teamMember.findMany({ where: { userId }, orderBy: { joinedAt: 'asc' } }),
      ]);

    const providers = Array.from(new Set(accounts.map((a: { provider: string }) => a.provider)));

    const data = {
      exportedAt: new Date().toISOString(),
      product: 'HEY',
      formatVersion: 1,
      account: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        providers,
      },
      preferences: user.preferences,
      billing: user.subscription
        ? {
            plan: user.subscription.plan,
            status: user.subscription.status,
            subscribedSince: user.subscription.createdAt,
            cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
          }
        : null,
      apiKeys: apiKeys.map((k) => ({ name: k.name, prefix: k.prefix, lastUsed: k.lastUsed, createdAt: k.createdAt })),
      chats,
      memories,
      memoryEdges,
      files,
      projects,
      tasks,
      journalEntries,
      goals,
      habits,
      notifications,
      agents,
      teamsOwned: ownedTeams.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        createdAt: t.createdAt,
        members: t.members,
        chats: t.chats,
        invitations: t.invitations,
      })),
      teamMemberships,
    };

    try {
      await auditLog(userId, 'EXPORT_DATA', 'account', { fileCount: files.length }, request);
    } catch {}

    const body = JSON.stringify(data, null, 2);
    const filename = `hey-data-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachme
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.