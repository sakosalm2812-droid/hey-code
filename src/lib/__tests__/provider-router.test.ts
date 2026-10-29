import { describe, expect, it, afterEach } from 'vitest';
import { MODEL_CONFIG } from '@/lib/ai';
import { ProviderAdapter, ProviderMessage, ProviderStreamChunk } from '@/lib/providers';
import {
  fallbackChain,
  availableTargets,
  streamChatWithFailover,
  completeWithFailover,
  isProviderHealthy,
  providerHealth,
  resetProviderHealth,
} from '@/lib/provider-router';

function fakeAdapter(
  id: 'openai' | 'anthropic',
  label: string,
  opts: { failStream?: boolean; failComplete?: boolean; partial?: string; complete?: string } = {}
): ProviderAdapter {
  return {
    id,
    label,
    isConfigured: true,
    async *stream(): AsyncGenerator<ProviderStreamChunk> {
      if (opts.failStream) throw new Error(`${label} down`);
      yield { text: opts.partial ?? '' };
      yield { usage: { inputTokens: 5, outputTokens: 3 } };
    },
    async complete() {
      if (opts.failComplete) throw new Error(`${label} down`);
      return { content: opts.complete ?? `${label} complete` };
    },
  };
}

afterEach(() => resetProviderHealth());

describe('fallback chains', () => {
  it('uses the primary provider model first', () => {
    const chain = fallbackChain('GPT_4O');
    expect(chain.length).toBeGreaterThanOrEqual(2);
    expect(chain[0]).toEqual({ providerId: 'openai', model: MODEL_CONFIG.GPT_4O.model });
    expect(chain[chain.length - 1].providerId).toBe('anthropic');
  });

  it('mirrors the chain for claude models', () => {
    const chain = fallbackChain('CLAUDE_3_OPUS');
    expect(chain[0]).toEqual({ providerId: 'anthropic', model: MODEL_CONFIG.CLAUDE_3_OPUS.model });
    expect(chain[chain.length - 1].providerId).toBe('openai');
  });

  it('falls back to a cheaper default model on the alternate provider', () => {
    const chain = fallbackChain('CLAUDE_3_OPUS');
    expect(chain[chain.length - 1].model).toBe(MODEL_CONFIG.GPT_4O_MINI.model);
  });
});

describe('availability', () => {
  it('only exposes configured providers', () => {
    const reg = {
      openai: fakeAdapter('openai', 'OpenAI'),
      anthropic: { ...fakeAdapter('anthropic', 'Anthropic'), isConfigured: false },
    } as any;
    const targets = availableTargets('GPT_4O', reg);
    expect(targets.map((t) => t.providerId)).toEqual(['openai']);
  });

  it('masks providers that become unhealthy', async () => {
    const bad = fakeAdapter('openai', 'OpenAI', { failStream: true });
    const reg = {
      openai: bad,
      anthropic: fakeAdapter('anthropic', 'Anthropic'),
    } as any;
    for (let i = 0; i < 3; i++) {
      // primary throws every time; fallback anthropic streams so the call still resolves
      await streamChatWithFailover([], 'GPT_4O', () => {}, () => {}, undefined, reg);
    }
    expect(isProviderHealthy('openai')).toBe(false);
    const filtered = availableTargets('GPT_4O', reg);
    expect(filtered.every((t) => t.providerId !== 'openai')).toBe(true);
    expect(isProviderHealthy('anthropic')).toBe(true);
  });
});

describe('failover streaming', () => {
  it('serves the fallback when the primary throws', async () => {
    const chunks: string[] = [];
    const failovers: Array<{ from: string; to: string }> = [];
    const reg = {
      openai: fakeAdapter('openai', 'OpenAI', { failStream: true }),
      anthropic: fakeAdapter('anthropic', 'Anthropic', { partial: 'fallback text' }),
    } as any;
    const result = await streamChatWithFailover(
      [{ role: 'user', content: 'hi' } as ProviderMessage],
      'GPT_4O',
      (c) => chunks.push(c),
      (from, to) => failovers.push({ from: from.providerId, to: to.providerId }),
      undefined,
      reg
    );
    expect(result.usedTarget.providerId).toBe('anthropic');
    expect(chunks.join('')).toBe('fallback text');
    expect(result.usage).toEqual({ inputTokens: 5, outputTokens: 3 });
    expect(failovers).toEqual([{ from: 'openai', to: 'anthropic' }]);
  });

  it('throws a clear error when nothing is configured', async () => {
    const reg = {
      openai: { ...fakeAdapter('openai', 'OpenAI'), isConfigured: false },
      anthropic: { ...fakeAdapter('anthropic', 'Anthropic'), isConfigured: false },
    } as any;
    await expect(streamChatWithFailover([], 'GPT_4O', () => {}, () => {}, undefined, reg)).rejects.toThrow(/not configured/);
  });

  it('rethrows abort errors', async () => {
    const abortish = new Error('stopped');
    abortish.name = 'AbortError';
    const reg = {
      openai: {
        ...fakeAdapter('openai', 'OpenAI'),
        stream: async function* stream(): AsyncGenerator<ProviderStreamChunk> {
          throw abortish;
        },
      },
      anthropic: fakeAdapter('anthropic', 'Anthropic'),
    } as any;
    const controller = new AbortController();
    controller.abort();
    await expect(
      streamChatWithFailover([], 'GPT_4O', () => {}, () => {}, { signal: controller.signal }, reg)
    ).rejects.toThrow('stopped');
  });
});

describe('failover completion', () => {
  it('completes via fallback', async () => {
    const reg = {
      openai: fakeAdapter('openai', 'OpenAI', { failComplete: true }),
      anthropic: fakeAdapter('anthropic', 'Anthropic', { complete: 'from anthropic' }),
    } as any;
    const result = await completeWithFailover([{ role: 'user', content: 'q' } as ProviderMessage], 'GPT_4O', 100, reg);
    expect(result.usedTarget.providerId).toBe('anthropic');
    expect(result.content).toBe('from anthropic');
  });

  it('rejects when nothing is available', async () => {
    const reg = {
      openai: { ...fakeAdapter('openai', 'OpenAI'), isConfigured: false },
      anthropic: { ...fakeAdapter('anthropic', 'Anthropic'), isConfigured: false },
    } as any;
    await expect(completeWithFailover([], 'GPT_4O', 100, reg)).rejects.toThrow(/not configured/);
  });
});

describe('health', () => {
  it('starts every provider healthy', () => {
    expect(providerHealth('openai')).toEqual({ healthy: true, failures: 0 });
    expect(providerHealth('anthropic')).toEqual({ healthy: true, failures: 0 });
  });
});