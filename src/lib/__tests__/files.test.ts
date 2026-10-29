import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  isTextMime,
  extractTextFromFile,
  extractKeywords,
  analyzeFile,
  rankFileMatches,
  understandImage,
} from '@/lib/files';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

const encoder = new TextEncoder();

describe('text extraction', () => {
  it('decodes plain text buffers', () => {
    const text = 'hello world\nsecond line';
    expect(extractTextFromFile('text/plain', encoder.encode(text).buffer)).toBe(text);
  });

  it('decodes json buffers', () => {
    const json = '{"ok": true}';
    expect(extractTextFromFile('application/json', encoder.encode(json).buffer)).toBe(json);
  });

  it('returns empty for binary types (pdf, images)', () => {
    expect(extractTextFromFile('application/pdf', encoder.encode('%PDF-1.4').buffer)).toBe('');
    expect(extractTextFromFile('image/png', encoder.encode('PNG').buffer)).toBe('');
  });

  it('reports text mimes', () => {
    expect(isTextMime('text/markdown')).toBe(true);
    expect(isTextMime('application/json')).toBe(true);
    expect(isTextMime('application/pdf')).toBe(false);
  });
});

describe('keyword extraction', () => {
  it('extracts frequent non-stopword tokens', () => {
    const words = extractKeywords('the quick brown fox jumps over the lazy dog the the and and and');
    expect(words[0]).toBe('brown');
    expect(words).toContain('fox');
    expect(words).toContain('quick');
    expect(words).not.toContain('the');
    expect(words).not.toContain('and');
  });

  it('filters stopwords and short tokens', () => {
    const words = extractKeywords('a an or if to be hero');
    expect(words).not.toContain('a');
    expect(words).not.toContain('an');
    expect(words).not.toContain('or');
    expect(words).toContain('hero');
  });

  it('handles empty text', () => {
    expect(extractKeywords('')).toEqual([]);
  });
});

describe('file analysis', () => {
  it('builds a summary from the first meaningful lines', () => {
    const { summary, confidence, keywords } = analyzeFile('Alpha beta gamma delta.\nMore content here.', 'notes.txt', 'text/plain');
    expect(summary).toContain('Alpha beta gamma delta');
    expect(confidence).toBe(0.9);
    expect(keywords.length).toBeGreaterThan(0);
  });

  it('gives image files low confidence', () => {
    const { confidence } = analyzeFile('', 'photo.png', 'image/png');
    expect(confidence).toBe(0.35);
  });

  it('falls back to a stored-file summary when content is empty', () => {
    const { summary } = analyzeFile('', 'doc.md', 'text/markdown');
    expect(summary).toContain('doc.md');
  });
});

describe('file search ranking', () => {
  it('scores exact matches higher than no matches', () => {
    expect(rankFileMatches('nextjs caching revalidate path', 'caching')).toBeGreaterThan(0);
    expect(rankFileMatches('unrelated words here', 'caching')).toBe(0);
  });

  it('boosts matches near the start of content', () => {
    const nearStart = rankFileMatches('caching strategy notes here', 'caching');
    const farAway = rankFileMatches('x'.repeat(300) + ' caching', 'caching');
    expect(nearStart).toBeGreaterThan(farAway);
  });

  it('scores zero for empty term', () => {
    expect(rankFileMatches('anything', '   ')).toBe(0);
    expect(rankFileMatches('', 'term')).toBe(0);
  });
});

describe('understandImage (free Gemini vision)', () => {
  const pngBuffer = encoder.encode('fake-png').buffer;

  it('returns null for non-image mimes', async () => {
    process.env.GEMINI_API_KEY = 'gemini-test-key';
    expect(await understandImage('application/pdf', pngBuffer, 'doc.pdf')).toBeNull();
  });

  it('returns null when no key is configured', async () => {
    process.env.GEMINI_API_KEY = '';
    process.env.OPENAI_API_KEY = '';
    expect(await understandImage('image/png', pngBuffer, 'photo.png')).toBeNull();
  });

  it('extracts description and transcribed text via Gemini', async () => {
    process.env.GEMINI_API_KEY = 'gemini-test-key';
    process.env.OPENAI_API_KEY = '';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'A cat sleeping on a couch.\nTEXT: hello world' }] } }],
        }),
      })
    );

    const result = await understandImage('image/png', pngBuffer, 'cat.png');
    expect(result?.text).toContain('A cat sleeping on a couch.');
    expect(result?.text).toContain('hello world');
    expect(result?.keywords).toContain('cat');
  });

  it('returns null when Gemini vision call fails', async () => {
    process.env.GEMINI_API_KEY = 'gemini-test-key';
    process.env.OPENAI_API_KEY = '';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' })
    );
    expect(await understandImage('image/png', pngBuffer, 'cat.png')).toBeNull();
  });

  it('sends the image as inline base64 to the Gemini endpoint', async () => {
    process.env.GEMINI_API_KEY = 'gemini-test-key';
    process.env.OPENAI_API_KEY = '';
    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'TEXT: ok' }] } }] }),
    });
    vi.stubGlobal('fetch', fakeFetch);

    await understandImage('image/png', pngBuffer, 'cat.png');
    const [url, init] = fakeFetch.mock.calls[0];
    expect(String(url)).toContain(`models/gemini-2.0-flash:generateContent`);
    const body = JSON.parse(String(init.body));
    expect(body.contents[0].parts[1].inlineData.mimeType).toBe('image/png');
    expect(body.contents[0].parts[1].inlineData.data).toBe(Buffer.from(pngBuffer).toString('base64'));
  });
});