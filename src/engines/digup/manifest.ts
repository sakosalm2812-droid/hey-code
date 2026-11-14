// src/engines/digup/manifest.ts
// Feature Registry manifest for Engine 19: Digup

import { createDigupEngine, type DigupConfig } from './DigupEngine';
import { logToCosmos } from '../../core/cosmosMemory';
import type { FeatureManifest } from '../../core/featureRegistry';

export const DigupEngineManifest: FeatureManifest = {
  id: 'digup',
  name: 'Digup',
  description: 'Semantic file search and discovery across platforms',
  version: '1.0.0',
  engine: createDigupEngine,
  configSchema: {
    type: 'object',
    properties: {
      enabled: {
        type: 'boolean',
        default: false,
        description: 'Whether digup search is enabled',
      },
      indexRoots: {
        type: 'array',
        items: { type: 'string' },
        default: ['~'],
        description: 'Root directories to index',
      },
      fileTypes: {
        type: 'array',
        items: { type: 'string' },
        default: ['.txt', '.md', '.js', '.ts', '.jsx', '.tsx'],
        description: 'File types to search',
      },
      maxConcurrentScans: {
        type: 'number',
        default: 2,
        description: 'Maximum concurrent scanning processes',
      },
      hcuBudgetPerHour: {
        type: 'number',
        default: 0.5,
        description: 'HCU budget per hour for digup operations',
      },
    },
    required: [],
    additionalProperties: false,
  },
  hcuCostPerOperation: {
    search: 0.001,
    index: 0.01,
    configChange: 0.005,
  },
  ui: {
    dashboardComponent: 'DigupDashboard',
    settingsComponent: 'DigupSettings',
  },
};

export default DigupEngineManifest;