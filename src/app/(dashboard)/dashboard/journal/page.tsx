'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpenText, Target, Flame, Plus, Trash2, Loader2, CheckCircle2, RotateCcw, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { moodEmoji } from '@/lib/life';

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  tags: string[];
  date: string;
}

interface Goal {
  id: string;
  title: string;
  targetDate: string | null;
  status: string;
  progress: number;
}

interface Habit {
  id: string;
  name: string;
  frequency: string;
  streak: number;
  lastDoneAt: string | null;
  color: string | null;
}

const MOODS = ['GREAT', 'GOOD', 'NEUTRAL', 'LOW', 'ROUGH'];

export default function JournalPage() {
  const [tab, setTab] = useState('journal');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    if (tabParam === 'goals' || tabParam === 'habits' || tabParam === 'journal') {
      setTab(tabParam);
    }
  }, []);

  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [entryMood, setEntryMood] = useState('NEUTRAL');
  const [saving, setSaving] = useState(false);

  const [goalTitle, setGoalTitle] = useState('');
  const [goalDate, setGoalDate] = useState('');

  const [habitName, setHabitName] = useState('');
  const [habitColor, setHabitColor] = useState('#6366f1');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [journalRes, goalsRes, habitsRes] = await Promise.all([
        fetch('/api/journal'),
        fetch('/api/goals'),
        fetch('/api/habits'),
      ]);
      const [journalData, goalsData, habitsData] = await Promise.all([
        journalRes.json().catch(() => ({})),
        goalsRes.json().catch(() => ({})),
        habitsRes.json().catch(() => ({})),
      ]);
      if (!journalRes.ok || !goalsRes.ok || !habitsRes.ok) {
        setError(journalData.error || goalsData.error || habitsData.error || 'Failed to load');
        return;
      }
      setEntries(journalData.entries || []);
      setGoals(goalsData.goals || []);
      setHabits(habitsData.habits || []);
    } catch {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const saveEntry = async () => {
    if (!entryContent.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: entryTitle, content: entryContent, mood: entryMood }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to save entry');
        return;
      }
      setEntryTitle('');
      setEntryContent('');
      setEntryMood('NEUTRAL');
      loadAll();
    } catch {
      setError('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await fetch(`/api/journal?id=${id}`, { method: 'DELETE' });
      loadAll();
    } catch {
      setError('Failed to delete entry');
    }
  };

  const createGoal = async () => {
    if (!goalTitle.trim()) return;
    setError(null);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: goalTitle, targetDate: goalDate || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to create goal');
        return;
      }
      setGoalTitle('');
      setGoalDate('');
      loadAll();
    } catch {
      setError('Failed to create goal');
    }
  };

  const setProgress = async (goal: Goal, progress: number) => {
    try {
      const res = await fetch(`/api/goals?id=${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to update goal');
        return;
      }
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? data.goal : g)));
    } catch {
      setError('Failed to update goal');
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
      loadAll();
    } catch {
      setError('Failed to delete goal');
    }
  };

  const createHabit = async () => {
    if (!habitName.trim()) return;
    setError(null);
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: habitName, color: habitColor }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to create habit');
        return;
      }
      setHabitName('');
      loadAll();
    } catch {
      setError('Failed to create habit');
    }
  };

  const markDone = async (habit: Habit) => {
    try {
      const res = await fetch(`/api/habits?id=${habit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to update habit');
        return;
      }
      setHabits((prev) => prev.map((h) => (h.id === habit.id ? data.habit : h)));
    } catch {
      setError('Failed to update habit');
    }
  };

  const resetHabit = async (id: string) => {
    try {
      await fetch(`/api/habits?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      });
      loadAll();
    } catch {
      setError('Failed to reset habit');
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      await fetch(`/api/habits?id=${id}`, { method: 'DELETE' });
      loadAll();
    } catch {
      setError('Failed to delete habit');
    }
  };

  const doneToday = (habit: Habit) => habit.lastDoneAt && new Date(habit.lastDoneAt).toDateString() === new Date().toDateString();

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="journal" className="gap-1.5">
            <BookOpenText className="h-4 w-4" />
            Journal
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-1.5">
            <Target className="h-4 w-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="habits" className="gap-1.5">
            <Flame className="h-4 w-4" />
            Habits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input value={entryTitle} onChange={(e) => setEntryTitle(e.target.value)} placeholder="Title (optional)" aria-label="Entry title" />
                <select
                  value={entryMood}
                  onChange={(e) => setEntryMood(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm sm:w-[160px]"
                  aria-label="Mood"
                >
                  {MOODS.map((m) => (
                    <option key={m} value={m}>{moodEmoji(m)} {m}</option>
                  ))}
                </select>
              </div>
              <Textarea
                value={entryContent}
                onChange={(e) => setEntryContent(e.target.value)}
                placeholder="How did your day go?"
                rows={5}
                aria-label="Journal content"
              />
              <Button onClick={saveEntry} disabled={saving || !entryContent.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Save entry
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent entries</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading…
                </div>
              ) : entries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No journal entries yet.</p>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div key={entry.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{entry.title || 'Untitled'}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(entry.date).toLocaleDateString()} · {moodEmoji(entry.mood)} {entry.mood}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteEntry(entry.id)} aria-label="Delete entry">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap mt-2">{entry.content.slice(0, 600)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New goal</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-2">
              <Input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="e.g. Ship HEY v1" aria-label="Goal title" />
              <Input type="date" value={goalDate} onChange={(e) => setGoalDate(e.target.value)} aria-label="Target date" className="sm:w-[180px]" />
              <Button onClick={createGoal} disabled={!goalTitle.trim()}>
                <Plus className="h-4 w-4" />
                Add goal
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Goals</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading…
                </div>
              ) : goals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No goals yet.</p>
              ) : (
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <div key={goal.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={cn('font-medium', goal.status === 'ACHIEVED' && 'text-emerald-600')}>
                            {goal.title}
                            {goal.status === 'ACHIEVED' && ' ✓'}
                          </p>
                          {goal.targetDate && (
                            <p className="text-xs text-muted-foreground">
                              Target {new Date(goal.targetDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteGoal(goal.id)} aria-label="Delete goal">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">{goal.progress}%</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {[0, 25, 50, 75, 100].map((pct) => (
                          <Button key={pct} size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setProgress(goal, pct)}>
                            {pct}%
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="habits" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New habit</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-2">
              <Input value={habitName} onChange={(e) => setHabitName(e.target.value)} placeholder="e.g. Morning run" aria-label="Habit name" />
              <input
                type="color"
                value={habitColor}
                onChange={(e) => setHabitColor(e.target.value)}
                aria-label="Habit color"
                className="h-10 w-12 rounded border border-input"
              />
              <Button onClick={createHabit} disabled={!habitName.trim()}>
                <Plus className="h-4 w-4" />
                Add habit
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Habits</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading…
                </div>
              ) : habits.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No habits yet — build your streak.</p>
              ) : (
                <div className="space-y-3">
                  {habits.map((habit) => (
                    <div key={habit.id} className="rounded-lg border p-3 flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: habit.color ?? '#6366f1' }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{habit.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {habit.streak} day{habit.streak === 1 ? '' : 's'} streak
                        </p>
                      </div>
                      <Button
                        variant={doneToday(habit) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => markDone(habit)}
                        className="gap-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {doneToday(habit) ? 'Done today' : 'Mark done'}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => resetHabit(habit.id)} aria-label="Reset streak">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteHabit(habit.id)} aria-label="Delete habit">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}