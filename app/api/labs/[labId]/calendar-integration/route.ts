import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit/rate-limiter'

// GET /api/labs/[labId]/calendar-integration - Get lab's calendar integration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ labId: string }> }
) {
  try {
    await rateLimit('api', 20)
    
    const { labId } = await params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is member of this lab
    const { data: membership, error: memberError } = await supabase
      .from('lab_members')
      .select('id, role')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get calendar integration for this lab
    const { data: integration, error: integrationError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('lab_id', labId)
      .eq('is_primary', true)
      .single()

    return NextResponse.json({
      integration: integration || null
    })

  } catch (error: any) {
    console.error('Calendar integration fetch error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch calendar integration' 
    }, { status: 500 })
  }
}

// DELETE /api/labs/[labId]/calendar-integration - Disconnect calendar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ labId: string }> }
) {
  try {
    await rateLimit('api', 10)
    
    const { labId } = await params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has admin permissions in this lab
    const { data: membership, error: memberError } = await supabase
      .from('lab_members')
      .select('id, role, can_manage_lab_settings')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError || !membership || !membership.can_manage_lab_settings) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Delete calendar integration
    const { error: deleteError } = await supabase
      .from('calendar_integrations')
      .delete()
      .eq('lab_id', labId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Calendar integration delete error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to disconnect calendar' 
    }, { status: 500 })
  }
}