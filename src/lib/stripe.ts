import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: ['100 messages/month', 'GPT-4o-mini', 'Basic support', 'Chat history'],
    limits: { messages: 100, tokens: 50000, models: ['GPT_4O_MINI'], apiCalls: 100, voiceMinutes: 0, uploads: 0, images: 0 },
  },
  PRO: {
    name: 'Pro',
    price: 20,
    priceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    priceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    features: ['Unlimited messages', 'All models (GPT-4o, Claude 3)', 'Priority support', 'API access', 'Voice input', 'File upload', 'Image generation'],
    limits: { messages: -1, tokens: -1, models: ['GPT_4O', 'GPT_4O_MINI', 'GPT_4_TURBO', 'CLAUDE_3_OPUS', 'CLAUDE_3_SONNET', 'CLAUDE_3_HAIKU'], apiCalls: -1, voiceMinutes: 60, uploads: 50, images: 50 },
  },
  TEAM: {
    name: 'Team',
    price: 50,
    priceIdMonthly: process.env.STRIPE_PRICE_TEAM_MONTHLY,
    priceIdYearly: process.env.STRIPE_PRICE_TEAM_YEARLY,
    features: ['Everything in Pro', 'Team workspace', 'Admin dashboard', 'SSO/SAML', 'Custom contracts', 'Dedicated support'],
    limits: { messages: -1, tokens: -1, models: ['GPT_4O', 'GPT_4O_MINI', 'GPT_4_TURBO', 'CLAUDE_3_OPUS', 'CLAUDE_3_SONNET', 'CLAUDE_3_HAIKU'], apiCalls: -1, voiceMinutes: 300, uploads: 200, images: 200 },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: -1,
    priceIdMonthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
    priceIdYearly: undefined,
    features: ['Everything in Team', 'SSO/SAML', 'Custom contracts', 'Dedicated support', 'Custom SLAs', 'On-prem deployment'],
    limits: { messages: -1, tokens: -1, models: ['GPT_4O', 'GPT_4O_MINI', 'GPT_4_TURBO', 'CLAUDE_3_OPUS', 'CLAUDE_3_SONNET', 'CLAUDE_3_HAIKU'], apiCalls: -1, voiceMinutes: -1, uploads: -1, images: -1 },
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export async function createCheckoutSession(userId: string, priceId: string, mode: 'subscription' = 'subscription') {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { subscription: true } });
  if (!user) throw new Error('User not found');

  let customerId = user.subscription?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, stripeCustomerId: customerId },
      update: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    metadata: { userId: user.id },
  });

  return session.url;
}

export async function createPortalSession(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeCustomerId) throw new Error('No subscription found');

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  });

  return session.url;
}

export async function getSubscriptionStatus(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return { plan: 'FREE' as PlanKey, status: 'INACTIVE' };
  return { plan: sub.plan, status: sub.status };
}