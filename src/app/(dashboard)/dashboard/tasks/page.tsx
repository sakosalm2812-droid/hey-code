'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Plus, Trash2, Loader2, Search, Download, CalendarCheck2, CircleDot, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  tags: string[];
  createdAt: string;
}

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-muted-foreground',
  IN_PROGRESS: 'text-blue-500',
  COMPLETED: 'text-emerald-500',
  CANCELLED: 'text-muted-foreground',
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-muted text-muted-foreground',
  MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  HIGH: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (statusFilter !== 'ALL') qs.set('status', statusFilter);
      if (priorityFilter !== 'ALL') qs.set('priority', priorityFilter);
      if (search.trim()) qs.set('q', search.trim());

      const res = await fetch(`/api/tasks?${qs.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to load tasks');
        return;
      }
      setTasks(data.tasks || []);
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load]);

  const create = async () => {
    if (!title.trim() || creating) return;
    setCreating(true);
    setActionError(null);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          priority,
          dueDate: dueDate || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.error || 'Failed to create task');
        return;
      }
      setTitle('');
      setDueDate('');
      setPriority('MEDIUM');
      load();
    } catch {
      setActionError('Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const setStatus = async (task: Task, status: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.error || 'Failed to update task');
        return;
      }
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
    } catch {
      setActionError('Failed to update task');
    }
  };

  const remove = async (task: Task) => {
    try {
      const res = await fetch(`/api/tasks?id=${task.id}`, { method: 'DELETE' });
      if (res.ok) load();
    } catch {
      setActionError('Failed to delete task');
    }
  };

  const isOverdue = (task: Task) => task.dueDate && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && new Date(task.dueDate).getTime() < Date.now();

  const todays = tasks.filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString() && t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
  const overdue = tasks.filter(isOverdue as any);
  const upcoming = tasks.filter((t) => t.dueDate && new Date(t.dueDate).getTime() >= Date.now());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Tasks
          </CardTitle>
          <CardDescription>
            Plan your day with priorities and due dates, or export your calendar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task…" aria-label="New task title" />
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label="Due date" className="sm:w-[180px]" />
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="sm:w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={create} disabled={creating || !title.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </div>

          {actionError && <p className="text-sm text-destructive" role="alert">{actionError}</p>}

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…" className="pl-9" aria-label="Search tasks" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="sm:w-[160px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All priorities</SelectItem>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" asChild>
              <a href="/api/tasks/export" className="gap-2">
                <Download className="h-4 w-4" />
                Export .ics
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {!search.trim() && statusFilter === 'ALL' && priorityFilter === 'ALL' && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className={cn(overdue.length > 0 && 'border-destructive/40')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5 text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{overdue.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5 text-muted-foreground">
                <CalendarCheck2 className="h-4 w-4" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{todays.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5 text-muted-foreground">
                <CircleDot className="h-4 w-4" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{upcoming.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tasks.length} task{tasks.length === 1 ? '' : 's'}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading tasks…
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No tasks.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <button
                    type="button"
                    onClick={() => setStatus(task, task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED')}
                    className={cn('shrink-0 rounded-full border p-0.5', task.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/40 text-transparent hover:border-primary')}
                    aria-label={task.status === 'COMPLETED' ? 'Mark pending' : 'Mark completed'}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-medium truncate', task.status === 'COMPLETED' && 'line-through text-muted-foreground')}>{task.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className={cn('inline-flex items-center gap-1', STATUS_COLORS[task.status] ?? '')}>
                        <CircleDot className="h-3 w-3" />
                        {task.status.replace('_', ' ').toLowerCase()}
                      </span>
                      {task.dueDate && (
                        <span className={cn('inline-flex items-center gap-1', isOverdue(task) && 'text-destructive font-medium')}>
                          <CalendarCheck2 className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                          {isOverdue(task) && ' · overdue'}
                        </span>
                      )}
                      <span className={cn('rounded-full px-2 py-0.5', PRIORITY_STYLES[task.priority] ?? '')}>{task.priority.toLowerCase()}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(task)} aria-label="Delete task">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}