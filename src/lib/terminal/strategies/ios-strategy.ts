'use client';

import { getAppTarget } from '@/lib/terminal/app-catalog';
import { strategyLog } from '@/lib/terminal/logger';
import { IOS_BRIDGE_HANDLER } from '@/lib/terminal/platform';
import type { StrategyResult } from '@/lib/terminal/strategies/desktop-strategy';

/**
 * iOS / iPadOS target routing through the Objective-C/Swift native bridge.
 *
 * The WKScriptMessageHandler named `heyCommand` (registered by
 * native/ios/HeyCommandBridge.swift) owns the friendly-name -> URL scheme
 * dictionary and runs `UIApplication.shared.canOpenURL(url)` before
 * `UIApplication.shared.open(...)`. This side only forwards the friendly name so
 * the dictionary stays authoritative on the native layer, per spec.
 */

interface IOSPayload {
  action: 'launchApp' | 'exitApp';
  app?: string;
}

function postToBridge(payload: IOSPayload): void {
  if (typeof window === 'undefined') {
    throw new Error('window is undefined outside the browser.');
  }
  const handlers = window.webkit?.messageHandlers;
  if (!handlers || !handlers[IOS_BRIDGE_HANDLER]) {
    throw new Error(`iOS native bridge (${IOS_BRIDGE_HANDLER}) is not attached.`);
  }
  handlers[IOS_BRIDGE_HANDLER].postMessage(payload);
}

export function isIOSBridgeAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return Boolean(window.webkit?.messageHandlers?.[IOS_BRIDGE_HANDLER]);
  } catch (error) {
    strategyLog.error('iOS bridge availability probe failed', error);
    return false;
  }
}

const message = (ok: boolean, detail: string, error: string | null): StrategyResult => ({
  ok,
  detail,
  error,
});

export async function launchIOSApp(friendlyName: string): Promise<StrategyResult> {
  const app = getAppTarget(friendlyName);
  if (!app) {
    const error = `Unknown app "${friendlyName}". Run "help" for the app catalog.`;
    return message(false, error, error);
  }
  if (!app.ios) {
    const error = `"${friendlyName}" has no iOS URL scheme in the catalog.`;
    strategyLog.warn('iOS launch rejected: empty scheme', error);
    return message(false, error, error);
  }

  try {
    strategyLog.info('Dispatching iOS launch', { friendlyName, schemeHint: app.ios });
    postToBridge({ action: 'launchApp', app: app.friendly });
    strategyLog.info('iOS launch message accepted by WebKit bridge');
    return message(true, `Forwarded "${app.friendly}" to the iOS URL scheme bridge.`, null);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    strategyLog.error('iOS bridge postMessage threw', error);
    return message(false, detail, detail);
  }
}

export async function exitIOSApp(): Promise<StrategyResult> {
  try {
    postToBridge({ action: 'exitApp' });
    strategyLog.info('iOS exit routine message accepted by WebKit bridge');
    return message(true, 'Forwarded exit request to the iOS bridge.', null);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    strategyLog.error('iOS exit postMessage threw', error);
    return message(false, detail, detail);
  }
}