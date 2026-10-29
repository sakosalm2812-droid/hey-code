import OpenAI from 'openai';

export type ImageSize = '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
export type ImageQuality = 'standard' | 'hd';
export type ImageStyle = 'vivid' | 'natural';

export interface GenerateImageInput {
  prompt: string;
  size?: ImageSize;
  quality?: ImageQuality;
  style?: ImageStyle;
  model?: 'dall-e-2' | 'dall-e-3';
}

export interface GenerateImageResult {
  url: string;
  revisedPrompt?: string;
}

const GEMINI_IMAGE_MODEL = 'imagen-3.0-generate-002';

function geminiEndpoint(): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:predict?key=${encodeURIComponent(
    process.env.GEMINI_API_KEY ?? ''
  )}`;
}

function aspectRatioForSize(size: string): string {
  switch (size) {
    case '1792x1024':
      return '16:9';
    case '1024x1792':
      return '9:16';
    default:
      return '1:1';
  }
}

function dataUrlFromBase64(base64: string, mimeType = 'image/png'): string {
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Generates an image using the free Google Gemini (Imagen 3) API when a
 * GEMINI_API_KEY is configured, otherwise falls back to OpenAI DALL·E.
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageResult> {
  const prompt = input.prompt.trim();
  if (!prompt) throw new Error('Prompt is required.');
  if (prompt.length > 4000) throw new Error('Prompt too long (max 4000 characters).');

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const size = input.size ?? '1024x1024';
    const response = await fetch(geminiEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: aspectRatioForSize(size) },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Gemini image generation failed (${response.status}): ${detail.slice(0, 300)}`);
    }

    const data: any = await response.json();
    const base64 = data?.predictions?.[0]?.bytesBase64Encoded;
    if (!base64) throw new Error('No image generated.');

    return { url: dataUrlFromBase64(base64) };
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error(
      'Image generation requires a GEMINI_API_KEY (free) or OPENAI_API_KEY in your .env file. Add one and restart the dev server.'
    );
  }

  const model = input.model ?? 'dall-e-3';
  const size = input.size ?? '1024x1024';
  const quality = input.quality ?? 'standard';
  const style = input.style ?? 'vivid';

  const client = new OpenAI({ apiKey: openaiKey });
  const completion = await client.images.generate({
    model,
    prompt,
    size: size as any,
    quality: quality as any,
    style: style as any,
    n: 1,
    response_format: 'url',
  });

  const imageUrl = completion.data?.[0]?.url;
  if (!imageUrl) throw new Error('No image generated.');

  return {
    url: imageUrl,
    revisedPrompt: completion.data?.[0]?.revised_prompt ?? undefined,
  };
}

export function isImageGenerationConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
}