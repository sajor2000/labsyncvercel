/**
 * Simple database queries - no complex abstractions
 * Direct Supabase calls with proper error handling
 */

import { createClient } from '@/utils/supabase/client'
import type {
  Lab, LabMember, UserProfile, Bucket, Project, Task, CalendarEvent,
  CreateProjectInput, CreateTaskInput, CreateBucketInput
} from './types'

// ============================================
// Lab Queries
// ============================================

export async function getUserLabs(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('lab_members')
    .select(`
      *,
      labs (*)
    `)
    .eq('user_id', userId)
  
  if (error) throw error
  return data
}

export async function getLabById(labId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('labs')
    .select('*')
    .eq('id', labId)
    .single()
  
  if (error) throw error
  return data as Lab
}

// ============================================
// Bucket Queries
// ============================================

export async function getLabBuckets(labId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('buckets')
    .select('*')
    .eq('lab_id', labId)
    .is('deleted_at', null)
    .order('position', { ascending: true })
  
  if (error) throw error
  return data as Bucket[]
}

export async function createBucket(input: CreateBucketInput) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('buckets')
    .insert(input)
    .select()
    .single()
  
  if (error) throw error
  return data as Bucket
}

export async function updateBucket(id: string, updates: Partial<Bucket>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('buckets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Bucket
}

export async function deleteBucket(id: string) {
  const supabase = createClient()
  
  // Soft delete by setting deleted_at
  const { error } = await supabase
    .from('buckets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  
  if (error) throw error
}

// ============================================
// Project Queries
// ============================================

export async function getBucketProjects(bucketId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('bucket_id', bucketId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Project[]
}

export async function getLabProjects(labId: string) {
  const supabase = createClient()
  
  // First get lab buckets
  const buckets = await getLabBuckets(labId)
  if (!buckets.length) return []
  
  const bucketIds = buckets.map(b => b.id)
  
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      buckets (*)
    `)
    .in('bucket_id', bucketIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function createProject(input: CreateProjectInput) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .insert(input)
    .select()
    .single()
  
  if (error) throw error
  return data as Project
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Project
}

export async function deleteProject(id: string) {
  const supabase = createClient()
  
  // Soft delete
  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  
  if (error) throw error
}

// ============================================
// Task Queries
// ============================================

export async function getProjectTasks(projectId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true })
  
  if (error) throw error
  return data as Task[]
}

export async function getLabTasks(labId: string) {
  const supabase = createClient()
  
  // Get all projects for the lab first
  const projects = await getLabProjects(labId)
  if (!projects.length) return []
  
  const projectIds = projects.map(p => p.id)
  
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      projects (*)
    `)
    .in('project_id', projectIds)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function createTask(input: CreateTaskInput) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .insert(input)
    .select()
    .single()
  
  if (error) throw error
  return data as Task
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Task
}

export async function deleteTask(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

export async function moveTask(taskId: string, newStatus: Task['status']) {
  const supabase = createClient()
  
  const updates: Partial<Task> = {
    status: newStatus,
    updated_at: new Date().toISOString()
  }
  
  // If moving to done, set completed_at
  if (newStatus === 'done') {
    updates.completed_at = new Date().toISOString()
  } else {
    updates.completed_at = null
  }
  
  return updateTask(taskId, updates)
}

// ============================================
// Calendar Queries
// ============================================

export async function getLabCalendarEvents(labId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('lab_id', labId)
    .gte('end_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(100)
  
  if (error) throw error
  return data as CalendarEvent[]
}

export async function createCalendarEvent(event: Partial<CalendarEvent>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(event)
    .select()
    .single()
  
  if (error) throw error
  return data as CalendarEvent
}

export async function updateCalendarEvent(id: string, updates: Partial<CalendarEvent>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as CalendarEvent
}

export async function deleteCalendarEvent(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ============================================
// Member Queries
// ============================================

export async function getLabMembers(labId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('lab_members')
    .select(`
      *,
      user_profiles (*)
    `)
    .eq('lab_id', labId)
  
  if (error) throw error
  return data
}

export async function getUserPermissions(labId: string, userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('lab_members')
    .select('*')
    .eq('lab_id', labId)
    .eq('user_id', userId)
    .single()
  
  if (error) throw error
  return data as LabMember
}

// ============================================
// Activity Log
// ============================================

export async function logActivity(
  labId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  entityTitle?: string,
  metadata?: any
) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('activity_log')
    .insert({
      lab_id: labId,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_title: entityTitle,
      metadata
    })
  
  if (error) console.error('Failed to log activity:', error)
}

// ============================================
// Useful Aggregations
// ============================================

export async function getLabStats(labId: string) {
  const supabase = createClient()
  
  // Get counts in parallel
  const [buckets, projects, members] = await Promise.all([
    getLabBuckets(labId),
    getLabProjects(labId),
    getLabMembers(labId)
  ])
  
  // Get task count
  let taskCount = 0
  if (projects.length > 0) {
    const projectIds = projects.map(p => p.id)
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
    
    taskCount = count || 0
  }
  
  return {
    bucketCount: buckets.length,
    projectCount: projects.length,
    taskCount,
    memberCount: members.length
  }
}

export async function getProjectProgress(projectId: string) {
  const tasks = await getProjectTasks(projectId)
  
  const total = tasks.length
  const completed = tasks.filter(t => t.status === 'done').length
  
  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  }
}