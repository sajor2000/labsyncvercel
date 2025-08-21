import { db } from '../db';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

/**
 * Base repository class that provides common database operations
 * All entity repositories should extend this class
 */
export abstract class BaseRepository<TTable extends PgTable, TEntity, TInsert> {
  protected table: TTable;

  constructor(table: TTable) {
    this.table = table;
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<TEntity | undefined> {
    const [result] = await db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    
    return result as TEntity;
  }

  /**
   * Find all entities with optional filtering
   */
  async findAll(conditions?: any[]): Promise<TEntity[]> {
    let query = db.select().from(this.table);
    
    if (conditions && conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query as TEntity[];
  }

  /**
   * Find entities with pagination
   */
  async findWithPagination(
    page: number = 1, 
    limit: number = 20, 
    conditions?: any[],
    orderBy?: any[]
  ): Promise<{
    data: TEntity[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const offset = (page - 1) * limit;

    // Build query
    let query = db.select().from(this.table);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(this.table);

    if (conditions && conditions.length > 0) {
      const whereClause = and(...conditions);
      query = query.where(whereClause);
      countQuery = countQuery.where(whereClause);
    }

    if (orderBy && orderBy.length > 0) {
      query = query.orderBy(...orderBy);
    }

    query = query.limit(limit).offset(offset);

    // Execute both queries
    const [data, countResult] = await Promise.all([
      query as Promise<TEntity[]>,
      countQuery
    ]);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: offset + limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Create a new entity
   */
  async create(data: TInsert): Promise<TEntity> {
    const [result] = await db
      .insert(this.table)
      .values(data)
      .returning();
    
    return result as TEntity;
  }

  /**
   * Update entity by ID
   */
  async update(id: string, data: Partial<TInsert>): Promise<TEntity> {
    const [result] = await db
      .update(this.table)
      .set(data)
      .where(eq(this.table.id, id))
      .returning();
    
    return result as TEntity;
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<void> {
    await db
      .delete(this.table)
      .where(eq(this.table.id, id));
  }

  /**
   * Soft delete (set isActive to false)
   */
  async softDelete(id: string): Promise<TEntity> {
    return await this.update(id, { 
      isActive: false, 
      updatedAt: new Date() 
    } as Partial<TInsert>);
  }

  /**
   * Count entities with optional conditions
   */
  async count(conditions?: any[]): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(this.table);
    
    if (conditions && conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const [result] = await query;
    return result?.count || 0;
  }

  /**
   * Check if entity exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const [result] = await db
      .select({ id: this.table.id })
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    
    return !!result;
  }

  /**
   * Find entities by field value
   */
  async findByField(field: string, value: any): Promise<TEntity[]> {
    return await db
      .select()
      .from(this.table)
      .where(eq(this.table[field], value)) as TEntity[];
  }

  /**
   * Find one entity by field value
   */
  async findOneByField(field: string, value: any): Promise<TEntity | undefined> {
    const [result] = await db
      .select()
      .from(this.table)
      .where(eq(this.table[field], value))
      .limit(1);
    
    return result as TEntity;
  }

  /**
   * Batch create entities
   */
  async batchCreate(data: TInsert[]): Promise<TEntity[]> {
    if (data.length === 0) return [];
    
    return await db
      .insert(this.table)
      .values(data)
      .returning() as TEntity[];
  }

  /**
   * Batch update entities
   */
  async batchUpdate(updates: Array<{ id: string; data: Partial<TInsert> }>): Promise<TEntity[]> {
    if (updates.length === 0) return [];
    
    const results = await Promise.all(
      updates.map(({ id, data }) => this.update(id, data))
    );
    
    return results;
  }

  /**
   * Get database instance for complex queries
   */
  protected getDb() {
    return db;
  }

  /**
   * Get table reference for complex queries
   */
  protected getTable() {
    return this.table;
  }

  /**
   * Execute raw SQL query (use sparingly)
   */
  protected async executeRaw<T = any>(query: string, params?: any[]): Promise<T[]> {
    return await db.execute(sql.raw(query, params));
  }
}