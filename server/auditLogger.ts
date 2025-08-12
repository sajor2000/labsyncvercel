// PHASE 2: Security Audit Logging Middleware
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

export interface AuditContext {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ACCESS_DENIED' | 'PERMISSION_CHANGE';
  entityType: 'USER' | 'LAB' | 'BUCKET' | 'STUDY' | 'TASK' | 'IDEA' | 'DEADLINE' | 'TEAM_MEMBER' | 'LAB_MEMBER' | 'STANDUP' | 'WORKFLOW_TRIGGER' | 'AUTOMATION_RULE' | 'AUTOMATED_SCHEDULE' | 'WORKFLOW_TEMPLATE';
  entityId?: string;
  authorizationMethod?: 'ownership' | 'admin' | 'permission';
  requiredPermission?: string;
  wasAuthorized: boolean;
  details?: any;
  errorMessage?: string;
}

export class SecurityAuditLogger {
  static async logEvent(req: any, context: AuditContext): Promise<void> {
    try {
      const user = req.user?.claims;
      const userLab = req.headers['x-current-lab'];
      
      await storage.createSecurityAuditLog({
        action: context.action,
        entityType: context.entityType,
        entityId: context.entityId,
        userId: user?.sub || null,
        userEmail: user?.email || null,
        labId: userLab || null,
        authorizationMethod: context.authorizationMethod || null,
        requiredPermission: context.requiredPermission || null,
        wasAuthorized: context.wasAuthorized,
        ipAddress: req.ip || req.connection?.remoteAddress || null,
        userAgent: req.get('User-Agent') || null,
        endpoint: req.originalUrl || req.path,
        httpMethod: req.method,
        details: context.details || null,
        errorMessage: context.errorMessage || null,
        sessionId: req.sessionID || null,
      });
    } catch (error) {
      // Log error but don't throw to avoid breaking main functionality
      console.error('Failed to create audit log:', error);
    }
  }

  static async logDeleteAttempt(
    req: any, 
    entityType: AuditContext['entityType'], 
    entityId: string, 
    authorized: boolean, 
    method?: string,
    error?: string
  ): Promise<void> {
    await this.logEvent(req, {
      action: 'DELETE',
      entityType,
      entityId,
      authorizationMethod: method as any,
      wasAuthorized: authorized,
      errorMessage: error,
      details: authorized ? null : { reason: 'Ownership or admin validation failed' }
    });
  }

  static async logAccessDenied(
    req: any, 
    entityType: AuditContext['entityType'], 
    reason: string,
    entityId?: string
  ): Promise<void> {
    await this.logEvent(req, {
      action: 'ACCESS_DENIED',
      entityType,
      entityId,
      wasAuthorized: false,
      errorMessage: reason,
      details: { deniedResource: req.originalUrl }
    });
  }

  static async logSuccessfulDelete(
    req: any, 
    entityType: AuditContext['entityType'], 
    entityId: string, 
    method: string
  ): Promise<void> {
    await this.logEvent(req, {
      action: 'DELETE',
      entityType,
      entityId,
      authorizationMethod: method as any,
      wasAuthorized: true,
      details: { deletionMethod: method }
    });
  }
}

// Middleware to automatically log failed authentication attempts
export const auditAuthenticationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  res.send = function(body: any) {
    if (res.statusCode === 401) {
      SecurityAuditLogger.logEvent(req as any, {
        action: 'ACCESS_DENIED',
        entityType: 'USER',
        wasAuthorized: false,
        errorMessage: 'Authentication failed',
        details: { endpoint: req.originalUrl, method: req.method }
      });
    }
    return originalSend.call(this, body);
  };
  next();
};