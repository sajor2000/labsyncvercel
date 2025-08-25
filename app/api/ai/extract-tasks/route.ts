/**
 * Extract tasks from text (meeting notes, transcripts, etc)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { extractTasks } from '@/lib/ai/simple-ai'
import { createTask } from '@/lib/db/queries'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, projectId, autoCreate = false } = body
    
    if (!text || !projectId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check user has access to project
    const { data: project } = await supabase
      .from('projects')
      .select('id, bucket_id, buckets!inner(lab_id)')
      .eq('id', projectId)
      .single()
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const labId = (project.buckets as any).lab_id
    const { data: membership } = await supabase
      .from('lab_members')
      .select('can_create_tasks')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .single()
    
    if (!membership?.can_create_tasks) {
      return NextResponse.json({ error: 'Not authorized to create tasks' }, { status: 403 })
    }

    // Extract tasks from text
    const extractedTasks = await extractTasks(text, projectId)
    
    // Optionally auto-create tasks
    let createdTasks = []
    if (autoCreate && extractedTasks.length > 0) {
      for (const taskData of extractedTasks) {
        try {
          // Ensure required fields have defaults
          const task = await createTask({
            title: taskData.title || 'Untitled Task',
            description: taskData.description,
            status: taskData.status || 'todo',
            priority: taskData.priority || 'medium',
            project_id: projectId,
            assigned_to: taskData.assigned_to,
            due_date: taskData.due_date,
            parent_task_id: taskData.parent_task_id
          })
          createdTasks.push(task)
        } catch (error) {
          console.error('Failed to create task:', error)
        }
      }
    }
    
    return NextResponse.json({ 
      extracted: extractedTasks,
      created: createdTasks,
      count: extractedTasks.length
    })
    
  } catch (error) {
    console.error('Task extraction error:', error)
    return NextResponse.json({ error: 'Failed to extract tasks' }, { status: 500 })
  }
}