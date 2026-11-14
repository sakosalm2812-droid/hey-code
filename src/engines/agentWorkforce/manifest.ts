// src/engines/agentWorkforce/manifest.ts
// Engine 4: Agent Workforce — Manifest for Feature Registry

import type { FeatureManifest } from '../../core/registry/FeatureRegistry';
import { AgentWorkforceEngine, createAgentWorkforceEngine } from './AgentWorkforceEngine';
import type { WorkforceConfig } from './types';

export const agentWorkforceManifest: FeatureManifest = {
  id: 'agentWorkforce',
  name: 'Agent Workforce',
  description: 'Hierarchical agent orchestration (Primary→Secondary→Tertiary→Quaternary) with IPC, Memory Vectors, CRDT sync',
  version: '1.0.0',
  engine: 'agentWorkforce',
  category: 'orchestration',
  enabled: true,
  dependencies: ['cosmos', 'costGovernor', 'permissionManager'],
  capabilities: [
    'agent.spawn',
    'agent.terminate',
    'agent.delegate',
    'agent.coordinate',
    'memory.vector_search',
    'memory.crdt_sync',
    'ipc.broadcast',
    'ipc.direct',
    'task.submit',
    'task.monitor',
    'workforce.health',
    'workforce.shutdown',
  ],
  configSchema: {
    maxAgents: { type: 'number', min: 1, max: 100, default: 50 },
    maxDepth: { type: 'number', min: 1, max: 4, default: 4 },
    defaultHCUBudget: { type: 'number', min: 10, max: 1000, default: 100 },
    heartbeatIntervalMs: { type: 'number', min: 1000, max: 60000, default: 5000 },
    taskTimeoutMs: { type: 'number', min: 30000, max: 3600000, default: 300000 },
    ipcBufferSize: { type: 'number', min: 100, max: 10000, default: 1000 },
    memoryVectorDimension: { type: 'number', default: 384 },
    enableCRDTSync: { type: 'boolean', default: true },
    costGovernor: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', default: true },
        maxTotalHCU: { type: 'number', default: 1000 },
        alertThreshold: { type: 'number', min: 0, max: 1, default: 0.8 },
      },
    },
  },
  defaultConfig: {
    maxAgents: 50,
    maxDepth: 4,
    defaultHCUBudget: 100,
    heartbeatIntervalMs: 5000,
    taskTimeoutMs: 300000,
    ipcBufferSize: 1000,
    memoryVectorDimension: 384,
    enableCRDTSync: true,
    costGovernor: {
      enabled: true,
      maxTotalHCU: 1000,
      alertThreshold: 0.8,
    },
  },
  createEngine: (config?: WorkforceConfig) => createAgentWorkforceEngine(config),
  ui: {
    dashboard: () => import('./AgentWorkforceDashboard').then(m => m.AgentWorkforceDashboard),
    settings: () => import('./AgentWorkforceSettings').then(m => m.AgentWorkforceSettings),
  },
  hcuCostPerOperation: {
    'agent.spawn': 0.05,
    'agent.terminate': 0.01,
    'agent.delegate': 0.02,
    'agent.coordinate': 0.03,
    'memory.vector_search': 0.005,
    'memory.crdt_sync': 0.01,
    'ipc.broadcast': 0.001,
    'ipc.direct': 0.0005,
    'task.submit': 0.005,
    'task.monitor': 0.002,
    'workforce.health': 0.001,
    'workforce.shutdown': 0.01,
  },
};

export default agentWorkforceManifest;