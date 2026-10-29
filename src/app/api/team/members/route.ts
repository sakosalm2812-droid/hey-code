import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auditLog } from '@/lib/audit';

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = request.nextUrl.searchParams.get('teamId');
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json({ members });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = request.nextUrl.searchParams.get('teamId');
    const memberId = request.nextUrl.searchParams.get('memberId');
    
    if (!teamId || !memberId) {
      return NextResponse.json({ error: 'Team ID and Member ID required' }, { status: 400 });
    }

    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });

    if (!membership || membership.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can change roles' }, { status: 403 });
    }

    const targetMember = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.teamId !== teamId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (targetMember.userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    const body = await request.json();
    const { role } = updateRoleSchema.parse(body);

    await prisma.teamMember.update({
      where: { id: memberId },
      data: { role },
    });

    await auditLog(session.user.id, 'UPDATE_TEAM_MEMBER_ROLE', 'team_member', { teamId, memberId, role }, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = request.nextUrl.searchParams.get('teamId');
    const memberId = request.nextUrl.searchParams.get('memberId');
    
    if (!teamId || !memberId) {
      return NextResponse.json({ error: 'Team ID and Member ID required' }, { status: 400 });
    }

    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetMember = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.teamId !== teamId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (targetMember.userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
    }

    if (targetMember.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove owner' }, { status: 400 });
    }

    await prisma.teamMember.delete({ where: { id: memberId } });

    await auditLog(session.user.id, 'REMOVE_TEAM_MEMBER', 'team_member', { teamId, memberId }, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}