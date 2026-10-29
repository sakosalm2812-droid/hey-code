import { MODEL_CONFIG, ModelId } from '@/lib/ai';
import {
  PROVIDERS,
  PROVIDER_DEFAULT_MODELS,
  resolveProvider,
  ProviderId,
  ProviderAdapter,
  ProviderMessage,
  ProviderStreamChunk,
  StreamRequestOptions,
} from '@/lib/providers';

export interface RouteTarget {
  providerId: ProviderId;
  model: string;
}

export interface HealthState {
  healthy: boolean;
  failures: number;
  lastErrorAt?: number;
}

const FALLBACK_CHAINS: Record<ModelId, ProviderId[]> = {
  GPT_4O: ['openai', 'openrouter', 'groq', 'deepseek', 'anthropic'],
  GPT_4O_MINI: ['openai', 'openrouter', 'groq', 'deepseek', 'gemini', 'anthropic'],
  GPT_4_TURBO: ['openai', 'openrouter', 'deepseek', 'anthropic'],
  CLAUDE_3_OPUS: ['anthropic', 'openrouter', 'deepseek', 'openai'],
  CLAUDE_3_SONNET: ['anthropic', 'openrouter', 'deepseek', 'gemini', 'openai'],
  CLAUDE_3_HAIKU: ['anthropic', 'groq', 'deepseek', 'openrouter', 'openai'],
  DEEPSEEK_FLASH: ['deepseek', 'groq', 'openrouter', 'gemini', 'anthropic'],
};

const health = new Map<ProviderId, HealthState>();
const MAX_CONSECUTIVE_FAILURES = 3;
const COOLDOWN_MS = 60_000;

function bump(providerId: ProviderId, failed: boolean) {
  const state = health.get(providerId) ?? { healthy: true, failures: 0 };
  if (failed) {
    state.failures += 1;
    state.lastErrorAt = Date.now();
    state.healthy = state.failures < MAX_CONSECUTIVE_FAILURES;
  } else {
    state.failures = 0;
    state.healthy = true;
    state.lastErrorAt = undefined;
  }
  health.set(providerId, state);
}

export function providerHealth(providerId: ProviderId): HealthState {
  const state = health.get(providerId);
  if (!state || !state.healthy) {
    if (state && state.lastErrorAt && Date.now() - state.lastErrorAt >= COOLDOWN_MS) {
      bump(providerId, false);
      return { healthy: true, failures: 0 };
    }
    return state ?? { healthy: true, failures: 0 };
  }
  return state;
}

export function isProviderHealthy(providerId: ProviderId): boolean {
  return providerHealth(providerId).healthy;
}

type Registry = typeof PROVIDERS;

export function fallbackChain(modelId: ModelId): RouteTarget[] {
  const primary = MODEL_CONFIG[modelId];
  const chain = FALLBACK_CHAINS[modelId] ?? [primary.provider];
  const targets: RouteTarget[] = [];
  for (let i = 0; i < chain.length; i++) {
    const providerId = chain[i];
    if (i === 0) {
      targets.push({ providerId, model: primary.model });
      continue;
    }
    targets.push({ providerId, model: PROVIDER_DEFAULT_MODELS[providerId] });
  }
  return targets;
}

export function availableTargets(modelId: ModelId, registry: Registry = PROVIDERS): RouteTarget[] {
  return fallbackChain(modelId).filter((t) => {
    const adapter = registry[t.providerId];
    return adapter && adapter.isConfigured && isProviderHealthy(t.providerId);
  });
}

export async function streamChatWithFailover(
  messages: ProviderMessage[],
  modelId: ModelId,
  onChunk: (chunk: string) => void,
  onFailover: (from: RouteTarget, to: RouteTarget) => void = () => {},
  options?: StreamRequestOptions,
  registry: Registry = PROVIDERS
): Promise<{ usedTarget: RouteTarget; usage?: { inputTokens: number; outputTokens: number }; fullResponse: string }> {
  const targets = availableTargets(modelId, registry);
  if (targets.length === 0) {
    const chain = fallbackChain(modelId);
    const adapter = registry[chain[0].providerId];
    throw adapter && adapter.isConfigured
      ? new Error('All providers are currently unhealthy; retry shortly.')
      : new Error(`Provider "${chain[0].providerId}" is not configured.`);
  }

  let lastError: unknown = null;
  let fullResponse = '';
  let usage: { inputTokens: number; outputTokens: number } | undefined;

  for (const target of targets) {
    try {
      const adapter = registry[target.providerId];
      for await (const chunk of adapter.stream(messages, target.model, { signal: options?.signal })) {
        if (chunk.text) {
          fullResponse += chunk.text;
          onChunk(chunk.text);
        }
        if (chunk.usage) {
          usage = chunk.usage;
        }
      }
      bump(target.providerId, false);
      return { usedTarget: target, usage, fullResponse };
    } catch (error: any) {
      if (error?.name === 'AbortError' || options?.signal?.aborted) {
        throw error;
      }
      bump(target.providerId, true);
      lastError = error;
      const next = targets[targets.indexOf(target) + 1];
      if (next) onFailover(target, next);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Provider stream failed');
}

export function completeWithFailover(
  messages: ProviderMessage[],
  modelId: ModelId,
  maxTokens: number,
  registry: Registry = PROVIDERS
): Promise<{ usedTarget: RouteTarget; content: string }> {
  const targets = availableTargets(modelId, registry);
  if (targets.length === 0) {
    const chain = fallbackChain(modelId);
    const adapter = registry[chain[0].providerId];
    return Promise.reject(
      adapter && adapter.isConfigured
        ? new Error('All providers are currently unhealthy; retry shortly.')
        : new Error(`Provider "${chain[0].providerId}" is not configured.`)
    );
  }

  const tryTargets = async (index: number): Promise<{ usedTarget: RouteTarget; content: string }> => {
    const target = targets[index];
    if (!target) return Promise.reject(new Error('Provider stream failed'));
    try {
      const adapter = registry[target.providerId];
      const result = await adapter.complete(messages, target.model, maxTokens);
      bump(target.providerId, false);
      return { usedTarget: target, content: result.content };
    } catch (error: unknown) {
      bump(target.providerId, true);
      return tryTargets(index + 1);
    }
  };

  return tryTargets(0);
}

export function listRouteTargets(modelId: ModelId, registry: Registry = PROVIDERS) {
  return fallbackChain(modelId).map((t) => ({
    ...t,
    configured: Boolean(registry[t.providerId]?.isConfigured),
    healthy: isProviderHealthy(t.providerId),
  }));
}

export function resetProviderHealth(): void {
  health.clear();
}

export function providerAdapterFor(providerId: ProviderId): ProviderAdapter {
  return resolveProvider(providerId);
}