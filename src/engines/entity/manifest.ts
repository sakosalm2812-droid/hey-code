// src/engines/entity/manifest.ts
// Feature Registry manifest for Engine 8: Entity

import { createEntityEngine, type EntityConfig } from './EntityEngine';
import { logToCosmos } from '../../core/cosmosMemory';
import type { FeatureManifest } from '../../core/featureRegistry';

export const EntityEngineManifest: FeatureManifest = {
  id: 'entity',
  name: 'Entity Engine',
  description: 'Generic entity management engine that powers 400+ features with CRUD, state-management, persistence, and sense integrations',
  version: '1.0.0',
  engine: createEntityEngine,
  configSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Entity engine ID' },
      name: { type: 'string', description: 'Entity name' },
      path: { type: 'string', description: 'Entity path' },
      icon: { type: 'string', description: 'Entity icon' },
      fields: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            label: { type: 'string' },
            type: { type: 'string' },
            required: { type: 'boolean' },
            default: { },
            options: { type: 'array' },
            placeholder: { type: 'string' },
          },
          required: ['name', 'label', 'type'],
        },
        description: 'Entity fields definition',
      },
      views: {
        type: 'array',
        items: { enum: ['list', 'kanban', 'calendar', 'timeline'] },
        description: 'Available entity views',
      },
      integrations: {
        type: 'object',
        properties: {
          voice: { type: 'boolean' },
          vision: { type: 'boolean' },
          gesture: { type: 'boolean' },
          memory: { type: 'boolean' },
          agent: { type: 'string' },
          proactive: { type: 'boolean' },
          crossDevice: { type: 'boolean' },
          automation: { type: 'boolean' },
          verification: { type: 'boolean' },
          pinsThroughTrust: { type: 'boolean' },
          senses: {
            type: 'array',
            items: { enum: ['voice', 'vision', 'gesture', 'stylus', 'screen', 'os', 'mesh'] },
          },
        },
        required: ['voice', 'vision', 'gesture', 'memory', 'agent', 'proactive', 'crossDevice', 'automation', 'verification', 'pinsThroughTrust', 'senses'],
      },
      derived: { },
      hcuBudgetPerHour: { type: 'number', default: 1.0 },
    },
    required: [],
    additionalProperties: false,
  },
  hcuCostPerOperation: {
    create: 0.01,
    read: 0.001,
    update: 0.005,
    delete: 0.005,
    voice_command: 0.02,
  },
  ui: {
    dashboardComponent: 'EntityDashboard',
    settingsComponent: 'EntitySettings',
  },
};

export default EntityEngineManifest;