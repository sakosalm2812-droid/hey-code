import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/stripe';
import type { PlanKey } from '@/lib/stripe';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 100,
  keyPrefix: 'ratelimit',
};

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): Promise<{ allowed: boolean; remaining: number; resetAt: Date; retryAfter?: number }> {
  const { windowMs, maxRequests, keyPrefix } = { ...DEFAULT_CONFIG, ...config };
  const key = `${keyPrefix}:${identifier}`;
  const now = Date.now();

  let record = memoryStore.get(key);
  if (!record || record.resetAt < now) {
    record = { count: 0, resetAt: now + windowMs };
    memoryStore.set(key, record);
  }

  record.count++;
  const remaining = Math.max(0, maxRequests - record.count);
  const allowed = record.count <= maxRequests;

  if (!allowed) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetAt: new Date(record.resetAt), retryAfter };
  }

  return { allowed: true, remaining, resetAt: new Date(record.resetAt) };
}

export async function checkApiRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const usage = await prisma.usage.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  const planLimits = await getPlanLimits(userId);
  const apiCalls = usage?.apiCalls || 0;

  if (planLimits.apiCalls === -1) {
    return { allowed: true, remaining: -1, resetAt: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
  }

  const remaining = Math.max(0, planLimits.apiCalls - apiCalls);
  return { allowed: remaining > 0, remaining, resetAt: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
}

async function getPlanLimits(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const plan = (sub?.plan || 'FREE') as PlanKey;
  return PLANS[plan].limits;
}

export async function incrementApiCalls(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.usage.update({
    where: { userId_date: { userId, date: today } },
    data: { apiCalls: { increment: 1 } },
  });
}

export function createRateLimiter(config: Partial<RateLimitConfig>) {
  return (identifier: string) => checkRateLimit(identifier, config);
}

export const authRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10, keyPrefix: 'auth' });
export const apiRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 60, keyPrefix: 'api' });
export const chatRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 30, keyPrefix: 'chat' });
export const voiceRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 10, keyPrefix: 'voice' });
export const uploadRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 20, keyPrefix: 'upload' });
export const imagesRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 5, keyPrefix: 'images' });