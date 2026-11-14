// src/engines/nativeMessaging/manifest.ts
// Feature Registry manifest for Engine 16: Native Messaging

import { createNativeMessagingEngine, type NativeMessagingConfig } from './nativeMessagingEngine';
import { logToCosmos } from '../../core/cosmosMemory';
import type { FeatureManifest } from '../../core/featureRegistry';

export const NativeMessagingEngineManifest: FeatureManifest = {
  id: 'native_messaging',
  name: 'Native Messaging',
  description: 'Communication via native messaging host integration',
  version: '1.0.0',
  engine: createNativeMessagingEngine,
  configSchema: {
    type: 'object',
    properties: {
      enabled: {
        type: 'boolean',
        default: false,
        description: 'Whether native messaging is enabled',
      },
      origin: {
        type: 'string',
        default: '',
        description: 'Native messaging host origin',
      },
      platforms: {
        type: 'array',
        items: { type: 'string' },
        default: ['windows', 'linux', 'mac'],
        description: 'Supported platforms',
      },
      hcuBudgetPerHour: {
        type: 'number',
        default: 0.5,
        description: 'HCU budget per hour',
      },
      maxMessageSize: {
        type: 'number',
        default: 65536,
        description: 'Maximum message size in bytes',
      },
      retryAttempts: {
        type: 'number',
        default: 3,
        description: 'Number of retry attempts for failed messages',
      },
    },
    required: [],
    additionalProperties: false,
  },
  hcuCostPerOperation: {
    enable: 0.001,
    disable: 0.001,
    send: 0.001,
    config_change: 0.005,
  },
  ui: {
    dashboardComponent: 'NativeMessagingDashboard',
    settingsComponent: 'NativeMessagingSettings',
  },
};

export default NativeMessagingEngineManifest;