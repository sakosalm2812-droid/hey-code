'use client';

import { create } from 'zustand';
import type {
  GestureSnapshot,
  TerminalOutput,
} from '@/lib/terminal/types';
import { storeLog } from '@/lib/terminal/logger';

/**
 * Centralized state machine for the "hey" virtual terminal.
 *
 * Every input source funnels through this single store:
 *  - the physical text prompt (Terminal component + chat text field -> command router)
 *  - the MediaPipe gesture engine (open palm clears, fist exits, index point scrolls)
 *
 * The terminal scroll controller is also owned here so the gesture engine and the
 * UI write to the exact same scroll target.
 */

export type EngineStatus = 'idle' | 'loading' | 'running' | 'error';

interface TerminalState {
  outputs: TerminalOutput[];
  input: string;
  promptHistory: string[];
  historyIndex: number;
  scrollOffset: number;
  maxScroll: number;
  exitRequested: boolean;
  gesture: {
    enabled: boolean;
    status: EngineStatus;
    error: string | null;
    lastSnapshot: GestureSnapshot | null;
  };

  append(output: Omit<TerminalOutput, 'id' | 'ts'>): void;
  clear(): void;
  setInput(input: string): void;
  setMaxScroll(max: number): void;
  setScrollOffset(offset: number): void;
  applyScrollDelta(deltaPx: number): void;
  submitInput(): void;
  navigateHistory(direction: -1 | 1): void;
  requestExit(): void;
  setGestureEnabled(enabled: boolean): void;
  setGestureStatus(status: EngineStatus, error?: string | null): void;
  setLastSnapshot(snapshot: GestureSnapshot): void;
  reset(): void;
  /** Registered by the command router to wire prompts into the state machine. */
  setCommandHandler(handler: (rawInput: string) => void): void;
}

let commandHandler: ((rawInput: string) => void) | null = null;
let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `out-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export const useTerminalStore = create<TerminalState>()((set, get) => ({
  outputs: [],
  input: '',
  promptHistory: [],
  historyIndex: -1,
  scrollOffset: 0,
  maxScroll: 0,
  exitRequested: false,
  gesture: {
    enabled: false,
    status: 'idle',
    error: null,
    lastSnapshot: null,
  },

  append: (output) =>
    set((state) => ({
      outputs: [
        ...state.outputs,
        { ...output, id: nextId(), ts: Date.now() },
      ].slice(-500),
    })),

  clear: () => {
    storeLog.info('terminalState.clear() invoked');
    set((state) => ({
      outputs: state.gesture.enabled
        ? [
            {
              id: nextId(),
              ts: Date.now(),
              level: 'system',
              source: 'gesture',
              text: 'Open palm detected -> terminal cleared via gesture.',
            },
          ]
        : [],
    }));
  },

  setInput: (input) => set({ input }),

  setMaxScroll: (max) => {
    const safeMax = Number.isFinite(max) && max > 0 ? Math.floor(max) : 0;
    set((state) => ({ maxScroll: safeMax, scrollOffset: clamp(state.scrollOffset, 0, safeMax) }));
  },

  setScrollOffset: (offset) =>
    set((state) => ({ scrollOffset: clamp(Math.floor(offset), 0, state.maxScroll) })),

  applyScrollDelta: (deltaPx) => {
    if (!Number.isFinite(deltaPx) || deltaPx === 0) return;
    set((state) => {
      if (state.maxScroll <= 0) return {};
      const next = clamp(Math.floor(state.scrollOffset + deltaPx), 0, state.maxScroll);
      return next === state.scrollOffset ? {} : { scrollOffset: next };
    });
  },

  submitInput: () => {
    const { input, append } = get();
    const raw = input.trim();
    if (!raw) return;
    set((state) => ({
      input: '',
      promptHistory: [raw, ...state.promptHistory].slice(0, 100),
      historyIndex: -1,
    }));
    append({ level: 'input', source: 'store', text: `> ${raw}` });
    if (commandHandler) {
      try {
        commandHandler(raw);
      } catch (error) {
        storeLog.error('Command handler threw', error);
        append({
          level: 'error',
          source: 'router',
          text: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      append({
        level: 'warn',
        source: 'router',
        text: 'Command router is not attached to the store yet.',
      });
    }
  },

  navigateHistory: (direction) =>
    set((state) => {
      const history = state.promptHistory;
      if (history.length === 0) return {};
      const nextIndex = clamp(state.historyIndex + direction, -1, history.length - 1);
      return {
        historyIndex: nextIndex,
        input: nextIndex === -1 ? '' : history[nextIndex],
      };
    }),

  requestExit: () => {
    storeLog.info('App exit routine requested via terminalState');
    const exitNotice: TerminalOutput = {
      id: nextId(),
      ts: Date.now(),
      level: 'system',
      source: 'store',
      text: 'Exit requested. Native shells run the OS termination routine; web browsers close the window when allowed.',
    };
    set((state) => ({
      exitRequested: true,
      outputs: [...state.outputs, exitNotice].slice(-500),
    }));
  },

  setGestureEnabled: (enabled) =>
    set((state) => ({
      gesture: { ...state.gesture, enabled },
    })),

  setGestureStatus: (status, error = null) =>
    set((state) => ({
      gesture: {
        ...state.gesture,
        status,
        error: error === null && status !== 'error' ? null : error,
      },
    })),

  setLastSnapshot: (snapshot) =>
    set((state) => ({
      gesture: { ...state.gesture, lastSnapshot: snapshot },
    })),

  reset: () =>
    set((state) => ({
      outputs: [],
      input: '',
      promptHistory: [],
      historyIndex: -1,
      scrollOffset: 0,
      maxScroll: 0,
      exitRequested: false,
      gesture: { enabled: false, status: 'idle', error: null, lastSnapshot: null },
    })),

  setCommandHandler: (handler) => {
    commandHandler = handler;
  },
}));