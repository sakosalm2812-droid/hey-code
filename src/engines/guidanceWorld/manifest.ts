// src/engines/guidanceWorld/manifest.ts
// Engine 12: Guidance World — Manifest for Feature Registry

import type { FeatureManifest } from '../../core/registry/FeatureRegistry';
import { GuidanceWorldEngine, createGuidanceWorldEngine } from './GuidanceWorldEngine';
import type { GuidanceConfig } from './types';

export const guidanceWorldManifest: FeatureManifest = {
  id: 'guidanceWorld',
  name: 'Guidance World',
  description: 'Instruction generation, tutoring paths, and mentorship goal tracking',
  version: '1.0.0',
  engine: 'guidanceWorld',
  category: 'intelligence',
  enabled: true,
  dependencies: ['cosmos', 'costGovernor'],
  capabilities: [
    'guidance.session',
    'guidance.tutoring',
    'guidance.mentorship',
    'guidance.instruction',
    'guidance.feedback',
    'guidance.health',
  ],
  configSchema: {
    autoGenerateInstructions: { type: 'boolean', default: true },
    mentorshipCheckInIntervalMs: { type: 'number', min: 3600000, max: 604800000, default: 86400000 },
    defaultTutoringLevel: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'beginner' },
    hcuBudgetPerHour: { type: 'number', min: 0.1, max: 10, default: 1.0 },
    enableFeedbackLoop: { type: 'boolean', default: true },
  },
  defaultConfig: {
    autoGenerateInstructions: true,
    mentorshipCheckInIntervalMs: 86400000,
    defaultTutoringLevel: 'beginner' as const,
    hcuBudgetPerHour: 1.0,
    enableFeedbackLoop: true,
  },
  createEngine: (config?: GuidanceConfig) => createGuidanceWorldEngine(config),
  ui: {
    dashboard: () => import('./GuidanceWorldDashboard').then(m => m.GuidanceWorldDashboard),
    settings: () => import('./GuidanceWorldSettings').then(m => m.GuidanceWorldSettings),
  },
  hcuCostPerOperation: {
    'guidance.session': 0.01,
    'guidance.tutoring': 0.02,
    'guidance.mentorship': 0.01,
    'guidance.instruction': 0.03,
    'guidance.feedback': 0.005,
    'guidance.health': 0.001,
  },
};

export default guidanceWorldManifest;