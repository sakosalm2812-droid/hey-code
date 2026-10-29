'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sunrise, ListChecks, Plus, BookOpenText, Target, Wrench } from 'lucide-react';

interface PlannerTask {
  id: string;
  title: string;
}

interface Planner {
  overdue: PlannerTask[];
  dueToday: PlannerTask[];
  completedToday: PlannerTask[];
  summary: { pending: number; focus: number };
}

interface Briefing {
  greeting: string;
  bullets: string[];
  focus: string[];
  journalStreak: number;
  bestHabitStreak: number;
  tasks: { overdue: PlannerTask[]; dueToday: PlannerTask[] };
}

export function TodayPanel() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [planner, setPlanner] = useState<Planner | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const results = await Promise.allSettled([
      fetch('/api/briefing').then((r) => (r.ok ? r.json() : Promise.reject(new Error(`briefing ${r.status}`)))),
      fetch('/api/planner').then((r) => (r.ok ? r.json() : Promise.reject(new Error(`planner ${r.status}`)))),
    ]);
    if (results[0].status === 'fulfilled') setBriefing((results[0] as PromiseFulfilledResult<any>).value.briefing);
    if (results[1].status === 'fulfilled') setPlanner((results[1] as PromiseFulfilledResult<any>).value.planner);
    if (results.every((r) => r.status === 'rejected')) setError('Could not load today\u2019s summary');
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dueTasks = planner?.dueToday ?? [];
  const overdueCount = planner?.overdue.length ?? 0;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        {error ? (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        ) : !briefing && !planner ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading today&apos;s plan…
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sunrise className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{briefing?.greeting ?? 'Today at a glance'}</h2>
              </div>
              <ul className="space-y-1.5 text-sm">
                {(briefing?.bullets ?? []).slice(0, 3).map((b, i) => (
                  <li key={i} className="text-muted-foreground">{b}</li>
                ))}
              </ul>
              {briefing && briefing.focus.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <ListChecks className="h-3.5 w-3.5" />
                    Focus
                  </span>
                  {briefing.focus.slice(0, 3).map((f, i) => (
                    <span key={i} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {f}
                    </span>
                  ))}
                </div>
              )}
              {!briefing && planner && (
                <p className="text-sm text-muted-foreground">
                  {planner.summary.focus} focus item{planner.summary.focus === 1 ? '' : 's'} · {planner.summary.pending} open tasks
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 lg:w-64">
              {overdueCount > 0 && (
                <Link href="/dashboard/tasks">
                  <Button variant="destructive" size="sm" className="w-full" type="button">
                    {overdueCount} overdue task{overdueCount === 1 ? '' : 's'} — review
                  </Button>
                </Link>
              )}
              <Link href="/dashboard/tasks?new=1" className="w-full">
                <Button variant="outline" size="sm" className="w-full gap-2" type="button">
                  <Plus className="h-4 w-4" />
                  Add task
                </Button>
              </Link>
              <Link href="/dashboard/journal?tab=journal" className="w-full">
                <Button variant="outline" size="sm" className="w-full gap-2" type="button">
                  <BookOpenText className="h-4 w-4" />
                  Write journal
                </Button>
              </Link>
              <Link href="/dashboard/journal?tab=habits" className="w-full">
                <Button variant="outline" size="sm" className="w-full gap-2" type="button">
                  <Target className="h-4 w-4" />
                  Habits · {briefing ? `${briefing.bestHabitStreak}d best` : ''}
                </Button>
              </Link>
              <Link href="/dashboard/briefing" className="w-full">
                <Button variant="ghost" size="sm" className="w-full gap-2" type="button">
                  <Wrench className="h-4 w-4" />
                  Full briefing
                </Button>
              </Link>
            </div>

            {dueTasks.length > 0 && (
              <div className="lg:col-span-2 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Due today</p>
                <div className="flex flex-wrap gap-2">
                  {dueTasks.map((t) => (
                    <Link key={t.id} href="/dashboard/tasks" className="text-sm">
                      <span className="rounded-md border border-border bg-muted/50 px-2 py-1 hover:bg-accent"> {t.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}