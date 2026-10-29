'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, Plus, Search, MoreVertical, Trash2, Edit, Clock } from 'lucide-react';
import { DashboardWidgets } from '@/components/dashboard-widgets';
import { TodayPanel } from '@/components/today-panel';
import { HeyThoughtsPanel } from '@/components/hey-thoughts-panel';

interface ChatListItem {
  id: string;
  title: string;
  model: string;
  updatedAt: Date;
  messageCount: number;
}

const modelLabels: Record<string, string> = {
  GPT_4O: 'GPT-4o',
  GPT_4O_MINI: 'GPT-4o-mini',
  GPT_4_TURBO: 'GPT-4 Turbo',
  CLAUDE_3_OPUS: 'Claude 3 Opus',
  CLAUDE_3_SONNET: 'Claude 3 Sonnet',
  CLAUDE_3_HAIKU: 'Claude 3 Haiku',
};

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadChats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/chat', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          let message = `Failed to load chats (${res.status})`;
          try {
            const body = await res.json();
            if (body?.error) message = body.error;
          } catch {}
          throw new Error(message);
        }
        const data = await res.json();
        if (cancelled) return;
        setChats(
          (data.chats || []).map((c: any) => ({
            id: c.id,
            title: c.title,
            model: modelLabels[c.model] || c.model,
            updatedAt: new Date(c.updatedAt),
            messageCount: c._count?.messages ?? 0,
          }))
        );
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load chats');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadChats();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Chats</h1>
            <p className="text-muted-foreground mt-1">Continue where you left off or start a new conversation</p>
          </div>
          <Link href="/dashboard/chats/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </Link>
        </div>

        <TodayPanel />

        <HeyThoughtsPanel />

        <DashboardWidgets />

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-5 w-1/3 bg-muted animate-pulse rounded mb-3" />
                  <div className="h-4 w-2/3 bg-muted/60 animate-pulse rounded mb-1" />
                  <div className="h-3 w-1/4 bg-muted/60 animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-lg font-medium mb-2">Could not load your chats</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : chats.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No chats yet</h3>
              <p className="text-muted-foreground mb-6">Start your first conversation with HEY</p>
              <Link href="/dashboard/chats/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Chat
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {chats.map((chat) => (
              <Card key={chat.id} className="group relative">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link href={`/dashboard/chats/${chat.id}`} className="block">
                        <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                          {chat.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {chat.messageCount} messages · {chat.model}
                        </p>
                      </Link>
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(chat.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/dashboard/chats/${chat.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
}