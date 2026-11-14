/**
 * Entity Engine - EntityRepository
 *
 * Database repository for entities.
 * Supports Supabase and Prisma backends.
 */

import type { BaseEntity, EntityConfig, EntityRepository } from './types';

/**
 * Supabase Entity Repository
 *
 * Implements EntityRepository interface for Supabase database.
 */
export class SupabaseEntityRepository<T extends BaseEntity> implements EntityRepository<T> {
  private tableName: string;
  private userField: string;
  private supabaseClient: any;

  constructor(
    supabaseClient: any,
    tableName: string,
    userField: string = 'user_id'
  ) {
    this.supabaseClient = supabaseClient;
    this.tableName = tableName;
    this.userField = userField;
  }

  async findAll(userId?: string): Promise<T[]> {
    let query = this.supabaseClient
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq(this.userField, userId);
    }

    const { data, error } = await query;
    if (error) {
      console.error(`Error fetching all ${this.tableName}:`, error);
      throw error;
    }
    return (data || []) as T[];
  }

  async findById(id: string, userId?: string): Promise<T | null> {
    let query = this.supabaseClient
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (userId) {
      query = query.eq(this.userField, userId);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error(`Error fetching ${this.tableName} by id ${id}:`, error);
      throw error;
    }
    return data as T | null;
  }

  async findByIds(ids: string[], userId?: string): Promise<T[]> {
    let query = this.supabaseClient
      .from(this.tableName)
      .select('*')
      .in('id', ids);

    if (userId) {
      query = query.eq(this.userField, userId);
    }

    const { data, error } = await query;
    if (error) {
      console.error(`Error fetching ${this.tableName} by ids:`, error);
      throw error;
    }
    return (data || []) as T[];
  }

  async find(query: Partial<T>, userId?: string): Promise<T[]> {
    let dbQuery = this.supabaseClient
      .from(this.tableName)
      .select('*');

    if (userId) {
      dbQuery = dbQuery.eq(this.userField, userId);
    }

    // Build query from the partial entity
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        dbQuery = dbQuery.eq(key, value);
      }
    }

    const { data, error } = await dbQuery;
    if (error) {
      console.error(`Error finding ${this.tableName}:`, error);
      throw error;
    }
    return (data || []) as T[];
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, userId?: string): Promise<T> {
    const now = new Date().toISOString();
    const entityData = {
      ...data,
      [this.userField]: userId,
      created_at: now,
      updated_at: now,
    } as any;

    const { data: result, error } = await this.supabaseClient
      .from(this.tableName)
      .insert(entityData)
      .select()
      .single();

    if (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }

    // Convert snake_case to camelCase
    return this.transformToCamelCase(result as any) as T;
  }

  async update(id: string, data: Partial<T>, userId?: string): Promise<T | null> {
    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updated_at: now,
    } as any;

    let query = this.supabaseClient
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (userId) {
      query = query.eq(this.userField, userId);
    }

    const { data: result, error } = await query;
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error(`Error updating ${this.tableName} ${id}:`, error);
      throw error;
    }

    return this.transformToCamelCase(result as any) as T | null;
  }

  async delete(id: string, userId?: string): Promise<boolean> {
    let query = this.supabaseClient
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (userId) {
      query = query.eq(this.userField, userId);
    }

    const { error } = await query;
    if (error) {
      if (error.code === 'PGRST116') return false; // Not found
      console.error(`Error deleting ${this.tableName} ${id}:`, error);
      throw error;
    }
    return true;
  }

  async deleteMany(ids: string[], userId?: string): Promise<number> {
    let query = this.supabaseClient
      .from(this.tableName)
      .delete()
      .in('id', ids);

    if (userId) {
      query = query.eq(this.userField, userId);
    }

    const { error } = await query;
    if (error) {
      console.error(`Error deleting multiple ${this.tableName}:`, error);
      throw error;
    }
    return ids.length;
  }

  // Helper to transform snake_case to camelCase
  private transformToCamelCase(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = this.transformToCamelCase(value);
    }
    return result;
  }
}

/**
 * Prisma Entity Repository
 *
 * Implements EntityRepository interface for Prisma ORM.
 */
export class PrismaEntityRepository<T extends BaseEntity> implements EntityRepository<T> {
  private prisma: any;
  private modelName: string;
  private userField: string;

  constructor(
    prisma: any,
    modelName: string,
    userField: string = 'userId'
  ) {
    this.prisma = prisma;
    this.modelName = modelName;
    this.userField = userField;
  }

  async findAll(userId?: string): Promise<T[]> {
    const where: any = {};
    if (userId) {
      where[this.userField] = userId;
    }

    const result = await (this.prisma[this.modelName] as any).findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return result as T[];
  }

  async findById(id: string, userId?: string): Promise<T | null> {
    const where: any = { id };
    if (userId) {
      where[this.userField] = userId;
    }

    const result = await (this.prisma[this.modelName] as any).findUnique({
      where,
    });
    return result as T | null;
  }

  async findByIds(ids: string[], userId?: string): Promise<T[]> {
    const where: any = { id: { in: ids } };
    if (userId) {
      where[this.userField] = userId;
    }

    const result = await (this.prisma[this.modelName] as any).findMany({
      where,
    });
    return result as T[];
  }

  async find(query: Partial<T>, userId?: string): Promise<T[]> {
    const where: any = { ...query };
    if (userId) {
      where[this.userField] = userId;
    }

    const result = await (this.prisma[this.modelName] as any).findMany({
      where,
    });
    return result as T[];
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, userId?: string): Promise<T> {
    const now = new Date();
    const createData = {
      ...data,
      [this.userField]: userId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await (this.prisma[this.modelName] as any).create({
      data: createData,
    });
    return result as T;
  }

  async update(id: string, data: Partial<T>, userId?: string): Promise<T | null> {
    const where: any = { id };
    if (userId) {
      where[this.userField] = userId;
    }

    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    const result = await (this.prisma[this.modelName] as any).update({
      where,
      data: updateData,
    });
    return result as T | null;
  }

  async delete(id: string, userId?: string): Promise<boolean> {
    const where: any = { id };
    if (userId) {
      where[this.userField] = userId;
    }

    try {
      await (this.prisma[this.modelName] as any).delete({
        where,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteMany(ids: string[], userId?: string): Promise<number> {
    const where: any = { id: { in: ids } };
    if (userId) {
      where[this.userField] = userId;
    }

    const result = await (this.prisma[this.modelName] as any).deleteMany({
      where,
    });
    return result.count || ids.length;
  }
}

/**
 * Factory function to create a repository based on configuration
 */
export function createEntityRepository<T extends BaseEntity>(
  config: EntityConfig<T>,
  dbClient: any
): EntityRepository<T> {
  // Determine which backend to use
  // Check if dbClient has prisma-like methods
  if (dbClient && typeof dbClient.$transaction === 'function') {
    // Prisma client
    const modelName = config.db?.tableName || config.entityType || 'entity';
    return new PrismaEntityRepository<T>(
      dbClient,
      modelName,
      config.db?.userField || 'userId'
    );
  } else if (dbClient && typeof dbClient.from === 'function') {
    // Supabase client
    const tableName = config.db?.tableName || config.entityType || 'entities';
    return new SupabaseEntityRepository<T>(
      dbClient,
      tableName,
      config.db?.userField || 'user_id'
    );
  }

  throw new Error('Unsupported database client');
}
