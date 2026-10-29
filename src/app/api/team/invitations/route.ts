import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auditLog } from '@/lib/audit';
import { sendEmail } from '@/lib/email';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
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

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const invitations = await prisma.teamInvitation.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
      include: { team: true },
    });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = inviteSchema.parse(body);

    const existingMember = await prisma.teamMember.findFirst({
      where: { teamId, user: { email } },
    });
    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    const existingInvite = await prisma.teamInvitation.findFirst({
      where: { teamId, email, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existingInvite) {
      return NextResponse.json({ error: 'Invitation already sent' }, { status: 400 });
    }

    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        email,
        role,
        token,
        expiresAt,
      },
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/team/invite/${token}`;
    
    await sendEmail({
      to: email,
      subject: `Invitation to join ${membership.team.name} on HEY`,
      html: `
        <p>You've been invited to join <strong>${membership.team.name}</strong> on HEY as a ${role}.</p>
        <p><a href="${inviteUrl}">Accept Invitation</a></p>
        <p>This invitation expires in 7 days.</p>
      `,
    });

    await auditLog(session.user.id, 'INVITE_TEAM_MEMBER', 'team_invitation', { teamId, email, role }, request);

    return NextResponse.json({ invitation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}