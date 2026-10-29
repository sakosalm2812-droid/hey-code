'use client';

import { useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Trash2,
  Send,
  Power,
  Hand,
  HandMetal,
  CircleDot,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { attachRouterToStore } from '@/lib/terminal/command-router';
import { inspectRuntime } from '@/lib/terminal/platform';
import { useTerminalStore } from '@/lib/terminal/terminal-store';
import { useGesturePipeline } from '@/lib/gesture/use-gesture-pipeline';
import { Button } from '@/components/ui/button';

function formatLevel(level: string): string {
  switch (level) {
    case 'input':
      return 'text-green-400';
    case 'error':
      return 'text-red-400';
    case 'warn':
      return 'text-amber-400';
    case 'success':
      return 'text-emerald-300';
    case 'system':
      return 'text-cyan-300';
    default:
      return 'text-zinc-300';
  }
}

export function VirtualTerminal() {
  const outputs = useTerminalStore((s) => s.outputs);
  const input = useTerminalStore((s) => s.input);
  const gesture = useTerminalStore((s) => s.gesture);
  const scrollOffset = useTerminalStore((s) => s.scrollOffset);

  const paneRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userScrolledRef = useRef(false);

  const pipeline = useGesturePipeline(videoRef);
  const runtime = inspectRuntime();
  const cameraActive =
    pipeline.enabled || pipeline.status === 'loading' || pipeline.permissionDenied;

  useEffect(() => {
    attachRouterToStore();
  }, []);

  // The gesture engine and physical terminal share the scroll controller through
  // the centralized store; apply the store's offset unless the user is mid-scroll.
  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    if (Math.abs(pane.scrollTop - scrollOffset) > 1 && !userScrolledRef.current) {
      pane.scrollTop = scrollOffset;
    }
  }, [scrollOffset]);

  const onScroll = () => {
    const pane = paneRef.current;
    if (!pane) return;
    const maxScroll = Math.max(0, pane.scrollHeight - pane.clientHeight);
    useTerminalStore.getState().setMaxScroll(maxScroll);
    useTerminalStore.getState().setScrollOffset(pane.scrollTop);
    userScrolledRef.current = pane.scrollTop < maxScroll - 24;
  };

  useEffect(() => {
    if (!userScrolledRef.current) {
      const pane = paneRef.current;
      if (pane) {
        const maxScroll = Math.max(0, pane.scrollHeight - pane.clientHeight);
        pane.scrollTop = maxScroll;
        useTerminalStore.getState().setMaxScroll(maxScroll);
        useTerminalStore.getState().setScrollOffset(maxScroll);
      }
    }
  }, [outputs]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      useTerminalStore.getState().submitInput();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      useTerminalStore.getState().navigateHistory(1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      useTerminalStore.getState().navigateHistory(-1);
    }
  };

  const toggleGesture = () => {
    void pipeline.setEnabled(!pipeline.enabled);
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-xl border bg-black text-zinc-200 shadow-2xl">
      <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-xs">
        <TerminalIcon className="h-4 w-4 text-zinc-400" />
        <span className="font-mono font-semibold tracking-wide text-zinc-100">HEY Virtual Terminal</span>
        <span className="hidden rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 sm:inline">
          target: {runtime.platform}
        </span>
        <span
          className={cn(
            'hidden rounded px-1.5 py-0.5 font-mono text-[10px] sm:inline',
            typeof window !== 'undefined' && inspectRuntime().androidBridge
              ? 'bg-green-900/60 text-green-300'
              : 'bg-zinc-800 text-zinc-500'
          )}
        >
          android:{String(Boolean(runtime.androidBridge))}
        </span>
        <span
          className={cn(
            'hidden rounded px-1.5 py-0.5 font-mono text-[10px] sm:inline',
            runtime.iosBridge ? 'bg-green-900/60 text-green-300' : 'bg-zinc-800 text-zinc-500'
          )}
        >
          ios:{String(runtime.iosBridge)}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleGesture}
            className={cn(
              'inline-flex items-center gap-1.5 rounded border px-2 py-1 font-mono transition-colors',
              pipeline.enabled
                ? 'border-emerald-700 bg-emerald-950/60 text-emerald-300'
                : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            )}
            aria-pressed={pipeline.enabled}
          >
            {pipeline.status === 'loading' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : pipeline.enabled ? (
              <Hand className="h-3.5 w-3.5" />
            ) : (
              <HandMetal className="h-3.5 w-3.5" />
            )}
            gesture: {pipeline.enabled ? 'on' : 'off'}
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-zinc-300 hover:text-green-400"
            onClick={() => {
              useTerminalStore.getState().clear();
              useTerminalStore.getState().append({
                level: 'system',
                source: 'system',
                text: 'Terminal cleared manually.',
              });
            }}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Clear</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-zinc-300 hover:text-red-400"
            onClick={() => useTerminalStore.getState().requestExit()}
          >
            <Power className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Exit</span>
          </Button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div
          ref={paneRef}
          onScroll={onScroll}
          className="h-full overflow-y-auto px-4 py-3 font-mono text-[13px] leading-relaxed"
        >
          {outputs.length === 0 ? (
            <p className="text-zinc-500">
              Type an app name (e.g. &quot;notepad&quot;), &quot;launch spotify&quot;, &quot;clear&quot;, &quot;exit&quot;, or &quot;help&quot;.
            </p>
          ) : (
            outputs.map((line) => (
              <div key={line.id} className="whitespace-pre-wrap break-all">
                <span className="mr-2 text-zinc-600">
                  {new Date(line.ts).toLocaleTimeString([], { hour12: false })}
                </span>
                <span className={formatLevel(line.level)}>{line.text}</span>
              </div>
            ))
          )}
        </div>

        <div
          className={cn(
            'absolute right-3 top-3 w-40 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl',
            cameraActive ? '' : 'hidden'
          )}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            className="h-28 w-full -scale-x-100 object-cover"
          />
            <div className="px-2 py-1 font-mono text-[10px] text-zinc-400">
              {pipeline.permissionDenied ? (
                <span className="text-amber-400">camera blocked</span>
              ) : pipeline.status === 'loading' ? (
                <span>loading model…</span>
              ) : pipeline.status === 'error' ? (
                <span className="text-red-400">engine error</span>
              ) : gesture.lastSnapshot ? (
                <span>
                  {gesture.lastSnapshot.gesture.replaceAll('_', ' ')}
                  {' · '}
                  d_idx {(gesture.lastSnapshot.distances.index ?? 0).toFixed(2)}
                </span>
              ) : (
                <span>waiting for hand</span>
              )}
            </div>
          </div>
        </div>

      <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-3">
        <div className="flex items-center gap-3 rounded-lg bg-black/60 px-3 py-2 ring-1 ring-zinc-800 focus-within:ring-emerald-700">
          <CircleDot className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
          <span className="font-mono text-sm text-green-400">&gt;&nbsp;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => useTerminalStore.getState().setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="command…"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-6 w-full bg-transparent font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
            aria-label="Terminal input"
          />
          <button
            type="button"
            onClick={() => useTerminalStore.getState().submitInput()}
            className="text-zinc-400 transition-colors hover:text-emerald-400"
            aria-label="Send command"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-zinc-600">
          ↑/↓ history · Enter runs · open palm clears · fist exits · index finger scrolls when gesture is on
        </p>
      </div>
    </div>
  );
}