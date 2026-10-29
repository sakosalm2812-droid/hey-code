'use client';

import { getAppTarget } from '@/lib/terminal/app-catalog';
import { strategyLog } from '@/lib/terminal/logger';
import { hasAndroidBridge } from '@/lib/terminal/platform';
import type { StrategyResult } from '@/lib/terminal/strategies/desktop-strategy';

/**
 * Android target routing.
 *
 * The bridge surface `window.heyAndroid` is injected by
 * native/android/app/src/main/java/com/hey/app/MainActivity.kt. The Kotlin side
 * resolves `packageManager.getLaunchIntentForPackage(packageName)` inside a
 * try/catch and starts the activity. Here we only resolve the package name from
 * the shared catalog and marshal the call.
 */

function androidBridge():
  | NonNullable<typeof window.heyAndroid>
  | NonNullable<typeof window.__heyAndroidTestBridge__>
  | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.heyAndroid ?? window.__heyAndroidTestBridge__ ?? null;
  } catch (error) {
    strategyLog.error('Android bridge lookup failed', error);
    return null;
  }
}

export function isAndroidBridgeAvailable(): boolean {
  return hasAndroidBridge();
}

const message = (ok: boolean, detail: string, error: string | null): StrategyResult => ({
  ok,
  detail,
  error,
});

export async function launchAndroidApp(friendlyName: string): Promise<StrategyResult> {
  const app = getAppTarget(friendlyName);
  if (!app) {
    const error = `Unknown app "${friendlyName}". Run "help" for the app catalog.`;
    return message(false, error, error);
  }
  if (!app.android) {
    const error = `"${friendlyName}" is not bundled on Android (no package in catalog).`;
    strategyLog.warn('Android launch rejected: empty package', error);
    return message(false, error, error);
  }

  const bridge = androidBridge();
  if (!bridge || typeof bridge.launchApp !== 'function') {
    const error = 'Android native bridge (window.heyAndroid) is not attached.';
    strategyLog.error('Android bridge missing', error);
    return message(false, error, error);
  }

  try {
    strategyLog.info('Dispatching Android launch', { friendlyName, packageName: app.android });
    const raw = bridge.launchApp(app.android);
    let parsed: { ok?: boolean; message?: string } = {};
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : {};
    } catch (parseError) {
      strategyLog.warn('Android bridge returned non-JSON reply', { raw, parseError });
    }
    const ok = parsed.ok !== false;
    const detail = parsed.message || (ok ? `Launched ${app.android}` : `Android refused to launch ${app.android}`);
    if (!ok) {
      strategyLog.warn('Android bridge reported failure', detail);
      return message(false, detail, detail);
    }
    strategyLog.info('Android launch succeeded', { friendlyName, packageName: app.android });
    return message(true, detail, null);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    strategyLog.error('Android bridge call threw', error);
    return message(false, detail, detail);
  }
}

export async function exitAndroidApp(): Promise<StrategyResult> {
  const bridge = androidBridge();
  if (!bridge || typeof bridge.exitApp !== 'function') {
    return message(false, 'Android exit routine unavailable (bridge missing).', 'Android exit routine unavailable');
  }
  try {
    bridge.exitApp();
    strategyLog.info('Android exit routine invoked through native channel');
    return message(true, 'Android exit routine invoked.', null);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    strategyLog.error('Android exit call threw', error);
    return message(false, detail, detail);
  }
}