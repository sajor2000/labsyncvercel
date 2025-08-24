import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { rateLimit } from '@/lib/rate-limit/rate-limiter'
import { z } from 'zod'

const CreateLabSchema = z.object({
  name: z.string().min(2, 'Lab name must be at least 2 characters').max(100, 'Lab name too long'),
  description: z.string().max(500, 'Description too long').optional(),
})

// GET /api/labs - Get all labs for the current user
export async function GET() {
  try {
    await rateLimit('api', 20) // 20 requests per minute
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's lab memberships with lab details
    const { data: memberships, error } = await supabase
      .from('lab_members')
      .select(`
        id,
        role,
        is_active,
        created_at,
        labs!inner (
          id,
          name,
          description,
          created_by,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching labs:', error)
      return NextResponse.json({ error: 'Failed to fetch labs' }, { status: 500 })
    }

    // Get stats for each lab
    const labsWithStats = await Promise.all(
      (memberships || []).map(async (membership: any) => {
        const lab = membership.labs

        // Get member count
        const { count: memberCount } = await supabase
          .from('lab_members')
          .select('*', { count: 'exact', head: true })
          .eq('lab_id', lab.id)
          .eq('is_active', true)

        // Get project count through buckets
        const { data: buckets } = await supabase
          .from('buckets')
          .select('id')
          .eq('lab_id', lab.id)
        
        let studyCount = 0
        if (buckets && buckets.length > 0) {
          const bucketIds = buckets.map(b => b.id)
          const { count } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .in('bucket_id', bucketIds)
          studyCount = count || 0
        }

        return {
          ...lab,
          userRole: membership.role,
          memberCount: memberCount || 0,
          studyCount: studyCount || 0,
          bucketCount: 0, // Placeholder for now
        }
      })
    )

    return NextResponse.json({ labs: labsWithStats })

  } catch (error) {
    console.error('Labs GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/labs - Create a new lab
export async function POST(request: Request) {
  try {
    await rateLimit('api', 10) // 10 requests per minute for creation
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CreateLabSchema.parse(body)

    // Create the lab
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        created_by: user.id,
        is_active: true,
      })
      .select()
      .single()

    if (labError) {
      console.error('Error creating lab:', labError)
      if (labError.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'A lab with this name already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create lab' }, { status: 500 })
    }

    // Add creator as principal_investigator with full permissions
    const { error: memberError } = await supabase
      .from('lab_members')
      .insert({
        lab_id: lab.id,
        user_id: user.id,
        role: 'principal_investigator',
        is_admin: true,
        is_super_admin: true,
        is_active: true,
        can_manage_lab_settings: true,
        can_manage_members: true,
        can_manage_permissions: true,
        can_view_audit_logs: true,
        can_manage_integrations: true,
        can_create_projects: true,
        can_edit_all_projects: true,
        can_delete_projects: true,
        can_view_all_projects: true,
        can_archive_projects: true,
        can_restore_projects: true,
        can_create_tasks: true,
        can_assign_tasks: true,
        can_edit_all_tasks: true,
        can_delete_tasks: true,
        can_view_all_tasks: true,
        can_set_task_priorities: true,
        can_manage_deadlines: true,
        can_access_reports: true,
        can_export_data: true,
        can_view_analytics: true,
        can_schedule_meetings: true,
        can_manage_standups: true,
        can_send_announcements: true,
        can_moderate_discussions: true,
        can_manage_calendar: true,
        can_upload_files: true,
        can_share_files: true,
        can_delete_files: true,
        can_manage_file_permissions: true,
        can_create_ideas: true,
        can_moderate_ideas: true
      })

    if (memberError) {
      console.error('Error adding lab creator as member:', memberError)
      // Try to clean up the lab if member creation failed
      await supabase.from('labs').delete().eq('id', lab.id)
      return NextResponse.json({ error: 'Failed to set up lab membership' }, { status: 500 })
    }

    // Update user's default lab if they don't have one
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('last_selected_lab_id')
      .eq('id', user.id)
      .single()

    if (!profile?.last_selected_lab_id) {
      await supabase
        .from('user_profiles')
        .update({ last_selected_lab_id: lab.id })
        .eq('id', user.id)
    }

    return NextResponse.json({ 
      lab: {
        ...lab,
        userRole: 'principal_investigator',
        memberCount: 1,
        studyCount: 0,
        bucketCount: 0,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Labs POST error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}