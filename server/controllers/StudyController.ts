import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { storage } from '../storage';
import {
  CreateStudySchema,
  UpdateStudySchema,
  StudyQuerySchema,
  DeleteOptionsSchema,
  CreateStudyRequest,
  UpdateStudyRequest,
  StudyQuery,
  DeleteOptions
} from '../types/requests';

/**
 * Controller for Study-related operations
 * Handles CRUD operations for research studies
 */
export class StudyController extends BaseController {
  /**
   * GET /api/studies
   * Get all studies with optional filtering and pagination
   */
  public getAllStudies = this.asyncHandler(async (req: Request, res: Response) => {
    const query = this.validateQuery(req, StudyQuerySchema);
    const userId = this.getUserId(req);

    // Get studies based on lab filter
    let studies;
    if (query.labId) {
      studies = await storage.getStudiesByLab(query.labId);
    } else {
      studies = await storage.getAllStudies();
    }

    // Apply additional filtering
    let filteredStudies = studies;
    
    if (query.bucketId) {
      filteredStudies = filteredStudies.filter(study => study.bucketId === query.bucketId);
    }

    if (query.status) {
      filteredStudies = filteredStudies.filter(study => study.status === query.status);
    }

    if (query.priority) {
      filteredStudies = filteredStudies.filter(study => study.priority === query.priority);
    }

    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredStudies = filteredStudies.filter(study => 
        study.name.toLowerCase().includes(searchTerm) ||
        study.notes?.toLowerCase().includes(searchTerm) ||
        study.firstAuthor?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination
    const { page, limit, offset } = this.getPagination(req);
    const total = filteredStudies.length;
    const paginatedStudies = filteredStudies.slice(offset, offset + limit);

    this.auditLog('VIEW_STUDIES', 'studies', 'all', userId, { 
      count: paginatedStudies.length, 
      filters: query 
    });

    return res.json({
      success: true,
      data: paginatedStudies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/studies/:id
   * Get a specific study by ID
   */
  public getStudyById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getUserId(req);

    const study = await storage.getStudy(id);
    if (!study) {
      this.notFound(res, 'Study');
      return;
    }

    this.auditLog('VIEW_STUDY', 'study', id, userId);
    return this.success(res, study);
  });

  /**
   * POST /api/studies
   * Create a new study
   */
  public createStudy = this.asyncHandler(async (req: Request, res: Response) => {
    const studyData = this.validateRequest(req, CreateStudySchema);
    const userId = this.getUserId(req);

    // Validate lab exists
    const lab = await storage.getLabById(studyData.labId);
    if (!lab) {
      this.notFound(res, 'Lab');
      return;
    }

    // Validate bucket exists if specified
    if (studyData.bucketId) {
      const bucket = await storage.getBucket(studyData.bucketId);
      if (!bucket) {
        this.notFound(res, 'Bucket');
        return;
      }
    }

    // Create study with audit fields
    const newStudy = await storage.createStudy({
      ...studyData,
      createdBy: userId
    });

    this.auditLog('CREATE_STUDY', 'study', newStudy.id, userId, { 
      name: newStudy.name,
      labId: newStudy.labId 
    });

    return this.created(res, newStudy);
  });

  /**
   * PUT /api/studies/:id
   * Update an existing study
   */
  public updateStudy = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = this.validateRequest(req, UpdateStudySchema);
    const userId = this.getUserId(req);

    // Check if study exists
    const existingStudy = await storage.getStudy(id);
    if (!existingStudy) {
      this.notFound(res, 'Study');
      return;
    }

    // Validate lab exists if being updated
    if (updateData.labId && updateData.labId !== existingStudy.labId) {
      const lab = await storage.getLabById(updateData.labId);
      if (!lab) {
        this.notFound(res, 'Lab');
        return;
      }
    }

    // Validate bucket exists if being updated
    if (updateData.bucketId && updateData.bucketId !== existingStudy.bucketId) {
      const bucket = await storage.getBucket(updateData.bucketId);
      if (!bucket) {
        this.notFound(res, 'Bucket');
        return;
      }
    }

    // Update study
    const updatedStudy = await storage.updateStudy(id, {
      ...updateData,
      updatedAt: new Date()
    });

    this.auditLog('UPDATE_STUDY', 'study', id, userId, updateData);
    return this.success(res, updatedStudy);
  });

  /**
   * DELETE /api/studies/:id
   * Delete a study (with optional cascade)
   */
  public deleteStudy = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const options = this.validateQuery(req, DeleteOptionsSchema);
    const userId = this.getUserId(req);

    // Check if study exists
    const study = await storage.getStudy(id);
    if (!study) {
      this.notFound(res, 'Study');
      return;
    }

    // Check for dependent tasks if not forcing
    if (!options.force) {
      const tasks = await storage.getTasksByStudy(id);
      const activeTasks = tasks.filter(task => task.isActive);

      if (activeTasks.length > 0) {
        this.conflict(res, 
          `Cannot delete study with ${activeTasks.length} active tasks. Use ?force=true to cascade delete tasks.`
        );
        return;
      }
    }

    // Delete study (with cascade if force=true)
    await storage.deleteStudy(id, options.force);

    this.auditLog('DELETE_STUDY', 'study', id, userId, { 
      force: options.force, 
      name: study.name 
    });

    return this.noContent(res);
  });

  /**
   * GET /api/studies/:id/tasks
   * Get all tasks for a specific study
   */
  public getStudyTasks = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getUserId(req);

    // Check if study exists
    const study = await storage.getStudy(id);
    if (!study) {
      this.notFound(res, 'Study');
      return;
    }

    const tasks = await storage.getTasksByStudy(id);

    this.auditLog('VIEW_STUDY_TASKS', 'study', id, userId, { taskCount: tasks.length });
    return this.success(res, tasks);
  });

  /**
   * GET /api/studies/:id/stats
   * Get statistics for a specific study
   */
  public getStudyStats = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getUserId(req);

    // Check if study exists
    const study = await storage.getStudy(id);
    if (!study) {
      this.notFound(res, 'Study');
      return;
    }

    const tasks = await storage.getTasksByStudy(id);

    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'DONE').length,
      inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      todoTasks: tasks.filter(t => t.status === 'TODO').length,
      overdueTasks: tasks.filter(t => 
        t.dueDate && 
        new Date(t.dueDate) < new Date() && 
        t.status !== 'DONE'
      ).length,
      tasksByPriority: {
        urgent: tasks.filter(t => t.priority === 'URGENT').length,
        high: tasks.filter(t => t.priority === 'HIGH').length,
        medium: tasks.filter(t => t.priority === 'MEDIUM').length,
        low: tasks.filter(t => t.priority === 'LOW').length,
      },
      studyInfo: {
        name: study.name,
        status: study.status,
        priority: study.priority,
        createdAt: study.createdAt,
        updatedAt: study.updatedAt
      }
    };

    this.auditLog('VIEW_STUDY_STATS', 'study', id, userId);
    return this.success(res, stats);
  });

  /**
   * PUT /api/studies/:id/status
   * Update study status with validation
   */
  public updateStudyStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = this.getUserId(req);

    if (!status || !['PLANNING', 'IRB_SUBMISSION', 'IRB_APPROVED', 'DATA_COLLECTION', 'ANALYSIS', 'MANUSCRIPT', 'UNDER_REVIEW', 'PUBLISHED', 'ON_HOLD', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ 
        error: 'Valid status is required (PLANNING, IRB_SUBMISSION, IRB_APPROVED, DATA_COLLECTION, ANALYSIS, MANUSCRIPT, UNDER_REVIEW, PUBLISHED, ON_HOLD, CANCELLED)' 
      });
    }

    // Check if study exists
    const study = await storage.getStudy(id);
    if (!study) {
      this.notFound(res, 'Study');
      return;
    }

    // Update status
    const updatedStudy = await storage.updateStudy(id, {
      status,
      updatedAt: new Date()
    });

    this.auditLog('UPDATE_STUDY_STATUS', 'study', id, userId, { 
      oldStatus: study.status, 
      newStatus: status 
    });

    return this.success(res, updatedStudy);
  });
}