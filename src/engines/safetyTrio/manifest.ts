// src/engines/safetyTrio/manifest.ts
// Engine 11: Safety Trio — Manifest for Feature Registry

import type { FeatureManifest } from '../../core/registry/FeatureRegistry';
import { SafetyTrioEngine, createSafetyTrioEngine } from './SafetyTrioEngine';
import type { SafetyConfig } from './types';

export const safetyTrioManifest: FeatureManifest = {
  id: 'safetyTrio',
  name: 'Safety Trio',
  description: 'Privacy enforcement, security audit logging, and trust level management',
  version: '1.0.0',
  engine: 'safetyTrio',
  category: 'security',
  enabled: true,
  dependencies: ['cosmos', 'costGovernor', 'permissionManager'],
  capabilities: [
    'safety.audit_log',
    'safety.privacy_control',
    'safety.trust_management',
    'safety.security_alerts',
    'safety.data_export',
    'safety.data_deletion',
    'safety.health',
  ],
  configSchema: {
    privacy: {
      type: 'object',
      properties: {
        dataRetentionDays: { type: 'number', min: 1, max: 3650, default: 365 },
        telemetryEnabled: { type: 'boolean', default: false },
        analyticsEnabled: { type: 'boolean', default: false },
        crashReportingEnabled: { type: 'boolean', default: false },
        localProcessingOnly: { type: 'boolean', default: true },
        encryptionAtRest: { type: 'boolean', default: true },
      },
    },
    security: {
      type: 'object',
      properties: {
        sessionTimeoutMs: { type: 'number', min: 300000, max: 86400000, default: 3600000 },
        maxFailedAuthAttempts: { type: 'number', min: 1, max: 20, default: 5 },
        lockoutDurationMs: { type: 'number', min: 60000, max: 3600000, default: 900000 },
        requireMfa: { type: 'boolean', default: false },
        auditLogRetentionDays: { type: 'number', min: 1, max: 365, default: 90 },
        encryptSensitiveFields: { type: 'boolean', default: true },
      },
    },
    trust: {
      type: 'object',
      properties: {
        defaultTrustLevel: { type: 'string', enum: ['trusted', 'neutral', 'untrusted', 'blocked'], default: 'neutral' },
        trustedDomains: { type: 'array', items: { type: 'string' }, default: ['hey.local', 'localhost'] },
        blockedDomains: { type: 'array', items: { type: 'string' }, default: [] },
        autoTrustOwners: { type: 'boolean', default: true },
        requireVerificationFor: { type: 'array', items: { type: 'string' }, default: ['computer_control', 'filesystem_write', 'external_communication'] },
      },
    },
    hcuBudgetPerHour: { type: 'number', min: 0.1, max: 5, default: 0.5 },
  },
  defaultConfig: {
    privacy: {
      dataRetentionDays: 365,
      telemetryEnabled: false,
      analyticsEnabled: false,
      crashReportingEnabled: false,
      localProcessingOnly: true,
      encryptionAtRest: true,
    },
    security: {
      sessionTimeoutMs: 3600000,
      maxFailedAuthAttempts: 5,
      lockoutDurationMs: 900000,
      requireMfa: false,
      auditLogRetentionDays: 90,
      encryptSensitiveFields: true,
    },
    trust: {
      defaultTrustLevel: 'neutral' as const,
      trustedDomains: ['hey.local', 'localhost'],
      blockedDomains: [],
      autoTrustOwners: true,
      requireVerificationFor: ['computer_control', 'filesystem_write', 'external_communication'],
    },
    hcuBudgetPerHour: 0.5,
  },
  createEngine: (config?: SafetyConfig) => createSafetyTrioEngine(config),
  ui: {
    dashboard: () => import('./SafetyTrioDashboard').then(m => m.SafetyTrioDashboard),
    settings: () => import('./SafetyTrioSettings').then(m => m.SafetyTrioSettings),
  },
  hcuCostPerOperation: {
    'safety.audit_log': 0.001,
    'safety.privacy_control': 0.002,
    'safety.trust_management': 0.001,
    'safety.security_alerts': 0.001,
    'safety.data_export': 0.01,
    'safety.data_deletion': 0.01,
    'safety.health': 0.001,
  },
};

export default safetyTrioManifest;