'use client';

import type { TargetPlatform } from '@/lib/terminal/types';
import { terminalLog } from '@/lib/terminal/logger';

/**
 * Runtime platform detection for the command router.
 *
 * The app ships as a Next.js web application: desktop routes are reachable in any
 * browser (the Node API route is the launcher), while Android/iOS routes are only
 * reachable when the app is embedded in the native webview shells under /native.
 * Detection therefore reads both the navigator user agent (to know the OS the
 * browser is running on) and the presence of the native bridge objects (to know
 * whether the native channel is actually attached).
 */

const ANDROID_UA = /Android/i;
const IOS_UA = /iPhone|iPad|iPod/i;
const MAC_UA = /Macintosh|Mac OS X/i;
const LINUX_UA = /Linux/i;
const WINDOWS_UA = /Windows NT/i;

export function detectPlatform(userAgent?: string): TargetPlatform {
  try {
    if (typeof navigator === 'undefined') {
      return typeof process !== 'undefined' && process.platform
        ? (process.platform as TargetPlatform)
        : 'unknown';
    }
    const ua = userAgent ?? navigator.userAgent;
    if (IOS_UA.test(ua)) return 'ios';
    if (ANDROID_UA.test(ua)) return 'android';
    if (WINDOWS_UA.test(ua)) return 'win32';
    if (MAC_UA.test(ua)) return 'darwin';
    if (LINUX_UA.test(ua)) return 'linux';
    terminalLog.warn('Unrecognized user agent, falling back to unknown platform', ua);
    return 'unknown';
  } catch (error) {
    terminalLog.error('Platform detection failed', error);
    return 'unknown';
  }
}

interface AndroidBridgeSurface {
  launchApp?: (packageName: string) => string;
  canLaunchApp?: (packageName: string) => boolean;
  exitApp?: () => void;
}

declare global {
  interface Window {
    /** Injected by native/android/.../MainActivity.kt when the app runs embedded. */
    heyAndroid?: AndroidBridgeSurface;
    /** Companion injected surface used by bridge-less CI/SSR environments. */
    __heyAndroidTestBridge__?: AndroidBridgeSurface;
    /** WebKit bridge surface exposed when the app runs inside the iOS WKWebView shell. */
    webkit?: {
      messageHandlers: Record<string, { postMessage(value: unknown): void }>;
    };
  }
}

export function hasAndroidBridge(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      window !== null &&
      (typeof window.heyAndroid?.launchApp === 'function' ||
        typeof window.__heyAndroidTestBridge__?.launchApp === 'function')
    );
  } catch (error) {
    terminalLog.error('Android bridge probe failed', error);
    return false;
  }
}

function webkitMessageHandlerNames(): string[] {
  try {
    if (typeof window === 'undefined' || !window.webkit?.messageHandlers) return [];
    return Object.keys(window.webkit.messageHandlers);
  } catch (error) {
    terminalLog.warn('webkit message handler enumeration failed', error);
    return [];
  }
}

/** Name of the iOS script message handler registered by HeyCommandBridge.swift. */
export const IOS_BRIDGE_HANDLER = 'heyCommand';

export function hasIOSBridge(): boolean {
  try {
    return typeof window !== 'undefined' && webkitMessageHandlerNames().includes(IOS_BRIDGE_HANDLER);
  } catch (error) {
    terminalLog.error('iOS bridge probe failed', error);
    return false;
  }
}

export interface BridgeStatus {
  platform: TargetPlatform;
  androidBridge: boolean;
  iosBridge: boolean;
  /** True when the runtime can reach the desktop Node launcher. */
  desktopReachable: boolean;
}

export function inspectRuntime(userAgent?: string): BridgeStatus {
  return {
    platform: detectPlatform(userAgent),
    androidBridge: hasAndroidBridge(),
    iosBridge: hasIOSBridge(),
    desktopReachable: typeof navigator !== 'undefined' && typeof fetch === 'function',
  };
}