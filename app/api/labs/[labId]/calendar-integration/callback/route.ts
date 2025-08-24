import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { redirect } from 'next/navigation'

// GET /api/labs/[labId]/calendar-integration/callback - Handle Google OAuth callback
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ labId: string }> }
) {
  try {
    const { labId } = await params
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error)
      redirect(`/dashboard/labs/${labId}?error=oauth_cancelled`)
    }

    if (!code || !state) {
      redirect(`/dashboard/labs/${labId}?error=oauth_invalid`)
    }

    // Parse state
    let stateData
    try {
      stateData = JSON.parse(state!)
    } catch (e) {
      redirect(`/dashboard/labs/${labId}?error=oauth_invalid_state`)
    }

    const { userId, timestamp } = stateData

    // Check if state is too old (15 minutes)
    if (Date.now() - timestamp > 15 * 60 * 1000) {
      redirect(`/dashboard/labs/${labId}?error=oauth_expired`)
    }

    const supabase = await createClient()

    // Verify user is still authenticated and has permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      redirect(`/dashboard/labs/${labId}?error=oauth_unauthorized`)
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/labs/${labId}/calendar-integration/callback`
    )

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code!)
    
    if (!tokens.access_token) {
      redirect(`/dashboard/labs/${labId}?error=oauth_no_token`)
    }

    // Set credentials and get user info
    oauth2Client.setCredentials(tokens)
    
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()

    // Get user's calendars to find primary calendar
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    const { data: calendarList } = await calendar.calendarList.list()
    
    const primaryCalendar = calendarList.items?.find(cal => cal.primary) || calendarList.items?.[0]
    
    if (!primaryCalendar) {
      redirect(`/dashboard/labs/${labId}?error=no_calendar_found`)
    }

    // Delete any existing calendar integration for this lab
    await supabase
      .from('calendar_integrations')
      .delete()
      .eq('lab_id', labId)

    // Store the integration (tokens should be encrypted in production)
    const { error: insertError } = await supabase
      .from('calendar_integrations')
      .insert({
        lab_id: labId,
        user_id: userId,
        provider: 'google',
        name: `${userInfo.email}'s Google Calendar`,
        external_calendar_id: primaryCalendar.id!,
        access_token_encrypted: tokens.access_token, // TODO: Encrypt this in production
        refresh_token_encrypted: tokens.refresh_token || null, // TODO: Encrypt this in production
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        sync_settings: {
          sync_events: true,
          sync_deadlines: true,
          auto_sync_interval: '15m',
          calendar_name: primaryCalendar.summary
        },
        is_primary: true,
        sync_enabled: true,
        status: 'connected'
      })

    if (insertError) {
      console.error('Integration storage error:', insertError)
      redirect(`/dashboard/labs/${labId}?error=storage_failed`)
    }

    // Success - redirect back to lab settings
    redirect(`/dashboard/labs/${labId}?success=calendar_connected`)

  } catch (error: any) {
    console.error('OAuth callback error:', error)
    const { labId } = await params
    redirect(`/dashboard/labs/${labId}?error=oauth_failed`)
  }
}