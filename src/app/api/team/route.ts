import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auditLog } from '@/lib/audit';

const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberships = await prisma.teamMember.findMany({
      where: { userId: session.user.id },
      include: {
        team: {
          include: {
            owner: { select: { id: true, name: true, email: true, image: true } },
            _count: { select: { members: true } },
          },
        },
      },
    });

    return NextResponse.json({ teams: memberships.map(m => m.team) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description } = createTeamSchema.parse(body);

    const existingSlug = await prisma.team.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
    if (subscription?.plan !== 'TEAM' && subscription?.plan !== 'ENTERPRISE') {
      return NextResponse.json({ error: 'Team workspaces require Team or Enterprise plan' }, { status: 403 });
    }

    const team = await prisma.team.create({
      data: {
        name,
        slug,
        description,
        ownerId: session.user.id,
        plan: subscription?.plan || 'TEAM',
        members: {
          create: { userId: session.user.id, role: 'OWNER' },
        },
      },
    });

    await auditLog(session.user.id, 'CREATE_TEAM', 'team', { teamId: team.id }, request);

    return NextResponse.json({ team });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}