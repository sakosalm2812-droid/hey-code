// src/engines/agentFamilies/manifest.ts
// Feature Registry manifest for Engine 17: Agent Families

import { createAgentFamiliesEngine, type AgentFamiliesConfig } from './AgentFamiliesEngine';
import { logToCosmos } from '../../core/cosmosMemory';
import type { FeatureManifest } from '../../core/featureRegistry';

export const AgentFamiliesEngineManifest: FeatureManifest = {
  id: 'agent_families',
  name: 'Agent Families',
  description: 'Manage groups of agents with shared characteristics and behaviors',
  version: '1.0.0',
  engine: createAgentFamiliesEngine,
  configSchema: {
    type: 'object',
    properties: {
      families: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            memberLimit: { type: 'number' },
            members: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string' },
                  capabilities: { type: 'array', items: { type: 'string' } },
                },
                required: ['id', 'name'],
              },
            },
          },
          required: ['id', 'name', 'description'],
        },
        description: 'List of agent families',
      },
      maxFamilySize: {
        type: 'number',
        default: 50,
        description: 'Maximum number of members per family',
      },
      defaultFamily: {
        type: 'string',
        default: 'general',
        description: 'Default family for new agents',
      },
      hcuBudgetPerHour: {
        type: 'number',
        default: 1.0,
        description: 'HCU budget per hour',
      },
    },
    required: [],
    additionalProperties: false,
  },
  hcuCostPerOperation: {
    createFamily: 0.01,
    addMember: 0.001,
    removeMember: 0.001,
    configChange: 0.005,
  },
  ui: {
    dashboardComponent: 'AgentFamiliesDashboard',
    settingsComponent: 'AgentFamiliesSettings',
  },
};

export default AgentFamiliesEngineManifest;