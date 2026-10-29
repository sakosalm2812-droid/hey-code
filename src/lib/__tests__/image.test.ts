import { describe, test, expect, vi, afterEach } from 'vitest';
import { generateImage, isImageGenerationConfigured } from '@/lib/image';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe('image generation (free Gemini / Imagen)', () => {
  test('isImageGenerationConfigured is true with a GEMINI_API_KEY', () => {
    process.env.GEMINI_API_KEY = 'gemini-test-key';
    process.env.OPENAI_API_KEY = '';
    expect(isImageGenerationConfigured()).toBe(true);
  });

  test('isImageGenerationConfigured is true with an OPENAI_API_KEY', () => {
    process.env.GEMINI_API_KEY = '';
    process.env.OPENAI_API_KEY = 'sk-test';
    expect(isImageGenerationConfigured()).toBe(true);
  });

  test('isImageGenerationConfigured is false without keys', () => {
    process.env.GEMINI_API_KEY = '';
    process.env.OPENAI_API_KEY = '';
    expect(isImageGenerationConfigured()).toBe(false);
  });

  test('generates via Gemini Imagen and returns a data URL', async () => {
    process.env.GEMINI_API_KEY = 'gemini-test-key';
    process.env.OPENAI_API_KEY = '';

    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ predictions: [{ bytesBase64Encoded: 'QUJD' }] }),
    });
    vi.stubGlobal('fetch', fakeFetch);

    const result = await generateImage({ prompt: 'a red apple' });
    expect(result.url).toBe('data:image/png;base64,QUJD');

    const [url, init] = fakeFetch.mock.calls[0];
    expect(String(url)).toContain('generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict');
    const body = JSON.parse(String(init.body));
    expect(body.instances[0].prompt).toBe('a red apple');
  });

  test('maps wide size to 16:9 aspect ratio', async () => {
    process.env.GEMINI_API_KEY = 'gemini-test-key';
    process.env.OPENAI_API_KEY = '';

    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ predictions: [{ bytesBase64Encoded: 'QUJD' }] }),
    });
    vi.stubGlobal('fetch', fakeFetch);

    await generateImage({ prompt: 'landscape', size: '1792x1024' });
    const body = JSON.parse(String(fakeFetch.mock.calls[0][1].body));
    expect(body.parameters.aspectRatio).toBe('16:9');
  });

  test('throws a clear setup error when no AI key is configured', async () => {
    process.env.GEMINI_API_KEY = '';
    process.env.OPENAI_API_KEY = '';
    await expect(generateImage({ prompt: 'hello' })).rejects.toThrow(/GEMINI_API_KEY/);
  });

  test('propagates Gemini API failures', async () => {
    process.env.GEMINI_API_KEY = 'gemini-test-key';
    process.env.OPENAI_API_KEY = '';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'rate limited',
      })
    );

    await expect(generateImage({ prompt: 'hello' })).rejects.toThrow(/Gemini image generation failed \(429\)/);
  });

  test('requires a prompt', async () => {
    process.env.GEMINI_API_KEY = 'gemini-test-key';
    await expect(generateImage({ prompt: '   ' })).rejects.toThrow('Prompt is required.');
  });
});