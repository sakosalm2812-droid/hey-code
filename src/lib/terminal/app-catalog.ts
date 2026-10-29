/**
 * Friendly-name -> platform target catalog for the command router.
 *
 * Single source of truth consumed by BOTH:
 *  - the browser strategies (android-strategy resolves package names, ios-strategy
 *    forwards friendly names, desktop-strategy forwards friendly names),
 *  - the Node API route src/app/api/terminal/launch which resolves these tokens into
 *    allowlisted sub-process argv.
 *
 * No free-form user input is ever executed; the router only ever resolves against
 * this fixed dictionary.
 */

import type { AppTarget } from '@/lib/terminal/types';

export interface AppCatalogEntry extends AppTarget {
  description: string;
}

const APP_TARGETS: AppCatalogEntry[] = [
  {
    friendly: 'calculator',
    description: 'System / calculator app',
    windows: 'calc.exe',
    macos: 'Calculator',
    linux: 'gnome-calculator',
    android: 'com.android.calculator2',
    ios: 'calculator://',
  },
  {
    friendly: 'notepad',
    description: 'Plain-text editor',
    windows: 'notepad.exe',
    macos: 'TextEdit',
    linux: 'gedit',
    android: '',
    ios: '',
  },
  {
    friendly: 'spotify',
    description: 'Spotify music',
    windows: 'Spotify:',
    macos: 'Spotify',
    linux: 'spotify',
    android: 'com.spotify.music',
    ios: 'spotify://',
  },
  {
    friendly: 'maps',
    description: 'Maps application',
    windows: 'bingmaps:',
    macos: 'Maps',
    linux: 'gnome-maps',
    android: 'com.google.android.apps.maps',
    ios: 'maps://',
  },
  {
    friendly: 'settings',
    description: 'System settings',
    windows: 'ms-settings:',
    macos: 'System Settings',
    linux: 'gnome-control-center',
    android: 'com.android.settings',
    ios: 'app-settings:',
  },
  {
    friendly: 'browser',
    description: 'Default web browser',
    windows: 'msedge.exe',
    macos: 'Safari',
    linux: 'firefox',
    android: '',
    ios: 'https://',
  },
  {
    friendly: 'calendar',
    description: 'Calendar application',
    windows: 'outlookcal:',
    macos: 'Calendar',
    linux: 'gnome-calendar',
    android: 'com.google.android.calendar',
    ios: 'calshow://',
  },
  {
    friendly: 'files',
    description: 'File manager',
    windows: 'explorer.exe',
    macos: 'Finder',
    linux: 'nautilus',
    android: 'com.android.documentsui',
    ios: 'shareddocuments://',
  },
  {
    friendly: 'messages',
    description: 'Messaging application',
    windows: 'mssettings:messaging',
    macos: 'Messages',
    linux: '',
    android: 'com.google.android.apps.messaging',
    ios: 'sms:',
  },
];

const CATALOG: ReadonlyMap<string, AppCatalogEntry> = new Map(
  APP_TARGETS.map((entry) => [entry.friendly, entry])
);

export function getAppTarget(friendlyName: string): AppCatalogEntry | null {
  return CATALOG.get(friendlyName.trim().toLowerCase()) ?? null;
}

export function listAppTargets(): readonly AppCatalogEntry[] {
  return APP_TARGETS;
}