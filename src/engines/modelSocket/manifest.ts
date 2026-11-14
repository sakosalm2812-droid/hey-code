// src/engines/modelSocket/manifest.ts
// Feature Registry manifest for Engine 18: 86B Model Socket

import { createModelSocketEngine, type ModelSocketConfig } from './ModelSocketEngine';
import { logToCosmos } from '../../core/cosmosMemory';
import type { FeatureManifest } from '../../core/featureRegistry';

export const ModelSocketEngineManifest: FeatureManifest = {
  id: 'model_socket',
  name: '86B Model Socket',
  description: 'High-capacity model inference via llama.cpp HTTP API',
  version: '1.0.0',
  engine: createModelSocketEngine,
  configSchema: {
    type: 'object',
    properties: {
      modelPath: {
        type: 'string',
        description: 'Path to llama.cpp model file',
      },
      host: {
        type: 'string',
        default: 'localhost',
        description: 'Model socket host',
      },
      port: {
        type: 'number',
        default: 8080,
        description: 'Model socket port',
      },
      modelName: {
        type: 'string',
        default: 'default',
        description: 'Model name identifier',
      },
      contextLength: {
        type: 'number',
        default: 4096,
        description: 'Maximum context length in tokens',
      },
      temperature: {
        type: 'number',
        default: 0.7,
        description: 'Sampling temperature',
      },
      maxTokens: {
        type: 'number',
        default: 2048,
        description: 'Maximum tokens per inference',
      },
      hcuBudgetPerHour: {
        type: 'number',
        default: 5.0,
        description: 'HCU budget per hour for inference',
      },
      concurrentRequests: {
        type: 'number',
        default: 4,
        description: 'Maximum concurrent inference requests',
      },
    },
    required: [],
    additionalProperties: false,
  },
  hcuCostPerOperation: {
    infer: 0.01,
    configChange: 0.005,
    connect: 0.001,
  },
  ui: {
    dashboardComponent: 'ModelSocketDashboard',
    settingsComponent: 'ModelSocketSettings',
  },
};

export default ModelSocketEngineManifest;