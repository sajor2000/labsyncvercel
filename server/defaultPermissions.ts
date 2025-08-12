// PHASE 3: Default Permission Templates for Enhanced RBAC
import { storage } from './storage';

// Default permission sets for different lab roles
export const DEFAULT_PERMISSIONS = {
  PRINCIPAL_INVESTIGATOR: {
    // Administrative Permissions
    isAdmin: true,
    isSuperAdmin: false,
    canManageMembers: true,
    canManageLabSettings: true,
    canViewAuditLogs: true,
    canManagePermissions: true,
    
    // Project & Study Management
    canCreateProjects: true,
    canEditAllProjects: true,
    canDeleteProjects: true,
    canViewAllProjects: true,
    canArchiveProjects: true,
    canRestoreProjects: true,
    
    // Task Management
    canAssignTasks: true,
    canEditAllTasks: true,
    canDeleteTasks: true,
    canViewAllTasks: true,
    canManageTaskTemplates: true,
    canSetTaskPriorities: true,
    
    // Idea & Innovation Management
    canApproveIdeas: true,
    canRejectIdeas: true,
    canEditAllIdeas: true,
    canDeleteIdeas: true,
    canImplementIdeas: true,
    
    // Data & Reporting
    canAccessReports: true,
    canExportData: true,
    canViewAnalytics: true,
    canManageDeadlines: true,
    canViewFinancials: true,
    
    // Cross-Lab Collaboration
    canInviteExternalUsers: true,
    canShareAcrossLabs: true,
    canAccessSharedProjects: true,
    canCreateCrossLabProjects: true,
    
    // Meeting & Communication
    canScheduleMeetings: true,
    canManageStandups: true,
    canSendLabAnnouncements: true,
    canModerateDiscussions: true,
    
    // Resource & Asset Management
    canManageAssets: true,
    canAllocateBudget: true,
    canManageEquipment: true,
    canManageDocuments: true,
  },

  RESEARCH_COORDINATOR: {
    // Administrative Permissions
    isAdmin: false,
    isSuperAdmin: false,
    canManageMembers: true,
    canManageLabSettings: false,
    canViewAuditLogs: false,
    canManagePermissions: false,
    
    // Project & Study Management
    canCreateProjects: true,
    canEditAllProjects: true,
    canDeleteProjects: false,
    canViewAllProjects: true,
    canArchiveProjects: true,
    canRestoreProjects: false,
    
    // Task Management
    canAssignTasks: true,
    canEditAllTasks: true,
    canDeleteTasks: true,
    canViewAllTasks: true,
    canManageTaskTemplates: true,
    canSetTaskPriorities: true,
    
    // Idea & Innovation Management
    canApproveIdeas: true,
    canRejectIdeas: true,
    canEditAllIdeas: true,
    canDeleteIdeas: false,
    canImplementIdeas: true,
    
    // Data & Reporting
    canAccessReports: true,
    canExportData: true,
    canViewAnalytics: true,
    canManageDeadlines: true,
    canViewFinancials: false,
    
    // Cross-Lab Collaboration
    canInviteExternalUsers: false,
    canShareAcrossLabs: true,
    canAccessSharedProjects: true,
    canCreateCrossLabProjects: false,
    
    // Meeting & Communication
    canScheduleMeetings: true,
    canManageStandups: true,
    canSendLabAnnouncements: true,
    canModerateDiscussions: true,
    
    // Resource & Asset Management
    canManageAssets: false,
    canAllocateBudget: false,
    canManageEquipment: true,
    canManageDocuments: true,
  },

  // PHASE 3: Enhanced permissions for all lab members
  RESEARCH_ASSISTANT: {
    // Administrative Permissions
    isAdmin: false,
    isSuperAdmin: false,
    canManageMembers: false,
    canManageLabSettings: false,
    canViewAuditLogs: false,
    canManagePermissions: false,
    
    // Project & Study Management - ENHANCED: All members can create/manage
    canCreateProjects: true,
    canEditAllProjects: false, // Can only edit own projects
    canDeleteProjects: false, // Can only delete own projects
    canViewAllProjects: true,
    canArchiveProjects: false,
    canRestoreProjects: false,
    
    // Task Management - ENHANCED: All members can create/manage
    canAssignTasks: true,
    canEditAllTasks: false, // Can only edit own tasks
    canDeleteTasks: false, // Can only delete own tasks
    canViewAllTasks: true,
    canManageTaskTemplates: false,
    canSetTaskPriorities: false,
    
    // Idea & Innovation Management - ENHANCED: All members can create/manage
    canApproveIdeas: false,
    canRejectIdeas: false,
    canEditAllIdeas: false, // Can only edit own ideas
    canDeleteIdeas: false, // Can only delete own ideas
    canImplementIdeas: true,
    
    // Data & Reporting
    canAccessReports: true,
    canExportData: false,
    canViewAnalytics: true,
    canManageDeadlines: true, // ENHANCED: All members can manage deadlines
    canViewFinancials: false,
    
    // Cross-Lab Collaboration
    canInviteExternalUsers: false,
    canShareAcrossLabs: false,
    canAccessSharedProjects: true,
    canCreateCrossLabProjects: false,
    
    // Meeting & Communication
    canScheduleMeetings: true,
    canManageStandups: false,
    canSendLabAnnouncements: false,
    canModerateDiscussions: false,
    
    // Resource & Asset Management
    canManageAssets: false,
    canAllocateBudget: false,
    canManageEquipment: false,
    canManageDocuments: true,
  },

  RESEARCH_FELLOW: {
    // Administrative Permissions
    isAdmin: false,
    isSuperAdmin: false,
    canManageMembers: false,
    canManageLabSettings: false,
    canViewAuditLogs: false,
    canManagePermissions: false,
    
    // Project & Study Management - ENHANCED: All members can create/manage
    canCreateProjects: true,
    canEditAllProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: true,
    canArchiveProjects: false,
    canRestoreProjects: false,
    
    // Task Management - ENHANCED: All members can create/manage
    canAssignTasks: true,
    canEditAllTasks: false,
    canDeleteTasks: false,
    canViewAllTasks: true,
    canManageTaskTemplates: false,
    canSetTaskPriorities: true,
    
    // Idea & Innovation Management - ENHANCED: All members can create/manage
    canApproveIdeas: false,
    canRejectIdeas: false,
    canEditAllIdeas: false,
    canDeleteIdeas: false,
    canImplementIdeas: true,
    
    // Data & Reporting
    canAccessReports: true,
    canExportData: true,
    canViewAnalytics: true,
    canManageDeadlines: true, // ENHANCED: All members can manage deadlines
    canViewFinancials: false,
    
    // Cross-Lab Collaboration
    canInviteExternalUsers: false,
    canShareAcrossLabs: true,
    canAccessSharedProjects: true,
    canCreateCrossLabProjects: false,
    
    // Meeting & Communication
    canScheduleMeetings: true,
    canManageStandups: false,
    canSendLabAnnouncements: false,
    canModerateDiscussions: true,
    
    // Resource & Asset Management
    canManageAssets: false,
    canAllocateBudget: false,
    canManageEquipment: false,
    canManageDocuments: true,
  }
};

/**
 * Apply default permissions to new lab member based on their role
 */
export async function applyDefaultPermissions(userId: string, labId: string, role: string): Promise<void> {
  try {
    const permissions = DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS] || DEFAULT_PERMISSIONS.RESEARCH_ASSISTANT;
    
    await storage.updateLabMemberPermissions(userId, labId, permissions);
    
    // Log permission assignment
    await storage.createSecurityAuditLog({
      action: 'PERMISSION_CHANGE',
      entityType: 'LAB_MEMBER',
      entityId: `${userId}-${labId}`,
      userId: userId,
      labId,
      authorizationMethod: 'system',
      wasAuthorized: true,
      details: { 
        defaultPermissionsApplied: true,
        role,
        permissionCount: Object.keys(permissions).length 
      }
    });
    
    console.log(`Applied default ${role} permissions to user ${userId} in lab ${labId}`);
  } catch (error) {
    console.error('Failed to apply default permissions:', error);
    throw error;
  }
}

/**
 * Update existing lab members with enhanced permissions
 */
export async function upgradeLabMemberPermissions(labId: string): Promise<void> {
  try {
    const labMembers = await storage.getLabMembers(labId);
    
    for (const member of labMembers) {
      if (member.isActive) {
        await applyDefaultPermissions(member.userId, labId, member.labRole);
      }
    }
    
    console.log(`Upgraded permissions for ${labMembers.length} lab members in lab ${labId}`);
  } catch (error) {
    console.error('Failed to upgrade lab member permissions:', error);
    throw error;
  }
}

/**
 * Create default permission templates for a lab
 */
export async function createDefaultPermissionTemplates(labId: string, createdBy: string): Promise<void> {
  try {
    const templates = [
      {
        name: 'Principal Investigator',
        description: 'Full administrative access and oversight of all lab operations',
        labId,
        permissions: DEFAULT_PERMISSIONS.PRINCIPAL_INVESTIGATOR,
        isDefault: true,
        createdBy
      },
      {
        name: 'Research Coordinator',
        description: 'Manage projects, tasks, and team coordination',
        labId,
        permissions: DEFAULT_PERMISSIONS.RESEARCH_COORDINATOR,
        isDefault: true,
        createdBy
      },
      {
        name: 'Research Assistant',
        description: 'Create and manage own work, collaborate on shared projects',
        labId,
        permissions: DEFAULT_PERMISSIONS.RESEARCH_ASSISTANT,
        isDefault: true,
        createdBy
      },
      {
        name: 'Research Fellow',
        description: 'Advanced research capabilities with collaboration permissions',
        labId,
        permissions: DEFAULT_PERMISSIONS.RESEARCH_FELLOW,
        isDefault: true,
        createdBy
      }
    ];
    
    for (const template of templates) {
      await storage.createPermissionTemplate(template);
    }
    
    console.log(`Created ${templates.length} default permission templates for lab ${labId}`);
  } catch (error) {
    console.error('Failed to create default permission templates:', error);
    throw error;
  }
}