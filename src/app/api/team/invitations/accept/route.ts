import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: { team: true },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 400 });
    }

    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          invitation: { 
            teamName: invitation.team.name, 
            role: invitation.role, 
            email: invitation.email 
          } 
        }, 
        { status: 401 }
      );
    }

    if (session.user.email !== invitation.email) {
      return NextResponse.json({ error: 'This invitation is for a different email' }, { status: 403 });
    }

    return NextResponse.json({
      invitation: { 
        teamName: invitation.team.name, 
        role: invitation.role, 
        email: invitation.email 
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to verify invitation' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: { team: true },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 400 });
    }

    if (session.user.email !== invitation.email) {
      return NextResponse.json({ error: 'This invitation is for a different email' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.teamInvitation.update({
        where: { token },
        data: { acceptedAt: new Date() },
      });

      await tx.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId: session.user.id,
          role: invitation.role,
        },
      });
    });

    await auditLog(session.user.id, 'ACCEPT_TEAM_INVITATION', 'team_invitation', { 
      teamId: invitation.teamId, 
      invitationId: invitation.id 
    }, request);

    return NextResponse.json({ success: true, teamId: invitation.teamId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}