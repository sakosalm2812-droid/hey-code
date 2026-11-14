// src/engines/crossDevice/manifest.ts
// Engine 10: Cross-Device Organism — Manifest for Feature Registry

import type { FeatureManifest } from '../../core/registry/FeatureRegistry';
import { CrossDeviceEngine, createCrossDeviceEngine } from './CrossDeviceEngine';
import type { CrossDeviceConfig } from './types';

export const crossDeviceManifest: FeatureManifest = {
  id: 'crossDevice',
  name: 'Cross-Device Organism',
  description: 'Device discovery, state synchronization, context handoff, and multi-device continuity',
  version: '1.0.0',
  engine: 'crossDevice',
  category: 'connectivity',
  enabled: true,
  dependencies: ['cosmos', 'costGovernor'],
  capabilities: [
    'cross_device.discovery',
    'cross_device.registration',
    'cross_device.sync',
    'cross_device.handoff',
    'cross_device.messaging',
    'cross_device.health',
  ],
  configSchema: {
    discoveryIntervalMs: { type: 'number', min: 5000, max: 300000, default: 30000 },
    syncIntervalMs: { type: 'number', min: 5000, max: 300000, default: 15000 },
    heartbeatIntervalMs: { type: 'number', min: 5000, max: 300000, default: 10000 },
    hcuBudgetPerHour: { type: 'number', min: 0.1, max: 10, default: 1.5 },
    autoHandoff: { type: 'boolean', default: true },
    maxDevices: { type: 'number', min: 2, max: 50, default: 10 },
  },
  defaultConfig: {
    discoveryIntervalMs: 30000,
    syncIntervalMs: 15000,
    heartbeatIntervalMs: 10000,
    hcuBudgetPerHour: 1.5,
    autoHandoff: true,
    maxDevices: 10,
  },
  createEngine: (config?: CrossDeviceConfig) => createCrossDeviceEngine(config),
  ui: {
    dashboard: () => import('./CrossDeviceDashboard').then(m => m.CrossDeviceDashboard),
    settings: () => import('./CrossDeviceSettings').then(m => m.CrossDeviceSettings),
  },
  hcuCostPerOperation: {
    'cross_device.discovery': 0.01,
    'cross_device.registration': 0.005,
    'cross_device.sync': 0.02,
    'cross_device.handoff': 0.03,
    'cross_device.messaging': 0.002,
    'cross_device.health': 0.001,
  },
};

export default crossDeviceManifest;