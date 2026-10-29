'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface Insight {
  id: string;
  kind: string;
  title: string;
}

interface ThoughtResponse {
  thought: string;
  source: 'llm' | 'template';
  provider?: string;
}

export function HeyThoughtsPanel() {
  const [thought, setThought] = useState<ThoughtResponse | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      fetch('/api/thoughts').then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch('/api/proactive').then((r) => (r.ok ? r.json() : Promise.reject())),
    ]).then((results) => {
      if (cancelled) return;
      if (results[0].status === 'fulfilled') setThought((results[0] as PromiseFulfilledResult<any>).value);
      if (results[1].status === 'fulfilled') {
        const data = (results[1] as PromiseFulfilledResult<any>).value;
        setInsights(data.insights ?? []);
      }
      setLoading(false);
      if (results.every((r) => r.status === 'rejected')) setError(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Thinking…
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          Could not load HEY&apos;s thoughts.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="relative overflow-hidden">
        <CardContent className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">HEY&apos;s thought</h3>
            {thought?.source === 'llm' && thought.provider && (
              <span className="ml-auto rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground capitalize">
                {thought.provider}
              </span>
            )}
            {thought?.source === 'template' && (
              <span className="ml-auto rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                template — add a provider key
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{thought?.thought}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Proactive nudges</h3>
            <Link href="/dashboard/tasks" className="ml-auto text-xs text-primary hover:underline">
              Review
            </Link>
          </div>
          {insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing needs attention right now. Enjoy the quiet.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {insights.map((i) => (
                <li key={i.id} className="text-muted-foreground">
                  {i.title}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}