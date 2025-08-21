import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { storage } from '../storage';
import { LabRepository } from '../repositories/LabRepository';
import {
  CreateLabSchema,
  UpdateLabSchema,
  LabQuerySchema,
  DeleteOptionsSchema,
  CreateLabRequest,
  UpdateLabRequest,
  LabQuery,
  DeleteOptions
} from '../types/requests';

/**
 * Controller for Lab-related operations
 * Handles CRUD operations for laboratories
 */
export class LabController extends BaseController {
  private labRepository: LabRepository;

  constructor() {
    super();
    this.labRepository = new LabRepository();
  }
  /**
   * GET /api/labs
   * Get all labs with optional filtering and pagination
   */
  public getAllLabs = this.asyncHandler(async (req: Request, res: Response) => {
    const query = this.validateQuery(req, LabQuerySchema);
    const userId = this.getUserId(req);

    // Use repository for search and pagination
    const result = await this.labRepository.findWithSearch(
      query.search,
      query.isActive,
      query.page,
      query.limit
    );

    // Audit log
    this.auditLog('VIEW_LABS', 'labs', 'all', userId, { 
      count: result.data.length, 
      filters: query 
    });

    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/labs/:id
   * Get a specific lab by ID
   */
  public getLabById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getUserId(req);

    const lab = await this.labRepository.findById(id);
    if (!lab) {
      this.notFound(res, 'Lab');
      return;
    }

    this.auditLog('VIEW_LAB', 'lab', id, userId);
    return this.success(res, lab);
  });

  /**
   * POST /api/labs
   * Create a new lab
   */
  public createLab = this.asyncHandler(async (req: Request, res: Response) => {
    const labData = this.validateRequest(req, CreateLabSchema);
    const userId = this.getUserId(req);

    // Create lab with defaults and audit fields
    const newLab = await this.labRepository.createWithDefaults(labData);

    this.auditLog('CREATE_LAB', 'lab', newLab.id, userId, { name: newLab.name });
    return this.created(res, newLab);
  });

  /**
   * PUT /api/labs/:id
   * Update an existing lab
   */
  public updateLab = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = this.validateRequest(req, UpdateLabSchema);
    const userId = this.getUserId(req);

    // Check if lab exists
    const existingLab = await storage.getLabById(id);
    if (!existingLab) {
      this.notFound(res, 'Lab');
      return;
    }

    // Authorization check - only lab creators or admins should be able to update
    if (existingLab.createdBy !== userId) {
      this.unauthorized(res, "Only lab creators can update this lab");
      return;
    }

    // Update lab
    const updatedLab = await storage.updateLab(id, {
      ...updateData,
      updatedAt: new Date()
    });

    this.auditLog('UPDATE_LAB', 'lab', id, userId, updateData);
    return this.success(res, updatedLab);
  });

  /**
   * DELETE /api/labs/:id
   * Delete a lab (with optional cascade)
   */
  public deleteLab = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const options = this.validateQuery(req, DeleteOptionsSchema);
    const userId = this.getUserId(req);

    // Check if lab exists
    const lab = await storage.getLabById(id);
    if (!lab) {
      this.notFound(res, 'Lab');
      return;
    }

    // Authorization check - only lab creators should be able to delete
    if (lab.createdBy !== userId) {
      this.unauthorized(res, "Only lab creators can delete this lab");
      return;
    }

    // Check for dependencies if not forcing
    if (!options.force) {
      const [studies, buckets, members] = await Promise.all([
        storage.getStudiesByLab(id),
        storage.getBucketsByLab(id),
        storage.getLabMembers(id)
      ]);

      const activeStudies = studies.filter(s => s.isActive);
      const activeBuckets = buckets.filter(b => b.isActive);
      const activeMembers = members.filter(m => m.isActive);

      if (activeStudies.length > 0 || activeBuckets.length > 0 || activeMembers.length > 0) {
        this.conflict(res, 
          `Cannot delete lab with ${activeStudies.length} studies, ${activeBuckets.length} buckets, and ${activeMembers.length} members. Use ?force=true to cascade delete.`
        );
        return;
      }
    }

    // Delete lab (with cascade if force=true)
    await storage.deleteLab(id, options.force);

    this.auditLog('DELETE_LAB', 'lab', id, userId, { 
      force: options.force, 
      labName: lab.name 
    });

    return this.noContent(res);
  });

  /**
   * GET /api/labs/:id/members
   * Get all members of a specific lab
   */
  public getLabMembers = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getUserId(req);

    // Check if lab exists
    const lab = await storage.getLabById(id);
    if (!lab) {
      this.notFound(res, 'Lab');
      return;
    }

    const members = await storage.getLabMembers(id);

    this.auditLog('VIEW_LAB_MEMBERS', 'lab', id, userId, { memberCount: members.length });
    return this.success(res, members);
  });

  /**
   * GET /api/labs/:id/studies
   * Get all studies for a specific lab
   */
  public getLabStudies = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getUserId(req);

    // Check if lab exists
    const lab = await storage.getLabById(id);
    if (!lab) {
      this.notFound(res, 'Lab');
      return;
    }

    const studies = await storage.getStudiesByLab(id);

    this.auditLog('VIEW_LAB_STUDIES', 'lab', id, userId, { studyCount: studies.length });
    return this.success(res, studies);
  });

  /**
   * GET /api/labs/:id/stats
   * Get statistics for a specific lab
   */
  public getLabStats = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getUserId(req);

    // Check if lab exists
    const lab = await storage.getLabById(id);
    if (!lab) {
      this.notFound(res, 'Lab');
      return;
    }

    // Get various counts
    const [studies, buckets, members, tasks] = await Promise.all([
      storage.getStudiesByLab(id),
      storage.getBucketsByLab(id),
      storage.getLabMembers(id),
      storage.getTasksByLab(id)
    ]);

    const stats = {
      totalStudies: studies.length,
      activeStudies: studies.filter(s => s.isActive).length,
      totalBuckets: buckets.length,
      activeBuckets: buckets.filter(b => b.isActive).length,
      totalMembers: members.length,
      activeMembers: members.filter(m => m.isActive).length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'DONE').length,
      activeTasks: tasks.filter(t => t.status !== 'DONE' && t.isActive).length
    };

    this.auditLog('VIEW_LAB_STATS', 'lab', id, userId);
    return this.success(res, stats);
  });
}