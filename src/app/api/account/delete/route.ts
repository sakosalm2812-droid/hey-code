import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit';
import { deleteUploadedFiles } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const rateLimit = await checkRateLimit(userId, { windowMs: 60 * 60 * 1000, maxRequests: 2, keyPrefix: 'delete-account' });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many deletion requests. Try again later.' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (body?.confirm !== 'DELETE') {
      return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({ where: { userId } });

    try {
      await auditLog(userId, 'ACCOUNT_DELETE', 'account', { confirmation: { action: 'ACCOUNT_DELETE', targetUserId: userId } }, request);
    } catch {}

    const files = await prisma.fileRecord.findMany({ where: { userId }, select: { storageUrl: true } });
    try {
      await deleteUploadedFiles(files.map((f) => f.storageUrl));
    } catch {}

    if (subscription?.stripeSubscriptionId || subscription?.stripeCustomerId) {
      try {
        const { stripe } = await import('@/lib/stripe');
        if (subscription.stripeSubscriptionId) {
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        }
        if (subscription.stripeCustomerId) {
          await stripe.customers.del(subscription.stripeCustomerId);
        }
      } catch (error) {
        console.error('Stripe cleanup during account deletion failed:', error);
      }
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('Record to delete does not exist') || error.message.includes('not found'))
    ) {
      return NextResponse.json({ deleted: true });
    }
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
  }
}
