import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import OpenAI from 'openai';
import { auditLog } from '@/lib/audit';

const GROQ_TRANSCRIPTION_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_WHISPER_MODEL = 'whisper-large-v3';

/**
 * Transcribes audio using Groq's free Whisper endpoint when GROQ_API_KEY is
 * configured (whisper-large-v3 is free on Groq), otherwise OpenAI Whisper.
 */
async function transcribeWithGroq(audioFile: File): Promise<string> {
  const form = new FormData();
  form.append('model', GROQ_WHISPER_MODEL);
  form.append('file', audioFile);
  form.append('language', 'en');
  form.append('response_format', 'json');

  const response = await fetch(GROQ_TRANSCRIPTION_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Groq transcription failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const data: any = await response.json();
  if (!data?.text) throw new Error('No transcription returned.');
  return data.text as string;
}

async function transcribeWithOpenAI(audioFile: File): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'en',
    response_format: 'json',
  });
  return transcription.text;
}

interface TranscribeResult {
  text: string;
  provider: 'groq' | 'openai';
}

async function transcribe(audioFile: File): Promise<TranscribeResult> {
  if (process.env.GROQ_API_KEY) {
    const text = await transcribeWithGroq(audioFile);
    return { text, provider: 'groq' };
  }
  if (process.env.OPENAI_API_KEY) {
    const text = await transcribeWithOpenAI(audioFile);
    return { text, provider: 'openai' };
  }
  throw new Error('Voice transcription is not configured. Add a GROQ_API_KEY (free) or OPENAI_API_KEY to your .env file.');
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const rateLimit = await checkRateLimit(userId, { windowMs: 60 * 1000, maxRequests: 10, keyPrefix: 'voice' });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Voice rate limit exceeded' }, { status: 429 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio file too large (max 25MB)' }, { status: 400 });
    }

    const { text, provider } = await transcribe(audioFile);

    await auditLog(userId, 'VOICE_TRANSCRIPTION', 'voice', {
      duration: audioFile.size,
      textLength: text.length,
      provider,
    }, request);

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Voice transcription error:', error);
    const message = error instanceof Error ? error.message : 'Transcription failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}