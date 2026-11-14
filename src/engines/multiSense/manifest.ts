// src/engines/multiSense/manifest.ts
// Engine 7: Multi-Sense Control — Manifest for Feature Registry

import type { FeatureManifest } from '../../core/registry/FeatureRegistry';
import { MultiSenseEngine, createMultiSenseEngine } from './MultiSenseEngine';
import type { MultiSenseConfig } from './types';

export const multiSenseManifest: FeatureManifest = {
  id: 'multiSense',
  name: 'Multi-Sense Control',
  description: 'Multi-modal sensory integration: vision, audio, tactile, spatial, biometric fusion',
  version: '1.0.0',
  engine: 'multiSense',
  category: 'perception',
  enabled: true,
  dependencies: ['cosmos', 'costGovernor'],
  capabilities: [
    'sense.activate',
    'sense.deactivate',
    'sense.receive_input',
    'sense.fusion',
    'sense.calibration',
    'sense.health',
  ],
  configSchema: {
    enabledSenses: { type: 'array', items: { type: 'string', enum: ['vision', 'audio', 'tactile', 'spatial', 'biometric'] }, default: ['vision', 'audio', 'spatial'] },
    fusionIntervalMs: { type: 'number', min: 1000, max: 60000, default: 5000 },
    minConfidenceThreshold: { type: 'number', min: 0.1, max: 1, default: 0.5 },
    hcuBudgetPerMinute: { type: 'number', min: 0.5, max: 20, default: 3.0 },
    autoCalibrate: { type: 'boolean', default: true },
  },
  defaultConfig: {
    enabledSenses: ['vision', 'audio', 'spatial'],
    fusionIntervalMs: 5000,
    minConfidenceThreshold: 0.5,
    hcuBudgetPerMinute: 3.0,
    autoCalibrate: true,
  },
  createEngine: (config?: MultiSenseConfig) => createMultiSenseEngine(config),
  ui: {
    dashboard: () => import('./MultiSenseDashboard').then(m => m.MultiSenseDashboard),
    settings: () => import('./MultiSenseSettings').then(m => m.MultiSenseSettings),
  },
  hcuCostPerOperation: {
    'sense.activate': 0.02,
    'sense.deactivate': 0.01,
    'sense.receive_input': 0.005,
    'sense.fusion': 0.02,
    'sense.calibration': 0.01,
    'sense.health': 0.001,
  },
};

export default multiSenseManifest;