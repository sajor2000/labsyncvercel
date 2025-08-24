import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { rateLimit } from '@/lib/rate-limit/rate-limiter'
import { z } from 'zod'

const UpdateLabSchema = z.object({
  name: z.string().min(2, 'Lab name must be at least 2 characters').max(100, 'Lab name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  is_active: z.boolean().optional(),
})

// GET /api/labs/[labId] - Get specific lab details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ labId: string }> }
) {
  const { labId } = await params
  try {
    await rateLimit('api', 30)
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this lab
    const { data: membership, error: memberError } = await supabase
      .from('lab_members')
      .select('role, can_manage_members, can_create_studies, can_edit_studies, can_delete_studies, can_manage_tasks, can_view_reports, can_export_data, can_manage_lab, can_manage_permissions')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Lab not found or access denied' }, { status: 404 })
    }

    // Get lab details
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .select('*')
      .eq('id', labId)
      .single()

    if (labError) {
      console.error('Error fetching lab:', labError)
      return NextResponse.json({ error: 'Failed to fetch lab' }, { status: 500 })
    }

    // Get lab statistics
    const { count: memberCount } = await supabase
      .from('lab_members')
      .select('*', { count: 'exact', head: true })
      .eq('lab_id', labId)
      .eq('is_active', true)

    const { count: studyCount } = await supabase
      .from('studies')
      .select('*', { count: 'exact', head: true })
      .eq('lab_id', labId)

    return NextResponse.json({
      lab: {
        ...lab,
        userRole: membership.role,
        userPermissions: {
          can_manage_members: membership.can_manage_members,
          can_create_studies: membership.can_create_studies,
          can_edit_studies: membership.can_edit_studies,
          can_delete_studies: membership.can_delete_studies,
          can_manage_tasks: membership.can_manage_tasks,
          can_view_reports: membership.can_view_reports,
          can_export_data: membership.can_export_data,
          can_manage_lab: membership.can_manage_lab,
          can_manage_permissions: membership.can_manage_permissions,
        },
        memberCount: memberCount || 0,
        studyCount: studyCount || 0,
        bucketCount: 0, // Placeholder
      }
    })

  } catch (error) {
    console.error('Lab GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/labs/[labId] - Update lab details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ labId: string }> }
) {
  const { labId } = await params
  try {
    await rateLimit('api', 10)
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can manage this lab
    const { data: membership, error: memberError } = await supabase
      .from('lab_members')
      .select('role, can_manage_lab')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Lab not found or access denied' }, { status: 404 })
    }

    if (!membership.can_manage_lab) {
      return NextResponse.json({ error: 'Insufficient permissions to edit lab' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = UpdateLabSchema.parse(body)

    // Update the lab
    const { data: updatedLab, error: updateError } = await supabase
      .from('labs')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', labId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating lab:', updateError)
      if (updateError.code === '23505') {
        return NextResponse.json({ error: 'A lab with this name already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to update lab' }, { status: 500 })
    }

    return NextResponse.json({ lab: updatedLab })

  } catch (error) {
    console.error('Lab PATCH error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/labs/[labId] - Delete/deactivate lab
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ labId: string }> }
) {
  const { labId } = await params
  try {
    await rateLimit('api', 5) // Stricter limit for deletion
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can manage this lab
    const { data: membership, error: memberError } = await supabase
      .from('lab_members')
      .select('role, can_manage_lab')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Lab not found or access denied' }, { status: 404 })
    }

    if (!membership.can_manage_lab) {
      return NextResponse.json({ error: 'Insufficient permissions to delete lab' }, { status: 403 })
    }

    // Check if user is principal_investigator (only they can delete)
    if (membership.role !== 'principal_investigator') {
      return NextResponse.json({ error: 'Only principal investigators can delete labs' }, { status: 403 })
    }

    // Get confirmation query param for hard delete vs soft delete
    const url = new URL(request.url)
    const hardDelete = url.searchParams.get('hard') === 'true'

    if (hardDelete) {
      // Hard delete - actually remove the lab and all related data
      // This is dangerous and should be used carefully
      const { error: deleteError } = await supabase
        .from('labs')
        .delete()
        .eq('id', labId)

      if (deleteError) {
        console.error('Error deleting lab:', deleteError)
        return NextResponse.json({ error: 'Failed to delete lab' }, { status: 500 })
      }
    } else {
      // Soft delete - just deactivate the lab
      const { error: deactivateError } = await supabase
        .from('labs')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', labId)

      if (deactivateError) {
        console.error('Error deactivating lab:', deactivateError)
        return NextResponse.json({ error: 'Failed to deactivate lab' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      message: hardDelete ? 'Lab deleted successfully' : 'Lab deactivated successfully',
      deleted: hardDelete
    })

  } catch (error) {
    console.error('Lab DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}