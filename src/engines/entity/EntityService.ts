/**
 * Entity Engine - EntityService
 *
 * Business logic layer for entities.
 * Integrates with senses (voice, memory, permissions).
 */

import type {
  BaseEntity,
  EntityConfig,
  EntityCRUD,
  EntityRepository,
  EntityService,
  MemorySenseConfig,
  PermissionSenseConfig,
  VoiceSenseConfig,
} from './types';
import { createEntityStore } from './EntityStore';
import { createEntityRepository } from './EntityRepository';

/**
 * Entity Service Factory
 *
 * Creates a complete entity service with store, repository, and sense integrations.
 */
export function createEntityService<T extends BaseEntity>(
  entityType: string,
  config: EntityConfig<T> = {}
): EntityService<T> {
  // Create the store
  const store = createEntityStore<T>(entityType, config);

  // Create the repository (if DB client provided)
  let repository: EntityRepository<T> | undefined;
  if (config.db) {
    // We'll need to pass the DB client later
    // For now, create a placeholder
  }

  // Create the service
  const service: EntityService<T> = {
    repository: repository as EntityRepository<T>,
    store: store.crud,

    // Business logic methods
    async getWithMemory(id: string) {
      const entity = store.crud.getById(id);
      if (!entity) {
        throw new Error(`${entityType} not found: ${id}`);
      }

      // If memory integration is enabled, query related memories
      if (config.senses?.memory) {
        // Placeholder for memory integration
        // In a real implementation, this would query Cosmos
        const relatedMemories = [];
        return { ...entity, relatedMemories };
      }

      return { ...entity, relatedMemories: [] };
    },

    async createWithValidation(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) {
      // Check permissions if enabled
      if (config.senses?.pinsThroughTrust) {
        // Placeholder for permission check
        // await permissions.require({ userId, action: 'create', resource: entityType });
      }

      // Validate
      if (config.validate) {
        const entity: T = {
          id: '',
          createdAt: '',
          updatedAt: '',
          ...data,
        } as T;
        if (!config.validate(entity)) {
          throw new Error('Entity validation failed');
        }
      }

      // Create the entity
      const entity = store.crud.create(data);

      // Link to memory if enabled
      if (config.senses?.memory) {
        // Placeholder for memory linking
        // await memory.link(entity.id, contextId, 'related_to');
      }

      return entity;
    },

    async updateWithChecks(id: string, data: Partial<T>) {
      const existing = store.crud.getById(id);
      if (!existing) {
        return undefined;
      }

      // Check permissions if enabled
      if (config.senses?.pinsThroughTrust) {
        // Placeholder for permission check
        // await permissions.require({ userId, action: 'update', resource: `${entityType}:${id}` });
      }

      // Validate
      if (config.validate) {
        const updated: T = { ...existing, ...data };
        if (!config.validate(updated)) {
          throw new Error('Entity validation failed');
        }
      }

      // Update the entity
      return store.crud.update(id, data);
    },

    async deleteWithCleanup(id: string) {
      const existing = store.crud.getById(id);
      if (!existing) {
        return false;
      }

      // Check permissions if enabled
      if (config.senses?.pinsThroughTrust) {
        // Placeholder for permission check
        // await permissions.require({ userId, action: 'delete', resource: `${entityType}:${id}` });
      }

      // Delete from memory links if enabled
      if (config.senses?.memory) {
        // Placeholder for memory cleanup
        // await memory.deleteLinks(entityType, id);
      }

      // Delete the entity
      return store.crud.delete(id);
    },
  };

  return service;
}

/**
 * Voice Sense Integration
 *
 * Provides voice command handling for entities.
 */
export class VoiceSenseHandler<T extends BaseEntity> {
  private entityType: string;
  private config: VoiceSenseConfig;
  private store: EntityCRUD<T>;

  constructor(entityType: string, config: VoiceSenseConfig, store: EntityCRUD<T>) {
    this.entityType = entityType;
    this.config = config;
    this.store = store;
  }

  /**
   * Process voice command
   * @param command - The voice command text
   * @param context - Additional context
   */
  async processCommand(command: string, context: any = {}): Promise<any> {
    const lowerCommand = command.toLowerCase().trim();

    // Check for create commands
    if (this.config.commands?.create) {
      for (const createCmd of this.config.commands.create) {
        if (lowerCommand.startsWith(createCmd.toLowerCase())) {
          const title = lowerCommand.substring(createCmd.length).trim();
          if (title) {
            const entity = this.store.create({
              title,
              ...context,
            } as Omit<T, 'id' | 'createdAt' | 'updatedAt'>);
            return { action: 'create', entity, success: true };
          }
          return { action: 'create', error: 'No title provided', success: false };
        }
      }
    }

    // Check for list commands
    if (this.config.commands?.list) {
      for (const listCmd of this.config.commands.list) {
        if (lowerCommand.includes(listCmd.toLowerCase())) {
          const entities = this.store.getAll();
          return { action: 'list', entities, count: entities.length, success: true };
        }
      }
    }

    // Check for update commands
    if (this.config.commands?.update) {
      for (const updateCmd of this.config.commands.update) {
        if (lowerCommand.startsWith(updateCmd.toLowerCase())) {
          // Simple update: "update task 1 to done"
          const parts = lowerCommand.substring(updateCmd.length).trim().split(/\s+to\s+/i);
          if (parts.length === 2) {
            const id = parts[0].trim();
            const newStatus = parts[1].trim();
            const entity = this.store.getById(id);
            if (entity) {
              const updated = this.store.update(id, { status: newStatus } as Partial<T>);
              return { action: 'update', entity: updated, success: !!updated };
            }
            return { action: 'update', error: 'Entity not found', success: false };
          }
        }
      }
    }

    // Check for delete commands
    if (this.config.commands?.delete) {
      for (const deleteCmd of this.config.commands.delete) {
        if (lowerCommand.startsWith(deleteCmd.toLowerCase())) {
          const id = lowerCommand.substring(deleteCmd.length).trim();
          const deleted = this.store.delete(id);
          return { action: 'delete', id, success: deleted };
        }
      }
    }

    return { action: null, error: 'Command not recognized', success: false };
  }
}

/**
 * Memory Sense Integration
 *
 * Provides memory integration for entities.
 */
export class MemorySenseHandler<T extends BaseEntity> {
  private entityType: string;
  private config: MemorySenseConfig;
  private store: EntityCRUD<T>;
  private memory: any; // CosmosMemory instance

  constructor(
    entityType: string,
    config: MemorySenseConfig,
    store: EntityCRUD<T>,
    memory: any
  ) {
    this.entityType = entityType;
    this.config = config;
    this.store = store;
    this.memory = memory;
  }

  /**
   * Query related memories for an entity
   */
  async getRelatedMemories(entityId: string, limit: number = 5): Promise<any[]> {
    const entity = this.store.getById(entityId);
    if (!entity) {
      return [];
    }

    // Build query from entity tags and title
    const queryTags = [...(entity.tags || []), this.entityType];
    const searchText = entity.title || entity.description || '';

    try {
      const results = await this.memory.search({
        text: searchText,
        tags: queryTags,
        limit,
      });
      return results;
    } catch (error) {
      console.error('Error querying memory:', error);
      return [];
    }
  }

  /**
   * Link entity to memory
   */
  async linkToMemory(entityId: string, memoryId: string, relation: string = 'related_to'): Promise<boolean> {
    const entity = this.store.getById(entityId);
    if (!entity) {
      return false;
    }

    try {
      await this.memory.link(entityId, memoryId, relation);
      return true;
    } catch (error) {
      console.error('Error linking to memory:', error);
      return false;
    }
  }

  /**
   * Store entity in memory
   */
  async storeInMemory(entity: T): Promise<any> {
    try {
      const memoryItem = await this.memory.store({
        type: this.entityType,
        content: JSON.stringify(entity),
        metadata: {
          entityId: entity.id,
          entityType: this.entityType,
        },
        tags: [this.entityType, ...(entity.tags || [])],
      });
      return memoryItem;
    } catch (error) {
      console.error('Error storing in memory:', error);
      return null;
    }
  }
}

/**
 * Permission Sense Integration
 *
 * Provides permission checking for entities.
 */
export class PermissionSenseHandler<T extends BaseEntity> {
  private entityType: string;
  private config: PermissionSenseConfig;
  private store: EntityCRUD<T>;
  private permissions: any; // PermissionManager instance

  constructor(
    entityType: string,
    config: PermissionSenseConfig,
    store: EntityCRUD<T>,
    permissions: any
  ) {
    this.entityType = entityType;
    this.config = config;
    this.store = store;
    this.permissions = permissions;
  }

  /**
   * Check if user can read entity
   */
  async canRead(userId: string, entityId?: string): Promise<boolean> {
    try {
      const result = await this.permissions.check({
        userId,
        action: this.config.actions.read,
        resource: entityId ? `${this.config.resource}:${entityId}` : this.config.resource,
      });
      return result.allowed;
    } catch (error) {
      console.error('Error checking read permission:', error);
      return false;
    }
  }

  /**
   * Check if user can write entity
   */
  async canWrite(userId: string, entityId?: string): Promise<boolean> {
    try {
      const result = await this.permissions.check({
        userId,
        action: this.config.actions.write,
        resource: entityId ? `${this.config.resource}:${entityId}` : this.config.resource,
      });
      return result.allowed;
    } catch (error) {
      console.error('Error checking write permission:', error);
      return false;
    }
  }

  /**
   * Check if user can delete entity
   */
  async canDelete(userId: string, entityId?: string): Promise<boolean> {
    try {
      const result = await this.permissions.check({
        userId,
        action: this.config.actions.delete,
        resource: entityId ? `${this.config.resource}:${entityId}` : this.config.resource,
      });
      return result.allowed;
    } catch (error) {
      console.error('Error checking delete permission:', error);
      return false;
    }
  }

  /**
   * Require permission (throws if denied)
   */
  async requirePermission(
    userId: string,
    action: 'read' | 'write' | 'delete',
    entityId?: string
  ): Promise<void> {
    const actionKey = this.config.actions[action];
    const resource = entityId ? `${this.config.resource}:${entityId}` : this.config.resource;

    try {
      await this.permissions.require({
        userId,
        action: actionKey,
        resource,
      });
    } catch (error) {
      throw new Error(`Permission denied: ${action} on ${resource}`);
    }
  }
}

/**
 * Create sense handlers for an entity
 */
export function createSenseHandlers<T extends BaseEntity>(
  entityType: string,
  config: EntityConfig<T>,
  store: EntityCRUD<T>,
  foundation: any
) {
  const handlers: any = {};

  // Voice sense
  if (config.senses?.voice) {
    handlers.voice = new VoiceSenseHandler<T>(
      entityType,
      {
        enabled: true,
        commands: {
          create: [`add ${entityType}`, `create ${entityType}`, `new ${entityType}`],
          list: [`list ${entityType}`, `show ${entityType}`, `get ${entityType}`],
          update: [`update ${entityType}`, `edit ${entityType}`, `modify ${entityType}`],
          delete: [`delete ${entityType}`, `remove ${entityType}`, `clear ${entityType}`],
        },
      },
      store
    );
  }

  // Memory sense
  if (config.senses?.memory && foundation?.memory) {
    handlers.memory = new MemorySenseHandler<T>(
      entityType,
      { enabled: true, queryTags: [entityType], linkOnCreate: true },
      store,
      foundation.memory
    );
  }

  // Permission sense
  if (config.senses?.pinsThroughTrust && foundation?.permissions) {
    handlers.permissions = new PermissionSenseHandler<T>(
      entityType,
      {
        enabled: true,
        resource: entityType,
        actions: {
          read: `read:${entityType}`,
          write: `write:${entityType}`,
          delete: `delete:${entityType}`,
        },
      },
      store,
      foundation.permissions
    );
  }

  return handlers;
}
