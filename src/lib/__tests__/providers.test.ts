import { describe, test, expect, vi } from 'vitest';
import { resolveProvider, listProviders, ProviderNotConfiguredError } from '@/lib/providers';

describe('provider registry', () => {
  test('registers all known providers', () => {
    const providers = listProviders();
    expect(providers.map(p => p.id).sort()).toEqual(['anthropic', 'gemini', 'groq', 'openai', 'openrouter']);
  });

  test('resolves openai and anthropic adapters', () => {
    expect(resolveProvider('openai').label).toBe('OpenAI');
    expect(resolveProvider('anthropic').label).toBe('Anthropic');
  });

  test('throws on unknown provider', () => {
    expect(() => resolveProvider('not-a-provider' as any)).toThrow('Unknown provider');
  });

  test('external setup providers throw ProviderNotConfiguredError when not configured', async () => {
    const provider = resolveProvider('openrouter');
    if (!provider.isConfigured) {
      await expect(
        provider.stream(
          [{ role: 'user', content: 'hi' }],
          'openai/gpt-4o'
        ).next()
      ).rejects.toBeInstanceOf(ProviderNotConfiguredError);
    }
  });
});