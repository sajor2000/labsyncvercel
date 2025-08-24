/**
 * Production-Ready Hierarchy Service
 * Provides bulletproof CRUD operations for bucket→study→task→subtask hierarchy
 * with strict TypeScript types and comprehensive error handling
 */

import { createClient, type QueryData } from '@supabase/supabase-js'
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/database.types'
import { z } from 'zod'

// ============================================
// Type Definitions
// ============================================

export type ProjectBucket = Tables<'buckets'>
export type Study = Tables<'projects'> // Map projects table to Study interface for UI compatibility
export type Task = Tables<'tasks'>
export type LabMember = Tables<'lab_members'>

export type ProjectBucketInsert = TablesInsert<'buckets'>
export type StudyInsert = TablesInsert<'projects'> // Map projects to studies for UI
export type TaskInsert = TablesInsert<'tasks'>

export type ProjectBucketUpdate = TablesUpdate<'buckets'>
export type StudyUpdate = TablesUpdate<'projects'> // Map projects to studies for UI
export type TaskUpdate = TablesUpdate<'tasks'>

// Extended types with relationships
export interface ProjectBucketWithRelations extends ProjectBucket {
  projects?: StudyWithRelations[]
  _count?: {
    projects: number
    tasks: number
  }
  completion_percentage?: number
}

export interface StudyWithRelations extends Study {
  bucket?: ProjectBucket
  tasks?: TaskWithRelations[]
  _count?: {
    tasks: number
    completed_tasks: number
  }
  completion_percentage?: number
}

export interface TaskWithRelations extends Task {
  study?: Study
  parent_task?: Task
  subtasks?: TaskWithRelations[]
  assignee?: Tables<'user_profiles'>
  _count?: {
    subtasks: number
    completed_subtasks: number
  }
  completion_percentage?: number
}

// Hierarchy path type
export interface HierarchyPath {
  level: number
  id: string
  title: string
  entity_type: 'bucket' | 'study' | 'task'
}

// ============================================
// Validation Schemas
// ============================================

const BucketCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  lab_id: z.string().uuid(),
  color: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

const StudyCreateSchema = z.object({
  name: z.string().min(1).max(255), // DB uses 'name', not 'title'
  description: z.string().optional(),
  bucket_id: z.string().uuid(),
  lab_id: z.string().uuid(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(), // DB uses 'due_date', not 'end_date'
  // IRB fields
  irb_number: z.string().optional(),
  irb_status: z.enum(['not_required', 'planning', 'submitted', 'under_review', 'approved', 'expired', 'suspended', 'withdrawn', 'exempt']).optional(),
  human_subjects_research: z.boolean().optional(),
  // Publication fields
  first_author_id: z.string().uuid().optional(),
  last_author_id: z.string().uuid().optional(),
  publication_title: z.string().optional(),
})

const TaskCreateSchema = z.object({
  title: z.string().min(1).max(500), // DB allows up to 500 chars
  description: z.string().optional(),
  project_id: z.string().uuid(), // DB uses 'project_id', not 'study_id'
  lab_id: z.string().uuid(),
  parent_task_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(), // DB uses 'assigned_to', not 'assignee_id'
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().datetime().optional(),
  estimated_hours: z.number().positive().optional(),
  actual_hours: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
})

// ============================================
// Service Class
// ============================================

export class HierarchyService {
  private supabase: ReturnType<typeof createClient<Database>>
  
  constructor(supabaseClient: ReturnType<typeof createClient<Database>>) {
    this.supabase = supabaseClient
  }
  
  // ============================================
  // Bucket Operations
  // ============================================
  
  async createBucket(data: z.infer<typeof BucketCreateSchema>): Promise<ProjectBucketWithRelations> {
    const validated = BucketCreateSchema.parse(data)
    
    const { data: bucket, error } = await this.supabase
      .from('buckets')
      .insert(validated)
      .select('*')
      .single()
    
    if (error) {
      throw new Error(`Failed to create bucket: ${error.message}`)
    }
    
    return this.getBucketWithRelations(bucket.id)
  }
  
  async getBucket(id: string): Promise<ProjectBucket | null> {
    const { data, error } = await this.supabase
      .from('buckets')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch bucket: ${error.message}`)
    }
    
    return data
  }
  
  async getBucketWithRelations(id: string): Promise<ProjectBucketWithRelations> {
    const { data: bucket, error: bucketError } = await this.supabase
      .from('buckets')
      .select(`
        *,
        projects (
          *,
          tasks (*)
        )
      `)
      .eq('id', id)
      .single()
    
    if (bucketError) {
      throw new Error(`Failed to fetch bucket with relations: ${bucketError.message}`)
    }
    
    // Calculate completion percentage
    const allTasks = bucket.projects?.flatMap(s => s.tasks || []) || []
    const completedTasks = allTasks.filter(t => t.status === 'done')
    const completion_percentage = allTasks.length > 0 
      ? Math.round((completedTasks.length / allTasks.length) * 100)
      : 0
    
    return {
      ...bucket,
      projects: bucket.projects || [],
      _count: {
        projects: bucket.projects?.length || 0,
        tasks: allTasks.length
      },
      completion_percentage
    } as ProjectBucketWithRelations
  }
  
  async listBuckets(lab_id: string): Promise<ProjectBucketWithRelations[]> {
    const { data, error } = await this.supabase
      .from('buckets')
      .select(`
        *,
        projects (
          id,
          name,
          status,
          tasks (id, status)
        )
      `)
      .eq('lab_id', lab_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to list buckets: ${error.message}`)
    }
    
    return data.map(bucket => {
      const allTasks = bucket.projects?.flatMap(s => s.tasks || []) || []
      const completedTasks = allTasks.filter(t => t.status === 'done')
      
      return {
        ...bucket,
        projects: bucket.projects || [],
        _count: {
          projects: bucket.projects?.length || 0,
          tasks: allTasks.length
        },
        completion_percentage: allTasks.length > 0 
          ? Math.round((completedTasks.length / allTasks.length) * 100)
          : 0
      } as ProjectBucketWithRelations
    })
  }
  
  async updateBucket(id: string, data: ProjectBucketUpdate): Promise<ProjectBucket> {
    const { data: bucket, error } = await this.supabase
      .from('buckets')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update bucket: ${error.message}`)
    }
    
    return bucket
  }
  
  async deleteBucket(id: string): Promise<void> {
    // CASCADE DELETE will handle related studies and tasks
    const { error } = await this.supabase
      .from('buckets')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(`Failed to delete bucket: ${error.message}`)
    }
  }
  
  // ============================================
  // Study Operations
  // ============================================
  
  async createStudy(data: z.infer<typeof StudyCreateSchema>): Promise<StudyWithRelations> {
    const validated = StudyCreateSchema.parse(data)
    
    // Verify bucket exists
    const bucket = await this.getBucket(validated.bucket_id)
    if (!bucket) {
      throw new Error('Bucket not found')
    }
    
    // Ensure lab_id matches bucket's lab_id
    if (bucket.lab_id !== validated.lab_id) {
      throw new Error('Study must be in the same lab as its bucket')
    }
    
    const { data: study, error } = await this.supabase
      .from('projects')
      .insert({
        ...validated,
        primary_bucket_id: validated.bucket_id // Ensure both fields are set
      })
      .select('*')
      .single()
    
    if (error) {
      throw new Error(`Failed to create study: ${error.message}`)
    }
    
    return this.getStudyWithRelations(study.id)
  }
  
  async getStudy(id: string): Promise<Study | null> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch study: ${error.message}`)
    }
    
    return data
  }
  
  async getStudyWithRelations(id: string): Promise<StudyWithRelations> {
    const { data: study, error } = await this.supabase
      .from('projects')
      .select(`
        *,
        bucket:buckets!bucket_id(*),
        tasks (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      throw new Error(`Failed to fetch study with relations: ${error.message}`)
    }
    
    const completedTasks = study.tasks?.filter(t => t.status === 'done') || []
    
    return {
      ...study,
      tasks: study.tasks || [],
      _count: {
        tasks: study.tasks?.length || 0,
        completed_tasks: completedTasks.length
      },
      completion_percentage: study.tasks && study.tasks.length > 0
        ? Math.round((completedTasks.length / study.tasks.length) * 100)
        : 0
    } as StudyWithRelations
  }
  
  async listStudiesByBucket(bucket_id: string): Promise<StudyWithRelations[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select(`
        *,
        tasks (id, status)
      `)
      .eq('bucket_id', bucket_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to list studies: ${error.message}`)
    }
    
    return data.map(study => {
      const completedTasks = study.tasks?.filter(t => t.status === 'done') || []
      
      return {
        ...study,
        tasks: study.tasks || [],
        _count: {
          tasks: study.tasks?.length || 0,
          completed_tasks: completedTasks.length
        },
        completion_percentage: study.tasks && study.tasks.length > 0
          ? Math.round((completedTasks.length / study.tasks.length) * 100)
          : 0
      } as StudyWithRelations
    })
  }
  
  async updateStudy(id: string, data: StudyUpdate): Promise<Study> {
    const { data: study, error } = await this.supabase
      .from('projects')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update study: ${error.message}`)
    }
    
    return study
  }
  
  async deleteStudy(id: string): Promise<void> {
    // CASCADE DELETE will handle related tasks
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(`Failed to delete study: ${error.message}`)
    }
  }
  
  // ============================================
  // Task Operations
  // ============================================
  
  async createTask(data: z.infer<typeof TaskCreateSchema>): Promise<TaskWithRelations> {
    const validated = TaskCreateSchema.parse(data)
    
    // Verify study exists
    const study = await this.getStudy(validated.project_id)
    if (!study) {
      throw new Error('Study not found')
    }
    
    // Get the bucket to access lab_id
    const bucket = await this.getBucket(study.bucket_id!)
    if (bucket?.lab_id !== validated.lab_id) {
      throw new Error('Task must be in the same lab as its study')
    }
    
    // Note: depth_level is computed client-side when needed, not stored in DB
    
    const { data: task, error } = await this.supabase
      .from('tasks')
      .insert(validated)
      .select('*')
      .single()
    
    if (error) {
      throw new Error(`Failed to create task: ${error.message}`)
    }
    
    return this.getTaskWithRelations(task.id)
  }
  
  async getTask(id: string): Promise<Task | null> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch task: ${error.message}`)
    }
    
    return data
  }
  
  async getTaskWithRelations(id: string): Promise<TaskWithRelations> {
    const { data: task, error } = await this.supabase
      .from('tasks')
      .select(`
        *,
        project:projects!project_id(*),
        parent_task:tasks!parent_task_id(*),
        subtasks:tasks!parent_task_id(*),
        assignee:user_profiles!assigned_to(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      throw new Error(`Failed to fetch task with relations: ${error.message}`)
    }
    
    // Ensure subtasks is always an array
    const subtasksArray = Array.isArray(task.subtasks) ? task.subtasks : (task.subtasks ? [task.subtasks] : [])
    const completedSubtasks = subtasksArray.filter(t => t.status === 'done')
    
    return {
      ...task,
      subtasks: subtasksArray,
      parent_task: task.parent_task || undefined,
      project: task.project || undefined,
      assignee: Array.isArray(task.assignee) ? task.assignee[0] : task.assignee,
      _count: {
        subtasks: subtasksArray.length,
        completed_subtasks: completedSubtasks.length
      },
      completion_percentage: subtasksArray.length > 0
        ? Math.round((completedSubtasks.length / subtasksArray.length) * 100)
        : 0
    } as TaskWithRelations
  }
  
  async listTasksByStudy(study_id: string): Promise<TaskWithRelations[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select(`
        *,
        subtasks:tasks!parent_task_id(*),
        assignee:user_profiles!tasks_assigned_to_fkey(id, first_name, last_name, display_name, avatar_url)
      `)
      .eq('project_id', study_id) // Use project_id field
      .is('parent_task_id', null) // Only get top-level tasks
      .is('deleted_at', null)
      .order('position', { ascending: true })
    
    if (error) {
      throw new Error(`Failed to list tasks: ${error.message}`)
    }
    
    return data.map(task => {
      // Ensure subtasks is always an array
      const subtasksArray = Array.isArray(task.subtasks) ? task.subtasks : (task.subtasks ? [task.subtasks] : [])
      const completedSubtasks = subtasksArray.filter(t => t.status === 'done')
      
      return {
        ...task,
        subtasks: subtasksArray,
        assignee: Array.isArray(task.assignee) ? task.assignee[0] : task.assignee,
        _count: {
          subtasks: subtasksArray.length,
          completed_subtasks: completedSubtasks.length
        },
        completion_percentage: subtasksArray.length > 0
          ? Math.round((completedSubtasks.length / subtasksArray.length) * 100)
          : 0
      } as TaskWithRelations
    })
  }
  
  async listSubtasks(parent_task_id: string): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('parent_task_id', parent_task_id)
      .order('created_at', { ascending: true })
    
    if (error) {
      throw new Error(`Failed to list subtasks: ${error.message}`)
    }
    
    return data
  }
  
  async updateTask(id: string, data: TaskUpdate): Promise<Task> {
    // If status is being changed to DONE, set completed_date
    if (data.status === 'done' && !data.completed_date) {
      data.completed_date = new Date().toISOString()
    }
    
    const { data: task, error } = await this.supabase
      .from('tasks')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update task: ${error.message}`)
    }
    
    // If task was completed, check if parent needs updating
    if (data.status === 'done' && task.parent_task_id) {
      await this.updateParentCompletion(task.parent_task_id)
    }
    
    return task
  }
  
  async deleteTask(id: string): Promise<void> {
    // CASCADE DELETE will handle subtasks
    const { error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`)
    }
  }
  
  // ============================================
  // Hierarchy Operations
  // ============================================
  
  async getHierarchyPath(task_id: string): Promise<HierarchyPath[]> {
    // TODO: Implement get_task_hierarchy RPC function or calculate client-side
    console.warn('get_task_hierarchy RPC function not implemented yet')
    return []
  }
  
  async moveTask(task_id: string, new_parent_task_id?: string, new_study_id?: string): Promise<Task> {
    const task = await this.getTask(task_id)
    if (!task) {
      throw new Error('Task not found')
    }
    
    const updates: TaskUpdate = {}
    
    if (new_study_id && new_study_id !== task.project_id) {
      const study = await this.getStudy(new_study_id)
      if (!study) {
        throw new Error('Target study not found')
      }
      updates.project_id = new_study_id
    }
    
    if (new_parent_task_id !== undefined) {
      if (new_parent_task_id === task_id) {
        throw new Error('Task cannot be its own parent')
      }
      
      let depth_level = 0
      if (new_parent_task_id) {
        const parent = await this.getTask(new_parent_task_id)
        if (!parent) {
          throw new Error('Parent task not found')
        }
        // depth_level is computed, not a database field
        depth_level = 0  // This would need to be calculated if needed
      }
      
      updates.parent_task_id = new_parent_task_id
      // depth_level is not a database field, removing from updates
    }
    
    return this.updateTask(task_id, updates)
  }
  
  async moveStudy(study_id: string, new_bucket_id: string): Promise<Study> {
    const study = await this.getStudy(study_id)
    if (!study) {
      throw new Error('Study not found')
    }
    
    const bucket = await this.getBucket(new_bucket_id)
    if (!bucket) {
      throw new Error('Target bucket not found')
    }
    
    // Get study's current bucket to check lab_id
    const currentBucket = await this.getBucket(study.bucket_id!)
    if (bucket.lab_id !== currentBucket?.lab_id) {
      throw new Error('Cannot move study to a bucket in a different lab')
    }
    
    return this.updateStudy(study_id, {
      bucket_id: new_bucket_id
    })
  }
  
  // ============================================
  // Completion & Progress Operations
  // ============================================
  
  private async updateParentCompletion(parent_task_id: string): Promise<void> {
    const subtasks = await this.listSubtasks(parent_task_id)
    const allCompleted = subtasks.every(t => t.status === 'done')
    
    if (allCompleted && subtasks.length > 0) {
      await this.updateTask(parent_task_id, { status: 'done' })
    }
  }
  
  async calculateBucketProgress(bucket_id: string): Promise<number> {
    // Calculate progress by counting completed vs total tasks in bucket
    const { data: projects } = await this.supabase
      .from('projects')
      .select('id')
      .eq('bucket_id', bucket_id)
    
    if (!projects || projects.length === 0) return 0
    
    const { data: tasks } = await this.supabase
      .from('tasks')
      .select('status')
      .in('project_id', projects.map(p => p.id))
    
    if (!tasks || tasks.length === 0) return 0
    
    const completedTasks = tasks.filter(t => t.status === 'done').length
    return Math.round((completedTasks / tasks.length) * 100)
  }
  
  async calculateStudyProgress(study_id: string): Promise<number> {
    // Calculate progress by counting completed vs total tasks in study
    const { data: tasks } = await this.supabase
      .from('tasks')
      .select('status')
      .eq('project_id', study_id)
    
    if (!tasks || tasks.length === 0) return 0
    
    const completedTasks = tasks.filter(t => t.status === 'done').length
    return Math.round((completedTasks / tasks.length) * 100)
  }
  
  // ============================================
  // Bulk Operations
  // ============================================
  
  async bulkUpdateTaskStatus(task_ids: string[], status: Task['status']): Promise<void> {
    const { error } = await this.supabase
      .from('tasks')
      .update({ 
        status,
        completed_date: status === 'done' ? new Date().toISOString() : null
      })
      .in('id', task_ids)
    
    if (error) {
      throw new Error(`Failed to bulk update tasks: ${error.message}`)
    }
  }
  
  async bulkAssignTasks(task_ids: string[], assignee_id: string): Promise<void> {
    const { error } = await this.supabase
      .from('tasks')
      .update({ assigned_to: assignee_id })
      .in('id', task_ids)
    
    if (error) {
      throw new Error(`Failed to bulk assign tasks: ${error.message}`)
    }
  }
  
  // ============================================
  // Search Operations
  // ============================================
  
  async searchTasks(lab_id: string, query: string): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('lab_id', lab_id)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20)
    
    if (error) {
      throw new Error(`Failed to search tasks: ${error.message}`)
    }
    
    return data
  }
  
  async getRecentActivity(lab_id: string, limit = 10): Promise<any[]> {
    // TODO: Implement audit_logs table or use alternative activity tracking
    console.warn('audit_logs table not implemented yet')
    return []
  }
}