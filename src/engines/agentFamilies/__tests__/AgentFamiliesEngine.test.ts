// Tests for Agent Families Engine
// Engine 17: Agent Families — Manage groups of agents with shared characteristics and behaviors

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgentFamiliesEngine, createAgentFamiliesEngine } from '../AgentFamiliesEngine';
import type { AgentFamiliesConfig, AgentFamily, AgentFamilyMember } from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

describe('AgentFamiliesEngine', () => {
  let engine: AgentFamiliesEngine;

  const createBaseConfig = (): Partial<AgentFamiliesConfig> => ({
    families: [],
    maxFamilySize: 50,
    defaultFamily: 'general',
    hcuBudgetPerHour: 1.0,
  });

  beforeEach(async () => {
    engine = createAgentFamiliesEngine(createBaseConfig());
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Initialization', () => {
    it('initializes with default config', async () => {
      const defaultEngine = createAgentFamiliesEngine();
      await defaultEngine.initialize();
      const health = defaultEngine.getHealth();
      expect(health.isRunning).toBe(true);
      await defaultEngine.shutdown();
    });

    it('initializes with custom config', async () => {
      const customEngine = createAgentFamiliesEngine({
        families: [
          {
            id: 'family-1',
            name: 'Test Family',
            description: 'A test family',
            memberLimit: 10,
            members: [
              { id: 'member-1', name: 'Member 1', role: 'agent' },
            ],
          },
        ],
        hcuBudgetPerHour: 2.0,
      });
      await customEngine.initialize();
      const health = customEngine.getHealth();
      expect(health.isRunning).toBe(true);
      await customEngine.shutdown();
    });
  });

  describe('Family Management', () => {
    it('creates a family', () => {
      const family = engine.createFamily('Test Family', 'A test family description');
      expect(family).toBeDefined();
      expect(family.name).toBe('Test Family');
      expect(family.id).toBeDefined();
    });

    it('gets a family by ID', () => {
      const created = engine.createFamily('Test Family', 'Description');
      const byId = engine.getFamily(created.id);
      expect(byId).toBeDefined();
      expect(byId?.name).toBe('Test Family');
    });

    it('gets a family by name', () => {
      engine.createFamily('Test Family', 'Description');
      const byName = engine.getFamilyByName('Test Family');
      expect(byName).toBeDefined();
      expect(byName?.name).toBe('Test Family');
    });

    it('gets all families', () => {
      engine.createFamily('Family 1', 'Description 1');
      engine.createFamily('Family 2', 'Description 2');
      const all = engine.getAllFamilies();
      expect(all.length).toBe(2);
    });

    it('adds a member to a family', () => {
      const family = engine.createFamily('Test Family', 'Description');
      const member: AgentFamilyMember = { id: 'member-1', name: 'Member 1', role: 'agent' };
      const result = engine.addMember(family.id, member);
      expect(result).toBe(true);
    });

    it('removes a member from a family', () => {
      const family = engine.createFamily('Test Family', 'Description');
      const member: AgentFamilyMember = { id: 'member-1', name: 'Member 1', role: 'agent' };
      engine.addMember(family.id, member);
      const result = engine.removeMember(family.id, 'member-1');
      expect(result).toBe(true);
    });

    it('rejects adding member when family is full', () => {
      const family = engine.createFamily('Test Family', 'Description', 1); // limit of 1
      const member1: AgentFamilyMember = { id: 'member-1', name: 'Member 1', role: 'agent' };
      const member2: AgentFamilyMember = { id: 'member-2', name: 'Member 2', role: 'agent' };
      // First member should be allowed
      expect(engine.addMember(family.id, member1)).toBe(true);
      // Second member should be rejected
      const result = engine.addMember(family.id, member2);
      expect(result).toBe(false);
    });
  });

  describe('Health Metrics', () => {
    it('reports health metrics', () => {
      const health = engine.getHealth();
      expect(health).toHaveProperty('isRunning');
      expect(health).toHaveProperty('totalHCUSpent');
      expect(health).toHaveProperty('hcuBudgetPerHour');
      expect(health).toHaveProperty('totalFamilies');
      expect(health).toHaveProperty('totalMembers');
    });

    it('tracks HCU spending after operations', () => {
      engine.createFamily('Test Family', 'Description');
      engine.addMember(engine.getAllFamilies()[0].id!, { id: 'm1', name: 'M1', role: 'agent' });
      const health = engine.getHealth();
      expect(health.totalHCUSpent).toBeGreaterThan(0);
    });
  });

  describe('Config Management', () => {
    it('updates config', () => {
      engine.updateConfig({ hcuBudgetPerHour: 2.0, maxFamilySize: 100 });
      const config = engine.getConfig();
      expect(config.hcuBudgetPerHour).toBe(2.0);
      expect(config.maxFamilySize).toBe(100);
    });
  });

  describe('Event System', () => {
    it('registers event listeners', () => {
      const listener = vi.fn();
      engine.onEvent('family_created', listener);
      engine.createFamily('Test Family', 'Description');
      expect(listener).toHaveBeenCalled();
    });

    it('emits family_created event', () => {
      let eventReceived = false;
      engine.onEvent('family_created', () => { eventReceived = true; });
      engine.createFamily('Test Family', 'Description');
      expect(eventReceived).toBe(true);
    });

    it('emits member_added event', () => {
      let eventReceived = false;
      engine.onEvent('member_added', () => { eventReceived = true; });
      const family = engine.createFamily('Test Family', 'Description');
      engine.addMember(family.id, { id: 'm1', name: 'M1', role: 'agent' });
      expect(eventReceived).toBe(true);
    });
  });
});