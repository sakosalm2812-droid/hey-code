'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Search, MessageSquare, Plus, Settings, CreditCard, Users, Sun, Moon, LogOut, CornerDownLeft, LayoutDashboard, Inbox, Bot, Newspaper, FolderOpen, CheckSquare, BookOpenText, BarChart3, Sunrise, BrainCircuit, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  label: string;
  keywords?: string[];
  icon: React.ComponentType<{ className?: string }>;
  perform: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { setTheme } = useTheme();

  const commands: Command[] = [
    { id: 'chats', label: 'Go to Chats', keywords: ['dashboard', 'home', 'conversations'], icon: LayoutDashboard, perform: () => router.push('/dashboard') },
    { id: 'new-chat', label: 'New Chat', keywords: ['start', 'compose', 'message'], icon: Plus, perform: () => router.push('/dashboard/chats/new') },
    { id: 'inbox', label: 'Inbox', keywords: ['notifications', 'alerts', 'bell'], icon: Inbox, perform: () => router.push('/dashboard/inbox') },
    { id: 'agents', label: 'Agents', keywords: ['assistants', 'bots', 'personas'], icon: Bot, perform: () => router.push('/dashboard/agents') },
    { id: 'research', label: 'Web Research', keywords: ['search', 'web', 'sources', 'citations'], icon: Newspaper, perform: () => router.push('/dashboard/research') },
    { id: 'files', label: 'Files & Projects', keywords: ['documents', 'projects', 'uploads', 'storage'], icon: FolderOpen, perform: () => router.push('/dashboard/files') },
    { id: 'tasks', label: 'Tasks', keywords: ['todo', 'to-do', 'planner', 'plans'], icon: CheckSquare, perform: () => router.push('/dashboard/tasks') },
    { id: 'journal', label: 'Journal', keywords: ['goals', 'habits', 'notes', 'reflections'], icon: BookOpenText, perform: () => router.push('/dashboard/journal') },
    { id: 'analytics', label: 'Analytics', keywords: ['stats', 'charts', 'usage', 'insights'], icon: BarChart3, perform: () => router.push('/dashboard/analytics') },
    { id: 'briefing', label: 'Daily Briefing', keywords: ['morning', 'summary', 'day'], icon: Sunrise, perform: () => router.push('/dashboard/briefing') },
    { id: 'memories', label: 'Memories', keywords: ['recall', 'remembered', 'knowledge'], icon: BrainCircuit, perform: () => router.push('/dashboard/memories') },
    { id: 'team', label: 'Team', keywords: ['members', 'invite', 'collaborate'], icon: Users, perform: () => router.push('/dashboard/team') },
    { id: 'billing', label: 'Billing', keywords: ['plan', 'upgrade', 'subscription', 'payments'], icon: CreditCard, perform: () => router.push('/dashboard/billing') },
    { id: 'settings', label: 'Settings', keywords: ['preferences', 'profile', 'account'], icon: Settings, perform: () => router.push('/dashboard/settings') },
    { id: 'update-memory', label: 'Save to memory (this chat)', keywords: ['remember', 'memorize'], icon: Zap, perform: () => router.push('/dashboard/memories') },
    { id: 'theme-light', label: 'Switch to light theme', keywords: ['appearance', 'mode'], icon: Sun, perform: () => setTheme('light') },
    { id: 'theme-dark', label: 'Switch to dark theme', keywords: ['appearance', 'mode'], icon: Moon, perform: () => setTheme('dark') },
    { id: 'signout', label: 'Sign out', keywords: ['logout', 'exit'], icon: LogOut, perform: () => signOut({ callbackUrl: '/' }) },
  ];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = query.trim()
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        (c.keywords || []).some(k => k.includes(query.toLowerCase()))
      )
    : commands;

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const execute = (cmd: Command) => {
    setOpen(false);
    cmd.perform();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIndex]) execute(filtered[activeIndex]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogOverlay />
      <DialogContent
        hideClose
        className="top-[18%] max-w-lg overflow-hidden p-0 translate-y-0"
        onKeyDown={onKeyDown}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No results for &quot;{query}&quot;</p>
          )}
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon;
            return (
              <button
                key={cmd.id}
                type="button"
                onClick={() => execute(cmd)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  i === activeIndex ? 'bg-accent text-accent-foreground' : 'text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1">{cmd.label}</span>
                {i === activeIndex && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            );
          })}
        </div>
        <div className="border-t px-4 py-2 text-[10px] text-muted-foreground">
          <kbd className="rounded border border-border bg-muted px-1 py-0.5">Tab</kbd> / <kbd className="rounded border border-border bg-muted px-1 py-0.5">↑</kbd> / <kbd className="rounded border border-border bg-muted px-1 py-0.5">↓</kbd> to navigate&nbsp;&nbsp;·&nbsp;&nbsp;<kbd className="rounded border border-border bg-muted px-1 py-0.5">Enter</kbd> to select
        </div>
      </DialogContent>
    </Dialog>
  );
}