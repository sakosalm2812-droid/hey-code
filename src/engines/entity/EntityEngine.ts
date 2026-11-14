// src/engines/entity/EntityEngine.ts
// Engine 8: Entity — Generic entity management with CRUD, senses, and persistence

import type {
  EntityField,
  EntityConfig,
  EntityItem,
  EntityIntegrations,
  EntityView,
  EntityFieldType,
} from './types';
import { createEntityStore } from './EntityStore';
import { createEntityService, VoiceSenseHandler, MemorySenseHandler, PermissionSenseHandler, createSenseHandlers } from './EntityService';
import { logToCosmos } from '../../core/cosmosMemory';
import { track } from '../../core/cost/costGovernor';
import { pinpoint } from '../../core/precision/pinpointPrecision';
import { grade } from '../../core/engines/bossAgent';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CONFIG: EntityConfig = {
  engine: 'entity',
  id: uuidv4().toString(),
  name: 'New Entity',
  path: '',
  icon: '📦',
  fields: [],
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
  derived: undefined,
};

export class EntityEngine {
  private config: EntityConfig;
  private store: ReturnType<typeof createEntityStore<EntityItem>>;
  private service: ReturnType<typeof createEntityService<EntityItem>>;
  private senseHandlers: Record<string, any> = {};
  private isRunning = false;
  private totalHCUSpent = 0;
  private eventListeners: Map<string, Set<(event: any) => void>> = new Map();

  constructor(config: Partial<EntityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.store = createEntityStore<EntityItem>(this.config.id, {
      entityType: this.config.id,
      validate: this.config.validate,
      indexes: ['id'],
    });
    this.service = createEntityService<EntityItem>(this.config.id, this.config);
  }

  async initialize(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    await this.log('entity_engine_initialized', { entityId: this.config.id });
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;
    await this.log('entity_engine_shutdown', { totalHCUSpent: this.totalHCUSpent });
  }

  // CRUD Operations

  getAll(): EntityItem[] {
    return this.store.crud.getAll();
  }

  getById(id: string): EntityItem | undefined {
    // Direct lookup via store state
    return this.store.crud.getAll().find(e => e.id === id);
  }

  create(data: Omit<EntityItem, 'id' | 'created_at' | 'updated_at'>): EntityItem {
    track(0.01);
    const entity = this.store.crud.create(data as Omit<EntityItem, 'id' | 'createdAt' | 'updatedAt'>);
    this.totalHCUSpent += 0.01;
    this.emitEvent({ type: 'entity_created', entity });
    pinpoint.verify('entity');
    grade({ operation: 'create', entityCount: this.store.crud.getAll().length }, { engine: 'entity' });
    return entity;
  }

  update(id: string, data: Partial<EntityItem>): EntityItem | undefined {
    track(0.005);
    const entity = this.store.crud.update(id, data);
    if (entity) {
      this.totalHCUSpent += 0.005;
      this.emitEvent({ type: 'entity_updated', entity });
      pinpoint.verify('entity');
      grade({ operation: 'update', entity }, { engine: 'entity' });
    }
    return entity;
  }

  delete(id: string): boolean {
    track(0.005);
    const result = this.store.crud.delete(id);
    if (result) {
      this.totalHCUSpent += 0.005;
      this.emitEvent({ type: 'entity_deleted', id });
      pinpoint.verify('entity');
      grade({ operation: 'delete', id }, { engine: 'entity' });
    }
    return result;
  }

  // Sense Handlers

  getVoiceHandler() {
    if (!this.senseHandlers.voice && this.config.integrations?.voice) {
      this.senseHandlers.voice = new VoiceSenseHandler(
        this.config.id,
        { enabled: true, commands: this.config.senseCommands?.voice },
        this.store.crud
      );
    }
    return this.senseHandlers.voice;
  }

  getMemoryHandler() {
    if (!this.senseHandlers.memory && this.config.integrations?.memory) {
      // Create a mock memory handler for testing
      this.senseHandlers.memory = {
        getRelatedMemories: async () => [],
        linkToMemory: async () => true,
        storeInMemory: async () => null,
      };
    }
    return this.senseHandlers.memory;
  }

  getPermissionHandler() {
    if (!this.senseHandlers.permissions && this.config.senses?.pinsThroughTrust) {
      // Would need foundation.permissions passed in
    }
    return this.senseHandlers.permissions;
  }

  // Health & Config

  getHealth(): {
    isRunning: boolean;
    entityCount: number;
    totalHCUSpent: number;
    hcuBudgetPerHour: number;
  } {
    const entities = this.getAll();
    return {
      isRunning: this.isRunning,
      entityCount: entities.length,
      totalHCUSpent: this.totalHCUSpent,
      hcuBudgetPerHour: this.config.hcuBudgetPerHour ?? 1.0,
    };
  }

  getConfig(): EntityConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<EntityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Event System

  onEvent(eventType: string, listener: (event: any) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener);
    };
  }

  emitEvent(event: { type: string; [key: string]: any }): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error('Entity engine event error:', e);
        }
      }
    }
  }

  // Logging

  private async log(type: string, data: Record<string, unknown>): Promise<void> {
    try {
      await logToCosmos({
        type: `entity_${type}`,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }
}

export function createEntityEngine(config?: Partial<EntityConfig>): EntityEngine {
  return new EntityEngine(config);
}

export default EntityEngine;