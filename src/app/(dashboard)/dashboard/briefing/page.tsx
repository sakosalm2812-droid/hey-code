'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sunrise, ListChecks, Flame, BookOpenText } from 'lucide-react';

interface BriefingTask {
  id: string;
  title: string;
  priority: string;
}

interface Briefing {
  greeting: string;
  bullets: string[];
  focus: string[];
  timestamp: string;
  journalStreak: number;
  bestHabitStreak: number;
  tasks: { dueToday: BriefingTask[]; overdue: BriefingTask[] };
}

export default function BriefingPage() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/briefing');
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || 'Failed to load briefing');
        return;
      }
      setBriefing(body.briefing);
    } catch {
      setError('Failed to load briefing');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const priorityColor: Record<string, string> = {
    URGENT: 'text-red-600',
    HIGH: 'text-amber-600',
    MEDIUM: 'text-foreground',
    LOW: 'text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sunrise className="h-5 w-5" />
            {loading ? 'Loading briefing…' : briefing ? `${briefing.greeting} — here's your day` : 'Daily briefing'}
          </CardTitle>
          <CardDescription>Auto-generated from your tasks, journal, and habits.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Composing briefing…
            </div>
          ) : error || !briefing ? (
            <p className="text-sm text-destructive" role="alert">{error || 'No briefing'}</p>
          ) : (
            <div className="space-y-5">
              <ul className="space-y-2">
                {briefing.bullets.map((b, i) => (
                  <li key={i} className="text-sm">{b}</li>
                ))}
              </ul>

              <div className="rounded-lg bg-muted p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5" />
                  Focus for today
                </p>
                <ul className="space-y-1.5">
                  {briefing.focus.map((f, i) => (
                    <li key={i} className="text-sm font-medium">{i + 1}. {f}</li>
                  ))}
                </ul>
              </div>

              {briefing.tasks.overdue.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Overdue</p>
                  <ul className="space-y-1">
                    {briefing.tasks.overdue.map((t) => (
                      <li key={t.id} className="text-sm">
                        <span className={priorityColor[t.priority] ?? ''}>{t.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {briefing.tasks.dueToday.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Due today</p>
                  <ul className="space-y-1">
                    {briefing.tasks.dueToday.map((t) => (
                      <li key={t.id} className="text-sm">
                        <span className={priorityColor[t.priority] ?? ''}>{t.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Flame className="h-4 w-4" />
                  Habit best: {briefing.bestHabitStreak} day{briefing.bestHabitStreak === 1 ? '' : 's'}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpenText className="h-4 w-4" />
                  Journal streak: {briefing.journalStreak} day{briefing.journalStreak === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}