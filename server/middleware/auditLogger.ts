import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Comprehensive audit logging middleware
 */

interface AuditContext {
  userId?: string;
  ip: string;
  userAgent?: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  requestId: string;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Audit middleware for all requests
 */
export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  // Add request ID to request object for tracing
  (req as any).requestId = requestId;
  
  // Log request start
  logger.audit('Request started', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    contentType: req.get('Content-Type')
  });
  
  // Capture response end
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const duration = Date.now() - startTime;
    
    const auditContext: AuditContext = {
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      requestId
    };
    
    // Log different types of events
    if (req.path.startsWith('/api/auth')) {
      logger.audit('Authentication request', auditContext);
    } else if (req.method !== 'GET' && req.path.startsWith('/api/')) {
      logger.audit('Data modification request', {
        ...auditContext,
        operation: getOperationType(req.method),
        entity: extractEntityFromPath(req.path)
      });
    } else if (res.statusCode >= 400) {
      logger.audit('Request failed', {
        ...auditContext,
        errorType: getErrorType(res.statusCode)
      });
    } else if (duration > 5000) {
      logger.audit('Slow request detected', auditContext);
    }
    
    // Log session events
    if (req.path === '/api/auth/login' && res.statusCode === 200) {
      logger.audit('User login success', auditContext);
    } else if (req.path === '/api/auth/logout') {
      logger.audit('User logout', auditContext);
    }
    
    // Log file operations
    if (req.path.includes('/upload') || req.path.includes('/file')) {
      logger.audit('File operation', {
        ...auditContext,
        operation: req.method,
        fileInfo: {
          contentType: req.get('Content-Type'),
          contentLength: req.get('Content-Length')
        }
      });
    }
    
    return originalEnd.apply(this, args);
  };
  
  next();
};

/**
 * Get operation type from HTTP method
 */
function getOperationType(method: string): string {
  switch (method) {
    case 'POST': return 'CREATE';
    case 'PUT': return 'UPDATE';
    case 'PATCH': return 'MODIFY';
    case 'DELETE': return 'DELETE';
    default: return method;
  }
}

/**
 * Extract entity name from API path
 */
function extractEntityFromPath(path: string): string {
  const match = path.match(/\/api\/([^\/]+)/);
  return match ? match[1] : 'unknown';
}

/**
 * Get error type from status code
 */
function getErrorType(statusCode: number): string {
  if (statusCode >= 500) return 'SERVER_ERROR';
  if (statusCode === 404) return 'NOT_FOUND';
  if (statusCode === 401) return 'UNAUTHORIZED';
  if (statusCode === 403) return 'FORBIDDEN';
  if (statusCode === 400) return 'BAD_REQUEST';
  if (statusCode === 429) return 'RATE_LIMITED';
  return 'CLIENT_ERROR';
}

/**
 * Log validation errors
 */
export const logValidationError = (req: Request, error: any) => {
  logger.audit('Validation error', {
    requestId: (req as any).requestId,
    userId: req.user?.id,
    ip: req.ip,
    path: req.path,
    method: req.method,
    error: error.message || String(error),
    validationType: 'REQUEST_VALIDATION'
  });
};

/**
 * Log security events
 */
export const logSecurityEvent = (req: Request, eventType: string, details: any = {}) => {
  logger.security(`Security event: ${eventType}`, {
    requestId: (req as any).requestId,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method,
    eventType,
    ...details
  });
};

/**
 * Audit report generation
 */
export async function generateAuditReport(startDate: Date, endDate: Date) {
  // This would typically query a dedicated audit log table
  // For now, we'll return a summary of audit events
  
  const report = {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    },
    summary: {
      totalRequests: 0,
      authenticationEvents: 0,
      dataModifications: 0,
      failedRequests: 0,
      securityEvents: 0
    },
    recommendations: [
      'Regular security audit reviews',
      'Monitor failed authentication attempts',
      'Review slow query patterns',
      'Check for unusual access patterns'
    ],
    generatedAt: new Date().toISOString()
  };
  
  return report;
}