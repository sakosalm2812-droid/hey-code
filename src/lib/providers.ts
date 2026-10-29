import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export type ProviderId = 'openai' | 'anthropic' | 'openrouter' | 'gemini' | 'groq' | 'deepseek';

export interface ModelConfig {
  provider: ProviderId;
  model: string;
  maxTokens: number;
  contextWindow: number;
}

export interface ProviderStreamChunk {
  text?: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export type ProviderMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export interface StreamRequestOptions {
  signal?: AbortSignal;
}

export interface ProviderAdapter {
  id: ProviderId;
  label: string;
  isConfigured: boolean;
  stream(
    messages: ProviderMessage[],
    model: string,
    options?: StreamRequestOptions
  ): AsyncGenerator<ProviderStreamChunk>;
  complete(
    messages: ProviderMessage[],
    model: string,
    maxTokens: number
  ): Promise<{ content: string; usage?: { inputTokens: number; outputTokens: number } }>;
}

export class ProviderNotConfiguredError extends Error {
  constructor(providerId: string, label: string) {
    super(`${label} provider is not configured. Add ${providerId.toUpperCase()}_API_KEY to your .env file.`);
    this.name = 'ProviderNotConfiguredError';
  }
}

class OpenAISDKAdapter implements ProviderAdapter {
  id = 'openai' as const;
  label = 'OpenAI';
  isConfigured = Boolean(process.env.OPENAI_API_KEY);
  private _sdk: OpenAI | null = null;

  private get sdk(): OpenAI {
    if (!this.isConfigured) throw new ProviderNotConfiguredError(this.id, this.label);
    if (!this._sdk) {
      this._sdk = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return this._sdk;
  }

  async *stream(messages: ProviderMessage[], model: string, options?: StreamRequestOptions): AsyncGenerator<ProviderStreamChunk> {
    const stream = await this.sdk.chat.completions.create({
      model,
      messages: messages as any,
      stream: true,
      ...(options && options.signal ? { signal: options.signal } : {}),
    });
    let inputTokens = 0;
    let outputTokens = 0;
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens ?? 0;
        outputTokens = chunk.usage.completion_tokens ?? 0;
      }
      yield { text, usage: { inputTokens, outputTokens } };
    }
  }

  async complete(messages: ProviderMessage[], model: string, maxTokens: number) {
    if (!this.isConfigured) throw new ProviderNotConfiguredError(this.id, this.label);
    const completion = await this.sdk.chat.completions.create({
      model,
      messages: messages as any,
      max_tokens: maxTokens,
      temperature: 0.7,
    });
    return {
      content: completion.choices[0]?.message?.content || '',
      usage: {
        inputTokens: completion.usage?.prompt_tokens ?? 0,
        outputTokens: completion.usage?.completion_tokens ?? 0,
      },
    };
  }
}

class AnthropicAdapter implements ProviderAdapter {
  id = 'anthropic' as const;
  label = 'Anthropic';
  isConfigured = Boolean(process.env.ANTHROPIC_API_KEY);
  private _sdk: Anthropic | null = null;

  private get sdk(): Anthropic {
    if (!this.isConfigured) throw new ProviderNotConfiguredError(this.id, this.label);
    if (!this._sdk) {
      this._sdk = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return this._sdk;
  }

  async *stream(messages: ProviderMessage[], model: string, options?: StreamRequestOptions): AsyncGenerator<ProviderStreamChunk> {
    const stream = await this.sdk.messages.create({
      model,
      messages: messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
      system: messages.find(m => m.role === 'system')?.content,
      max_tokens: 4096,
      temperature: 0.7,
      stream: true,
      ...(options && options.signal ? { signal: options.signal } : {}),
    });
    let inputTokens = 0;
    let outputTokens = 0;
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield { text: chunk.delta.text };
      }
      if (chunk.type === 'message_delta' && chunk.usage) {
        inputTokens = chunk.usage.input_tokens ?? 0;
        outputTokens = chunk.usage.output_tokens ?? 0;
      }
    }
    if (inputTokens || outputTokens) {
      yield { usage: { inputTokens, outputTokens } };
    }
  }

  async complete(messages: ProviderMessage[], model: string, maxTokens: number) {
    if (!this.isConfigured) throw new ProviderNotConfiguredError(this.id, this.label);
    const response = await this.sdk.messages.create({
      model,
      messages: messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
      system: messages.find(m => m.role === 'system')?.content,
      max_tokens: maxTokens,
      temperature: 0.7,
    });
    return {
      content: response.content
        .filter(b => b.type === 'text')
        .map(b => (b as { text?: string }).text || '')
        .join(''),
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}

// Streaming of OpenAI-compatible (NDJSON SSE) chat completion endpoints
// (OpenRouter and Groq both implement this wire format).
async function* openAiCompatStream(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  signal?: AbortSignal
): AsyncGenerator<ProviderStreamChunk> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Provider request failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') return;
        let parsed: any;
        try {
          parsed = JSON.parse(payload);
        } catch {
          continue;
        }
        const text = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content || '';
        if (parsed.usage) {
          inputTokens = parsed.usage.prompt_tokens ?? 0;
          outputTokens = parsed.usage.completion_tokens ?? 0;
        }
        if (text) {
          yield { text, usage: { inputTokens, outputTokens } };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function openAiCompatComplete(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>
): Promise<{ content: string; usage: { inputTokens: number; outputTokens: number } }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Provider request failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  const data: any = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: {
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    },
  };
}

function chatBody(messages: ProviderMessage[], model: string, maxTokens: number, stream: boolean): Record<string, unknown> {
  return {
    model,
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
    stream,
  };
}

class OpenRouterAdapter implements ProviderAdapter {
  id = 'openrouter' as const;
  label = 'OpenRouter';
  isConfigured = Boolean(process.env.OPENROUTER_API_KEY);

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'HEY',
    };
  }

  async *stream(messages: ProviderMessage[], model: string, options?: StreamRequestOptions): AsyncGenerator<ProviderStreamChunk> {
    if (!this.isConfigured) throw new ProviderNotConfiguredError(this.id, this.label);
    yield* openAiCompatStream(
      'https://openrouter.ai/api/v1/chat/completions',
      this.headers(),
      chatBody(messages, model, 4096, true),
      options?.signal
    );
  }

  async complete(messages: ProviderMessage[], model: string, maxTokens: number) {
    if (!this.isConfigured) throw new ProviderNotConfiguredError(this.id, this.label);
    return openAiCompatComplete(
      'https://openrouter.ai/api/v1/chat/completions',
      this.headers(),
      chatBody(messages, model, maxTokens, false)
    );
  }
}

class GroqAdapter implements ProviderAdapter {
  id = 'groq' as const;
  label = 'Groq';
  isConfigured = Boolean(process.env.GROQ_API_KEY);

  private headers(): Record<string, string> {
    return { Authorization: `Bearer ${process.env.GROQ_API_KEY}` };
  }

  async *stream(messages: ProviderMessage[], model: string, options?: StreamRequestOptions): AsyncGenerator<ProviderStreamChunk> {
    if (!this.isConfigured) throw new ProviderNotConfiguredError(this.id, this.label);
    yield* openAiCompatStream(
      'https://api.groq.com/openai/v1/chat/completions',
      this.headers(),
      chatBody(messages, model, 4096, true),
      options?.signal
    );
  }

  async complete(messages: ProviderMessage[], model: string, maxTokens: number) {
    if (!this.isConfigured) throw new ProviderNotConfiguredError(this.id, this.label);
    return openAiCompatComplete(
      'https://api.groq.com/openai/v1/chat/completions',
      this.headers(),
      chatBody(messages, model, maxTokens, false)
    );
  }
}

class DeepSeekAdapter implements ProviderAdapter {
  id = 'deepseek' as const;
  label = 'DeepSeek';
  isConfigured = Boolean(process.env.DEEPSEEK_API_KEY);

  private headers(): Record<string, string> {
    return { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` };
  }

  async *stream(messages: ProviderMessage[], model: string, options?: StreamRequestOptions): AsyncGenerator<ProviderStreamChunk> {
    if (!this.isConfigured) throw new ProviderNotConfiguredError(this.id, this.label);
    yield* openAiCompatStream(
      'https://api.deepseek.com/v1/chat/completions',
      this.headers(),
      chatBody(messages, model, 4096, true),
      options?.signal
    );
  }

  async complete(messages: ProviderMessage[], model: string, maxTokens: number) {
    if (!this.isConfigured) throw new ProviderNotConfiguredError(this.id, this.label);
    return openAiCompatComplete(
      'https://api.deepseek.com/v1/chat/completions',
      this.headers(),
      chatBody(messages, model, maxTokens, false)
    );
  }
}

// Gemini streams Server-Sent Events framed as `data: {"candidates": [...]}`.
async function* geminiStream(
  url: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): AsyncGenerator<ProviderStreamChunk> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Gemini request failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload) continue;
        let parsed: any;
        try {
          parsed = JSON.parse(payload);
        } catch {
          continue;
        }
        const text = parsed.candidates?.[0]?.content?.parts
          ?.map((part: any) => part?.text || '')
          .join('') || '';
        if (parsed.usageMetadata) {
          inputTokens = parsed.usageMetadata.promptTokenCount ?? 0;
          outputTokens = parsed.usageMetadata.candidatesTokenCount ?? 0;
        }
        if (text) {
          yield { text, usage: { inputTokens, outputTokens } };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function geminiBody(messages: ProviderMessage[], maxTokens: number): Record<string, unknown> {
  const system = messages.find(m => m.role === 'system')?.content;
  return {
    contents: messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
  };
}

class GeminiAdapter implements ProviderAdapter {
  id = 'gemini' as const;
  label = 'Google Gemini';
  isConfigured = Boolean(process.env.GEMINI_API_KEY);

  async *stream(messages: ProviderMessage[], model: string, options?: StreamRequestOptions): AsyncGenerator<ProviderStreamChunk> {
    if (!this.isConfigured) throw new ProviderNotConfiguredError(this.id, this.label);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(process.env.GEMINI_API_KEY!)}`;
    yield* geminiStream(url, geminiBody(messages, 4096), options?.signal);
  }

  async complete(messages: ProviderMessage[], model: string, maxTokens: number) {
    if (!this.isConfigured) throw new ProviderNotConfiguredError(this.id, this.label);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY!)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody(messages, maxTokens)),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Gemini request failed (${response.status}): ${detail.slice(0, 300)}`);
    }
    const data: any = await response.json();
    return {
      content:
        data.candidates?.[0]?.content?.parts
          ?.map((part: any) => part?.text || '')
          .join('') || '',
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  }
}

/**
 * Default model slug used per provider when it appears as a FALLBACK target
 * in the router's failure chain. Primary chat models keep their MODEL_CONFIG
 * mapping; these slugs are consumed directly by the adapters above.
 */
export const PROVIDER_DEFAULT_MODELS: Record<ProviderId, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-haiku-20240307',
  openrouter: 'meta-llama/llama-3.3-70b-instruct:free',
  gemini: 'gemini-1.5-flash',
  groq: 'llama-3.3-70b-versatile',
  deepseek: 'deepseek-flash',
};

const openaiAdapter = new OpenAISDKAdapter();
const anthropicAdapter = new AnthropicAdapter();
const groqAdapter = new GroqAdapter();
const deepseekAdapter = new DeepSeekAdapter();

export const PROVIDERS: Record<ProviderId, ProviderAdapter> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  openrouter: new OpenRouterAdapter(),
  gemini: new GeminiAdapter(),
  groq: groqAdapter,
  deepseek: deepseekAdapter,
};

export function resolveProvider(providerId: ProviderId): ProviderAdapter {
  const adapter = PROVIDERS[providerId];
  if (!adapter) throw new Error(`Unknown provider: ${providerId}`);
  return adapter;
}

export function listProviders(): Array<{ id: ProviderId; label: string; isConfigured: boolean }> {
  return Object.values(PROVIDERS).map(({ id, label, isConfigured }) => ({ id, label, isConfigured }));
}