'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Trash2, Brain, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Memory {
  id: string;
  type: string;
  content: string;
  category: string | null;
  importance: number;
  createdAt: string;
}

type MemoryType = 'FACT' | 'PREFERENCE' | 'RELATIONSHIP' | 'PROJECT' | 'NOTE';

const typeOptions: Array<{ value: MemoryType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All types' },
  { value: 'FACT', label: 'Facts' },
  { value: 'PREFERENCE', label: 'Preferences' },
  { value: 'RELATIONSHIP', label: 'Relationships' },
  { value: 'PROJECT', label: 'Projects' },
  { value: 'NOTE', label: 'Notes' },
];

const typeLabels: Record<string, string> = {
  FACT: 'FACT',
  PREFERENCE: 'PREF',
  RELATIONSHIP: 'REL',
  PROJECT: 'PROJ',
  NOTE: 'NOTE',
};

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<MemoryType | 'ALL'>('ALL');
  const [showAdd, setShowAdd] = useState(false);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [newType, setNewType] = useState<MemoryType>('FACT');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      const res = await fetch(`/api/memories?${params.toString()}`, { method: 'GET' });
      if (!res.ok) {
        let message = `Failed to load memories (${res.status})`;
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {}
        throw new Error(message);
      }
      const body = await res.json();
      setMemories(body.memories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memories');
    } finally {
      setLoading(false);
    }
  }, [query, typeFilter]);

  useEffect(() => {
    const t = setTimeout(load, query ? 250 : 0);
    return () => clearTimeout(t);
  }, [load]);

  const addMemory = async () => {
    if (!content.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newType, content: content.trim(), category: category.trim() || undefined }),
      });
      if (!res.ok) throw new Error('Failed to save memory');
      setContent('');
      setCategory('');
      setShowAdd(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save memory');
    } finally {
      setAdding(false);
    }
  };

  const removeMemory = async (id: string) => {
    const res = await fetch(`/api/memories?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMemories(m => m.filter(x => x.id !== id));
    }
  };

  const bumpImportance = async (memory: Memory, importance: number) => {
    const res = await fetch('/api/memories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memoryId: memory.id, importance }),
    });
    if (res.ok) {
      setMemories(m => m.map(x => (x.id === memory.id ? { ...x, importance } : x)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            Memory
          </h1>
          <p className="text-muted-foreground mt-1">HEY remembers what matters across conversations</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAdd(s => !s)}>
          <Plus className="h-4 w-4" />
          Add memory
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
              <Select value={newType} onValueChange={v => setNewType(v as MemoryType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {typeOptions.filter(t => t.value !== 'ALL').map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="What should HEY remember?" value={content} onChange={e => setContent(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Input placeholder="Category (optional)" value={category} onChange={e => setCategory(e.target.value)} />
              <Button onClick={addMemory} disabled={adding || !content.trim()}>
                {adding ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search memories…" value={query} onChange={e => setQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={typeFilter} onValueChange={v => setTypeFilter(v as MemoryType | 'ALL')}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {typeOptions.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map(i => (
            <Card key={i}><CardContent className="p-4"><div className="h-4 bg-muted animate-pulse rounded w-3/4 mb-2" /><div className="h-3 bg-muted/60 animate-pulse rounded w-1/2" /></CardContent></Card>
          ))}
        </div>
      ) : error ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">{error}</CardContent></Card>
      ) : memories.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">No memories yet. Anything you save here will help HEY personalize future replies.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {memories.map(memory => (
            <Card key={memory.id}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center justify-between">
                  <span className="rounded bg-muted px-1.5 py-0.5">{typeLabels[memory.type] || memory.type}</span>
                  <span className="flex items-center gap-1">
                    {[1, 2, 3].map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => bumpImportance(memory, level)}
                        className={cn('transition-colors', level <= memory.importance ? 'text-primary' : 'text-muted-foreground/30 hover:text-muted-foreground')}
                        aria-label={`Set importance ${level}`}
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <p className="text-sm">{memory.content}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{memory.category || 'Uncategorized'}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeMemory(memory.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}