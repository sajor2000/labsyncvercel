import { BaseRepository } from './BaseRepository';
import { labs, type Lab, type InsertLab } from '../../shared/schema';
import { eq, and, desc, ilike, sql } from 'drizzle-orm';
import { storage } from '../storage'; // For now, we'll use existing storage for complex operations

/**
 * Repository for Lab entity operations
 * Extends BaseRepository with Lab-specific methods
 */
export class LabRepository extends BaseRepository<typeof labs, Lab, InsertLab> {
  constructor() {
    super(labs);
  }

  /**
   * Find labs with search functionality
   */
  async findWithSearch(
    search?: string,
    isActive?: boolean,
    page: number = 1,
    limit: number = 20
  ) {
    const conditions = [];

    if (isActive !== undefined) {
      conditions.push(eq(labs.isActive, isActive));
    }

    if (search && search.trim().length > 0) {
      const searchTerm = `%${search.toLowerCase()}%`;
      conditions.push(
        sql`(
          LOWER(${labs.name}) LIKE ${searchTerm} OR
          LOWER(${labs.fullName}) LIKE ${searchTerm} OR
          LOWER(${labs.description}) LIKE ${searchTerm} OR
          LOWER(${labs.institution}) LIKE ${searchTerm}
        )`
      );
    }

    return await this.findWithPagination(
      page,
      limit,
      conditions,
      [desc(labs.createdAt)]
    );
  }

  /**
   * Find active labs only
   */
  async findActive(): Promise<Lab[]> {
    return await this.findAll([eq(labs.isActive, true)]);
  }

  /**
   * Find labs by institution
   */
  async findByInstitution(institution: string): Promise<Lab[]> {
    return await this.findByField('institution', institution);
  }

  /**
   * Find labs by creator
   */
  async findByCreator(createdBy: string): Promise<Lab[]> {
    return await this.findByField('createdBy', createdBy);
  }

  /**
   * Get lab statistics using optimized queries
   */
  async getLabStats(labId: string) {
    // Use Promise.all to execute all queries in parallel (avoiding N+1)
    const [studies, buckets, members, tasks] = await Promise.all([
      storage.getStudiesByLab(labId),
      storage.getBucketsByLab(labId),
      storage.getLabMembers(labId),
      storage.getTasksByLab(labId)
    ]);

    return {
      totalStudies: studies.length,
      activeStudies: studies.filter(s => s.isActive).length,
      totalBuckets: buckets.length,
      activeBuckets: buckets.filter(b => b.isActive).length,
      totalMembers: members.length,
      activeMembers: members.filter(m => m.isActive).length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
      activeTasks: tasks.filter(t => t.status !== 'COMPLETED' && t.isActive).length
    };
  }

  /**
   * Check if lab has dependencies using optimized parallel queries
   */
  async checkDependencies(labId: string): Promise<{
    hasStudies: boolean;
    hasBuckets: boolean;
    hasMembers: boolean;
    studyCount: number;
    bucketCount: number;
    memberCount: number;
  }> {
    // Execute all dependency checks in parallel to avoid N+1 queries
    const [studies, buckets, members] = await Promise.all([
      storage.getStudiesByLab(labId),
      storage.getBucketsByLab(labId),
      storage.getLabMembers(labId)
    ]);

    const activeStudies = studies.filter(s => s.isActive);
    const activeBuckets = buckets.filter(b => b.isActive);
    const activeMembers = members.filter(m => m.isActive);

    return {
      hasStudies: activeStudies.length > 0,
      hasBuckets: activeBuckets.length > 0,
      hasMembers: activeMembers.length > 0,
      studyCount: activeStudies.length,
      bucketCount: activeBuckets.length,
      memberCount: activeMembers.length
    };
  }

  /**
   * Delete lab with cascade option
   */
  async deleteWithCascade(labId: string, force: boolean = false): Promise<void> {
    if (force) {
      // Use existing storage method for complex cascade delete
      await storage.deleteLab(labId, true);
    } else {
      // Check dependencies first
      const dependencies = await this.checkDependencies(labId);
      
      if (dependencies.hasStudies || dependencies.hasBuckets || dependencies.hasMembers) {
        throw new Error(
          `Cannot delete lab with ${dependencies.studyCount} studies, ${dependencies.bucketCount} buckets, and ${dependencies.memberCount} members. Use force=true to cascade delete.`
        );
      }
      
      await this.delete(labId);
    }
  }

  /**
   * Update lab with audit trail
   */
  async updateWithAudit(id: string, data: Partial<InsertLab>, userId: string): Promise<Lab> {
    const updatedLab = await this.update(id, {
      ...data,
      updatedAt: new Date()
    });

    // Log audit event (in a full system, this would go to an audit service)
    console.log(`Lab ${id} updated by user ${userId}`, data);

    return updatedLab;
  }

  /**
   * Create lab with default settings
   */
  async createWithDefaults(data: Omit<InsertLab, 'createdAt' | 'updatedAt'>): Promise<Lab> {
    const labData: InsertLab = {
      ...data,
      isActive: data.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.create(labData);
  }
}