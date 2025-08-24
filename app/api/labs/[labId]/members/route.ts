import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { rateLimit } from '@/lib/rate-limit/rate-limiter'
import { z } from 'zod'

const AddMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
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
  ]),
})

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
})

// GET /api/labs/[labId]/members - Get all lab members
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

    // Get all lab members with user profile info
    const { data: members, error: membersError } = await supabase
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
          email,
          first_name,
          last_name,
          full_name,
          avatar_url
        )
      `)
      .eq('lab_id', labId)
      .order('created_at', { ascending: false })

    if (membersError) {
      console.error('Error fetching lab members:', membersError)
      return NextResponse.json({ error: 'Failed to fetch lab members' }, { status: 500 })
    }

    // Format member data
    const formattedMembers = members?.map(member => {
      const userProfiles = Array.isArray(member.user_profiles) ? member.user_profiles[0] : member.user_profiles
      return {
        id: member.id,
        userId: userProfiles?.id,
        email: userProfiles?.email,
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
    }) || []

    return NextResponse.json({ members: formattedMembers })

  } catch (error) {
    console.error('Lab members GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/labs/[labId]/members - Add new lab member
export async function POST(
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
      return NextResponse.json({ error: 'Insufficient permissions to add members' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = AddMemberSchema.parse(body)

    // Find the user by email
    const { data: targetUser, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', validatedData.email)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ 
        error: 'User not found. They may need to create an account first.' 
      }, { status: 404 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('lab_members')
      .select('id, is_active')
      .eq('lab_id', labId)
      .eq('user_id', targetUser.id)
      .single()

    if (existingMember) {
      if (existingMember.is_active) {
        return NextResponse.json({ error: 'User is already a member of this lab' }, { status: 409 })
      } else {
        // Reactivate existing membership
        const defaultPerms = getDefaultPermissions(validatedData.role)
        const { data: reactivatedMember, error: reactivateError } = await supabase
          .from('lab_members')
          .update({
            role: validatedData.role,
            is_active: true,
            updated_at: new Date().toISOString(),
            ...defaultPerms,
          })
          .eq('id', existingMember.id)
          .select()
          .single()

        if (reactivateError) {
          console.error('Error reactivating member:', reactivateError)
          return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
        }

        return NextResponse.json({ 
          member: reactivatedMember,
          message: 'Member reactivated successfully'
        })
      }
    }

    // Add new member
    const defaultPerms = getDefaultPermissions(validatedData.role)
    const { data: newMember, error: addError } = await supabase
      .from('lab_members')
      .insert({
        lab_id: labId,
        user_id: targetUser.id,
        role: validatedData.role,
        is_active: true,
        ...defaultPerms,
      })
      .select()
      .single()

    if (addError) {
      console.error('Error adding member:', addError)
      return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
    }

    return NextResponse.json({ 
      member: newMember,
      message: 'Member added successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Add member error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get default permissions based on role
function getDefaultPermissions(role: string) {
  const permissionSets: Record<string, any> = {
    principal_investigator: {
      can_manage_members: true,
      can_create_studies: true,
      can_edit_studies: true,
      can_delete_studies: true,
      can_manage_tasks: true,
      can_view_reports: true,
      can_export_data: true,
      can_manage_lab: true,
      can_manage_permissions: true
    },
    co_investigator: {
      can_manage_members: true,
      can_create_studies: true,
      can_edit_studies: true,
      can_delete_studies: false,
      can_manage_tasks: true,
      can_view_reports: true,
      can_export_data: true,
      can_manage_lab: false,
      can_manage_permissions: false
    },
    lab_manager: {
      can_manage_members: true,
      can_create_studies: true,
      can_edit_studies: true,
      can_delete_studies: false,
      can_manage_tasks: true,
      can_view_reports: true,
      can_export_data: true,
      can_manage_lab: false,
      can_manage_permissions: false
    },
    regulatory_coordinator: {
      can_manage_members: false,
      can_create_studies: true,
      can_edit_studies: true,
      can_delete_studies: false,
      can_manage_tasks: true,
      can_view_reports: true,
      can_export_data: true,
      can_manage_lab: false,
      can_manage_permissions: false
    },
    data_scientist: {
      can_manage_members: false,
      can_create_studies: true,
      can_edit_studies: true,
      can_delete_studies: false,
      can_manage_tasks: true,
      can_view_reports: true,
      can_export_data: true,
      can_manage_lab: false,
      can_manage_permissions: false
    },
    data_analyst: {
      can_manage_members: false,
      can_create_studies: false,
      can_edit_studies: true,
      can_delete_studies: false,
      can_manage_tasks: true,
      can_view_reports: true,
      can_export_data: true,
      can_manage_lab: false,
      can_manage_permissions: false
    },
    lab_assistant: {
      can_manage_members: false,
      can_create_studies: false,
      can_edit_studies: false,
      can_delete_studies: false,
      can_manage_tasks: false,
      can_view_reports: true,
      can_export_data: false,
      can_manage_lab: false,
      can_manage_permissions: false
    },
    research_volunteer: {
      can_manage_members: false,
      can_create_studies: false,
      can_edit_studies: false,
      can_delete_studies: false,
      can_manage_tasks: false,
      can_view_reports: true,
      can_export_data: false,
      can_manage_lab: false,
      can_manage_permissions: false
    },
    external_collaborator: {
      can_manage_members: false,
      can_create_studies: false,
      can_edit_studies: true,
      can_delete_studies: false,
      can_manage_tasks: false,
      can_view_reports: true,
      can_export_data: false,
      can_manage_lab: false,
      can_manage_permissions: false
    }
  }

  return permissionSets[role] || permissionSets.lab_assistant
}