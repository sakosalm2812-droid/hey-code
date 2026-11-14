/**
 * Entity Engine
 *
 * Engine 1: Entity Engine - Powers 400+ features with generic entity management.
 *
 * @module engines/entity
 */

export * from './types';
export * from './EntityStore';
export * from './EntityRepository';
export * from './EntityService';

// Re-export everything for convenience
import type {
  BaseEntity,
  EntityCRUD,
  EntityConfig,
  EntityManifest,
  EntityRepository,
  EntityService,
  EntityStoreState,
  EntityStoreActions,
  EntityStoreType,
  GenericEntity,
} from './types';

export type {
  BaseEntity,
  EntityCRUD,
  EntityConfig,
  EntityManifest,
  EntityRepository,
  EntityService,
  EntityStoreState,
  EntityStoreActions,
  EntityStoreType,
  GenericEntity,
};

// Main factory function
export { createEntityStore } from './EntityStore';
export { createEntityRepository, SupabaseEntityRepository, PrismaEntityRepository } from './EntityRepository';
export { createEntityService, VoiceSenseHandler, MemorySenseHandler, PermissionSenseHandler, createSenseHandlers } from './EntityService';

/**
 * Create a complete entity feature
 *
 * This is the main entry point for creating entity-based features.
 * It creates the store, repository, service, and sense handlers.
 *
 * @param entityType - The type name for this entity
 * @param config - Configuration options
 * @param foundation - Optional foundation modules (memory, permissions, etc.)
 * @returns Complete entity service with all integrations
 */
export function createEntityFeature<T extends BaseEntity>(
  entityType: string,
  config: EntityConfig<T> = {},
  foundation: any = null
) {
  // Create the store
  const store = createEntityStore<T>(entityType, config);

  // Create the service
  const service = createEntityService<T>(entityType, config);

  // Create sense handlers if foundation is provided
  const senses = foundation ? createSenseHandlers<T>(entityType, config, store.crud, foundation) : {};

  return {
    entityType,
    config,
    store,
    crud: store.crud,
    service,
    senses,
    // Convenience methods
    useEntities: store.useEntities,
    useLoading: store.useLoading,
    useError: store.useError,
  };
}

/**
 * Entity Engine manifest
 *
 * This is used by the FeatureRegistry to discover entity-based features.
 */
export const EntityEngineManifest = {
  id: 'entity',
  name: 'Entity Engine',
  description: 'Generic entity management engine that powers 400+ features',
  version: '1.0.0',
  capabilities: [
    'crud',
    'state-management',
    'persistence',
    'voice-integration',
    'memory-integration',
    'permission-integration',
  ],
};

export default {
  createEntityStore,
  createEntityRepository,
  createEntityService,
  createEntityFeature,
  createSenseHandlers,
  EntityEngineManifest,
};
