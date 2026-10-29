'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';
import { Bell, CheckCheck, Inbox, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  TEAM: Bell,
  BILLING: Bell,
  SYSTEM: AlertCircle,
  MEMORY: Bell,
  GENERAL: Bell,
};

export default function InboxPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notifications', { method: 'GET' });
      if (!res.ok) {
        let message = `Failed to load notifications (${res.status})`;
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {}
        throw new Error(message);
      }
      const body = await res.json();
      setNotifications(body.notifications || []);
      setUnread(body.unread || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: string) => {
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setNotifications(n => n.map(x => (x.id === id ? { ...x, read: true } : x)));
      setUnread(u => Math.max(0, u - 1));
    }
  };

  const markAll = async () => {
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    if (res.ok) {
      setNotifications(n => n.map(x => ({ ...x, read: true })));
      setUnread(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground mt-1">
            {unread > 0 ? `${unread} unread notification${unread === 1 ? '' : 's'}` : 'You are all caught up'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" className="gap-2" onClick={markAll}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <Card key={i}><CardContent className="p-4"><div className="h-4 bg-muted animate-pulse rounded w-2/3" /></CardContent></Card>
          ))}
        </div>
      ) : error ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">{error}</CardContent></Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => {
            const Icon = typeIcons[notification.type] || Bell;
            return (
              <Card key={notification.id} className={cn('transition-colors', !notification.read && 'border-primary/40 bg-primary/[0.02]')}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={cn('mt-0.5 rounded-full p-2', notification.read ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary')}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className={cn('text-sm', !notification.read && 'font-semibold')}>{notification.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(new Date(notification.createdAt))}</span>
                    </div>
                    {notification.message && <p className="mt-0.5 text-sm text-muted-foreground">{notification.message}</p>}
                    <div className="mt-2 flex items-center gap-3">
                      {notification.link && (
                        <Link href={notification.link} className="text-xs font-medium text-primary hover:underline">View</Link>
                      )}
                      {!notification.read && (
                        <button type="button" onClick={() => markRead(notification.id)} className="text-xs text-muted-foreground hover:text-foreground">
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}