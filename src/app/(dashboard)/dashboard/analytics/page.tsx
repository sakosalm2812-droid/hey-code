'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, BarChart3, MessageSquare, MessagesSquare, Coins, Target, BookOpenText, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Bucket {
  date: string;
  count: number;
}

interface Analytics {
  window: string[];
  messagesPerDay: Bucket[];
  tokensPerDay: Bucket[];
  journalPerDay: Bucket[];
  totals: {
    messages: number;
    chats: number;
    tokens: number;
    journalEntries: number;
    completionRate: number;
  };
  taskBreakdown: {
    byStatus: Array<{ label: string; count: number }>;
    completed: number;
    pending: number;
  };
  topModels: Array<{ label: string; count: number }>;
  maxMessages: number;
  maxJournal: number;
  recentChats: Array<{ id: string; title: string; createdAt: string }>;
}

function BarChart({ buckets, max }: { buckets: Bucket[]; max: number }) {
  const peak = Math.max(1, max);
  return (
    <div className="flex items-end gap-1 h-32">
      {buckets.map((b) => (
        <div key={b.date} className="flex-1 flex flex-col items-center gap-1" title={`${b.date.slice(0, 10)}: ${b.count}`}>
          <span className="text-[10px] text-muted-foreground">{b.count}</span>
          <div
            className={cn('w-full rounded-t bg-primary/70', b.count === 0 && 'bg-muted')}
            style={{ height: `${Math.max(4, (b.count / peak) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics');
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || 'Failed to load analytics');
        return;
      }
      setData(body);
    } catch {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading analytics…
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-destructive" role="alert">{error || 'No data'}</p>;
  }

  const stats = [
    { label: 'Messages', value: data.totals.messages.toLocaleString(), icon: MessageSquare },
    { label: 'Chats', value: data.totals.chats.toLocaleString(), icon: MessagesSquare },
    { label: 'Tokens used', value: data.totals.tokens.toLocaleString(), icon: Coins },
    { label: 'Journal entries', value: data.totals.journalEntries.toLocaleString(), icon: BookOpenText },
    { label: 'Task completion', value: `${data.totals.completionRate}%`, icon: Target },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        <h1 className="text-xl font-semibold">Analytics</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <s.icon className="h-4 w-4" />
                <span className="text-sm">{s.label}</span>
              </div>
              <p className="text-2xl font-semibold mt-2">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Messages per day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart buckets={data.messagesPerDay} max={data.maxMessages} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <BookOpenText className="h-4 w-4" />
              Journal entries per day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart buckets={data.journalPerDay} max={data.maxJournal} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tasks by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.taskBreakdown.byStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks.</p>
            ) : (
              data.taskBreakdown.byStatus.map((t) => (
                <div key={t.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t.label.replace('_', ' ').toLowerCase()}</span>
                  <span className="font-medium">{t.count}</span>
                </div>
              ))
            )}
            <div className="flex items-center justify-between text-sm border-t pt-2 mt-2">
              <span className="text-muted-foreground">Completion rate</span>
              <span className="font-medium">{data.totals.completionRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top models</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topModels.length === 0 ? (
              <p className="text-sm text-muted-foreground">No model usage yet.</p>
            ) : (
              data.topModels.map((m) => (
                <div key={m.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate">{m.label}</span>
                  <span className="font-medium">{m.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent chats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentChats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No chats yet.</p>
            ) : (
              data.recentChats.map((c) => (
                <p key={c.id} className="text-sm truncate">
                  {c.title || 'Untitled'} <span className="text-xs text-muted-foreground">· {new Date(c.createdAt).toLocaleDateString()}</span>
                </p>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}