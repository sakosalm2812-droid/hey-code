// src/engines/ownerConsole/manifest.ts
// Engine 13: Owner Console — Manifest for Feature Registry

import type { FeatureManifest } from '../../core/registry/FeatureRegistry';
import { OwnerConsoleEngine, createOwnerConsoleEngine } from './OwnerConsoleEngine';
import type { OwnerConfig } from './types';

export const ownerConsoleManifest: FeatureManifest = {
  id: 'ownerConsole',
  name: 'Owner Console',
  description: 'System-wide command, control, and override for all HEY engines',
  version: '1.0.0',
  engine: 'ownerConsole',
  category: 'control',
  enabled: true,
  dependencies: ['cosmos', 'costGovernor', 'safetyTrio'],
  capabilities: [
    'owner.engine_control',
    'owner.budget_management',
    'owner.global_stop',
    'owner.emergency_override',
    'owner.broadcast',
    'owner.snapshot',
    'owner.health',
  ],
  configSchema: {
    engines: {
      type: 'object',
      properties: {},
      additionalProperties: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', default: true },
          hcuBudget: { type: 'number', min: 0, max: 50, default: 1.0 },
        },
      },
    },
    globalHCUBudgetPerHour: { type: 'number', min: 1, max: 200, default: 50.0 },
    emergencyStopEnabled: { type: 'boolean', default: true },
    autoRestartFailedEngines: { type: 'boolean', default: false },
    maxConcurrentCommands: { type: 'number', min: 1, max: 20, default: 5 },
    commandTimeoutMs: { type: 'number', min: 5000, max: 300000, default: 30000 },
    broadcastEnabled: { type: 'boolean', default: true },
  },
  defaultConfig: {
    engines: {},
    globalHCUBudgetPerHour: 50.0,
    emergencyStopEnabled: true,
    autoRestartFailedEngines: false,
    maxConcurrentCommands: 5,
    commandTimeoutMs: 30000,
    broadcastEnabled: true,
  },
  createEngine: (config?: OwnerConfig) => createOwnerConsoleEngine(config),
  ui: {
    dashboard: () => import('./OwnerConsoleDashboard').then(m => m.OwnerConsoleDashboard),
    settings: () => import('./OwnerConsoleSettings').then(m => m.OwnerConsoleSettings),
  },
  hcuCostPerOperation: {
    'owner.engine_control': 0.01,
    'owner.budget_management': 0.005,
    'owner.global_stop': 0.05,
    'owner.emergency_override': 0.1,
    'owner.broadcast': 0.01,
    'owner.snapshot': 0.02,
    'owner.health': 0.001,
  },
};

export default ownerConsoleManifest;