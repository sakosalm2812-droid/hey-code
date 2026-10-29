import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const GEMINI_VISION_MODEL = 'gemini-2.0-flash';
const VISION_PROMPT =
  'You are HEY\'s document vision module. Describe this image in 2-4 sentences for search indexing. ' +
  'Transcribe any visible text word-for-word. Return the description, then a line starting with TEXT: followed by any transcribed text (empty if none).';

function parseVisionResponse(raw: string): { description: string; transcribedText: string } {
  const textLine = raw.match(/TEXT:\s*([\s\S]*)/)?.[1]?.trim() ?? '';
  const description = raw.replace(/TEXT:[\s\S]*$/, '').trim();
  return { description, transcribedText: textLine };
}

async function understandImageWithGemini(mimeType: string, buffer: ArrayBuffer): Promise<string> {
  const base64 = Buffer.from(buffer).toString('base64');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_VISION_MODEL}:generateContent?key=${encodeURIComponent(
    process.env.GEMINI_API_KEY ?? ''
  )}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: VISION_PROMPT }, { inlineData: { mimeType, data: base64 } }],
        },
      ],
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Gemini vision failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  const data: any = await response.json();
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text ?? '')
      .join('') ?? ''
  );
}

const STOPWORDS = new Set(
  'a,an,and,are,as,at,be,by,for,from,has,he,in,is,it,its,of,on,that,the,to,was,were,will,with,you,your,we,our,this,these,those,but,not,or,so,if,then,than,can,could,should,would,do,does,did,have,had,i,me,my,they,them,their,what,which,who,when,where,how,all,any,both,each,few,more,most,other,some,such,only,own,same,too,very,just,about,into,over,under,again,further,once,there,here,why'
    .split(',')
);

const TEXT_MIME = ['text/plain', 'text/markdown', 'text/csv', 'application/json', 'application/xml', 'text/html'];

export function isTextMime(mimeType: string): boolean {
  return TEXT_MIME.includes(mimeType) || mimeType.startsWith('text/');
}

export function extractTextFromFile(mimeType: string, buffer: ArrayBuffer): string {
  if (!isTextMime(mimeType)) return '';
  try {
    return new TextDecoder('utf-8').decode(buffer).replace(/\u0000/g, '').trim();
  } catch {
    return '';
  }
}

/**
 * Extracts text from a PDF using pdf-parse. Returns '' when parsing fails.
 */
export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(Buffer.from(buffer));
    return String(data?.text ?? '').replace(/\u0000/g, '').trim();
  } catch {
    return '';
  }
}

export interface BinaryUnderstanding {
  text: string;
  summary: string;
  keywords: string[];
  confidence: number;
}

/**
 * Runs a vision-capable model over an image to extract visible text and a
 * description so binary uploads become searchable. Uses the free Gemini API
 * when GEMINI_API_KEY is set, otherwise OpenAI vision (OPENAI_API_KEY).
 * Returns null when no key is configured (the caller keeps the preview-only path).
 */
export async function understandImage(mimeType: string, buffer: ArrayBuffer, name: string): Promise<BinaryUnderstanding | null> {
  if (!mimeType.startsWith('image/')) return null;

  let raw = '';
  if (process.env.GEMINI_API_KEY) {
    try {
      raw = await understandImageWithGemini(mimeType, buffer);
    } catch {
      return null;
    }
  } else if (process.env.OPENAI_API_KEY) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const base64 = Buffer.from(buffer).toString('base64');
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: VISION_PROMPT },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            ],
          } as any,
        ],
      });
      raw = response.choices[0]?.message?.content || '';
    } catch {
      return null;
    }
  } else {
    return null;
  }

  const { description, transcribedText } = parseVisionResponse(raw);
  const text = [description, transcribedText].filter(Boolean).join('\n').trim();

  if (!text) return null;
  const keywords = extractKeywords(`${name} ${description} ${transcribedText}`);
  return {
    text,
    summary: description.slice(0, 240) || `Image "${name}" was stored (${mimeType}).`,
    keywords,
    confidence: 0.8,
  };
}

export function analyzeFile(text: string, name: string, mimeType: string): { summary: string; keywords: string[]; confidence: number } {
  const content = (text || '').trim();

  let summary = `Stored file "${name}" (${mimeType || 'unknown type'}).`;
  if (content) {
    const firstLines = content.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const firstMeaningful = firstLines.slice(0, 2).join(' ');
    if (firstMeaningful) summary = firstMeaningful.slice(0, 240);
  }

  const keywords = extractKeywords(content);

  let confidence = 0.5;
  if (content && content.length >= 20) confidence = 0.9;
  else if (mimeType.startsWith('image/')) confidence = 0.35;

  return { summary, keywords, confidence };
}

export function extractKeywords(text: string, limit = 8): string[] {
  const tokens = text.toLowerCase().split(/[^a-z0-9+#]+/).filter(Boolean);
  const counts = new Map<string, number>();
  for (const token of tokens) {
    if (token.length < 3 || STOPWORDS.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word);
}

export function rankFileMatches(text: string, term: string): number {
  const needle = term.toLowerCase().trim();
  if (!needle) return 0;
  const haystack = (text || '').toLowerCase();
  if (!haystack) return 0;

  let score = 0;
  const exactIndexes = Array.from(haystack.matchAll(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')));
  if (exactIndexes.length > 0) {
    score += 10 * Math.min(exactIndexes.length, 5);
    if (exactIndexes[0].index < 200) score += 5;
  }

  const words = needle.split(/\s+/).filter(Boolean);
  for (const word of words) {
    if (word.length < 3) continue;
    const occurrences = haystack.split(word).length - 1;
    if (occurrences > 0) score += 3 + Math.min(occurrences, 3);
  }

  return score;
}

export async function createProject(userId: string, data: { name: string; description?: string; color?: string }) {
  const name = (data.name || '').trim();
  if (!name) throw new Error('Project name is required');

  const existing = await prisma.project.findUnique({ where: { userId_name: { userId, name } } });
  if (existing) throw new Error('A project with this name already exists');

  return prisma.project.create({
    data: { userId, name: name.slice(0, 120), description: data.description?.slice(0, 500), color: data.color ?? '#6366f1' },
  });
}

export async function listProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { files: true } } },
  });
}

export async function deleteProject(userId: string, projectId: string) {
  return prisma.project.deleteMany({ where: { id: projectId, userId } });
}

export async function storeFileRecord(
  userId: string,
  data: {
    name: string;
    mimeType: string;
    size: number;
    storageUrl: string;
    text?: string;
    summary?: string;
    keywords?: string[];
    confidence?: number;
    projectId?: string | null;
  }
) {
  if (data.projectId) {
    const project = await prisma.project.findFirst({ where: { id: data.projectId, userId } });
    if (!project) throw new Error('Project not found');
  }

  return prisma.fileRecord.create({
    data: {
      userId,
      projectId: data.projectId ?? null,
      name: data.name.slice(0, 255),
      mimeType: data.mimeType.slice(0, 100),
      size: data.size,
      storageUrl: data.storageUrl.slice(0, 1000),
      text: data.text?.slice(0, 100000),
      summary: data.summary?.slice(0, 500),
      keywords: (data.keywords ?? []).slice(0, 20),
      confidence: data.confidence ?? 0.5,
      status: data.text ? 'LEARNED' : 'FAILED',
    },
  });
}

export async function listFiles(userId: string, opts?: { projectId?: string | null; search?: string }) {
  const records = await prisma.fileRecord.findMany({
    where: {
      userId,
      ...(opts?.projectId ? { projectId: opts.projectId } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    include: { project: { select: { id: true, name: true, color: true } } },
  });

  if (opts?.search?.trim()) {
    const term = opts.search.trim();
    return records
      .map((r) => ({ rank: rankFileMatches(`${r.name} ${r.text ?? ''} ${r.summary ?? ''} ${r.keywords.join(' ')}`, term), record: r }))
      .filter((entry) => entry.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .map((entry) => entry.record);
  }

  return records;
}

export async function searchFiles(userId: string, term: string, limit = 20) {
  const results = await listFiles(userId, { search: term });
  return results.slice(0, limit);
}

export async function getFileById(userId: string, fileId: string) {
  return prisma.fileRecord.findFirst({ where: { id: fileId, userId } });
}

export async function deleteFile(userId: string, fileId: string) {
  return prisma.fileRecord.deleteMany({ where: { id: fileId, userId } });
}