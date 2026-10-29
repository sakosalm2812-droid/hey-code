'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Newspaper, Search, ExternalLink, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  trustScore: number;
  trusted: boolean;
}

interface ResearchResult {
  query: string;
  sources: ResearchSource[];
  summary: string;
  citations: string[];
  extractive: boolean;
  needsSetup: boolean;
}

export default function ResearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResult | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (!res.ok) {
        let message = `Request failed with status ${res.status}`;
        try {
          const data = await res.json();
          message = data.error || message;
        } catch {}
        throw new Error(message);
      }
      const data = await res.json();
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Web Research
          </CardTitle>
          <CardDescription>
            Collect sources from the web, summarize them with citations, and flag untrusted content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={run} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Next.js App Router caching behavior 2026"
              aria-label="Research query"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Research
            </Button>
          </form>
          {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
        </CardContent>
      </Card>

      {result?.needsSetup && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p className="text-sm text-muted-foreground">{result.summary}</p>
          </CardContent>
        </Card>
      )}

      {result && !result.needsSetup && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{result.query}</CardTitle>
              {result.extractive && (
                <CardDescription className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Extractive fallback — live summarizer provider not configured.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{result.summary}</div>
              {result.citations.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Sources</p>
                  <ol className="space-y-1.5">
                    {result.citations.map((url, i) => (
                      <li key={url} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground min-w-4">{i + 1}.</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 break-all">
                          {url}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>

          {result.sources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Source confidence</CardTitle>
                <CardDescription>
                  Trust score reflects domain reputation; untrusted sources are isolated from instruction context.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.sources.map((s, i) => (
                  <div key={s.url} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
                        {i + 1}. {s.title}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{s.url}</p>
                      <p className="text-sm mt-1">{s.snippet}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', s.trusted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300')}>
                        {s.trusted ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {Math.round(s.trustScore * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}