// src/engines/situationalAwareness/manifest.ts
// Engine 6: Situational Awareness — Manifest for Feature Registry

import type { FeatureManifest } from '../../core/registry/FeatureRegistry';
import { SituationalAwarenessEngine, createSituationalAwarenessEngine } from './SituationalAwarenessEngine';
import type { AwarenessConfig } from './types';

export const situationalAwarenessManifest: FeatureManifest = {
  id: 'situationalAwareness',
  name: 'Situational Awareness',
  description: 'Environment monitoring, context analysis, proactive alerts, and attention tracking',
  version: '1.0.0',
  engine: 'situationalAwareness',
  category: 'intelligence',
  enabled: true,
  dependencies: ['cosmos', 'costGovernor'],
  capabilities: [
    'awareness.snapshot',
    'awareness.assessment',
    'awareness.attention_tracking',
    'awareness.proactive_alerts',
    'awareness.health',
  ],
  configSchema: {
    snapshotIntervalMs: { type: 'number', min: 1000, max: 60000, default: 10000 },
    assessmentIntervalMs: { type: 'number', min: 5000, max: 300000, default: 30000 },
    historyRetentionMs: { type: 'number', min: 300000, max: 86400000, default: 3600000 },
    hcuBudgetPerHour: { type: 'number', min: 0.1, max: 10, default: 2.0 },
    alertThreshold: { type: 'string', enum: ['normal', 'elevated', 'high', 'critical'], default: 'elevated' },
    autoActionEnabled: { type: 'boolean', default: false },
  },
  defaultConfig: {
    snapshotIntervalMs: 10000,
    assessmentIntervalMs: 30000,
    historyRetentionMs: 3600000,
    hcuBudgetPerHour: 2.0,
    alertThreshold: 'elevated' as const,
    autoActionEnabled: false,
  },
  createEngine: (config?: AwarenessConfig) => createSituationalAwarenessEngine(config),
  ui: {
    dashboard: () => import('./SituationalAwarenessDashboard').then(m => m.SituationalAwarenessDashboard),
    settings: () => import('./SituationalAwarenessSettings').then(m => m.SituationalAwarenessSettings),
  },
  hcuCostPerOperation: {
    'awareness.snapshot': 0.01,
    'awareness.assessment': 0.02,
    'awareness.attention_tracking': 0.005,
    'awareness.proactive_alerts': 0.01,
    'awareness.health': 0.001,
  },
};

export default situationalAwarenessManifest;