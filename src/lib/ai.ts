import { prisma } from '@/lib/prisma';
import { PLANS, PlanKey } from '@/lib/stripe';
import { resolveProvider } from '@/lib/providers';
import { streamChatWithFailover } from '@/lib/provider-router';

export interface StreamChatOptions {
  signal?: AbortSignal;
  onCancel?: (partialResponse: string) => Promise<void> | void;
}

export type ModelId = 'GPT_4O' | 'GPT_4O_MINI' | 'GPT_4_TURBO' | 'CLAUDE_3_OPUS' | 'CLAUDE_3_SONNET' | 'CLAUDE_3_HAIKU' | 'DEEPSEEK_FLASH';
export type ChatModel = ModelId;

export const MODEL_CONFIG: Record<ModelId, { provider: 'openai' | 'anthropic' | 'deepseek'; model: string; maxTokens: number; contextWindow: number }> = {
  GPT_4O: { provider: 'openai', model: 'gpt-4o', maxTokens: 4096, contextWindow: 128000 },
  GPT_4O_MINI: { provider: 'openai', model: 'gpt-4o-mini', maxTokens: 4096, contextWindow: 128000 },
  GPT_4_TURBO: { provider: 'openai', model: 'gpt-4-turbo', maxTokens: 4096, contextWindow: 128000 },
  CLAUDE_3_OPUS: { provider: 'anthropic', model: 'claude-3-opus-20240229', maxTokens: 4096, contextWindow: 200000 },
  CLAUDE_3_SONNET: { provider: 'anthropic', model: 'claude-3-sonnet-20240229', maxTokens: 4096, contextWindow: 200000 },
  CLAUDE_3_HAIKU: { provider: 'anthropic', model: 'claude-3-haiku-20240307', maxTokens: 4096, contextWindow: 200000 },
  DEEPSEEK_FLASH: { provider: 'deepseek', model: 'deepseek-flash', maxTokens: 4096, contextWindow: 128000 },
};

export async function checkRateLimit(userId: string, plan: PlanKey): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const usage = await prisma.usage.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, messagesCount: 0, tokensUsed: 0, apiCalls: 0 },
    update: {},
  });

  const planLimits = PLANS[plan].limits;
  if (planLimits.messages === -1) {
    return { allowed: true, remaining: -1, resetAt: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
  }

  const remaining = Math.max(0, planLimits.messages - usage.messagesCount);
  return { allowed: remaining > 0, remaining, resetAt: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
}

export async function incrementUsage(userId: string, tokens: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.usage.update({
    where: { userId_date: { userId, date: today } },
    data: { messagesCount: { increment: 1 }, tokensUsed: { increment: tokens } },
  });
}

export async function streamChat(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  modelId: ModelId,
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string, tokens: number) => Promise<void> | void,
  options?: StreamChatOptions
) {
  const config = MODEL_CONFIG[modelId];
  const { signal, onCancel } = options ?? {};
  let fullResponse = '';
  let totalTokens = 0;
  let isAborted = signal?.aborted ?? false;

  const markAborted = () => {
    isAborted = true;
  };
  signal?.addEventListener('abort', markAborted, { once: true });

  try {
    const adapter = resolveProvider(config.provider);
    for await (const chunk of adapter.stream(messages, config.model, { signal })) {
      if (isAborted) break;
      if (chunk.text) {
        fullResponse += chunk.text;
        onChunk(chunk.text);
      }
      if (chunk.usage) {
        totalTokens = chunk.usage.inputTokens + chunk.usage.outputTokens;
      }
    }
  } catch (error) {
    if (!isAborted) throw error;
  } finally {
    signal?.removeEventListener('abort', markAborted);
  }

  if (isAborted) {
    if (onCancel) await onCancel(fullResponse);
    return;
  }

  await onComplete(fullResponse, totalTokens);
}

export async function streamChatWithRouter(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  modelId: ModelId,
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string, tokens: number) => Promise<void> | void,
  options?: StreamChatOptions & { onFailover?: (from: { providerId: string; model: string }, to: { providerId: string; model: string }) => void }
) {
  const { signal, onCancel, onFailover } = options ?? {};
  let fullResponse = '';
  let totalTokens = 0;
  let isAborted = signal?.aborted ?? false;
  const markAborted = () => {
    isAborted = true;
  };
  signal?.addEventListener('abort', markAborted, { once: true });

  try {
    const result = await streamChatWithFailover(
      messages,
      modelId,
      (chunk) => {
        if (isAborted) return;
        fullResponse += chunk;
        onChunk(chunk);
      },
      onFailover,
      { signal }
    );
    if (result.usage) {
      totalTokens = result.usage.inputTokens + result.usage.outputTokens;
    }
  } catch (error) {
    if (!isAborted) throw error;
  } finally {
    signal?.removeEventListener('abort', markAborted);
  }

  if (isAborted) {
    if (onCancel) await onCancel(fullResponse);
    return;
  }

  await onComplete(fullResponse, totalTokens);
}

export async function generateTitle(firstMessage: string): Promise<string> {
  const adapter = resolveProvider('openai');
  const result = await adapter.complete(
    [
      { role: 'system', content: 'Generate a concise 3-5 word title for this conversation. No quotes, no punctuation.' },
      { role: 'user', content: firstMessage },
    ],
    'gpt-4o-mini',
    20
  );
  return result.content.trim() || 'New Chat';
}

export function getAvailableModels(plan: PlanKey): ModelId[] {
  return [...PLANS[plan].limits.models] as ModelId[];
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export type ContextMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export function buildContextMessages(
  messages: ContextMessage[],
  options: { systemPrompt?: string | null; modelId: ModelId }
): ContextMessage[] {
  const config = MODEL_CONFIG[options.modelId];
  const budget = Math.max(1000, config.contextWindow - config.maxTokens);

  const result: ContextMessage[] = [];
  let used = 0;

  if (options.systemPrompt && options.systemPrompt.trim()) {
    result.push({ role: 'system', content: options.systemPrompt });
    used += estimateTokens(options.systemPrompt);
  }

  const kept: ContextMessage[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const cost = estimateTokens(message.content || '');
    if (kept.length > 0 && used + cost > budget) break;
    used += cost;
    kept.unshift(message);
  }

  return [...result, ...kept];
}