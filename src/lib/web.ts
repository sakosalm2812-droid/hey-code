/**
 * Web sources for HEY: SerpAPI-backed web search and a safe URL fetcher.
 * Both fail fast with a clear "requires setup" signal when the key is missing,
 * and return sanitized, prompt-injection-resistant text when it is present.
 */

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export class WebSetupRequiredError extends Error {
  constructor(message = 'Web search requires a SERP_API_KEY in your .env file.') {
    super(message);
    this.name = 'WebSetupRequiredError';
  }
}

const MAX_PAGE_BYTES = 300_000;
const REQUEST_TIMEOUT_MS = 15_000;

function sanitizeHtmlToText(html: string): string {
  if (!html) return '';
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const text = withoutScripts
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|pre|blockquote|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 5000);
}

/**
 * Performs a SerpAPI Google search. Requires SERP_API_KEY.
 */
export async function searchWeb(query: string, limit = 8): Promise<WebSearchResult[]> {
  const key = process.env.SERP_API_KEY;
  if (!key) throw new WebSetupRequiredError();
  if (!query || !query.trim()) return [];

  const params = new URLSearchParams({ engine: 'google', q: query.trim(), num: String(limit), api_key: key });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`SerpAPI request failed (${res.status}).`);
    }
    const data = await res.json();
    const organic = Array.isArray(data.organic_results) ? data.organic_results : [];
    return organic
      .filter((r: any) => r?.link && r?.title)
      .slice(0, limit)
      .map((r: any) => {
        let url = String(r.link);
        try {
          url = new URL(url).toString();
        } catch {}
        return { title: String(r.title || 'Untitled'), url, snippet: String(r.snippet || '').trim() };
      });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches a single URL and converts meaningful page text to plain text.
 * HTML-only extraction (no JS). Requires no API key.
 */
export async function fetchUrlText(url: string): Promise<{ title: string; text: string }> {
  const parsed = new URL(url);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error('Only http(s) URLs are supported.');
  if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '0.0.0.0') {
    throw new Error('Local addresses are not allowed.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HEY-Bot/1.0; +https://hey.ai)',
        Accept: 'text/html,text/plain,*/*',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Fetch failed (${res.status}).`);
    const contentType = res.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');
    const buffer = await res.arrayBuffer();
    const size = buffer.byteLength;
    if (size > MAX_PAGE_BYTES) throw new Error('Page is too large to fetch.');
    const raw = new TextDecoder('utf-8').decode(buffer).replace(/\u0000/g, '');

    let text: string;
    let title = parsed.hostname;
    if (isHtml) {
      const titleMatch = raw.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch?.[1]) title = titleMatch[1].trim().slice(0, 200);
      text = sanitizeHtmlToText(raw);
    } else {
      text = raw.slice(0, 5000);
    }
    return { title, text };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches and summarizes a single URL into a compact, source-attributed text block.
 */
export async function fetchUrlForAgent(url: string): Promise<string> {
  const { title, text } = await fetchUrlText(url);
  const clipped = text.trim();
  if (!clipped) return `[web_fetch] ${url} (${title}) — page returned no readable text.`;
  return `[web_fetch] ${url} (${title})\n${clipped.slice(0, 4000)}`;
}