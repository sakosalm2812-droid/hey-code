// Tests for Entity Engine
// Engine 8: Entity — Generic entity management with CRUD, senses, and persistence

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EntityEngine, createEntityEngine } from '../EntityEngine';
import type { EntityConfig, EntityField, EntityFieldType } from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

describe('EntityEngine', () => {
  let engine: EntityEngine;

  const testConfig: Partial<EntityConfig> = {
    id: 'test-entity-001',
    name: 'Test Entity',
    icon: '📦',
    fields: [
      { name: 'title', label: 'Title', type: 'text' as EntityFieldType },
      { name: 'count', label: 'Count', type: 'number' as EntityFieldType },
    ],
    views: ['list'],
    integrations: {
      voice: false,
      vision: false,
      gesture: false,
      memory: false,
      agent: undefined,
      proactive: false,
      crossDevice: false,
      automation: false,
      verification: false,
      pinsThroughTrust: false,
      senses: [],
    },
  };

  beforeEach(async () => {
    engine = createEntityEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Initialization', () => {
    it('initializes with default config', async () => {
      const defaultEngine = createEntityEngine();
      await defaultEngine.initialize();
      const health = defaultEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.entityCount).toBe(0);
      await defaultEngine.shutdown();
    });

    it('initializes with custom config', async () => {
      const customEngine = createEntityEngine({
        id: 'custom-entity',
        name: 'Custom',
        fields: [
          { name: 'title', label: 'Title', type: 'text' as EntityFieldType },
        ],
        views: ['list', 'kanban'],
      });
      await customEngine.initialize();
      const health = customEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.entityCount).toBe(0);
      await customEngine.shutdown();
    });
  });

  describe('CRUD Operations', () => {
    it('creates an entity', () => {
      const entity = engine.create({
        title: 'Test Item',
        count: 42,
      });
      expect(entity).toBeDefined();
      expect(entity.id).toBeDefined();
      expect(entity.title).toBe('Test Item');
      expect(entity.count).toBe(42);
    });

    it('reads all entities', () => {
      engine.create({ title: 'Item 1', count: 1 });
      engine.create({ title: 'Item 2', count: 2 });
      const all = engine.getAll();
      expect(all.length).toBe(2);
    });

    it('reads entity by ID', () => {
      const created = engine.create({ title: 'Specific Item', count: 99 });
      const byId = engine.getById(created.id);
      expect(byId).toBeDefined();
      expect(byId?.title).toBe('Specific Item');
    });

    it('updates an entity', () => {
      const created = engine.create({ title: 'Before', count: 1 });
      const updated = engine.update(created.id, { title: 'After', count: 99 });
      expect(updated).toBeDefined();
      expect(updated?.title).toBe('After');
      expect(updated?.count).toBe(99);
    });

    it('deletes an entity', () => {
      const created = engine.create({ title: 'ToDelete', count: 1 });
      const deleted = engine.delete(created.id);
      expect(deleted).toBe(true);
      const all = engine.getAll();
      expect(all.length).toBe(0);
    });
  });

  describe('Sense Handlers', () => {
    it('has voice handler config', async () => {
      const voiceEngine = createEntityEngine({
        ...testConfig,
        integrations: { ...testConfig.integrations, voice: true, senses: ['voice'] },
      });
      await voiceEngine.initialize();
      const voiceHandler = voiceEngine.getVoiceHandler();
      expect(voiceHandler).toBeDefined();
      await voiceEngine.shutdown();
    });

    it('has memory handler config', async () => {
      const memoryEngine = createEntityEngine({
        ...testConfig,
        integrations: { ...testConfig.integrations, memory: true, senses: ['memory'] },
      });
      await memoryEngine.initialize();
      const memoryHandler = memoryEngine.getMemoryHandler();
      expect(memoryHandler).toBeDefined();
      await memoryEngine.shutdown();
    });
  });

  describe('Health Metrics', () => {
    it('reports health metrics', () => {
      const health = engine.getHealth();
      expect(health).toHaveProperty('isRunning');
      expect(health).toHaveProperty('entityCount');
      expect(health).toHaveProperty('totalHCUSpent');
      expect(health).toHaveProperty('hcuBudgetPerHour');
      expect(typeof health.totalHCUSpent).toBe('number');
      expect(health.entityCount).toBe(0);
    });

    it('tracks HCU spending after operations', () => {
      engine.create({ title: 'HCU Test', count: 1 });
      const health = engine.getHealth();
      expect(health.totalHCUSpent).toBeGreaterThan(0);
    });
  });

  describe('Config Management', () => {
    it('updates config', () => {
      engine.updateConfig({
        name: 'Updated Name',
        fields: [
          { name: 'newField', label: 'New Field', type: 'text' as EntityFieldType },
        ],
      });
      const config = engine.getConfig();
      expect(config.name).toBe('Updated Name');
      expect(config.fields.length).toBe(1);
    });
  });

  describe('Event System', () => {
    it('registers event listeners', () => {
      const listener = vi.fn();
      engine.onEvent('entity_created', listener);
      engine.create({ title: 'Test', count: 1 });
      expect(listener).toHaveBeenCalled();
    });

    it('emits entity_updated event', () => {
      let eventReceived = false;
      engine.onEvent('entity_updated', () => { eventReceived = true; });
      engine.create({ title: 'Test', count: 1 });
      engine.update(engine.getAll()[0].id!, { title: 'Updated' });
      expect(eventReceived).toBe(true);
    });

    it('emits entity_deleted event', () => {
      let eventReceived = false;
      engine.onEvent('entity_deleted', () => { eventReceived = true; });
      engine.create({ title: 'ToDelete', count: 1 });
      engine.delete(engine.getAll()[0].id!);
      expect(eventReceived).toBe(true);
    });
  });
});