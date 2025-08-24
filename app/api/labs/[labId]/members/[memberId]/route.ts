import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { rateLimit } from '@/lib/rate-limit/rate-limiter'
import { z } from 'zod'

const UpdateMemberSchema = z.object({
  role: z.enum([
    'principal_investigator',
    'co_investigator', 
    'lab_manager',
    'data_analyst',
    'data_scientist',
    'regulatory_coordinator',
    'lab_assistant',
    'research_volunteer',
    'external_collaborator'
  ]).optional(),
  is_active: z.boolean().optional(),
  can_manage_members: z.boolean().optional(),
  can_create_studies: z.boolean().optional(),
  can_edit_studies: z.boolean().optional(),
  can_delete_studies: z.boolean().optional(),
  can_manage_tasks: z.boolean().optional(),
  can_view_reports: z.boolean().optional(),
  can_export_data: z.boolean().optional(),
  can_manage_lab: z.boolean().optional(),
  can_manage_permissions: z.boolean().optional(),
})

// GET /api/labs/[labId]/members/[memberId] - Get specific member details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ labId: string; memberId: string }> }
) {
  const { labId, memberId } = await params
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

    // Get specific member details
    const { data: member, error: fetchError } = await supabase
      .from('lab_members')
      .select(`
        id,
        role,
        is_active,
        created_at,
        updated_at,
        can_manage_members,
        can_create_studies,
        can_edit_studies,
        can_delete_studies,
        can_manage_tasks,
        can_view_reports,
        can_export_data,
        can_manage_lab,
        can_manage_permissions,
        user_profiles!inner (
          id,
          first_name,
          last_name,
          full_name,
          avatar_url
        )
      `)
      .eq('id', memberId)
      .eq('lab_id', labId)
      .single()

    if (fetchError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Format member data  
    const userProfiles = Array.isArray(member.user_profiles) ? member.user_profiles[0] : member.user_profiles
    const formattedMember = {
      id: member.id,
      userId: userProfiles?.id,
      firstName: userProfiles?.first_name,
      lastName: userProfiles?.last_name,
      fullName: userProfiles?.full_name,
      avatarUrl: userProfiles?.avatar_url,
      role: member.role,
      permissions: {
        can_manage_members: member.can_manage_members,
        can_create_studies: member.can_create_studies,
        can_edit_studies: member.can_edit_studies,
        can_delete_studies: member.can_delete_studies,
        can_manage_tasks: member.can_manage_tasks,
        can_view_reports: member.can_view_reports,
        can_export_data: member.can_export_data,
        can_manage_lab: member.can_manage_lab,
        can_manage_permissions: member.can_manage_permissions,
      },
      isActive: member.is_active,
      joinedAt: member.created_at,
      updatedAt: member.updated_at,
    }

    return NextResponse.json({ member: formattedMember })

  } catch (error) {
    console.error('Member GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/labs/[labId]/members/[memberId] - Update member role/permissions
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ labId: string; memberId: string }> }
) {
  const { labId, memberId } = await params
  try {
    await rateLimit('api', 10)
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can manage members in this lab
    const { data: membership, error: memberError } = await supabase
      .from('lab_members')
      .select('role, can_manage_members, can_manage_permissions')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Lab not found or access denied' }, { status: 404 })
    }

    if (!membership.can_manage_members && !membership.can_manage_permissions) {
      return NextResponse.json({ error: 'Insufficient permissions to update member' }, { status: 403 })
    }

    // Get the member being updated
    const { data: targetMember, error: targetError } = await supabase
      .from('lab_members')
      .select('role, user_id')
      .eq('id', memberId)
      .eq('lab_id', labId)
      .single()

    if (targetError || !targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Prevent users from modifying themselves unless they're principal investigator
    const isSelfUpdate = targetMember.user_id === user.id
    if (isSelfUpdate && membership.role !== 'principal_investigator') {
      return NextResponse.json({ error: 'Cannot modify your own role or permissions' }, { status: 403 })
    }

    // Only principal investigators can promote/demote other principal investigators
    const body = await request.json()
    const validatedData = UpdateMemberSchema.parse(body)

    if (validatedData.role === 'principal_investigator' && membership.role !== 'principal_investigator') {
      return NextResponse.json({ 
        error: 'Only principal investigators can assign principal investigator role' 
      }, { status: 403 })
    }

    if (targetMember.role === 'principal_investigator' && membership.role !== 'principal_investigator') {
      return NextResponse.json({ 
        error: 'Only principal investigators can modify other principal investigators' 
      }, { status: 403 })
    }

    // Update the member
    const { data: updatedMember, error: updateError } = await supabase
      .from('lab_members')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId)
      .eq('lab_id', labId)
      .select(`
        id,
        role,
        is_active,
        created_at,
        updated_at,
        can_manage_members,
        can_create_studies,
        can_edit_studies,
        can_delete_studies,
        can_manage_tasks,
        can_view_reports,
        can_export_data,
        can_manage_lab,
        can_manage_permissions,
        user_profiles!inner (
          id,
          first_name,
          last_name,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating member:', updateError)
      return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
    }

    // Format updated member data
    const updatedUserProfiles = Array.isArray(updatedMember.user_profiles) ? updatedMember.user_profiles[0] : updatedMember.user_profiles
    const formattedMember = {
      id: updatedMember.id,
      userId: updatedUserProfiles?.id,
      firstName: updatedUserProfiles?.first_name,
      lastName: updatedUserProfiles?.last_name,
      fullName: updatedUserProfiles?.full_name,
      avatarUrl: updatedUserProfiles?.avatar_url,
      role: updatedMember.role,
      permissions: {
        can_manage_members: updatedMember.can_manage_members,
        can_create_studies: updatedMember.can_create_studies,
        can_edit_studies: updatedMember.can_edit_studies,
        can_delete_studies: updatedMember.can_delete_studies,
        can_manage_tasks: updatedMember.can_manage_tasks,
        can_view_reports: updatedMember.can_view_reports,
        can_export_data: updatedMember.can_export_data,
        can_manage_lab: updatedMember.can_manage_lab,
        can_manage_permissions: updatedMember.can_manage_permissions,
      },
      isActive: updatedMember.is_active,
      joinedAt: updatedMember.created_at,
      updatedAt: updatedMember.updated_at,
    }

    return NextResponse.json({ member: formattedMember })

  } catch (error) {
    console.error('Member PATCH error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/labs/[labId]/members/[memberId] - Remove member from lab
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ labId: string; memberId: string }> }
) {
  const { labId, memberId } = await params
  try {
    await rateLimit('api', 10)
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can manage members in this lab
    const { data: membership, error: memberError } = await supabase
      .from('lab_members')
      .select('role, can_manage_members')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Lab not found or access denied' }, { status: 404 })
    }

    if (!membership.can_manage_members) {
      return NextResponse.json({ error: 'Insufficient permissions to remove members' }, { status: 403 })
    }

    // Get the member being removed
    const { data: targetMember, error: targetError } = await supabase
      .from('lab_members')
      .select('role, user_id')
      .eq('id', memberId)
      .eq('lab_id', labId)
      .single()

    if (targetError || !targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Prevent removing the last principal investigator
    if (targetMember.role === 'principal_investigator') {
      const { count: piCount } = await supabase
        .from('lab_members')
        .select('*', { count: 'exact', head: true })
        .eq('lab_id', labId)
        .eq('role', 'principal_investigator')
        .eq('is_active', true)

      if ((piCount || 0) <= 1) {
        return NextResponse.json({ 
          error: 'Cannot remove the last principal investigator. Promote another member first.' 
        }, { status: 403 })
      }
    }

    // Prevent users from removing themselves (they should leave the lab instead)
    if (targetMember.user_id === user.id) {
      return NextResponse.json({ 
        error: 'Cannot remove yourself. Use the leave lab function instead.' 
      }, { status: 403 })
    }

    // Check if hard delete or soft delete
    const url = new URL(request.url)
    const hardDelete = url.searchParams.get('hard') === 'true'

    if (hardDelete) {
      // Hard delete - remove the member completely
      const { error: deleteError } = await supabase
        .from('lab_members')
        .delete()
        .eq('id', memberId)
        .eq('lab_id', labId)

      if (deleteError) {
        console.error('Error removing member:', deleteError)
        return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
      }
    } else {
      // Soft delete - deactivate the member
      const { error: deactivateError } = await supabase
        .from('lab_members')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .eq('lab_id', labId)

      if (deactivateError) {
        console.error('Error deactivating member:', deactivateError)
        return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      message: hardDelete ? 'Member removed successfully' : 'Member deactivated successfully',
      removed: hardDelete
    })

  } catch (error) {
    console.error('Member DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}