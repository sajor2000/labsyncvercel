import { Request, Response } from 'express';
import { z } from 'zod';
import { handleError, handleNotFound, handleUnauthorized, handleConflict, AppError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { logValidationError } from '../middleware/auditLogger';

/**
 * Base controller class that provides common patterns for all controllers
 */
export abstract class BaseController {
  /**
   * Validates request body using Zod schema
   */
  protected validateRequest<T>(req: Request, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(req.body);
    } catch (error) {
      logValidationError(req, error);
      throw new AppError('Validation failed', 400);
    }
  }

  /**
   * Validates request query using Zod schema
   */
  protected validateQuery<T>(req: Request, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(req.query);
    } catch (error) {
      logValidationError(req, error);
      throw new AppError('Query validation failed', 400);
    }
  }

  /**
   * Standard success response
   */
  protected success<T>(res: Response, data: T, statusCode: number = 200): Response {
    return res.status(statusCode).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Standard created response
   */
  protected created<T>(res: Response, data: T): Response {
    return this.success(res, data, 201);
  }

  /**
   * Standard no content response
   */
  protected noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Get authenticated user from request
   */
  protected getUser(req: Request): any {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    return req.user;
  }

  /**
   * Get user ID from request
   */
  protected getUserId(req: Request): string {
    const user = this.getUser(req);
    return user.id;
  }

  /**
   * Async wrapper for controller methods
   */
  protected asyncHandler(fn: (req: Request, res: Response) => Promise<any>) {
    return (req: Request, res: Response) => {
      Promise.resolve(fn(req, res)).catch((error) => {
        handleError(res, error, 'Internal server error');
      });
    };
  }

  /**
   * Handle entity not found
   */
  protected notFound(res: Response, entityName: string): void {
    handleNotFound(res, entityName);
  }

  /**
   * Handle unauthorized access
   */
  protected unauthorized(res: Response, message?: string): void {
    handleUnauthorized(res, message);
  }

  /**
   * Handle conflict errors
   */
  protected conflict(res: Response, message: string): void {
    handleConflict(res, message);
  }

  /**
   * Standardized audit logging
   */
  protected auditLog(action: string, entityType: string, entityId: string, userId: string, metadata?: any): void {
    logger.audit(`${action} ${entityType} ${entityId}`, {
      userId,
      action,
      entityType,
      entityId,
      ...metadata
    });
  }

  /**
   * Parse pagination parameters
   */
  protected getPagination(req: Request): { page: number; limit: number; offset: number } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Parse boolean query parameter
   */
  protected getBooleanQuery(req: Request, param: string, defaultValue: boolean = false): boolean {
    const value = req.query[param];
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    return defaultValue;
  }

  /**
   * Parse string query parameter with optional validation
   */
  protected getStringQuery(req: Request, param: string, defaultValue?: string): string | undefined {
    const value = req.query[param];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    return defaultValue;
  }
}