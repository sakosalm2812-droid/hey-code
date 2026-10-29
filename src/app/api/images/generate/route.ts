import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit';
import { generateImage, isImageGenerationConfigured, ImageSize } from '@/lib/image';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    const plan = subscription?.plan || 'FREE';

    if (plan === 'FREE') {
      return NextResponse.json({ error: 'Image generation requires Pro plan or higher' }, { status: 403 });
    }

    const rateLimit = await checkRateLimit(userId, { windowMs: 60 * 1000, maxRequests: 5, keyPrefix: 'images' });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Image generation rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = body;

    if (!prompt || prompt.trim().length < 3) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!isImageGenerationConfigured()) {
      return NextResponse.json(
        {
          error:
            'Image generation is not configured. Add a GEMINI_API_KEY (free) or OPENAI_API_KEY to your .env file (see KEYS.md), then restart the dev server.',
          requiresSetup: true,
        },
        { status: 503 }
      );
    }

    const validSizes = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];
    if (!validSizes.includes(size)) {
      return NextResponse.json({ error: 'Invalid size' }, { status: 400 });
    }

    const result = await generateImage({
      prompt: prompt.trim(),
      size: size as ImageSize,
      quality: quality === 'hd' ? 'hd' : 'standard',
      style: style === 'natural' ? 'natural' : 'vivid',
    });

    await auditLog(
      userId,
      'IMAGE_GENERATION',
      'image',
      { prompt: prompt.trim(), size, quality, style, revisedPrompt: result.revisedPrompt ?? undefined },
      request
    );

    return NextResponse.json({ url: result.url, revised_prompt: result.revisedPrompt });
  } catch (error) {
    console.error('Image generation error:', error);
    const message = error instanceof Error ? error.message : 'Image generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}