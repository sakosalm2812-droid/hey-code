// src/engines/continuousIntelligence/manifest.ts
// Engine 5: Continuous Intelligence — Manifest for Feature Registry

import type { FeatureManifest } from '../../core/registry/FeatureRegistry';
import { ContinuousIntelligenceEngine, createContinuousIntelligenceEngine } from './ContinuousIntelligenceEngine';
import type { IntelligenceConfig } from './types';

export const continuousIntelligenceManifest: FeatureManifest = {
  id: 'continuousIntelligence',
  name: 'Continuous Intelligence',
  description: 'Background reasoning, context monitoring, anomaly detection, and goal alignment',
  version: '1.0.0',
  engine: 'continuousIntelligence',
  category: 'intelligence',
  enabled: true,
  dependencies: ['cosmos', 'costGovernor'],
  capabilities: [
    'intelligence.thought_stream',
    'intelligence.background_reasoning',
    'intelligence.anomaly_detection',
    'intelligence.goal_alignment',
    'intelligence.health',
  ],
  configSchema: {
    backgroundReasoningIntervalMs: { type: 'number', min: 10000, max: 300000, default: 60000 },
    maxThoughtHistory: { type: 'number', min: 100, max: 10000, default: 1000 },
    anomalyCheckIntervalMs: { type: 'number', min: 5000, max: 120000, default: 30000 },
    hcuBudgetPerMinute: { type: 'number', min: 0.5, max: 50, default: 5.0 },
    autoEscalateCritical: { type: 'boolean', default: true },
  },
  defaultConfig: {
    backgroundReasoningIntervalMs: 60000,
    maxThoughtHistory: 1000,
    anomalyCheckIntervalMs: 30000,
    hcuBudgetPerMinute: 5.0,
    autoEscalateCritical: true,
  },
  createEngine: (config?: IntelligenceConfig) => createContinuousIntelligenceEngine(config),
  ui: {
    dashboard: () => import('./ContinuousIntelligenceDashboard').then(m => m.ContinuousIntelligenceDashboard),
    settings: () => import('./ContinuousIntelligenceSettings').then(m => m.ContinuousIntelligenceSettings),
  },
  hcuCostPerOperation: {
    'intelligence.thought_stream': 0.001,
    'intelligence.background_reasoning': 0.05,
    'intelligence.anomaly_detection': 0.01,
    'intelligence.goal_alignment': 0.02,
    'intelligence.health': 0.001,
  },
};

export default continuousIntelligenceManifest;