'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Zap, Activity, Gauge, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageWidgetsData {
  plan: string;
  limits: { messages: number; models: string[] };
  today: { messages: number; tokens: number; apiCalls: number };
  weekly: Array<{ date: string; messages: number; tokens: number }>;
  monthly: Array<{ date: string; messages: number; tokens: number }>;
  rateLimit: { allowed: boolean; remaining: number; resetAt: string };
}

const planLabels: Record<string, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  TEAM: 'Team',
  ENTERPRISE: 'Enterprise',
};

export function DashboardWidgets() {
  const [data, setData] = useState<UsageWidgetsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/usage', { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) {
          let message = `Failed to load usage (${res.status})`;
          try {
            const body = await res.json();
            if (body?.error) message = body.error;
          } catch {}
          throw new Error(message);
        }
        const body = await res.json();
        if (!cancelled) setData(body);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load usage');
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    {
      label: 'Messages today',
      value: data ? String(data.today.messages) : '—',
      icon: MessageSquare,
      sub: data ? `of ${data.limits.messages === -1 ? '∞' : data.limits.messages} on ${planLabels[data.plan] || data.plan}` : undefined,
    },
    {
      label: 'Tokens used today',
      value: data ? data.today.tokens.toLocaleString() : '—',
      icon: Zap,
    },
    {
      label: 'API calls today',
      value: data ? String(data.today.apiCalls) : '—',
      icon: Activity,
    },
    {
      label: 'Messages remaining',
      value: data
        ? data.limits.messages === -1
          ? '∞'
          : String(Math.max(0, data.rateLimit.remaining))
        : '—',
      icon: Gauge,
      sub: data?.rateLimit.allowed === false ? 'Limit reached' : undefined,
    },
  ];

  const maxWeekly = data ? Math.max(1, ...data.weekly.map(d => d.messages)) : 1;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-bold">{s.value}</p>
                {s.sub && <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" /> Last 7 days</CardTitle>
          <CardDescription>Messages sent per day</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-muted-foreground">{error}</p>
          ) : !data ? (
            <div className="flex h-20 items-end gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 bg-muted animate-pulse rounded-t" style={{ height: '40%' }} />
              ))}
            </div>
          ) : (
            <div className="flex h-20 items-end gap-1">
              {data.weekly.map((d, i) => (
                <div
                  key={i}
                  className="group relative flex-1 rounded-t bg-primary/20 transition-colors hover:bg-primary/50"
                  style={{ height: `${Math.max(6, (d.messages / maxWeekly) * 100)}%` }}
                >
                  <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-popover px-1.5 py-0.5 text-[10px] text-popover-foreground opacity-0 group-hover:opacity-100">
                    {d.messages} msgs
                  </div>
                </div>
              ))}
              <div className="sr-only">
                {data.weekly.map((d, i) => (
                  <span key={i}>{new Date(d.date).toISOString().slice(0, 10)}: {d.messages}</span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm">
        <div className={cn('flex-1 h-2 overflow-hidden rounded-full bg-muted')}>
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width:
                data && data.limits.messages !== -1
                  ? `${Math.min(100, ((data.today.messages) / Math.max(1, data.limits.messages)) * 100)}%`
                  : '0%',
            }}
          />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {data ? `${data.today.messages}/${data.limits.messages === -1 ? '∞' : data.limits.messages}` : '—'} messages
        </span>
        <Link href="/dashboard/billing" className="shrink-0 text-xs font-medium text-primary hover:underline">
          Upgrade
        </Link>
      </div>
    </div>
  );
}