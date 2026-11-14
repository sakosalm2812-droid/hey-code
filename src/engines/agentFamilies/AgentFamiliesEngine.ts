// src/engines/agentFamilies/AgentFamiliesEngine.ts
// Engine 17: Agent Families — Manage groups of agents with shared characteristics and behaviors

import type { AgentFamiliesConfig, AgentFamiliesHealth, AgentFamily, AgentFamilyMember, AgentFamiliesEvent } from './types';
import { logToCosmos } from '../../core/cosmosMemory';
import * as hcu from '../../core/cost/costGovernor';
import { pinpoint } from '../../core/precision/pinpointPrecision';
import * as bossAgent from '../../core/engines/bossAgent';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CONFIG: AgentFamiliesConfig = {
  families: [],
  maxFamilySize: 50,
  defaultFamily: 'general',
  hcuBudgetPerHour: 1.0,
};

const initialFamilies: AgentFamily[] = [];

export class AgentFamiliesEngine {
  private config: AgentFamiliesConfig;
  private isRunning = false;
  private totalHCUSpent = 0;
  private eventListeners: Map<string, Set<(event: AgentFamiliesEvent) => void>> = new Map();

  constructor(config: Partial<AgentFamiliesConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    await this.log('agent_families_initialized', { config: this.config });
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;
    await this.log('agent_families_shutdown', { totalHCUSpent: this.totalHCUSpent });
  }

  // Family Management

  createFamily(name: string, description: string, memberLimit?: number): AgentFamily {
    hcu.track('createFamily', 0.01);
    const family: AgentFamily = {
      id: `family_${uuidv4().slice(0, 8)}`,
      name,
      description,
      memberLimit: memberLimit ?? this.config.maxFamilySize,
      members: [],
      createdAt: new Date().toISOString(),
    };

    if (!this.config.families) {
      this.config.families = [];
    }
    this.config.families.push(family);

    this.totalHCUSpent += 0.01;
    this.emitEvent({ type: 'family_created', family });
    pinpoint.verify('agentFamilies');
    bossAgent.grade({ operation: 'createFamily', familyId: family.id, familyName: name }, { engine: 'agentFamilies' });
    return family;
  }

  getFamily(id: string): AgentFamily | undefined {
    const families = this.config.families ?? initialFamilies;
    return families.find(f => f.id === id);
  }

  getFamilyByName(name: string): AgentFamily | undefined {
    const families = this.config.families ?? initialFamilies;
    return families.find(f => f.name === name);
  }

  getAllFamilies(): AgentFamily[] {
    const families = this.config.families ?? initialFamilies;
    return families;
  }

  addMember(familyId: string, member: AgentFamilyMember): boolean {
    const family = this.getFamily(familyId);
    if (!family) return false;

    if (family.memberLimit && family.members.length >= family.memberLimit) {
      this.emitEvent({ type: 'family_full', family });
      return false;
    }

    family.members.push(member);
    hcu.track('addMember', 0.001);
    this.totalHCUSpent += 0.001;
    this.emitEvent({ type: 'member_added', family, member });
    pinpoint.verify('agentFamilies');
    bossAgent.grade({ operation: 'addMember', familyId: family.id, memberId: member.id }, { engine: 'agentFamilies' });
    return true;
  }

  removeMember(familyId: string, memberId: string): boolean {
    const family = this.getFamily(familyId);
    if (!family) return false;

    const initialLength = family.members.length;
    family.members = family.members.filter(m => m.id !== memberId);

    if (family.members.length < initialLength) {
      hcu.track('removeMember', 0.001);
      this.totalHCUSpent += 0.001;
      this.emitEvent({ type: 'member_removed', family, memberId });
      pinpoint.verify('agentFamilies');
      bossAgent.grade({ operation: 'removeMember', familyId: family.id, memberId }, { engine: 'agentFamilies' });
      return true;
    }
    return false;
  }

  // Health & Config

  getHealth(): AgentFamiliesHealth {
    const families = this.config.families ?? initialFamilies;
    const totalMembers = families.reduce((sum, f) => sum + f.members.length, 0);

    return {
      isRunning: this.isRunning,
      totalHCUSpent: this.totalHCUSpent,
      hcuBudgetPerHour: this.config.hcuBudgetPerHour,
      totalFamilies: families.length,
      totalMembers,
    };
  }

  getConfig(): AgentFamiliesConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<AgentFamiliesConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Event System

  onEvent<K extends AgentFamiliesEvent['type']>(
    eventType: K,
    listener: (event: Extract<AgentFamiliesEvent, { type: K }>) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener as any);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener as any);
    };
  }

  emitEvent(event: AgentFamiliesEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error('Agent Families engine event error:', e);
        }
      }
    }
  }

  // Logging

  private async log(type: string, data: Record<string, unknown>): Promise<void> {
    try {
      await logToCosmos({
        type: `agent_families_${type}`,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }
}

export function createAgentFamiliesEngine(config?: Partial<AgentFamiliesConfig>): AgentFamiliesEngine {
  return new AgentFamiliesEngine(config);
}

export default AgentFamiliesEngine;