/**
 * Permission hooks for granular lab-based permissions
 * Uses the new 48+ permission system from the database
 */

import { useState, useEffect, useCallback } from 'react'
import { useUser } from './use-user'
import { useSupabase } from '@/utils/supabase/client'

// Permission types matching database schema
export type LabPermission = 
  | 'can_manage_lab_settings'
  | 'can_manage_members'
  | 'can_manage_permissions'
  | 'can_view_audit_logs'
  | 'can_manage_integrations'
  | 'can_manage_billing'
  | 'can_create_projects'
  | 'can_edit_all_projects'
  | 'can_delete_projects'
  | 'can_view_all_projects'
  | 'can_archive_projects'
  | 'can_restore_projects'
  | 'can_manage_project_templates'
  | 'can_create_tasks'
  | 'can_assign_tasks'
  | 'can_edit_all_tasks'
  | 'can_delete_tasks'
  | 'can_view_all_tasks'
  | 'can_manage_task_templates'
  | 'can_set_task_priorities'
  | 'can_manage_deadlines'
  | 'can_access_reports'
  | 'can_export_data'
  | 'can_view_analytics'
  | 'can_view_financials'
  | 'can_manage_data_sources'
  | 'can_schedule_meetings'
  | 'can_manage_standups'
  | 'can_send_announcements'
  | 'can_moderate_discussions'
  | 'can_manage_calendar'
  | 'can_upload_files'
  | 'can_share_files'
  | 'can_delete_files'
  | 'can_manage_file_permissions'
  | 'can_create_ideas'
  | 'can_moderate_ideas'

interface LabMembership {
  lab_id: string
  role: string
  is_admin: boolean
  is_super_admin: boolean
  permissions: Record<LabPermission, boolean>
}

export function useLabPermissions(lab_id: string) {
  const { user } = useUser()
  const supabase = useSupabase()
  const [membership, setMembership] = useState<LabMembership | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPermissions = useCallback(async () => {
    if (!user?.id || !lab_id) {
      setMembership(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('lab_members')
        .select(`
          lab_id,
          role,
          is_admin,
          is_super_admin,
          can_manage_lab_settings,
          can_manage_members,
          can_manage_permissions,
          can_view_audit_logs,
          can_manage_integrations,
          can_manage_billing,
          can_create_projects,
          can_edit_all_projects,
          can_delete_projects,
          can_view_all_projects,
          can_archive_projects,
          can_restore_projects,
          can_manage_project_templates,
          can_create_tasks,
          can_assign_tasks,
          can_edit_all_tasks,
          can_delete_tasks,
          can_view_all_tasks,
          can_manage_task_templates,
          can_set_task_priorities,
          can_manage_deadlines,
          can_access_reports,
          can_export_data,
          can_view_analytics,
          can_view_financials,
          can_manage_data_sources,
          can_schedule_meetings,
          can_manage_standups,
          can_send_announcements,
          can_moderate_discussions,
          can_manage_calendar,
          can_upload_files,
          can_share_files,
          can_delete_files,
          can_manage_file_permissions,
          can_create_ideas,
          can_moderate_ideas
        `)
        .eq('lab_id', lab_id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        setMembership(null)
        return
      }

      // Extract permissions into a clean object
      const permissions: Record<LabPermission, boolean> = {
        can_manage_lab_settings: data.can_manage_lab_settings || false,
        can_manage_members: data.can_manage_members || false,
        can_manage_permissions: data.can_manage_permissions || false,
        can_view_audit_logs: data.can_view_audit_logs || false,
        can_manage_integrations: data.can_manage_integrations || false,
        can_manage_billing: data.can_manage_billing || false,
        can_create_projects: data.can_create_projects || false,
        can_edit_all_projects: data.can_edit_all_projects || false,
        can_delete_projects: data.can_delete_projects || false,
        can_view_all_projects: data.can_view_all_projects || false,
        can_archive_projects: data.can_archive_projects || false,
        can_restore_projects: data.can_restore_projects || false,
        can_manage_project_templates: data.can_manage_project_templates || false,
        can_create_tasks: data.can_create_tasks || false,
        can_assign_tasks: data.can_assign_tasks || false,
        can_edit_all_tasks: data.can_edit_all_tasks || false,
        can_delete_tasks: data.can_delete_tasks || false,
        can_view_all_tasks: data.can_view_all_tasks || false,
        can_manage_task_templates: data.can_manage_task_templates || false,
        can_set_task_priorities: data.can_set_task_priorities || false,
        can_manage_deadlines: data.can_manage_deadlines || false,
        can_access_reports: data.can_access_reports || false,
        can_export_data: data.can_export_data || false,
        can_view_analytics: data.can_view_analytics || false,
        can_view_financials: data.can_view_financials || false,
        can_manage_data_sources: data.can_manage_data_sources || false,
        can_schedule_meetings: data.can_schedule_meetings || false,
        can_manage_standups: data.can_manage_standups || false,
        can_send_announcements: data.can_send_announcements || false,
        can_moderate_discussions: data.can_moderate_discussions || false,
        can_manage_calendar: data.can_manage_calendar || false,
        can_upload_files: data.can_upload_files || false,
        can_share_files: data.can_share_files || false,
        can_delete_files: data.can_delete_files || false,
        can_manage_file_permissions: data.can_manage_file_permissions || false,
        can_create_ideas: data.can_create_ideas || false,
        can_moderate_ideas: data.can_moderate_ideas || false,
      }

      setMembership({
        lab_id: data.lab_id,
        role: data.role,
        is_admin: data.is_admin || false,
        is_super_admin: data.is_super_admin || false,
        permissions
      })

    } catch (error) {
      console.error('Failed to fetch permissions:', error)
      setMembership(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id, lab_id, supabase])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  // Helper function to check specific permission
  const hasPermission = useCallback((permission: LabPermission): boolean => {
    if (!membership) return false
    if (membership.is_super_admin) return true
    return membership.permissions[permission] || false
  }, [membership])

  // Helper function to check if user can perform action
  const canCreateProjects = hasPermission('can_create_projects')
  const canManageMembers = hasPermission('can_manage_members')
  const canCreateTasks = hasPermission('can_create_tasks')
  const canAssignTasks = hasPermission('can_assign_tasks')
  const canManageDeadlines = hasPermission('can_manage_deadlines')
  const canViewAnalytics = hasPermission('can_view_analytics')
  const canViewFinancials = hasPermission('can_view_financials')
  const canScheduleMeetings = hasPermission('can_schedule_meetings')
  const canUploadFiles = hasPermission('can_upload_files')

  return {
    membership,
    loading,
    hasPermission,
    // Commonly used permissions
    canCreateProjects,
    canManageMembers,
    canCreateTasks,
    canAssignTasks,
    canManageDeadlines,
    canViewAnalytics,
    canViewFinancials,
    canScheduleMeetings,
    canUploadFiles,
    // Admin status
    isAdmin: membership?.is_admin || false,
    isSuperAdmin: membership?.is_super_admin || false,
    // Role info
    role: membership?.role || null,
  }
}

// Hook for checking multiple permissions at once
export function useLabPermissionCheck(lab_id: string, permissions: LabPermission[]) {
  const { hasPermission, loading } = useLabPermissions(lab_id)
  
  const hasAnyPermission = permissions.some(permission => hasPermission(permission))
  const hasAllPermissions = permissions.every(permission => hasPermission(permission))
  
  return {
    hasAnyPermission,
    hasAllPermissions,
    loading
  }
}