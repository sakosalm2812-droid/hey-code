import { prisma } from '@/lib/prisma';

export const FLAGS = {
  AI_CHAT: 'ai_chat',
  VOICE_INPUT: 'voice_input',
  FILE_UPLOAD: 'file_upload',
  IMAGE_GENERATION: 'image_generation',
  TEAM_WORKSPACES: 'team_workspaces',
  API_ACCESS: 'api_access',
  CUSTOM_MODELS: 'custom_models',
  ANALYTICS_DASHBOARD: 'analytics_dashboard',
  WHITE_LABEL: 'white_label',
} as const;

export type FlagKey = typeof FLAGS[keyof typeof FLAGS];

const flagCache = new Map<string, { enabled: boolean; metadata: any; expires: number }>();
const CACHE_TTL = 60 * 1000;

export async function getFlag(userId: string, key: FlagKey): Promise<{ enabled: boolean; metadata: any }> {
  const cacheKey = `${userId}:${key}`;
  const cached = flagCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return { enabled: cached.enabled, metadata: cached.metadata };
  }

  const flag = await prisma.featureFlag.findUnique({
    where: { userId_key: { userId, key } },
  });

  const result = {
    enabled: flag?.enabled ?? process.env[`FEATURE_${key.toUpperCase()}`] === 'true',
    metadata: flag?.metadata ?? {},
  };

  flagCache.set(cacheKey, { ...result, expires: Date.now() + CACHE_TTL });
  return result;
}

export async function setFlag(userId: string, key: FlagKey, enabled: boolean, metadata?: any) {
  await prisma.featureFlag.upsert({
    where: { userId_key: { userId, key } },
    create: { userId, key, enabled, metadata },
    update: { enabled, metadata },
  });
  flagCache.delete(`${userId}:${key}`);
}

export async function getAllFlags(userId: string): Promise<Record<FlagKey, { enabled: boolean; metadata: any }>> {
  const flags = await prisma.featureFlag.findMany({ where: { userId } });
  const result: any = {};
  for (const key of Object.values(FLAGS)) {
    const flag = flags.find(f => f.key === key);
    result[key] = {
      enabled: flag?.enabled ?? process.env[`FEATURE_${key.toUpperCase()}`] === 'true',
      metadata: flag?.metadata ?? {},
    };
  }
  return result;
}

export function clearFlagCache(userId?: string) {
  if (userId) {
    for (const key of Object.values(FLAGS)) {
      flagCache.delete(`${userId}:${key}`);
    }
  } else {
    flagCache.clear();
  }
}

export async function isEnabled(userId: string, key: FlagKey): Promise<boolean> {
  const { enabled } = await getFlag(userId, key);
  return enabled;
}