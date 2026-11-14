// src/engines/performanceQuality/manifest.ts
// Engine 9: Performance & Quality — Manifest for Feature Registry

import type { FeatureManifest } from '../../core/registry/FeatureRegistry';
import { PerformanceQualityEngine, createPerformanceQualityEngine } from './PerformanceQualityEngine';
import type { PerformanceQualityConfig } from './types';

export const performanceQualityManifest: FeatureManifest = {
  id: 'performanceQuality',
  name: 'Performance & Quality',
  description: 'Metrics monitoring, performance benchmarking, quality scoring, and reliability tracking',
  version: '1.0.0',
  engine: 'performanceQuality',
  category: 'monitoring',
  enabled: true,
  dependencies: ['cosmos', 'costGovernor'],
  capabilities: [
    'quality.metrics',
    'quality.benchmark',
    'quality.scoring',
    'quality.alerts',
    'quality.health',
  ],
  configSchema: {
    metricsRefreshIntervalMs: { type: 'number', min: 5000, max: 600000, default: 30000 },
    maxPerformanceRecords: { type: 'number', min: 100, max: 10000, default: 5000 },
    hcuBudgetPerHour: { type: 'number', min: 0.1, max: 10, default: 1.0 },
    qualityAlertThreshold: { type: 'number', min: 0, max: 100, default: 70 },
    performanceBaseline: { type: 'number', min: 10, max: 1000, default: 100 },
  },
  defaultConfig: {
    metricsRefreshIntervalMs: 30000,
    maxPerformanceRecords: 5000,
    hcuBudgetPerHour: 1.0,
    qualityAlertThreshold: 70,
    performanceBaseline: 100,
  },
  createEngine: (config?: PerformanceQualityConfig) => createPerformanceQualityEngine(config),
  ui: {
    dashboard: () => import('./PerformanceQualityDashboard').then(m => m.PerformanceQualityDashboard),
    settings: () => import('./PerformanceQualitySettings').then(m => m.PerformanceQualitySettings),
  },
  hcuCostPerOperation: {
    'quality.metrics': 0.01,
    'quality.benchmark': 0.05,
    'quality.scoring': 0.02,
    'quality.alerts': 0.005,
    'quality.health': 0.001,
  },
};

export default performanceQualityManifest;