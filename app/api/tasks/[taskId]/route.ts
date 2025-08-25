import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { rateLimit } from '@/lib/rate-limit/rate-limiter'
import { z } from 'zod'

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  completed_date: z.string().nullable().optional(),
  estimated_hours: z.number().min(0).optional(),
  actual_hours: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
})

// GET /api/tasks/[taskId] - Get a single task
export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    await rateLimit('api', 50)
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        id,
        project_id,
        parent_task_id,
        title,
        description,
        status,
        priority,
        assigned_to,
        assigned_by,
        due_date,
        start_date,
        completed_date,
        estimated_hours,
        actual_hours,
        position,
        tags,
        created_at,
        updated_at,
        assignee:user_profiles!tasks_assigned_to_fkey (
          id,
          email,
          first_name,
          last_name,
          display_name,
          avatar_url
        ),
        assigner:user_profiles!tasks_assigned_by_fkey (
          id,
          email,
          first_name,
          last_name,
          display_name
        ),
        projects!inner (
          id,
          bucket_id,
          buckets!inner (
            lab_id
          )
        )
      `)
      .eq('id', taskId)
      .is('deleted_at', null)
      .single()

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Extract lab_id from nested relationship
    const projects = Array.isArray(task.projects) ? task.projects[0] : task.projects
    const buckets = Array.isArray(projects?.buckets) ? projects.buckets[0] : projects?.buckets
    const lab_id = buckets?.lab_id

    if (!lab_id) {
      return NextResponse.json({ error: 'Unable to determine lab' }, { status: 500 })
    }

    // Verify user has access to this lab
    const { data: membership } = await supabase
      .from('lab_members')
      .select('id')
      .eq('lab_id', lab_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized to view this task' }, { status: 403 })
    }

    // Get subtask count
    const { count: subtaskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('parent_task_id', taskId)
      .is('deleted_at', null)

    const taskWithCount = {
      ...task,
      study_id: task.project_id, // Backwards compatibility
      _count: {
        subtasks: subtaskCount || 0
      }
    }

    return NextResponse.json({ task: taskWithCount })

  } catch (error) {
    console.error('Task GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/tasks/[taskId] - Update a task
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    await rateLimit('api', 20)
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = UpdateTaskSchema.parse(body)

    // Get task to check project and lab
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        project_id,
        assigned_to,
        projects!inner (
          bucket_id,
          buckets!inner (
            lab_id
          )
        )
      `)
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Extract lab_id
    const projects = Array.isArray(task.projects) ? task.projects[0] : task.projects
    const buckets = Array.isArray(projects?.buckets) ? projects.buckets[0] : projects?.buckets
    const lab_id = buckets?.lab_id

    if (!lab_id) {
      return NextResponse.json({ error: 'Unable to determine lab' }, { status: 500 })
    }

    // Check permissions
    const { data: membership, error: membershipError } = await supabase
      .from('lab_members')
      .select('can_edit_all_tasks, can_edit_own_tasks, can_assign_tasks, is_super_admin')
      .eq('lab_id', lab_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Not a member of this lab' }, { status: 403 })
    }

    // Check edit permissions
    const canEdit = membership.is_super_admin || 
                   membership.can_edit_all_tasks || 
                   (membership.can_edit_own_tasks && task.assigned_to === user.id)

    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions to edit this task' }, { status: 403 })
    }

    // Check assignment permissions if changing assignee
    if (validatedData.assigned_to !== undefined && validatedData.assigned_to !== task.assigned_to) {
      if (!membership.can_assign_tasks && !membership.is_super_admin) {
        return NextResponse.json({ error: 'Insufficient permissions to assign tasks' }, { status: 403 })
      }
    }

    // Update the task
    const updateData: any = {
      ...validatedData,
      updated_at: new Date().toISOString()
    }

    // If assigning task, update assigned_by
    if (validatedData.assigned_to !== undefined) {
      updateData.assigned_by = user.id
    }

    // If marking as done, set completed_date
    if (validatedData.status === 'done' && !validatedData.completed_date) {
      updateData.completed_date = new Date().toISOString()
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select(`
        id,
        project_id,
        parent_task_id,
        title,
        description,
        status,
        priority,
        assigned_to,
        assigned_by,
        due_date,
        start_date,
        completed_date,
        estimated_hours,
        actual_hours,
        tags,
        created_at,
        updated_at,
        assignee:user_profiles!tasks_assigned_to_fkey (
          id,
          email,
          first_name,
          last_name,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating task:', updateError)
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    const taskWithCompat = {
      ...updatedTask,
      study_id: updatedTask.project_id,
      _count: { subtasks: 0 }
    }

    return NextResponse.json({ task: taskWithCompat })

  } catch (error) {
    console.error('Task PATCH error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/tasks/[taskId] - Soft delete a task
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    await rateLimit('api', 10)
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get task to check project and lab
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        project_id,
        assigned_to,
        projects!inner (
          bucket_id,
          buckets!inner (
            lab_id
          )
        )
      `)
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Extract lab_id
    const projects = Array.isArray(task.projects) ? task.projects[0] : task.projects
    const buckets = Array.isArray(projects?.buckets) ? projects.buckets[0] : projects?.buckets
    const lab_id = buckets?.lab_id

    if (!lab_id) {
      return NextResponse.json({ error: 'Unable to determine lab' }, { status: 500 })
    }

    // Check permissions
    const { data: membership, error: membershipError } = await supabase
      .from('lab_members')
      .select('can_delete_tasks, can_delete_own_tasks, is_super_admin')
      .eq('lab_id', lab_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Not a member of this lab' }, { status: 403 })
    }

    const canDelete = membership.is_super_admin || 
                     membership.can_delete_tasks || 
                     (membership.can_delete_own_tasks && task.assigned_to === user.id)

    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions to delete this task' }, { status: 403 })
    }

    // Soft delete the task and its subtasks
    const { error: deleteError } = await supabase
      .from('tasks')
      .update({ 
        deleted_at: new Date().toISOString() 
      })
      .or(`id.eq.${taskId},parent_task_id.eq.${taskId}`)

    if (deleteError) {
      console.error('Error deleting task:', deleteError)
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Task DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}