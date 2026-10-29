'use client';

import { listAppTargets, getAppTarget } from '@/lib/terminal/app-catalog';
import { routerLog } from '@/lib/terminal/logger';
import { inspectRuntime, detectPlatform } from '@/lib/terminal/platform';
import { launchDesktopApp } from '@/lib/terminal/strategies/desktop-strategy';
import { launchAndroidApp, exitAndroidApp } from '@/lib/terminal/strategies/android-strategy';
import { launchIOSApp, exitIOSApp } from '@/lib/terminal/strategies/ios-strategy';
import { useTerminalStore } from '@/lib/terminal/terminal-store';
import type { CommandKind, DispatchResult, TargetPlatform } from '@/lib/terminal/types';

/**
 * Unified command parser & state machine.
 *
 * Ingest: raw string from any UI text field ("[>] launch notepad", "clear",
 * "exit", "gesture on", "help", or a bare catalog name).
 *
 * State machine:
 *   normalize -> tokenize -> classify -> resolve target -> pick platform strategy
 *           . -> execute with error boundaries -> log to terminal store
 *
 * Bare, unknown tokens are routed back to the chat pipeline when dispatched
 * through tryDispatchCommand (used by the chat text field) so AI chat still
 * receives them.
 */

export type CommandToken = 'clear' | 'exit' | 'help' | 'launch' | 'gesture';

export interface ParsedCommand {
  kind: CommandKind;
  app?: string;
  token?: CommandToken;
  gestureSub?: 'on' | 'off' | 'status';
  detail: string;
}

const LAUNCH_VERBS = new Set(['launch', 'open', 'run']);
const CLEAR_VERBS = new Set(['clear', 'cls']);
const EXIT_VERBS = new Set(['exit', 'quit', 'terminate']);
const HELP_VERBS = new Set(['help', '?', 'commands']);
const GESTURE_VERBS = new Set(['gesture', 'camera', 'hands']);
const COMMAND_TRIGGERS = new Set(['>', '!', '/']);

export function hasCommandTrigger(raw: string): boolean {
  const trimmed = raw.trim();
  return COMMAND_TRIGGERS.has(trimmed.charAt(0));
}

function stripTrigger(raw: string): string {
  const trimmed = raw.trim();
  if (COMMAND_TRIGGERS.has(trimmed.charAt(0))) return trimmed.slice(1).trim();
  return trimmed;
}

/** Tokenizes and classifies the raw input without executing anything. */
export function parseCommand(raw: string): ParsedCommand {
  const normalized = stripTrigger(raw);
  const tokens = normalized.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return { kind: 'noop', detail: 'Empty command.' };
  }

  const head = tokens[0]!.toLowerCase();

  if (LAUNCH_VERBS.has(head)) {
    const app = tokens[1];
    if (!app) {
      return { kind: 'launch', detail: `Usage: ${head} <app>. Run "help" for the catalog.` };
    }
    if (!getAppTarget(app)) {
      return { kind: 'launch', app, detail: `"${app}" is not in the app catalog. Run "help" to list targets.` };
    }
    return { kind: 'launch', app: getAppTarget(app)!.friendly, detail: `Launching "${app}".` };
  }

  if (CLEAR_VERBS.has(head)) {
    return { kind: 'clear', token: 'clear', detail: 'Clearing terminal output.' };
  }

  if (EXIT_VERBS.has(head)) {
    return { kind: 'exit', token: 'exit', detail: 'Requesting application exit routine.' };
  }

  if (HELP_VERBS.has(head)) {
    return { kind: 'help', token: 'help', detail: 'Showing command help.' };
  }

  if (GESTURE_VERBS.has(head)) {
    const sub = (tokens[1] || 'status').toLowerCase();
    const gestureSub = sub === 'on' || sub === 'off' || sub === 'status' ? sub : 'status';
    return {
      kind: 'gesture',
      token: 'gesture',
      gestureSub,
      detail: `Gesture ${gestureSub}.`,
    };
  }

  const bareApp = getAppTarget(tokens[0]);
  if (bareApp) {
    return { kind: 'launch', app: bareApp.friendly, detail: `Launching "${bareApp.friendly}".` };
  }

  if (COMMAND_TRIGGERS.has(raw.trim().charAt(0))) {
    return { kind: 'unknown', detail: `Unknown command "${raw.trim()}". Run "help" for the catalog.` };
  }

  return { kind: 'noop', detail: 'Not a terminal command (deferring to chat).' };
}

export function isBareCommand(parsed: ParsedCommand): boolean {
  return parsed.kind !== 'noop' && parsed.kind !== 'unknown';
}

/** Injects the launch/app catalog output into the terminal transcript. */
function printCatalog(): void {
  const { append } = useTerminalStore.getState();
  append({ level: 'info', source: 'router', text: 'Available app targets:' });
  for (const target of listAppTargets()) {
    append({
      level: 'info',
      source: 'router',
      text: `  ${target.friendly.padEnd(12)} ${target.description}`,
    });
  }
  append({ level: 'info', source: 'router', text: 'Commands: <app> | launch <app> | clear | exit | help | gesture on|off|status' });
}

async function executeLaunch(app: string): Promise<DispatchResult> {
  const startedAt = Date.now();
  const { append } = useTerminalStore.getState();
  const platform = detectPlatform();

  append({ level: 'info', source: 'router', text: `--> routing "${app}" to platform: ${platform}` });

  let strategy: () => Promise<{ ok: boolean; detail: string; error: string | null }>;
  let route: TargetPlatform = platform;

  switch (platform) {
    case 'win32':
    case 'darwin':
    case 'linux':
      strategy = () => launchDesktopApp(app);
      break;
    case 'android':
      strategy = () => launchAndroidApp(app);
      break;
    case 'ios':
      strategy = () => launchIOSApp(app);
      break;
    default:
      routerLog.warn('Unknown platform detected; falling back to desktop launcher', { platform });
      strategy = () => launchDesktopApp(app);
      route = 'unknown';
      break;
  }

  try {
    const outcome = await strategy();
    append({
      level: outcome.ok ? 'success' : 'error',
      source: 'strategy',
      text: outcome.detail,
    });
    return {
      handled: true,
      kind: 'launch',
      source: 'command-router',
      route,
      detail: outcome.detail,
      error: outcome.error,
      startedAt,
      finishedAt: Date.now(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    routerLog.error('Launch execution threw', error);
    append({ level: 'error', source: 'router', text: `Launch failed: ${message}` });
    return {
      handled: true,
      kind: 'launch',
      source: 'command-router',
      route,
      detail: message,
      error: message,
      startedAt,
      finishedAt: Date.now(),
    };
  }
}

async function executeExit(): Promise<DispatchResult> {
  const startedAt = Date.now();
  const { requestExit } = useTerminalStore.getState();
  requestExit();

  const platform = detectPlatform();
  let detail = 'Web fallback: closing window (browsers may block script-initiated close).';
  try {
    if (platform === 'android') {
      const result = await exitAndroidApp();
      detail = result.detail;
    } else if (platform === 'ios') {
      const result = await exitIOSApp();
      detail = result.detail;
    } else if (typeof window !== 'undefined') {
      window.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    routerLog.error('Exit routine threw', error);
    detail = message;
  }
  return {
    handled: true,
    kind: 'exit',
    source: 'command-router',
    route: platform,
    detail,
    error: null,
    startedAt,
    finishedAt: Date.now(),
  };
}

function executeHelp(): DispatchResult {
  const startedAt = Date.now();
  printCatalog();
  return {
    handled: true,
    kind: 'help',
    source: 'command-router',
    route: null,
    detail: 'Help printed to terminal output.',
    error: null,
    startedAt,
    finishedAt: Date.now(),
  };
}

/**
 * The gesture sub-machine lives in the browser gesture pipeline; this command
 * mutes/unmutes the camera loop through its registered controller. If no
 * controller is attached (e.g. no terminal page mounted), the store still
 * records the desired state.
 */
export interface GestureController {
  setEnabled(enabled: boolean): Promise<void>;
  getStatus(): { enabled: boolean; status: string; error: string | null };
  dispose(): Promise<void>;
}

let gestureController: GestureController | null = null;

export function registerGestureController(controller: GestureController): void {
  gestureController = controller;
  routerLog.info('Gesture controller registered with command router');
}

export function unregisterGestureController(controller: GestureController): void {
  if (gestureController === controller) {
    gestureController = null;
  }
}

function executeGesture(sub: 'on' | 'off' | 'status'): DispatchResult {
  const startedAt = Date.now();
  const { append, setGestureEnabled } = useTerminalStore.getState();

  let detail: string;
  try {
    if (sub === 'status') {
      const status = gestureController ? gestureController.getStatus() : { enabled: false, status: 'idle', error: null };
      detail = `Gesture engine: ${status.enabled ? 'enabled' : 'disabled'} (${status.status})${status.error ? ` — ${status.error}` : ''}`;
    } else {
      const next = sub === 'on';
      setGestureEnabled(next);
      if (gestureController) {
        void gestureController.setEnabled(next).catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          append({ level: 'error', source: 'gesture', text: `Gesture engine error: ${message}` });
          routerLog.error('Gesture enable failed', error);
        });
        detail = next ? 'Requesting camera + gesture engine...' : 'Stopping gesture engine...';
      } else {
        detail = next
          ? 'Gesture controller unavailable here; state toggled (open a Terminal session to attach the camera pipeline).'
          : 'Gesture engine disabled.';
      }
    }
  } catch (error) {
    detail = error instanceof Error ? error.message : String(error);
    routerLog.error('Gesture command threw', error);
  }
  append({ level: 'info', source: 'router', text: detail });

  return {
    handled: true,
    kind: 'gesture',
    source: 'command-router',
    route: null,
    detail,
    error: null,
    startedAt,
    finishedAt: Date.now(),
  };
}

function executeUnknown(parsed: ParsedCommand): DispatchResult {
  const { append } = useTerminalStore.getState();
  append({ level: 'error', source: 'router', text: parsed.detail });
  return {
    handled: true,
    kind: 'unknown',
    source: 'command-router',
    route: null,
    detail: parsed.detail,
    error: parsed.detail,
    startedAt: Date.now(),
    finishedAt: Date.now(),
  };
}

/**
 * Full pipeline entry point. Executes and logs the command into the terminal
 * store. Used by the virtual terminal prompt and gesture sub-machine caller.
 */
export async function dispatchCommand(rawInput: string): Promise<DispatchResult> {
  const startedAt = Date.now();
  routerLog.info('Command router ingesting input', rawInput);

  let parsed: ParsedCommand;
  try {
    parsed = parseCommand(rawInput);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    routerLog.error('Command parse failed', error);
    useTerminalStore.getState().append({ level: 'error', source: 'router', text: `Parse error: ${message}` });
    return { handled: true, kind: 'unknown', source: 'command-router', route: null, detail: message, error: message, startedAt, finishedAt: Date.now() };
  }

  try {
    switch (parsed.kind) {
      case 'launch':
        if (!parsed.app) {
          useTerminalStore.getState().append({ level: 'warn', source: 'router', text: parsed.detail });
          return { handled: true, kind: 'launch', source: 'command-router', route: null, detail: parsed.detail, error: parsed.detail, startedAt, finishedAt: Date.now() };
        }
        return await executeLaunch(parsed.app);
      case 'clear':
        useTerminalStore.getState().clear();
        return { handled: true, kind: 'clear', source: 'command-router', route: null, detail: 'Terminal cleared.', error: null, startedAt, finishedAt: Date.now() };
      case 'exit':
        return await executeExit();
      case 'help':
        return executeHelp();
      case 'gesture':
        return executeGesture(parsed.gestureSub ?? 'status');
      case 'unknown':
        return executeUnknown(parsed);
      case 'noop':
      default:
        return { handled: false, kind: 'noop', source: 'command-router', route: null, detail: parsed.detail, error: null, startedAt, finishedAt: Date.now() };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    routerLog.error('Unhandled error inside command dispatch', error);
    useTerminalStore.getState().append({ level: 'error', source: 'router', text: `Command aborted: ${message}` });
    return { handled: true, kind: 'unknown', source: 'command-router', route: null, detail: message, error: message, startedAt, finishedAt: Date.now() };
  }
}

/**
 * Interceptor for the chat text field. Returns true when the input was consumed
 * as a terminal command so the chat pipeline should NOT send it to the model.
 */
export async function tryDispatchCommand(rawInput: string): Promise<boolean> {
  if (!rawInput.trim()) return false;
  if (!hasCommandTrigger(rawInput)) return false;
  const result = await dispatchCommand(rawInput);
  return result.handled;
}

export function getRuntimeOverview(): ReturnType<typeof inspectRuntime> {
  return inspectRuntime();
}

/** Wires the store prompt into this router (idempotent, browser-only). */
export function attachRouterToStore(): void {
  const { setCommandHandler } = useTerminalStore.getState();
  setCommandHandler((input: string) => {
    void dispatchCommand(input);
  });
  routerLog.info('Command router attached to terminal store');
}

if (typeof window !== 'undefined') {
  routerLog.info('Runtime bridge status', inspectRuntime());
}