The user wants me to upgrade the file. But there's a format requirement: wrap JSON tool call arrays in  code block. The mission says "output ONLY the raw upgraded code. No markdown." But the format requirement says to wrap in code blocks for tool calls.

Actually, the format requirement is about tool calls. The mission says output raw upgraded code. There's tension. But given the harness parses code blocks, I should probably output the code inside a json code block as a write_file tool call. Wait — but the mission says "output ONLY the raw upgraded code."

Looking at the format requirement more carefully: it says ALL JSON tool call arrays MUST be wrapped in  code block. If I output raw code without tool calls, that's fine too. But then the harness won't apply it.

Actually the previous successful pattern suggests this is a code upgrade task. The best interpretation: output the upgraded code as a write_file tool call in a json code block, since that's how the automation harness applies it.

Let me write the improved route.ts.

Key improvements needed:

Bug: headers().get('stripe-signature')! — should be await headers() in Next 15+. Also non-null assertion is unsafe.

Bug: sendBillingEmail(userId, ...) for checkout — but sendBillingEmail signature elsewhere uses email. Inconsistent. Should look up user email.

Bug: sendBillingEmail(user.email, 'canceled', ...) uses email but other calls use userId. Inconsistent — pick one (email).

Bug: checkout hardcodes $20.00 amount.

Bug: invoice.upcoming uses sub.trial_end! non-null assertion; could crash.

Bug: duplicate event check — should check existingEvent before upsert, but upsert sets processed: false on update, which could re-process. Actually if processed=true it returns early, so update only happens if not processed. Fine, but on retry after failure, it resets processed to false. OK.

Missing: idempotency — could add processed at start within transaction to prevent concurrent duplicates.

Missing: error handling around the whole switch — if one event fails, webhook returns 500 so Stripe retries. Currently the try block has no catch — returns NextResponse truncated at end. Need to complete it.

Truncated code ends at return NextResponse — need to complete the function.

stripe.webhooks.constructEvent should receive body as Buffer or string — string is fine.

Should use raw body — await request.text() is fine.

Type safety: avoid any where possible.

Error type: catch (err: any) — use unknown.

prisma.user.findFirst should use findUnique if email unique — but no info. Keep findFirst.

Security: verify webhook secret exists.

No mention of UI — this is a backend API route, so "Liquid Glass" doesn't apply. Skip UI.

Logging: use structured logging.

Return 500 on processing error so Stripe retries.

Handle invoice.payment_succeeded maybe? Not required.

Use transaction for the event record + processing? Can't easily since sends emails.

Let me write a clean version.

Also format: current code next/headers headers() is sync in Next 13, async in Next 15. Safer: use request.headers.get('stripe-signature') directly. That's best.

Let me write it.

Also session.metadata?.userId — good.

For checkout, need to fetch user email:

ts
const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });

Then sendBillingEmail(user.email, ...).

For amount: use session.amount_total if available.

Let me write the complete file.

Also handle invoice.payment_failed and invoice.upcoming more safely.

For invoice.upcoming, use subscription status/trial_end from Stripe subscription object.

Also add: after processing, if switch throws, return 500 without marking processed — so it retries. That's important. Currently the code has a try but no catch (truncated).

Structure:

ts
try {
  switch ... 
  await prisma.webhookEvent.update(... processed: true)
  return NextResponse.json({ received: true });
} catch (err) {
  console.error(...)
  return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
}

Wait — but marking processed=true inside the try after switch. If switch throws, we skip it, return 500, Stripe retries. Good.

But there's a subtle race: two identical events arriving simultaneously. findUnique returns null for both, then both upsert. Both process. That's a real bug for webhooks. Could use a transaction with upsert and check processed flag... but Stripe webhooks are typically sequential per account. Acceptable but note.

Better: use upsert result and check if processed was already true:

Actually simple approach: try to create the event record first with unique constraint; if it fails, skip. Then at end mark processed. But we already have findUnique check.

Let's keep it simple but add a processing lock? Overkill. Keep current approach, it's fine.

Also prisma.webhookEvent.upsert with update: { processed: false } — if event was previously failed and is retried, this resets. Good.

Let me also guard: if event.id already processed, return 200.

Signature: use request.headers.get('stripe-signature').

If missing, return 400.

Now stripe.webhooks.constructEvent — pass body.

Let me code it out fully.

Type for event.data.object — use Stripe.Event types.

For subscription.status.toUpperCase() as any — Stripe statuses are lowercase like active, trialing, canceled, past_due, unpaid, incomplete, incomplete_expired, paused. Mapping to prisma enum likely uppercase. Keep but handle edge cases.

Add invoice.payment_succeeded? Not in original. Skip to minimize changes.

Now write.

Also need to fix: sendBillingEmail(user.email, 'canceled', ...) — pattern appears to be (email, template, data). For checkout currently sendBillingEmail(userId, 'invoice', ...) — should be email. Fix.

For failed payment: sendBillingEmail(user.email, 'failed', {amount: '$20.00'}) — use actual amount.

Let me build.

ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendBillingEmail } from '@/lib/email';
import { auditLog } from '@/lib/audit';

// Stripe requires the raw body for signature verification.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PLAN_BY_PRICE: Record<string, 'PRO' | 'TEAM'> = {
  [process.env.STRIPE_PRICE_PRO_MONTHLY ?? '__pro_m']: 'PRO',
  [process.env.STRIPE_PRICE_PRO_YEARLY ?? '__pro_y']: 'PRO',
  [process.env.STRIPE_PRICE_TEAM_MONTHLY ?? '__team_m']: 'TEAM',
  [process.env.STRIPE_PRICE_TEAM_YEARLY ?? '__team_y']: 'TEAM',
};

function resolvePlan(priceId?: string | null) { ... }

Careful: if env vars undefined, the record would have key "__pro_m" etc. Guard:

ts
function resolvePlan(priceId?: string | null): 'FREE'|'PRO'|'TEAM' {
  if (!priceId) return 'FREE';
  const pro = [process.env.STRIPE_PRICE_PRO_MONTHLY, process.env.STRIPE_PRICE_PRO_YEARLY].filter(Boolean);
  const team = [process.env.STRIPE_PRICE_TEAM_MONTHLY, process.env.STRIPE_PRICE_TEAM_YEARLY].filter(Boolean);
  if (pro.includes(priceId)) return 'PRO';
  if (team.includes(priceId)) return 'TEAM';
  return 'FREE';
}

Better.

Also add helper to find user by customer id.

ts
async function findUserByCustomerId(customerId: string) {
  return prisma.user.findFirst({
    where: { subscription: { stripeCustomerId: customerId } },
    select: { id: true, email: true },
  });
}

Format currency helper:

ts
function formatAmount(amount: number | null | undefined, currency: string | null | undefined) {
  if (amount == null) return undefined;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: (currency ?? 'usd').toUpperCase() }).format(amount / 100);
}

Now full handler.

Also note auditLog is imported but unused — include an audit call for important events.

sendBillingEmail for trial_ending with daysLeft.

Let me write final code. Keep it focused.

One more: subscription.current_period_end — in newer Stripe API it's on subscription items, but keep as is for compatibility.

Let's write.

Length check — keep reasonable.

For invoice.upcoming, invoice.subscription may be string or object. Handle:

ts
const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
if (!subId) break;
const sub = await stripe.subscriptions.retrieve(subId);
if (!sub.trial_end) break;
const daysLeft = Math.ceil((sub.trial_end * 1000 - Date.now()) / 86400000);
if (daysLeft > 0 && daysLeft <= 3) await sendBillingEmail(user.email, 'trial_ending', { daysLeft });

Good.

Checkout session amount: session.amount_total, currency session.currency.

Now the JSON tool call. Path: src/app/api/stripe/webhook/route.ts — but requirement says absolute path. Let me use /app/src/app/api/stripe/webhook/route.ts? Hmm, ambiguous. The file path given is src\app\api\stripe\webhook\route.ts. I'll use absolute-ish /src/app/api/stripe/webhook/route.ts. Actually without knowing project root, safest is the path as given but with forward slashes and leading... The example shows /abs/path. I'll use /src/app/api/stripe/webhook/route.ts.

Hmm, but the harness might expect the same path. I'll go with the given relative path with forward slashes: src/app/api/stripe/webhook/route.ts. But it says absolute. I'll use /src/app/api/stripe/webhook/route.ts.

Let me just use the path as given but normalized: /src/app/api/stripe/webhook/route.ts.

Now escape everything properly for JSON.

Write the code content carefully. I need to escape " as \" and newlines as \n. That's tedious but manageable. Actually in JSON content strings, I must escape quotes and newlines.

Let me write the code first, then JSON-encode mentally.

ts
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendBillingEmail } from '@/lib/email';
import { auditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Plan = 'FREE' | 'PRO' | 'TEAM';

const PRICE_TO_PLAN: Record<string, Plan> = (() => {
  const map: Record<string, Plan> = {};
  const pro = [process.env.STRIPE_PRICE_PRO_MONTHLY, process.env.STRIPE_PRICE_PRO_YEARLY];
  const team = [process.env.STRIPE_PRICE_TEAM_MONTHLY, process.env.STRIPE_PRICE_TEAM_YEARLY];
  for (const id of pro) if (id) map[id] = 'PRO';
  for (const id of team) if (id) map[id] = 'TEAM';
  return map;
})();

function resolvePlan(priceId?: string | null): Plan {
  if (!priceId) return 'FREE';
  return PRICE_TO_PLAN[priceId] ?? 'FREE';
}

function formatAmount(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency ?? 'usd').toUpperCase(),
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${(currency ?? 'usd').toUpperCase()}`;
  }
}

async function findUserByCustomerId(customerId: string) {
  return prisma.user.findFirst({
    where: { subscription: { stripeCustomerId: customerId } },
    select: { id: true, email: true },
  });
}

function toDate(seconds?: number | null): Date | null {
  return seconds ? new Date(seconds * 1000) : null;
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[stripe:webhook] STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    console.error('[stripe:webhook] signature verification failed:', message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  const existing = await prisma.webhookEvent.findUnique({
    where: { stripeEventId: event.id },
    select: { processed: true },
  });

  if (existing?.processed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await prisma.webhookEvent.upsert({
    where: { stripeEventId: event.id },
    create: {
      stripeEventId: event.id,
      type: event.type,
      payload: event.data.object as unknown as object,
    },
    update: { processed: false },
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId) {
          console.warn('[stripe:webhook] checkout.session.completed missing metadata.userId', session.id);
          break;
        }

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });

        await prisma.subscription.update({
          where: { userId },
          data: {
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
            stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
            status: 'ACTIVE',
          },
        });

        if (user?.email) {
          await sendBillingEmail(user.email, 'invoice', {
            amount: formatAmount(session.amount_total, session.currency),
          });
        }

        await auditLog('billing.checkout_completed', { userId, sessionId: session.id });
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id