// src/engines/selfImprovement/manifest.ts
// Engine 8: Self-Improvement — Manifest for Feature Registry

import type { FeatureManifest } from '../../core/registry/FeatureRegistry';
import { SelfImprovementEngine, createSelfImprovementEngine } from './SelfImprovementEngine';
import type { SelfImprovementConfig } from './types';

export const selfImprovementManifest: FeatureManifest = {
  id: 'selfImprovement',
  name: 'Self-Improvement',
  description: 'Autonomous optimization, refactoring, bug fixing, and evolutionary improvement cycles',
  version: '1.0.0',
  engine: 'selfImprovement',
  category: 'intelligence',
  enabled: true,
  dependencies: ['cosmos', 'costGovernor'],
  capabilities: [
    'improvement.cycle',
    'improvement.propose',
    'improvement.evaluate',
    'improvement.apply',
    'improvement.rollback',
    'improvement.health',
  ],
  configSchema: {
    cycleIntervalMs: { type: 'number', min: 60000, max: 3600000, default: 300000 },
    maxCyclesPerHour: { type: 'number', min: 1, max: 50, default: 10 },
    hcuBudgetPerCycle: { type: 'number', min: 0.5, max: 10, default: 2.0 },
    autoApplyThreshold: { type: 'number', min: 0.1, max: 1, default: 0.7 },
    requireManualApprovalFor: { type: 'array', items: { type: 'string', enum: ['high_risk', 'config_change', 'structural_change'] }, default: ['high_risk', 'structural_change'] },
  },
  defaultConfig: {
    cycleIntervalMs: 300000,
    maxCyclesPerHour: 10,
    hcuBudgetPerCycle: 2.0,
    autoApplyThreshold: 0.7,
    requireManualApprovalFor: ['high_risk', 'structural_change'],
  },
  createEngine: (config?: SelfImprovementConfig) => createSelfImprovementEngine(config),
  ui: {
    dashboard: () => import('./SelfImprovementDashboard').then(m => m.SelfImprovementDashboard),
    settings: () => import('./SelfImprovementSettings').then(m => m.SelfImprovementSettings),
  },
  hcuCostPerOperation: {
    'improvement.cycle': 2.0,
    'improvement.propose': 0.05,
    'improvement.evaluate': 0.1,
    'improvement.apply': 0.5,
    'improvement.rollback': 0.2,
    'improvement.health': 0.001,
  },
};

export default selfImprovementManifest;