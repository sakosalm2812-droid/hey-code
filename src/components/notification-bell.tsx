'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatRelativeTime } from '@/lib/utils';
import { Bell, BellOff, CheckCheck, Inbox, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  isNativeNotificationsEnabled,
  setNativeNotificationsEnabled,
  requestNotificationPermission,
  useNativeNotifications,
} from '@/lib/use-native-notifications';
import { isWebPushEnabled, toggleWebPush } from '@/lib/use-web-push';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [nativeEnabled, setNativeEnabled] = useState(false);
  const [webPushEnabled, setWebPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useNativeNotifications(items, nativeEnabled, permission);

  useEffect(() => {
    setNativeEnabled(isNativeNotificationsEnabled());
    setWebPushEnabled(isWebPushEnabled());
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handlePushToggle = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      const result = await toggleWebPush(!webPushEnabled);
      if (result.ok) setWebPushEnabled(!webPushEnabled);
    } finally {
      setPushBusy(false);
    }
  };

  const toggleNative = async () => {
    if (!nativeEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setPermission('granted');
        setNativeEnabled(true);
        setNativeNotificationsEnabled(true);
      }
    } else {
      setNativeEnabled(false);
      setNativeNotificationsEnabled(false);
    }
  };

  const load = async () => {
    try {
      const res = await fetch('/api/notifications?limit=8', { method: 'GET' });
      if (!res.ok) return;
      const body = await res.json();
      setItems(body.notifications || []);
      setUnread(body.unread || 0);
    } catch {}
  };

  useEffect(() => {
    load();
    timer.current = setInterval(load, 60000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  useEffect(() => {
    if (open && !loaded) {
      load();
      setLoaded(true);
    }
  }, [open, loaded]);

  const markAll = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setItems(n => n.map(x => ({ ...x, read: true })));
    setUnread(0);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}>
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleNative}
              className={cn('flex items-center gap-1 text-xs', nativeEnabled ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
              aria-pressed={nativeEnabled}
              title={nativeEnabled ? 'Native notifications on' : 'Enable native notifications'}
            >
              {nativeEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
              Native
            </button>
            <button
              type="button"
              onClick={handlePushToggle}
              disabled={pushBusy}
              className={cn(
                'flex items-center gap-1 text-xs disabled:opacity-50',
                webPushEnabled ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-pressed={webPushEnabled}
              title={
                webPushEnabled
                  ? 'Web push on (works when HEY is closed)'
                  : 'Enable web push — works even when HEY is closed'
              }
            >
              <Radio className="h-3.5 w-3.5" />
              Push
            </button>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all
              </button>
            )}
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-8 text-center">
              <Inbox className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            items.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.link) router.push(item.link);
                }}
                className={cn(
                  'flex w-full flex-col gap-0.5 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-accent/50',
                  !item.read && 'bg-primary/[0.03]'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={cn('truncate text-sm', !item.read ? 'font-semibold' : '')}>{item.title}</p>
                  {!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
                {item.message && <p className="line-clamp-2 text-xs text-muted-foreground">{item.message}</p>}
                <span className="text-[10px] text-muted-foreground/70">{formatRelativeTime(new Date(item.createdAt))}</span>
              </button>
            ))
          )}
        </div>
        <button
          type="button"
          onClick={() => { setOpen(false); router.push('/dashboard/inbox'); }}
          className="w-full border-t px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-accent/50 transition-colors"
        >
          View all in inbox
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}