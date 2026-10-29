'use client';

import { getAppTarget } from '@/lib/terminal/app-catalog';
import { strategyLog } from '@/lib/terminal/logger';

/**
 * Desktop target routing.
 *
 * The browser cannot spawn sub-processes, so the desktop strategy delegates to the
 * Next.js Node runtime via POST /api/terminal/launch. The server resolves the
 * friendly name against the SAME allowlisted catalog and execs the platform-native
 * shell path launcher (cmd `start` on Windows, `open -a` on macOS, PATH binary on
 * Linux). User input never reaches the shell as free text.
 */

export interface StrategyResult {
  ok: boolean;
  detail: string;
  error: string | null;
}

export const LAUNCH_ENDPOINT = '/api/terminal/launch';

export async function launchDesktopApp(friendlyName: string): Promise<StrategyResult> {
  const app = getAppTarget(friendlyName);
  if (!app) {
    const error = `Unknown app "${friendlyName}". Run "help" for the app catalog.`;
    strategyLog.warn('Desktop launch rejected: not in catalog', error);
    return { ok: false, detail: error, error };
  }

  try {
    strategyLog.info('Dispatching desktop launch', { friendlyName, target: app });
    const response = await fetch(LAUNCH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: app.friendly }),
    });

    let body: { ok: boolean; detail?: string; error?: string } = { ok: false };
    try {
      body = await response.json();
    } catch (parseError) {
      strategyLog.warn('Launch response was not JSON', parseError);
    }

    if (!response.ok || !body.ok) {
      const error = body.error || body.detail || `Launcher responded with HTTP ${response.status}`;
      strategyLog.error('Desktop launch failed remotely', error);
      return { ok: false, detail: body.detail || error, error };
    }

    strategyLog.info('Desktop launch acknowledged', body);
    return { ok: true, detail: body.detail || `Launched ${app.friendly} on this device.`, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    strategyLog.error('Desktop bridge request failed', error);
    return { ok: false, detail: message, error: message };
  }
}

export function isDesktopLaunchSupported(): boolean {
  return typeof fetch === 'function';
}