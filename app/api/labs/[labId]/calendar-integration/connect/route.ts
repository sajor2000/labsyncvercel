import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit/rate-limiter'
import { google } from 'googleapis'

// POST /api/labs/[labId]/calendar-integration/connect - Start Google OAuth flow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ labId: string }> }
) {
  try {
    await rateLimit('api', 5)
    
    const { labId } = await params
    const body = await request.json()
    const { provider } = body

    if (provider !== 'google') {
      return NextResponse.json({ error: 'Only Google Calendar is supported' }, { status: 400 })
    }

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

    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({ 
        error: 'Google OAuth is not configured. Contact administrator.' 
      }, { status: 503 })
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/labs/${labId}/calendar-integration/callback`
    )

    // Generate OAuth URL with required scopes
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email'
    ]

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: JSON.stringify({
        labId,
        userId: user.id,
        timestamp: Date.now()
      }),
      prompt: 'consent' // Force consent to get refresh token
    })

    return NextResponse.json({
      success: true,
      authUrl
    })

  } catch (error: any) {
    console.error('OAuth initiation error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to initiate OAuth flow' 
    }, { status: 500 })
  }
}