/**
 * Simple project API - GET, PATCH, DELETE operations
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const supabase = await createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get project with bucket info
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        buckets (*)
      `)
      .eq('id', projectId)
      .single()
    
    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Get task count
    const { count: taskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
    
    const { count: completedTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', 'done')
    
    return NextResponse.json({
      project,
      stats: {
        taskCount: taskCount || 0,
        completedTasks: completedTasks || 0,
        progress: taskCount ? Math.round(((completedTasks || 0) / taskCount) * 100) : 0
      }
    })
    
  } catch (error) {
    console.error('Project GET error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const supabase = await createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get project to check lab membership
    const { data: project } = await supabase
      .from('projects')
      .select('bucket_id, buckets!inner(lab_id)')
      .eq('id', projectId)
      .single()
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Check permissions
    const labId = (project.buckets as any).lab_id
    const { data: membership } = await supabase
      .from('lab_members')
      .select('can_edit_all_projects')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .single()
    
    if (!membership?.can_edit_all_projects) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
    
    // Update project - Map title to name for database
    const body = await request.json()
    const updateData = { ...body }
    
    // Map frontend field names to database field names
    if ('title' in updateData) {
      updateData.name = updateData.title
      delete updateData.title
    }
    
    const { data: updated, error } = await supabase
      .from('projects')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }
    
    // Map database field names back to frontend field names
    const project = {
      ...updated,
      title: updated.name || updated.title
    }
    
    return NextResponse.json({ project })
    
  } catch (error) {
    console.error('Project PATCH error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const supabase = await createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get project to check lab membership
    const { data: project } = await supabase
      .from('projects')
      .select('bucket_id, buckets!inner(lab_id)')
      .eq('id', projectId)
      .single()
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Check permissions
    const labId = (project.buckets as any).lab_id
    const { data: membership } = await supabase
      .from('lab_members')
      .select('can_delete_projects')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .single()
    
    if (!membership?.can_delete_projects) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
    
    // Soft delete
    const { error } = await supabase
      .from('projects')
      .update({ 
        deleted_at: new Date().toISOString() 
      })
      .eq('id', projectId)
    
    if (error) {
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Project DELETE error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}