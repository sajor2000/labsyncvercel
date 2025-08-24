import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { rateLimit } from '@/lib/rate-limit/rate-limiter'
import { z } from 'zod'

const CreateTaskSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  parent_task_id: z.string().uuid().optional(),
  title: z.string().min(1, 'Task title is required').max(500, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigned_to: z.string().uuid().optional(),
  due_date: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
})

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigned_to: z.string().uuid().optional(),
  due_date: z.string().optional(),
  completed_date: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  actual_hours: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
})

// GET /api/tasks - Get tasks filtered by project_id
export async function GET(request: Request) {
  try {
    await rateLimit('api', 50) // 50 requests per minute
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const project_id = url.searchParams.get('project_id')
    const study_id = url.searchParams.get('study_id') // Backwards compatibility

    const target_project_id = project_id || study_id

    if (!target_project_id) {
      return NextResponse.json({ error: 'project_id or study_id parameter required' }, { status: 400 })
    }

    // Get tasks with related data
    const { data: tasks, error } = await supabase
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
        )
      `)
      .eq('project_id', target_project_id)
      .is('deleted_at', null)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    // Get subtask counts for parent tasks
    const tasksWithCounts = await Promise.all(
      (tasks || []).map(async (task) => {
        const { count: subtaskCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('parent_task_id', task.id)
          .is('deleted_at', null)

        return {
          ...task,
          // Add compatibility fields for frontend
          study_id: task.project_id,
          _count: {
            subtasks: subtaskCount || 0
          }
        }
      })
    )

    return NextResponse.json({ tasks: tasksWithCounts })

  } catch (error) {
    console.error('Tasks GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: Request) {
  try {
    await rateLimit('api', 20) // 20 requests per minute
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Handle backwards compatibility (study_id → project_id)
    if (body.study_id && !body.project_id) {
      body.project_id = body.study_id
    }
    
    const validatedData = CreateTaskSchema.parse(body)

    // Verify user has permission to create tasks in this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        bucket_id,
        buckets!inner (lab_id)
      `)
      .eq('id', validatedData.project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Invalid project' }, { status: 400 })
    }

    const buckets = Array.isArray(project.buckets) ? project.buckets[0] : project.buckets
    const lab_id = buckets?.lab_id

    // Check permissions
    const { data: membership, error: membershipError } = await supabase
      .from('lab_members')
      .select('can_create_tasks, can_assign_tasks, is_super_admin')
      .eq('lab_id', lab_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Not a member of this lab' }, { status: 403 })
    }

    if (!membership.can_create_tasks && !membership.is_super_admin) {
      return NextResponse.json({ error: 'Insufficient permissions to create tasks' }, { status: 403 })
    }

    // If assigning to someone else, check assignment permission
    if (validatedData.assigned_to && validatedData.assigned_to !== user.id) {
      if (!membership.can_assign_tasks && !membership.is_super_admin) {
        return NextResponse.json({ error: 'Insufficient permissions to assign tasks' }, { status: 403 })
      }
    }

    // Create the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        project_id: validatedData.project_id,
        parent_task_id: validatedData.parent_task_id,
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status || 'todo',
        priority: validatedData.priority || 'medium',
        assigned_to: validatedData.assigned_to,
        assigned_by: validatedData.assigned_to ? user.id : null,
        due_date: validatedData.due_date,
        estimated_hours: validatedData.estimated_hours,
        tags: validatedData.tags,
      })
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
        estimated_hours,
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

    if (taskError) {
      console.error('Error creating task:', taskError)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    // Add compatibility fields
    const taskWithCompat = {
      ...task,
      study_id: task.project_id,
      _count: { subtasks: 0 }
    }

    return NextResponse.json({ task: taskWithCompat }, { status: 201 })

  } catch (error) {
    console.error('Tasks POST error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}