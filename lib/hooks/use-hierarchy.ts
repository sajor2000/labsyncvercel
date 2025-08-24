/**
 * React hooks for hierarchy operations
 * Provides easy-to-use hooks for bucket→study→task→subtask management
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSupabase } from '@/utils/supabase/client'
import { HierarchyService } from '@/lib/services/hierarchy.service'
import type {
  ProjectBucket,
  ProjectBucketWithRelations,
  Study,
  StudyWithRelations,
  Task,
  TaskWithRelations
} from '@/lib/services/hierarchy.service'
import { toast } from 'sonner'

// ============================================
// Bucket Hooks
// ============================================

export function useBuckets(lab_id: string) {
  const [buckets, setBuckets] = useState<ProjectBucketWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useSupabase()
  const service = useMemo(() => new HierarchyService(supabase), [supabase])
  
  const fetchBuckets = useCallback(async () => {
    if (!lab_id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await service.listBuckets(lab_id)
      setBuckets(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch buckets'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [lab_id, service])
  
  useEffect(() => {
    fetchBuckets()
  }, [fetchBuckets])
  
  const createBucket = useCallback(async (data: {
    name: string
    description?: string
    color?: string
    metadata?: Record<string, any>
  }) => {
    try {
      const bucket = await service.createBucket({
        ...data,
        lab_id
      })
      setBuckets(prev => [bucket, ...prev])
      toast.success('Bucket created successfully')
      return bucket
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create bucket'
      toast.error(message)
      throw err
    }
  }, [lab_id, service])
  
  const updateBucket = useCallback(async (id: string, data: Partial<ProjectBucket>) => {
    try {
      const updated = await service.updateBucket(id, data)
      setBuckets(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b))
      toast.success('Bucket updated successfully')
      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update bucket'
      toast.error(message)
      throw err
    }
  }, [service])
  
  const deleteBucket = useCallback(async (id: string) => {
    try {
      await service.deleteBucket(id)
      setBuckets(prev => prev.filter(b => b.id !== id))
      toast.success('Bucket deleted successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete bucket'
      toast.error(message)
      throw err
    }
  }, [service])
  
  return {
    buckets,
    loading,
    error,
    refresh: fetchBuckets,
    createBucket,
    updateBucket,
    deleteBucket
  }
}

// ============================================
// Study Hooks
// ============================================

export function useStudies(bucket_id: string) {
  const [studies, setStudies] = useState<StudyWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useSupabase()
  const service = useMemo(() => new HierarchyService(supabase), [supabase])
  
  const fetchStudies = useCallback(async () => {
    if (!bucket_id) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Use the new API endpoint instead of service layer
      const response = await fetch(`/api/projects?bucket_id=${bucket_id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      const { studies: data } = await response.json()
      setStudies(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch studies'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [bucket_id])
  
  useEffect(() => {
    fetchStudies()
  }, [fetchStudies])
  
  const createStudy = useCallback(async (data: {
    title: string
    description?: string
    status?: Study['status']
    priority?: Study['priority']
    start_date?: string
    end_date?: string
    metadata?: Record<string, any>
  }, lab_id: string) => {
    try {
      const study = await service.createStudy({
        name: data.title,
        description: data.description,
        status: data.status || undefined,
        priority: data.priority || undefined,
        start_date: data.start_date,
        due_date: data.end_date,
        // metadata field doesn't exist in createStudy interface
        bucket_id,
        lab_id
      })
      setStudies(prev => [study, ...prev])
      toast.success('Study created successfully')
      return study
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create study'
      toast.error(message)
      throw err
    }
  }, [bucket_id, service])
  
  const updateStudy = useCallback(async (id: string, data: Partial<Study>) => {
    try {
      const updated = await service.updateStudy(id, data)
      setStudies(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s))
      toast.success('Study updated successfully')
      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update study'
      toast.error(message)
      throw err
    }
  }, [service])
  
  const deleteStudy = useCallback(async (id: string) => {
    try {
      await service.deleteStudy(id)
      setStudies(prev => prev.filter(s => s.id !== id))
      toast.success('Study deleted successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete study'
      toast.error(message)
      throw err
    }
  }, [service])
  
  const moveStudy = useCallback(async (study_id: string, new_bucket_id: string) => {
    try {
      const updated = await service.moveStudy(study_id, new_bucket_id)
      setStudies(prev => prev.filter(s => s.id !== study_id))
      toast.success('Study moved successfully')
      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to move study'
      toast.error(message)
      throw err
    }
  }, [service])
  
  return {
    studies,
    loading,
    error,
    refresh: fetchStudies,
    createStudy,
    updateStudy,
    deleteStudy,
    moveStudy
  }
}

// ============================================
// Task Hooks
// ============================================

export function useTasks(study_id: string) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useSupabase()
  const service = useMemo(() => new HierarchyService(supabase), [supabase])
  
  const fetchTasks = useCallback(async () => {
    if (!study_id) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Use the new API endpoint with proper project_id handling
      const response = await fetch(`/api/tasks?project_id=${study_id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const { tasks: data } = await response.json()
      setTasks(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tasks'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [study_id])
  
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])
  
  const createTask = useCallback(async (data: {
    title: string
    description?: string
    assignee_id?: string
    status?: Task['status']
    priority?: Task['priority']
    due_date?: string
    estimated_hours?: number
    tags?: string[]
    metadata?: Record<string, any>
  }, lab_id: string) => {
    try {
      const task = await service.createTask({
        title: data.title,
        description: data.description,
        assigned_to: data.assignee_id,
        status: data.status || undefined,
        priority: data.priority || undefined,
        due_date: data.due_date,
        estimated_hours: data.estimated_hours,
        // tags field not available
        project_id: study_id,
        lab_id
      })
      setTasks(prev => [task, ...prev])
      toast.success('Task created successfully')
      return task
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task'
      toast.error(message)
      throw err
    }
  }, [study_id, service])
  
  const createSubtask = useCallback(async (parent_task_id: string, data: {
    title: string
    description?: string
    assignee_id?: string
    status?: Task['status']
    priority?: Task['priority']
    due_date?: string
  }, lab_id: string) => {
    try {
      const subtask = await service.createTask({
        title: data.title,
        description: data.description,
        assigned_to: data.assignee_id,
        status: data.status || undefined,
        priority: data.priority || undefined,
        due_date: data.due_date,
        // tags field not available
        project_id: study_id,
        parent_task_id,
        lab_id
      })
      
      // Refresh tasks to get updated counts
      await fetchTasks()
      
      toast.success('Subtask created successfully')
      return subtask
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create subtask'
      toast.error(message)
      throw err
    }
  }, [study_id, service])
  
  const updateTask = useCallback(async (id: string, data: Partial<Task>) => {
    try {
      const updated = await service.updateTask(id, data)
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t))
      toast.success('Task updated successfully')
      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task'
      toast.error(message)
      throw err
    }
  }, [service])
  
  const deleteTask = useCallback(async (id: string) => {
    try {
      await service.deleteTask(id)
      setTasks(prev => prev.filter(t => t.id !== id))
      toast.success('Task deleted successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task'
      toast.error(message)
      throw err
    }
  }, [service])
  
  const moveTask = useCallback(async (
    task_id: string,
    new_parent_task_id?: string,
    new_study_id?: string
  ) => {
    try {
      const updated = await service.moveTask(task_id, new_parent_task_id, new_study_id)
      
      if (new_study_id && new_study_id !== study_id) {
        // Task moved to different study
        setTasks(prev => prev.filter(t => t.id !== task_id))
      } else {
        // Task moved within same study
        setTasks(prev => prev.map(t => t.id === task_id ? { ...t, ...updated } : t))
      }
      
      toast.success('Task moved successfully')
      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to move task'
      toast.error(message)
      throw err
    }
  }, [study_id, service])
  
  const bulkUpdateStatus = useCallback(async (task_ids: string[], status: Task['status']) => {
    try {
      await service.bulkUpdateTaskStatus(task_ids, status)
      setTasks(prev => prev.map(t => 
        task_ids.includes(t.id) 
          ? { ...t, status, completed_date: status === 'done' ? new Date().toISOString() : null }
          : t
      ))
      toast.success(`${task_ids.length} tasks updated successfully`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update tasks'
      toast.error(message)
      throw err
    }
  }, [service])
  
  const bulkAssign = useCallback(async (task_ids: string[], assignee_id: string) => {
    try {
      await service.bulkAssignTasks(task_ids, assignee_id)
      setTasks(prev => prev.map(t => 
        task_ids.includes(t.id) ? { ...t, assignee_id } : t
      ))
      toast.success(`${task_ids.length} tasks assigned successfully`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign tasks'
      toast.error(message)
      throw err
    }
  }, [service])
  
  return {
    tasks,
    loading,
    error,
    refresh: fetchTasks,
    createTask,
    createSubtask,
    updateTask,
    deleteTask,
    moveTask,
    bulkUpdateStatus,
    bulkAssign
  }
}

// ============================================
// Subtask Hooks
// ============================================

export function useSubtasks(parent_task_id: string) {
  const [subtasks, setSubtasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useSupabase()
  const service = useMemo(() => new HierarchyService(supabase), [supabase])
  
  const fetchSubtasks = useCallback(async () => {
    if (!parent_task_id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await service.listSubtasks(parent_task_id)
      setSubtasks(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch subtasks'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [parent_task_id, service])
  
  useEffect(() => {
    fetchSubtasks()
  }, [fetchSubtasks])
  
  return {
    subtasks,
    loading,
    error,
    refresh: fetchSubtasks
  }
}

// ============================================
// Hierarchy Path Hook
// ============================================

export function useHierarchyPath(task_id: string) {
  const [path, setPath] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useSupabase()
  const service = useMemo(() => new HierarchyService(supabase), [supabase])
  
  useEffect(() => {
    if (!task_id) return
    
    const fetchPath = async () => {
      setLoading(true)
      try {
        const data = await service.getHierarchyPath(task_id)
        setPath(data)
      } catch (err) {
        console.error('Failed to fetch hierarchy path:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPath()
  }, [task_id, service])
  
  return { path, loading }
}

// ============================================
// Search Hook
// ============================================

export function useTaskSearch(lab_id: string) {
  const [results, setResults] = useState<Task[]>([])
  const [searching, setSearching] = useState(false)
  const supabase = useSupabase()
  const service = useMemo(() => new HierarchyService(supabase), [supabase])
  
  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }
    
    setSearching(true)
    try {
      const data = await service.searchTasks(lab_id, query)
      setResults(data)
    } catch (err) {
      console.error('Search failed:', err)
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [lab_id, service])
  
  return { results, searching, search }
}