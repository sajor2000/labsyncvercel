/**
 * Simple labs API - GET all labs, POST new lab
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    
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
        created_at,
        labs!inner (
          id,
          name,
          description,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching labs:', error)
      return NextResponse.json({ error: 'Failed to fetch labs' }, { status: 500 })
    }

    // Simple response - just return the memberships with lab data
    const labs = memberships?.map((m: any) => ({
      ...m.labs,
      role: m.role,
      joinedAt: m.created_at
    })) || []

    return NextResponse.json({ labs })

  } catch (error) {
    console.error('Labs GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body
    
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Invalid lab name' }, { status: 400 })
    }

    // Create lab
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .insert({
        name,
        description,
        created_by: user.id
      })
      .select()
      .single()

    if (labError) {
      console.error('Error creating lab:', labError)
      return NextResponse.json({ error: 'Failed to create lab' }, { status: 500 })
    }

    // Add creator as PI with all permissions
    const { error: memberError } = await supabase
      .from('lab_members')
      .insert({
        lab_id: lab.id,
        user_id: user.id,
        role: 'principal_investigator',
        can_manage_members: true,
        can_create_projects: true,
        can_edit_all_projects: true,
        can_delete_projects: true,
        can_create_tasks: true,
        can_edit_all_tasks: true,
        can_delete_tasks: true,
        can_view_financials: true
      })

    if (memberError) {
      // Cleanup on failure
      await supabase.from('labs').delete().eq('id', lab.id)
      return NextResponse.json({ error: 'Failed to setup membership' }, { status: 500 })
    }

    return NextResponse.json({ lab }, { status: 201 })

  } catch (error) {
    console.error('Labs POST error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}