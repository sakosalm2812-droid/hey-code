// src/engines/rendering/manifest.ts
// Feature Registry manifest for Engine 9: Rendering

import { createRenderingEngine, type RenderingConfig } from './RenderingEngine';
import { logToCosmos } from '../../core/cosmosMemory';
import type { FeatureManifest } from '../../core/featureRegistry';

export const RenderingEngineManifest: FeatureManifest = {
  id: 'rendering',
  name: 'Rendering Engine',
  description: 'Frame rendering, framebuffer management, and visual output engine',
  version: '1.0.0',
  engine: createRenderingEngine,
  configSchema: {
    type: 'object',
    properties: {
      framesPerSecond: {
        type: 'number',
        default: 60,
        description: 'Target frames per second',
      },
      framebufferWidth: {
        type: 'number',
        default: 1920,
        description: 'Framebuffer width in pixels',
      },
      framebufferHeight: {
        type: 'number',
        default: 1080,
        description: 'Framebuffer height in pixels',
      },
      maxFramesInFlight: {
        type: 'number',
        default: 2,
        description: 'Maximum frames in flight for pipelining',
      },
      hcuBudgetPerHour: {
        type: 'number',
        default: 1.0,
        description: 'HCU budget per hour for rendering operations',
      },
      enableVSync: {
        type: 'boolean',
        default: true,
        description: 'Enable vertical sync',
      },
    },
    required: [],
    additionalProperties: false,
  },
  hcuCostPerOperation: {
    frame_create: 0.001,
    frame_render: 0.01,
    config_change: 0.005,
  },
  ui: {
    dashboardComponent: 'RenderingDashboard',
    settingsComponent: 'RenderingSettings',
  },
};

export default RenderingEngineManifest;