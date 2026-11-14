// src/engines/modes/manifest.ts
// Engine 14: Modes — Manifest for Feature Registry

import type { FeatureManifest } from '../../core/registry/FeatureRegistry';
import { ModesEngine, createModesEngine } from './ModesEngine';
import type { ModesConfig } from './types';

export const modesManifest: FeatureManifest = {
  id: 'modes',
  name: 'Modes',
  description: 'Adaptive behavioral modes with automatic triggers and engine configuration',
  version: '1.0.0',
  engine: 'modes',
  category: 'intelligence',
  enabled: true,
  dependencies: ['cosmos', 'costGovernor', 'ownerConsole'],
  capabilities: [
    'modes.activate',
    'modes.deactivate',
    'modes.schedule',
    'modes.triggers',
    'modes.transitions',
    'modes.health',
  ],
  configSchema: {
    defaultMode: { type: 'string', enum: ['focus', 'creative', 'learning', 'rest', 'social', 'admin', 'emergency', 'custom'], default: 'focus' },
    allowManualOverride: { type: 'boolean', default: true },
    transitionCooldownMs: { type: 'number', min: 1000, max: 60000, default: 5000 },
    persistActiveMode: { type: 'boolean', default: true },
    hcuBudgetPerHour: { type: 'number', min: 0.1, max: 5, default: 0.5 },
  },
  defaultConfig: {
    defaultMode: 'focus',
    allowManualOverride: true,
    transitionCooldownMs: 5000,
    persistActiveMode: true,
    hcuBudgetPerHour: 0.5,
  },
  createEngine: (config?: ModesConfig) => createModesEngine(config),
  ui: {
    dashboard: () => import('./ModesDashboard').then(m => m.ModesDashboard),
    settings: () => import('./ModesSettings').then(m => m.ModesSettings),
  },
  hcuCostPerOperation: {
    'modes.activate': 0.01,
    'modes.deactivate': 0.005,
    'modes.schedule': 0.001,
    'modes.triggers': 0.001,
    'modes.transitions': 0.001,
    'modes.health': 0.001,
  },
};

export default modesManifest;