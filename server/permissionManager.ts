// PHASE 3: Advanced Permission Management System
import { storage } from './storage';
import { SecurityAuditLogger } from './auditLogger';

export interface PermissionContext {
  userId: string;
  labId: string;
  entityType: 'BUCKET' | 'STUDY' | 'TASK' | 'IDEA' | 'DEADLINE' | 'LAB' | 'USER';
  entityId?: string;
  action: 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'ASSIGN' | 'SHARE' | 'EXPORT';
  resourceSpecific?: boolean; // Check resource-level permissions
}

export interface PermissionResult {
  allowed: boolean;
  reason: string;
  method: 'ownership' | 'lab_role' | 'resource_permission' | 'cross_lab_access' | 'admin_override';
  restrictions?: string[];
}

export class AdvancedPermissionManager {
  
  /**
   * PHASE 3: Comprehensive permission check with multiple authorization layers
   */
  static async checkPermission(req: any, context: PermissionContext): Promise<PermissionResult> {
    try {
      const { userId, labId, entityType, entityId, action, resourceSpecific } = context;
      
      // Layer 1: Ownership check (highest priority)
      if (entityId) {
        const ownershipResult = await this.checkOwnership(userId, entityType, entityId);
        if (ownershipResult.allowed) {
          await SecurityAuditLogger.logEvent(req, {
            action: 'PERMISSION_CHANGE',
            entityType: entityType as any,
            entityId,
            authorizationMethod: 'ownership',
            wasAuthorized: true,
            details: { permissionCheck: action, method: 'ownership' }
          });
          return ownershipResult;
        }
      }
      
      // Layer 2: Lab role permissions
      const labRoleResult = await this.checkLabRolePermissions(userId, labId, entityType, action);
      if (labRoleResult.allowed) {
        await SecurityAuditLogger.logEvent(req, {
          action: 'PERMISSION_CHANGE',
          entityType: entityType as any,
          entityId,
          authorizationMethod: 'permission',
          wasAuthorized: true,
          details: { permissionCheck: action, method: 'lab_role' }
        });
        return labRoleResult;
      }
      
      // Layer 3: Resource-specific permissions (if enabled)
      if (resourceSpecific && entityId) {
        const resourceResult = await this.checkResourcePermissions(userId, labId, entityType, entityId, action);
        if (resourceResult.allowed) {
          await SecurityAuditLogger.logEvent(req, {
            action: 'PERMISSION_CHANGE',
            entityType: entityType as any,
            entityId,
            authorizationMethod: 'permission',
            wasAuthorized: true,
            details: { permissionCheck: action, method: 'resource_permission' }
          });
          return resourceResult;
        }
      }
      
      // Layer 4: Cross-lab access permissions
      const crossLabResult = await this.checkCrossLabAccess(userId, labId, entityType, action);
      if (crossLabResult.allowed) {
        await SecurityAuditLogger.logEvent(req, {
          action: 'PERMISSION_CHANGE',
          entityType: entityType as any,
          entityId,
          authorizationMethod: 'admin',
          wasAuthorized: true,
          details: { permissionCheck: action, method: 'cross_lab_access' }
        });
        return crossLabResult;
      }
      
      // All layers failed - log denial
      await SecurityAuditLogger.logEvent(req, {
        action: 'ACCESS_DENIED',
        entityType: entityType as any,
        entityId,
        wasAuthorized: false,
        errorMessage: 'Permission denied - insufficient access rights',
        details: { permissionCheck: action, allLayersFailed: true }
      });
      
      return {
        allowed: false,
        reason: 'Insufficient permissions for this action',
        method: 'ownership',
        restrictions: ['No valid authorization method found']
      };
      
    } catch (error) {
      await SecurityAuditLogger.logEvent(req, {
        action: 'ACCESS_DENIED',
        entityType: context.entityType as any,
        entityId: context.entityId,
        wasAuthorized: false,
        errorMessage: String(error),
        details: { permissionCheck: context.action, error: String(error) }
      });
      
      return {
        allowed: false,
        reason: 'Permission check failed due to system error',
        method: 'ownership'
      };
    }
  }
  
  /**
   * Layer 1: Check entity ownership
   */
  private static async checkOwnership(userId: string, entityType: string, entityId: string): Promise<PermissionResult> {
    try {
      const entity = await this.getEntity(entityType, entityId);
      if (!entity) {
        return { allowed: false, reason: 'Entity not found', method: 'ownership' };
      }
      
      const ownerField = this.getOwnerField(entityType);
      if (entity[ownerField] === userId) {
        return { 
          allowed: true, 
          reason: 'User owns this entity', 
          method: 'ownership' 
        };
      }
      
      return { allowed: false, reason: 'User does not own this entity', method: 'ownership' };
    } catch (error) {
      return { allowed: false, reason: 'Ownership check failed', method: 'ownership' };
    }
  }
  
  /**
   * Layer 2: Check lab role-based permissions
   */
  private static async checkLabRolePermissions(userId: string, labId: string, entityType: string, action: string): Promise<PermissionResult> {
    try {
      const labMember = await storage.getLabMember(userId, labId);
      if (!labMember || !labMember.isActive) {
        return { allowed: false, reason: 'User not a member of this lab', method: 'lab_role' };
      }
      
      // Check time-based access
      const now = new Date();
      if (labMember.accessStartDate && now < labMember.accessStartDate) {
        return { allowed: false, reason: 'Access not yet valid', method: 'lab_role' };
      }
      if (labMember.accessEndDate && now > labMember.accessEndDate) {
        return { allowed: false, reason: 'Access has expired', method: 'lab_role' };
      }
      
      // Admin override
      if (labMember.isAdmin || labMember.isSuperAdmin) {
        return { 
          allowed: true, 
          reason: 'Administrator privileges', 
          method: 'lab_role' 
        };
      }
      
      // Check specific permissions based on entity type and action
      const hasPermission = await this.checkSpecificPermission(labMember, entityType, action);
      if (hasPermission.allowed) {
        return hasPermission;
      }
      
      return { 
        allowed: false, 
        reason: `Insufficient ${entityType.toLowerCase()} ${action.toLowerCase()} permissions`, 
        method: 'lab_role' 
      };
    } catch (error) {
      return { allowed: false, reason: 'Lab role permission check failed', method: 'lab_role' };
    }
  }
  
  /**
   * Layer 3: Check resource-specific permissions
   */
  private static async checkResourcePermissions(userId: string, labId: string, entityType: string, entityId: string, action: string): Promise<PermissionResult> {
    try {
      const resourcePermissions = await storage.getResourcePermissions(userId, entityType, entityId);
      if (!resourcePermissions || resourcePermissions.length === 0) {
        return { allowed: false, reason: 'No resource-specific permissions found', method: 'resource_permission' };
      }
      
      // Check if any valid permission exists
      const now = new Date();
      const validPermissions = resourcePermissions.filter(perm => 
        !perm.revokedAt && 
        (!perm.validUntil || now <= perm.validUntil) &&
        now >= perm.validFrom
      );
      
      for (const permission of validPermissions) {
        if (this.actionMatchesPermission(action, permission)) {
          return {
            allowed: true,
            reason: `Resource-specific ${action.toLowerCase()} permission granted`,
            method: 'resource_permission'
          };
        }
      }
      
      return { 
        allowed: false, 
        reason: 'No valid resource permission for this action', 
        method: 'resource_permission' 
      };
    } catch (error) {
      return { allowed: false, reason: 'Resource permission check failed', method: 'resource_permission' };
    }
  }
  
  /**
   * Layer 4: Check cross-lab access permissions
   */
  private static async checkCrossLabAccess(userId: string, targetLabId: string, entityType: string, action: string): Promise<PermissionResult> {
    try {
      const crossLabAccess = await storage.getCrossLabAccess(userId, targetLabId);
      if (!crossLabAccess || crossLabAccess.length === 0) {
        return { allowed: false, reason: 'No cross-lab access found', method: 'cross_lab_access' };
      }
      
      // Check for valid, approved access
      const now = new Date();
      const validAccess = crossLabAccess.filter(access => 
        access.status === 'APPROVED' &&
        (!access.validUntil || now <= access.validUntil) &&
        now >= access.validFrom &&
        !access.revokedAt
      );
      
      for (const access of validAccess) {
        if (this.crossLabActionAllowed(action, entityType, access)) {
          return {
            allowed: true,
            reason: `Cross-lab ${action.toLowerCase()} access granted`,
            method: 'cross_lab_access',
            restrictions: this.getCrossLabRestrictions(access)
          };
        }
      }
      
      return { 
        allowed: false, 
        reason: 'Cross-lab access does not permit this action', 
        method: 'cross_lab_access' 
      };
    } catch (error) {
      return { allowed: false, reason: 'Cross-lab access check failed', method: 'cross_lab_access' };
    }
  }
  
  /**
   * Helper methods for permission checking
   */
  private static async getEntity(entityType: string, entityId: string): Promise<any> {
    switch (entityType.toLowerCase()) {
      case 'bucket': return await storage.getBucket(entityId);
      case 'study': return await storage.getStudy(entityId);
      case 'task': return await storage.getTask(entityId);
      case 'idea': return await storage.getIdea(entityId);
      case 'deadline': return await storage.getDeadline(entityId);
      default: return null;
    }
  }
  
  private static getOwnerField(entityType: string): string {
    switch (entityType.toLowerCase()) {
      case 'idea': return 'proposedBy';
      default: return 'createdBy';
    }
  }
  
  private static async checkSpecificPermission(labMember: any, entityType: string, action: string): Promise<PermissionResult> {
    const permissionKey = this.getPermissionKey(entityType, action);
    if (permissionKey && labMember[permissionKey]) {
      return {
        allowed: true,
        reason: `Lab role permits ${entityType.toLowerCase()} ${action.toLowerCase()}`,
        method: 'lab_role'
      };
    }
    return { allowed: false, reason: 'Specific permission not granted', method: 'lab_role' };
  }
  
  private static getPermissionKey(entityType: string, action: string): string | null {
    const mapping: Record<string, string> = {
      'STUDY_CREATE': 'canCreateProjects',
      'STUDY_EDIT': 'canEditAllProjects',
      'STUDY_DELETE': 'canDeleteProjects',
      'STUDY_VIEW': 'canViewAllProjects',
      'TASK_ASSIGN': 'canAssignTasks',
      'TASK_EDIT': 'canEditAllTasks',
      'TASK_DELETE': 'canDeleteTasks',
      'TASK_VIEW': 'canViewAllTasks',
      'IDEA_EDIT': 'canEditAllIdeas',
      'IDEA_DELETE': 'canDeleteIdeas',
      'DEADLINE_EDIT': 'canManageDeadlines',
      'DEADLINE_DELETE': 'canManageDeadlines',
    };
    const key = `${entityType}_${action}`;
    return mapping[key] || null;
  }
  
  private static actionMatchesPermission(action: string, permission: any): boolean {
    switch (action) {
      case 'VIEW': return permission.canView;
      case 'EDIT': return permission.canEdit;
      case 'DELETE': return permission.canDelete;
      case 'SHARE': return permission.canShare;
      case 'ASSIGN': return permission.canAssign;
      default: return false;
    }
  }
  
  private static crossLabActionAllowed(action: string, entityType: string, access: any): boolean {
    switch (action) {
      case 'VIEW': return access.canViewProjects;
      case 'EDIT': return access.canEditSharedProjects;
      default: return false;
    }
  }
  
  private static getCrossLabRestrictions(access: any): string[] {
    const restrictions = [];
    if (!access.canEditSharedProjects) restrictions.push('Read-only access');
    if (!access.canJoinMeetings) restrictions.push('Cannot join meetings');
    if (!access.canViewReports) restrictions.push('Cannot view reports');
    return restrictions;
  }
  
  /**
   * Apply permission template to user
   */
  static async applyPermissionTemplate(userId: string, labId: string, templateId: string, appliedBy: string): Promise<boolean> {
    try {
      const template = await storage.getPermissionTemplate(templateId);
      if (!template || !template.isActive) {
        return false;
      }
      
      // Apply template permissions to lab member
      await storage.updateLabMemberPermissions(userId, labId, template.permissions);
      
      // Log permission change
      await storage.createSecurityAuditLog({
        action: 'PERMISSION_CHANGE',
        entityType: 'LAB_MEMBER',
        entityId: `${userId}-${labId}`,
        userId: appliedBy,
        labId,
        authorizationMethod: 'admin',
        wasAuthorized: true,
        details: { 
          templateApplied: template.name,
          targetUser: userId,
          permissionCount: Object.keys(template.permissions).length 
        }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to apply permission template:', error);
      return false;
    }
  }
}

// Middleware function for enhanced permission checking
export const checkEnhancedPermissions = (entityType: string, action: string, resourceSpecific = false) => {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub;
      const labId = req.headers['x-current-lab'];
      const entityId = req.params.id;
      
      if (!userId || !labId) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const result = await AdvancedPermissionManager.checkPermission(req, {
        userId,
        labId,
        entityType: entityType as any,
        entityId,
        action: action as any,
        resourceSpecific
      });
      
      if (!result.allowed) {
        return res.status(403).json({ 
          message: 'Permission denied',
          reason: result.reason,
          restrictions: result.restrictions 
        });
      }
      
      // Add permission context to request for logging
      req.permissionContext = result;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Permission check failed' });
    }
  };
};