import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit/rate-limiter'

// POST /api/labs/[labId]/calendar-integration/ricc - Connect RICCC Labs calendar
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ labId: string }> }
) {
  try {
    await rateLimit('api', 5)
    
    const { labId } = await params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get lab details to verify it's one of your labs
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .select('id, name')
      .eq('id', labId)
      .single()

    if (labError || !lab) {
      return NextResponse.json({ error: 'Lab not found' }, { status: 404 })
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

    // Verify this is one of your labs (by name patterns)
    const yourLabNames = ['RICCC', 'RHEDAS', 'Rush Health Equity', 'Rush Interdisciplinary']
    const isYourLab = yourLabNames.some(name => lab.name.includes(name))

    if (!isYourLab) {
      return NextResponse.json({ 
        error: 'RICCC Labs calendar is only available for RICCC/RHEDAS labs' 
      }, { status: 403 })
    }

    // Delete any existing calendar integration for this lab
    await supabase
      .from('calendar_integrations')
      .delete()
      .eq('lab_id', labId)

    // Create RICCC calendar integration
    const { data: integration, error: insertError } = await supabase
      .from('calendar_integrations')
      .insert({
        lab_id: labId,
        user_id: user.id,
        provider: 'ricc',
        name: 'RICCC Labs Calendar',
        external_calendar_id: 'riccclabs@gmail.com',
        access_token_encrypted: null, // Uses API key, not OAuth
        refresh_token_encrypted: null,
        expires_at: null,
        sync_settings: {
          sync_events: true,
          sync_deadlines: true,
          auto_sync_interval: '15m'
        },
        is_primary: true,
        sync_enabled: true,
        status: 'connected'
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      success: true,
      integration
    })

  } catch (error: any) {
    console.error('RICCC calendar connection error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to connect RICCC Labs calendar' 
    }, { status: 500 })
  }
}