import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { storage } from '../storage';
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  TaskQuerySchema,
  MoveTaskSchema,
  DeleteOptionsSchema,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskQuery,
  MoveTaskRequest
} from '../types/requests';

/**
 * Controller for Task-related operations
 * Handles CRUD operations for research tasks
 */
export class TaskController extends BaseController {
  /**
   * GET /api/tasks
   * Get all tasks with optional filtering and pagination
   */
  public getAllTasks = this.asyncHandler(async (req: Request, res: Response) => {
    const query = this.validateQuery(req, TaskQuerySchema);
    const userId = this.getUserId(req);

    // Get tasks based on filters
    let tasks;
    if (query.studyId && query.assigneeId) {
      tasks = await storage.getTasks(query.studyId, query.assigneeId);
    } else if (query.studyId) {
      tasks = await storage.getTasksByStudy(query.studyId);
    } else if (query.assigneeId) {
      tasks = await storage.getTasks(undefined, query.assigneeId);
    } else {
      tasks = await storage.getAllTasks();
    }

    // Apply additional filtering
    let filteredTasks = tasks;

    if (query.status) {
      filteredTasks = filteredTasks.filter(task => task.status === query.status);
    }

    if (query.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === query.priority);
    }

    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        task.description?.toLowerCase().includes(searchTerm) ||
        task.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (query.overdue) {
      const now = new Date();
      filteredTasks = filteredTasks.filter(task => 
        task.dueDate && 
        new Date(task.dueDate) < now && 
        task.status !== 'DONE'
      );
    }

    // Apply pagination
    const { page, limit, offset } = this.getPagination(req);
    const total = filteredTasks.length;
    const paginatedTasks = filteredTasks.slice(offset, offset + limit);

    this.auditLog('VIEW_TASKS', 'tasks', 'all', userId, { 
      count: paginatedTasks.length, 
      filters: query 
    });

    return res.json({
      success: true,
      data: paginatedTasks,
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
   * GET /api/tasks/:id
   * Get a specific task by ID
   */
  public getTaskById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getUserId(req);

    const task = await storage.getTask(id);
    if (!task) {
      this.notFound(res, 'Task');
      return;
    }

    this.auditLog('VIEW_TASK', 'task', id, userId);
    return this.success(res, task);
  });

  /**
   * POST /api/tasks
   * Create a new task
   */
  public createTask = this.asyncHandler(async (req: Request, res: Response) => {
    const taskData = this.validateRequest(req, CreateTaskSchema);
    const userId = this.getUserId(req);

    // Validate study exists
    const study = await storage.getStudy(taskData.studyId);
    if (!study) {
      return this.notFound(res, 'Study');
    }

    // Validate assignee exists if specified
    if (taskData.assigneeId) {
      const assignee = await storage.getUser(taskData.assigneeId);
      if (!assignee || !assignee.isActive) {
        this.notFound(res, 'Assignee');
        return;
      }
    }

    // Validate parent task exists if specified
    if (taskData.parentTaskId) {
      const parentTask = await storage.getTask(taskData.parentTaskId);
      if (!parentTask) {
        this.notFound(res, 'Parent task');
        return;
      }
    }

    // Create task with audit fields
    const newTask = await storage.createTask({
      ...taskData,
      createdBy: userId
    });

    this.auditLog('CREATE_TASK', 'task', newTask.id, userId, { 
      title: newTask.title,
      studyId: newTask.studyId,
      assigneeId: newTask.assigneeId
    });

    // TODO: Implement task assignment notification
    // if (newTask.assigneeId) {
    //   await emailService.sendTaskAssignmentNotification(newTask);
    // }
    
    return this.created(res, newTask);
  });

  /**
   * PUT /api/tasks/:id
   * Update an existing task
   */
  public updateTask = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = this.validateRequest(req, UpdateTaskSchema);
    const userId = this.getUserId(req);

    // Check if task exists
    const existingTask = await storage.getTask(id);
    if (!existingTask) {
      this.notFound(res, 'Task');
      return;
    }

    // Validate study exists if being updated
    if (updateData.studyId && updateData.studyId !== existingTask.studyId) {
      const study = await storage.getStudy(updateData.studyId);
      if (!study) {
        this.notFound(res, 'Study');
        return;
      }
    }

    // Validate assignee exists if being updated
    if (updateData.assigneeId && updateData.assigneeId !== existingTask.assigneeId) {
      const assignee = await storage.getUser(updateData.assigneeId);
      if (!assignee || !assignee.isActive) {
        this.notFound(res, 'Assignee');
        return;
      }
    }

    // Update task
    const updatedTask = await storage.updateTask(id, {
      ...updateData,
      updatedAt: new Date(),
      // Set completion timestamp if status changed to completed
      completedAt: updateData.status === 'DONE' && existingTask.status !== 'DONE' 
        ? new Date() 
        : existingTask.completedAt,
      completedById: updateData.status === 'DONE' && existingTask.status !== 'DONE' 
        ? userId 
        : existingTask.completedById
    });

    this.auditLog('UPDATE_TASK', 'task', id, userId, updateData);

    // TODO: Implement change notifications
    // if (updateData.assigneeId !== existingTask.assigneeId) {
    //   await emailService.sendTaskReassignmentNotification(updatedTask);
    // }
    
    return this.success(res, updatedTask);
  });

  /**
   * DELETE /api/tasks/:id
   * Delete a task
   */
  public deleteTask = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = this.getUserId(req);

    // Check if task exists
    const task = await storage.getTask(id);
    if (!task) {
      this.notFound(res, 'Task');
      return;
    }

    // Permission check - only creator or assignee can delete task
    const canDelete = task.createdBy === userId || 
                     (task.assigneeId && task.assigneeId === userId);
    
    if (!canDelete) {
      this.unauthorized(res, "You don't have permission to delete this task");
      return;
    }

    await storage.deleteTask(id);

    this.auditLog('DELETE_TASK', 'task', id, userId, { 
      title: task.title,
      studyId: task.studyId
    });

    return this.noContent(res);
  });

  /**
   * PUT /api/tasks/:id/move
   * Move a task (change status, position, or study)
   */
  public moveTask = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const moveData = this.validateRequest(req, MoveTaskSchema);
    const userId = this.getUserId(req);

    // Check if task exists
    const task = await storage.getTask(id);
    if (!task) {
      this.notFound(res, 'Task');
      return;
    }

    // Validate new study exists if specified
    if (moveData.newStudyId && moveData.newStudyId !== task.studyId) {
      const study = await storage.getStudy(moveData.newStudyId);
      if (!study) {
        return this.notFound(res, 'Target study');
      }
    }

    // Move task
    const movedTask = await storage.moveTask(id, moveData);

    this.auditLog('MOVE_TASK', 'task', id, userId, {
      from: {
        status: task.status,
        studyId: task.studyId,
        position: task.position
      },
      to: moveData
    });

    return this.success(res, movedTask);
  });

  /**
   * PUT /api/tasks/:id/status
   * Update task status with validation
   */
  public updateTaskStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = this.getUserId(req);

    if (!status || !['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'].includes(status)) {
      return res.status(400).json({ 
        error: 'Valid status is required (TODO, IN_PROGRESS, REVIEW, DONE, BLOCKED)' 
      });
    }

    // Check if task exists
    const task = await storage.getTask(id);
    if (!task) {
      this.notFound(res, 'Task');
      return;
    }

    // Update status with completion tracking
    const updatedTask = await storage.updateTask(id, {
      status,
      updatedAt: new Date(),
      completedAt: status === 'DONE' && task.status !== 'DONE' 
        ? new Date() 
        : task.completedAt,
      completedById: status === 'DONE' && task.status !== 'DONE' 
        ? userId 
        : task.completedById
    });

    this.auditLog('UPDATE_TASK_STATUS', 'task', id, userId, { 
      oldStatus: task.status, 
      newStatus: status 
    });

    return this.success(res, updatedTask);
  });

  /**
   * GET /api/tasks/my
   * Get tasks assigned to the current user
   */
  public getMyTasks = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const query = this.validateQuery(req, TaskQuerySchema);

    // Get tasks assigned to current user
    const tasks = await storage.getTasks(undefined, userId);

    // Apply filtering
    let filteredTasks = tasks;

    if (query.status) {
      filteredTasks = filteredTasks.filter(task => task.status === query.status);
    }

    if (query.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === query.priority);
    }

    if (query.overdue) {
      const now = new Date();
      filteredTasks = filteredTasks.filter(task => 
        task.dueDate && 
        new Date(task.dueDate) < now && 
        task.status !== 'DONE'
      );
    }

    // Sort by priority and due date
    filteredTasks.sort((a, b) => {
      const priorityOrder = { 'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - 
                          priorityOrder[b.priority as keyof typeof priorityOrder];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      
      return 0;
    });

    // Apply pagination
    const { page, limit, offset } = this.getPagination(req);
    const total = filteredTasks.length;
    const paginatedTasks = filteredTasks.slice(offset, offset + limit);

    this.auditLog('VIEW_MY_TASKS', 'tasks', 'my', userId, { 
      count: paginatedTasks.length 
    });

    return res.json({
      success: true,
      data: paginatedTasks,
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
}