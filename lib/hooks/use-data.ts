/**
 * Simple React hooks for data fetching
 * Using SWR for caching and revalidation
 */

import useSWR from 'swr'
import { toast } from 'sonner'
import {
  getUserLabs,
  getLabById,
  getLabBuckets,
  getBucketProjects,
  getLabProjects,
  getProjectTasks,
  getLabTasks,
  getLabCalendarEvents,
  getLabMembers,
  getUserPermissions,
  getLabStats,
  getProjectProgress,
  createBucket,
  updateBucket,
  deleteBucket,
  createProject,
  updateProject,
  deleteProject,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
} from '@/lib/db/queries'
import type {
  Bucket, Project, Task, CalendarEvent,
  CreateBucketInput, CreateProjectInput, CreateTaskInput
} from '@/lib/db/types'

// ============================================
// Lab Hooks
// ============================================

export function useUserLabs(userId: string) {
  const { data, error, mutate } = useSWR(
    userId ? `/labs/user/${userId}` : null,
    () => getUserLabs(userId)
  )
  
  return {
    labs: data,
    loading: !data && !error,
    error,
    refresh: mutate
  }
}

export function useLab(labId: string) {
  const { data, error, mutate } = useSWR(
    labId ? `/labs/${labId}` : null,
    () => getLabById(labId)
  )
  
  return {
    lab: data,
    loading: !data && !error,
    error,
    refresh: mutate
  }
}

export function useLabStats(labId: string) {
  const { data, error, mutate } = useSWR(
    labId ? `/labs/${labId}/stats` : null,
    () => getLabStats(labId)
  )
  
  return {
    stats: data,
    loading: !data && !error,
    error,
    refresh: mutate
  }
}

// ============================================
// Bucket Hooks
// ============================================

export function useBuckets(labId: string) {
  const { data, error, mutate } = useSWR(
    labId ? `/buckets/lab/${labId}` : null,
    () => getLabBuckets(labId)
  )
  
  const addBucket = async (input: Omit<CreateBucketInput, 'lab_id'>) => {
    try {
      const bucket = await createBucket({ ...input, lab_id: labId })
      await mutate()
      toast.success('Bucket created')
      return bucket
    } catch (error) {
      toast.error('Failed to create bucket')
      throw error
    }
  }
  
  const editBucket = async (id: string, updates: Partial<Bucket>) => {
    try {
      const bucket = await updateBucket(id, updates)
      await mutate()
      toast.success('Bucket updated')
      return bucket
    } catch (error) {
      toast.error('Failed to update bucket')
      throw error
    }
  }
  
  const removeBucket = async (id: string) => {
    try {
      await deleteBucket(id)
      await mutate()
      toast.success('Bucket deleted')
    } catch (error) {
      toast.error('Failed to delete bucket')
      throw error
    }
  }
  
  return {
    buckets: data || [],
    loading: !data && !error,
    error,
    refresh: mutate,
    addBucket,
    editBucket,
    removeBucket
  }
}

// ============================================
// Project Hooks
// ============================================

export function useProjects(labId: string) {
  const { data, error, mutate } = useSWR(
    labId ? `/projects/lab/${labId}` : null,
    () => getLabProjects(labId)
  )
  
  const addProject = async (input: Omit<CreateProjectInput, 'lab_id'>) => {
    try {
      const project = await createProject({ ...input, lab_id: labId })
      await mutate()
      toast.success('Project created')
      return project
    } catch (error) {
      toast.error('Failed to create project')
      throw error
    }
  }
  
  const editProject = async (id: string, updates: Partial<Project>) => {
    try {
      const project = await updateProject(id, updates)
      await mutate()
      toast.success('Project updated')
      return project
    } catch (error) {
      toast.error('Failed to update project')
      throw error
    }
  }
  
  const removeProject = async (id: string) => {
    try {
      await deleteProject(id)
      await mutate()
      toast.success('Project deleted')
    } catch (error) {
      toast.error('Failed to delete project')
      throw error
    }
  }
  
  return {
    projects: data || [],
    loading: !data && !error,
    error,
    refresh: mutate,
    addProject,
    editProject,
    removeProject
  }
}

export function useBucketProjects(bucketId: string) {
  const { data, error, mutate } = useSWR(
    bucketId ? `/projects/bucket/${bucketId}` : null,
    () => getBucketProjects(bucketId)
  )
  
  return {
    projects: data || [],
    loading: !data && !error,
    error,
    refresh: mutate
  }
}

export function useProjectProgress(projectId: string) {
  const { data, error, mutate } = useSWR(
    projectId ? `/projects/${projectId}/progress` : null,
    () => getProjectProgress(projectId)
  )
  
  return {
    progress: data,
    loading: !data && !error,
    error,
    refresh: mutate
  }
}

// ============================================
// Task Hooks
// ============================================

export function useTasks(projectId: string) {
  const { data, error, mutate } = useSWR(
    projectId ? `/tasks/project/${projectId}` : null,
    () => getProjectTasks(projectId)
  )
  
  const addTask = async (input: Omit<CreateTaskInput, 'project_id'>) => {
    try {
      const task = await createTask({ ...input, project_id: projectId })
      await mutate()
      toast.success('Task created')
      return task
    } catch (error) {
      toast.error('Failed to create task')
      throw error
    }
  }
  
  const editTask = async (id: string, updates: Partial<Task>) => {
    try {
      const task = await updateTask(id, updates)
      await mutate()
      toast.success('Task updated')
      return task
    } catch (error) {
      toast.error('Failed to update task')
      throw error
    }
  }
  
  const removeTask = async (id: string) => {
    try {
      await deleteTask(id)
      await mutate()
      toast.success('Task deleted')
    } catch (error) {
      toast.error('Failed to delete task')
      throw error
    }
  }
  
  const changeTaskStatus = async (id: string, status: Task['status']) => {
    try {
      const task = await moveTask(id, status)
      await mutate()
      return task
    } catch (error) {
      toast.error('Failed to move task')
      throw error
    }
  }
  
  return {
    tasks: data || [],
    loading: !data && !error,
    error,
    refresh: mutate,
    addTask,
    editTask,
    removeTask,
    changeTaskStatus
  }
}

export function useLabTasks(labId: string) {
  const { data, error, mutate } = useSWR(
    labId ? `/tasks/lab/${labId}` : null,
    () => getLabTasks(labId)
  )
  
  return {
    tasks: data || [],
    loading: !data && !error,
    error,
    refresh: mutate
  }
}

// ============================================
// Calendar Hooks
// ============================================

export function useCalendarEvents(labId: string) {
  const { data, error, mutate } = useSWR(
    labId ? `/calendar/lab/${labId}` : null,
    () => getLabCalendarEvents(labId)
  )
  
  const addEvent = async (event: Partial<CalendarEvent>) => {
    try {
      const newEvent = await createCalendarEvent({ ...event, lab_id: labId })
      await mutate()
      toast.success('Event created')
      return newEvent
    } catch (error) {
      toast.error('Failed to create event')
      throw error
    }
  }
  
  const editEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      const event = await updateCalendarEvent(id, updates)
      await mutate()
      toast.success('Event updated')
      return event
    } catch (error) {
      toast.error('Failed to update event')
      throw error
    }
  }
  
  const removeEvent = async (id: string) => {
    try {
      await deleteCalendarEvent(id)
      await mutate()
      toast.success('Event deleted')
    } catch (error) {
      toast.error('Failed to delete event')
      throw error
    }
  }
  
  return {
    events: data || [],
    loading: !data && !error,
    error,
    refresh: mutate,
    addEvent,
    editEvent,
    removeEvent
  }
}

// ============================================
// Member Hooks
// ============================================

export function useLabMembers(labId: string) {
  const { data, error, mutate } = useSWR(
    labId ? `/members/lab/${labId}` : null,
    () => getLabMembers(labId)
  )
  
  return {
    members: data || [],
    loading: !data && !error,
    error,
    refresh: mutate
  }
}

export function usePermissions(labId: string, userId: string) {
  const { data, error } = useSWR(
    labId && userId ? `/permissions/${labId}/${userId}` : null,
    () => getUserPermissions(labId, userId)
  )
  
  return {
    permissions: data,
    loading: !data && !error,
    error,
    canManageMembers: data?.can_manage_members || false,
    canCreateProjects: data?.can_create_projects || false,
    canEditAllProjects: data?.can_edit_all_projects || false,
    canDeleteProjects: data?.can_delete_projects || false,
    canCreateTasks: data?.can_create_tasks || false,
    canEditAllTasks: data?.can_edit_all_tasks || false,
    canDeleteTasks: data?.can_delete_tasks || false,
    canViewFinancials: data?.can_view_financials || false
  }
}