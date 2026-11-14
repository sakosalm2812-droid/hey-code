// src/engines/agentFamilies/types.ts
// Engine 17: Agent Families — Type definitions

export interface AgentFamilyMember {
  id: string;
  name: string;
  role: string;
  capabilities?: string[];
  status?: 'active' | 'idle' | 'offline';
}

export interface AgentFamily {
  id: string;
  name: string;
  description: string;
  memberLimit: number;
  members: AgentFamilyMember[];
  createdAt: string;
  updatedAt?: string;
}

export interface AgentFamiliesConfig {
  families: AgentFamily[];
  maxFamilySize: number;
  defaultFamily: string;
  hcuBudgetPerHour: number;
}

export interface AgentFamiliesHealth {
  isRunning: boolean;
  totalHCUSpent: number;
  hcuBudgetPerHour: number;
  totalFamilies: number;
  totalMembers: number;
}

export type AgentFamiliesEvent =
  | { type: 'family_created'; family: AgentFamily }
  | { type: 'family_full'; family: AgentFamily }
  | { type: 'member_added'; family: AgentFamily; member: AgentFamilyMember }
  | { type: 'member_removed'; family: AgentFamily; memberId: string }
  | { type: 'agent_families_initialized'; config: AgentFamiliesConfig }
  | { type: 'agent_families_shutdown'; totalHCUSpent: number };