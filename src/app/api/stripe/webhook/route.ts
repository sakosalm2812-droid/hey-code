import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendBillingEmail } from '@/lib/email';
import { auditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { stripeEventId: event.id },
  });

  if (existingEvent?.processed) {
    return NextResponse.json({ received: true });
  }

  await prisma.webhookEvent.upsert({
    where: { stripeEventId: event.id },
    create: { stripeEventId: event.id, type: event.type, payload: event.data.object as any },
    update: { processed: false },
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        if (userId) {
          await prisma.subscription.update({
            where: { userId },
            data: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              status: 'ACTIVE',
            },
          });
          await sendBillingEmail(userId, 'invoice', { amount: '$20.00' });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        const user = await prisma.user.findFirst({
          where: { subscription: { stripeCustomerId: customerId } },
        });
        if (user) {
          const priceId = subscription.items.data[0]?.price.id;
          let plan = 'FREE';
          if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY || priceId === process.env.STRIPE_PRICE_PRO_YEARLY) {
            plan = 'PRO';
          } else if (priceId === process.env.STRIPE_PRICE_TEAM_MONTHLY || priceId === process.env.STRIPE_PRICE_TEAM_YEARLY) {
            plan = 'TEAM';
          }

          await prisma.subscription.update({
            where: { userId: user.id },
            data: {
              stripeSubscriptionId: subscription.id,
              stripePriceId: priceId,
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
              status: subscription.status.toUpperCase() as any,
              plan: plan as any,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        const user = await prisma.user.findFirst({
          where: { subscription: { stripeCustomerId: customerId } },
        });
        if (user) {
          await prisma.subscription.update({
            where: { userId: user.id },
            data: { status: 'CANCELED', plan: 'FREE' },
          });
          await sendBillingEmail(user.email, 'canceled', { plan: 'Pro', periodEnd: new Date() });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;
        const user = await prisma.user.findFirst({
          where: { subscription: { stripeCustomerId: customerId } },
        });
        if (user) {
          await sendBillingEmail(user.email, 'failed', { amount: '$20.00' });
        }
        break;
      }

      case 'invoice.upcoming': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;
        const user = await prisma.user.findFirst({
          where: { subscription: { stripeCustomerId: customerId } },
        });
        if (user && invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const daysLeft = Math.ceil((sub.trial_end! * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysLeft > 0 && daysLeft <= 3) {
            await sendBillingEmail(user.email, 'trial_ending', { daysLeft });
          }
        }
        break;
      }
    }

    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: { processed: true, processedAt: new Date() },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}