import { prisma } from '@/lib/prisma';

type PushSubscriptionKeys = {
  p256dh: string;
  auth: string;
  endpoint?: string;
  expirationTime?: number | null;
};

export function isPushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  );
}

export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
}

/**
 * Stores a web-push subscription for a user (idempotent per endpoint).
 */
export async function savePushSubscription(userId: string, raw: any): Promise<boolean> {
  const endpoint = typeof raw?.endpoint === 'string' ? raw.endpoint : '';
  const p256dh = raw?.keys?.p256dh;
  const auth = raw?.keys?.auth;
  if (!endpoint || !p256dh || !auth) return false;

  await prisma.pushSubscription.upsert({
    where: { userId_endpoint: { userId, endpoint } },
    create: {
      userId,
      endpoint,
      p256dh,
      auth,
      userAgent: typeof raw?.userAgent === 'string' ? raw.userAgent.slice(0, 255) : undefined,
    },
    update: { p256dh, auth },
  });
  return true;
}

export async function removePushSubscription(userId: string, endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
}

export interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
}

/**
 * Sends a web push notification to every stored subscription for a user.
 * Dead endpoints (410 Gone / 404) are cleaned up automatically.
 * Resolves false when push is not configured or no subscriptions exist.
 */
export async function pushWebPush(userId: string, payload: PushPayload): Promise<boolean> {
  if (!isPushConfigured()) return false;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return false;

  const webpush = (await import('web-push')).default;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  const privateKey = process.env.VAPID_PRIVATE_KEY!;
  const subject = process.env.VAPID_SUBJECT!;
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const body = JSON.stringify(payload);
  const deadEndpoints: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body);
      } catch (error: any) {
        const status = error?.statusCode;
        if (status === 404 || status === 410) deadEndpoints.push(sub.endpoint);
      }
    })
  );

  if (deadEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { userId, endpoint: { in: deadEndpoints } } });
  }

  return true;
}