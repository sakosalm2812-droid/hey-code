// src/engines/neverCutOff/manifest.ts
// Feature Registry manifest for Engine 15: Never Cut Off

import { createEngine, type FeatureManifest } from '../../core/featureRegistry';
import type { AvailabilityConfig } from './types';

export const NeverCutOffManifest: FeatureManifest = {
  id: 'never_cutoff',
  name: 'Never Cut Off',
  description: 'Continuous availability, offline-first engine with connectivity management, offline queue, and sync operations',
  version: '1.0.0',
  engine: createNeverCutOffEngine,
  configSchema: {
    type: 'object',
    properties: {
      minConnectivityCheckIntervalMs: {
        type: 'number',
        default: 30000,
        description: 'Interval in milliseconds between connectivity checks',
      },
      maxOfflineQueueSize: {
        type: 'number',
        default: 1000,
        description: 'Maximum number of operations to queue offline',
      },
      syncIntervalMs: {
        type: 'number',
        default: 60000,
        description: 'Interval in milliseconds between sync cycles',
      },
      retryBaseDelayMs: {
        type: 'number',
        default: 1000,
        description: 'Base delay in milliseconds for retry exponential backoff',
      },
      maxRetryDelayMs: {
        type: 'number',
        default: 60000,
        description: 'Maximum delay in milliseconds for retry exponential backoff',
      },
      criticalOperations: {
        type: 'array',
        items: { type: 'string' },
        default: ['computer_control', 'filesystem_write', 'external_communication'],
        description: 'Operations that can be processed even when offline',
      },
      hcuBudgetPerHour: {
        type: 'number',
        default: 0.5,
        description: 'HCU budget per hour for this engine',
      },
    },
    required: [],
    additionalProperties: false,
  },
  hcuCostPerOperation: {
    connectivity_check: 0.001,
    queue_add: 0.001,
    queue_process: 0.001,
    sync_start: 0.005,
    sync_complete: 0.005,
    sync_failed: 0.01,
  },
  ui: {
    dashboardComponent: 'NeverCutOffDashboard',
    settingsComponent: 'NeverCutOffSettings',
  },
};

export default NeverCutOffManifest;