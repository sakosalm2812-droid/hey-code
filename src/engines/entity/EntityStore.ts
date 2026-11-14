/**
 * Entity Engine - EntityStore
 *
 * Generic Zustand store factory for managing entities.
 * Provides CRUD operations, derived selectors, and persistence.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { BaseEntity, EntityConfig, EntityCRUD, EntityStoreType } from './types';

/**
 * Create a generic entity store with Zustand
 *
 * @param entityType - The type name for this entity (e.g., 'tasks', 'notes')
 * @param config - Configuration options
 * @returns Zustand store with entity CRUD operations
 */
export function createEntityStore<T extends BaseEntity>(
  entityType: string,
  config: EntityConfig<T> = {}
) {
  const {
    persistKey,
    defaultEntity = {},
    initialEntities = [],
    validate,
    indexes = [],
  } = config;

  // Build index maps for faster queries
  type EntityIndex = Map<string, Set<string>>; // fieldValue -> Set<entityIds>
  const indexesMap: Record<keyof T, EntityIndex> = {} as Record<keyof T, EntityIndex>;

  // Initialize indexes
  for (const field of indexes) {
    indexesMap[field] = new Map();
  }

  // Helper to update indexes
  const updateIndexes = (entities: T[]) => {
    for (const field of indexes) {
      const index = indexesMap[field];
      index.clear();
      for (const entity of entities) {
        const value = entity[field] as unknown as string;
        if (value && typeof value === 'string') {
          if (!index.has(value)) {
            index.set(value, new Set());
          }
          index.get(value)!.add(entity.id);
        }
      }
    }
  };

  // Helper to get entities by indexed field
  const getByIndexedField = <K extends keyof T>(field: K, value: T[K], entities: T[]): T[] => {
    const index = indexesMap[field] as EntityIndex;
    if (index && index.has(value as string)) {
      const ids = index.get(value as string)!;
      return entities.filter(e => ids.has(e.id));
    }
    return entities.filter(e => e[field] === value);
  };

  // Store definition
  const store = create<EntityStoreType<T>>()(
    devtools(
      persist(
        (set, get) => ({
          // State
          entities: initialEntities,
          loading: false,
          error: null,
          lastUpdated: new Date().toISOString(),

          // Actions
          setEntities: (entities: T[]) => {
            updateIndexes(entities);
            set({
              entities,
              loading: false,
              error: null,
              lastUpdated: new Date().toISOString(),
            });
          },

          addEntity: (entity: T) => {
            set((state) => {
              const newEntities = [...state.entities, entity];
              updateIndexes(newEntities);
              return {
                entities: newEntities,
                lastUpdated: new Date().toISOString(),
              };
            });
          },

          updateEntity: (id: string, data: Partial<T>) => {
            set((state) => {
              const newEntities = state.entities.map(e =>
                e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
              );
              updateIndexes(newEntities);
              return {
                entities: newEntities,
                lastUpdated: new Date().toISOString(),
              };
            });
          },

          removeEntity: (id: string) => {
            set((state) => {
              const newEntities = state.entities.filter(e => e.id !== id);
              updateIndexes(newEntities);
              return {
                entities: newEntities,
                lastUpdated: new Date().toISOString(),
              };
            });
          },

          setLoading: (loading: boolean) => {
            set({ loading });
          },

          setError: (error: Error | null) => {
            set({ error, loading: false });
          },
        }),
        {
          name: persistKey || `hey-${entityType}`,
          partialize: (state) => ({
            entities: state.entities,
            lastUpdated: state.lastUpdated,
          }),
        }
      ),
      { name: `${entityType}-store` }
    )
  );

  // CRUD operations
  const crud: EntityCRUD<T> = {
    // Create
    create: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T => {
      const now = new Date().toISOString();
      const entity: T = {
        id: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        createdAt: now,
        updatedAt: now,
        ...defaultEntity,
        ...data,
      } as T;

      if (validate && !validate(entity)) {
        throw new Error('Entity validation failed');
      }

      store.getState().addEntity(entity);
      return entity;
    },

    createMany: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): T[] => {
      const now = new Date().toISOString();
      const entities: T[] = data.map(d => ({
        id: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        createdAt: now,
        updatedAt: now,
        ...defaultEntity,
        ...d,
      } as T));

      if (validate) {
        for (const entity of entities) {
          if (!validate(entity)) {
            throw new Error('Entity validation failed');
          }
        }
      }

      store.getState().setEntities([...store.getState().entities, ...entities]);
      return entities;
    },

    // Read
    getAll: (): T[] => {
      return store.getState().entities;
    },

    getById: (id: string): T | undefined => {
      return store.getState().entities.find(e => e.id === id);
    },

    getByIds: (ids: string[]): T[] => {
      const idSet = new Set(ids);
      return store.getState().entities.filter(e => idSet.has(e.id));
    },

    query: (predicate: (entity: T) => boolean): T[] => {
      return store.getState().entities.filter(predicate);
    },

    // Update
    update: (id: string, data: Partial<T>): T | undefined => {
      const entity = store.getState().entities.find(e => e.id === id);
      if (!entity) return undefined;

      const updated: T = { ...entity, ...data, updatedAt: new Date().toISOString() };

      if (validate && !validate(updated)) {
        throw new Error('Entity validation failed');
      }

      store.getState().updateEntity(id, data);
      return updated;
    },

    updateMany: (ids: string[], data: Partial<T>): T[] => {
      const idSet = new Set(ids);
      const updatedEntities: T[] = [];

      store.setState((state) => {
        const newEntities = state.entities.map(e => {
          if (idSet.has(e.id)) {
            const updated: T = { ...e, ...data, updatedAt: new Date().toISOString() };
            if (validate && !validate(updated)) {
              throw new Error('Entity validation failed');
            }
            updatedEntities.push(updated);
            return updated;
          }
          return e;
        });
        updateIndexes(newEntities);
        return { entities: newEntities, lastUpdated: new Date().toISOString() };
      });

      return updatedEntities;
    },

    upsert: (id: string, data: Partial<T>): T => {
      const existing = store.getState().entities.find(e => e.id === id);
      if (existing) {
        const updated: T = { ...existing, ...data, updatedAt: new Date().toISOString() };
        if (validate && !validate(updated)) {
          throw new Error('Entity validation failed');
        }
        store.getState().updateEntity(id, data);
        return updated;
      } else {
        return crud.create(data as Omit<T, 'id' | 'createdAt' | 'updatedAt'>);
      }
    },

    // Delete
    delete: (id: string): boolean => {
      const exists = store.getState().entities.some(e => e.id === id);
      if (exists) {
        store.getState().removeEntity(id);
      }
      return exists;
    },

    deleteMany: (ids: string[]): number => {
      const idSet = new Set(ids);
      const initialCount = store.getState().entities.length;
      store.setState((state) => {
        const newEntities = state.entities.filter(e => !idSet.has(e.id));
        updateIndexes(newEntities);
        return { entities: newEntities, lastUpdated: new Date().toISOString() };
      });
      return initialCount - store.getState().entities.length;
    },

    clear: (): void => {
      store.getState().setEntities([]);
    },

    // Subscriptions
    subscribe: (callback: (entities: T[]) => void): (() => void) => {
      return store.subscribe(
        (state) => state.entities,
        (entities) => callback(entities)
      );
    },

    // Derived selectors
    getDerived: <R>(selector: (entities: T[]) => R): R => {
      return selector(store.getState().entities);
    },
  };

  // Add indexed field getters
  for (const field of indexes) {
    crud[`getBy${field.toString().charAt(0).toUpperCase() + field.toString().slice(1)}` as keyof EntityCRUD<T>] = (
      value: T[typeof field]
    ): T[] => {
      return getByIndexedField(store.getState().entities, field, value);
    };
  }

  // Extend the store with CRUD operations
  const extendedStore = {
    ...store,
    crud,
    // Convenience methods
    useEntities: () => store((state) => state.entities),
    useLoading: () => store((state) => state.loading),
    useError: () => store((state) => state.error),
  };

  return extendedStore;
}

// Type-safe hook for using the store
export type EntityStoreHook<T extends BaseEntity> = ReturnType<typeof createEntityStore<T>>;

// Export a factory for creating typed hooks
export function createUseEntityStore<T extends BaseEntity>(
  entityType: string,
  config?: EntityConfig<T>
) {
  const store = createEntityStore<T>(entityType, config);
  return store;
}
