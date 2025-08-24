import { createClient } from '@/utils/supabase/server'
import { googleCalendarService } from '@/lib/google-calendar/calendar-service'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'

// Google Calendar webhook endpoint for receiving push notifications
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify webhook signature (if configured)
    const headersList = await headers()
    const channelId = headersList.get('X-Goog-Channel-ID')
    const resourceId = headersList.get('X-Goog-Resource-ID')
    const resourceState = headersList.get('X-Goog-Resource-State')
    const messageNumber = headersList.get('X-Goog-Message-Number')
    
    console.log('Google Calendar webhook received:', {
      channelId,
      resourceId,
      resourceState,
      messageNumber
    })

    // Resource states: sync, exists, not_exists
    if (resourceState === 'sync') {
      // Initial sync notification - acknowledge it
      return NextResponse.json({ success: true, message: 'Sync acknowledged' })
    }

    if (resourceState === 'not_exists') {
      // Resource deleted
      console.log('Calendar resource deleted:', resourceId)
      return NextResponse.json({ success: true })
    }

    // Fetch recent changes from Google Calendar
    const startDate = new Date()
    startDate.setHours(startDate.getHours() - 1) // Check last hour
    
    const googleEvents = await googleCalendarService.fetchGoogleCalendarEvents(
      startDate,
      undefined,
      `webhook-${messageNumber}`
    )

    // Process each Google event
    for (const googleEvent of googleEvents) {
      try {
        // Check if this event already exists in our database
        const { data: existingEvent } = await supabase
          .from('calendar_events')
          .select('id, updated_at')
          .eq('google_calendar_id', googleEvent.id)
          .single() as { data: { id: string; updated_at: string } | null }

        const labFlowEvent = googleCalendarService.convertGoogleEventToLabFlow(googleEvent)
        if (!labFlowEvent) continue

        if (existingEvent) {
          // Update existing event if Google version is newer
          const googleUpdated = new Date(googleEvent.updated)
          const localUpdated = new Date(existingEvent.updated_at)
          
          if (googleUpdated > localUpdated) {
            const { error } = await supabase
              .from('calendar_events')
              .update({
                title: labFlowEvent.title!,
                description: labFlowEvent.description,
                event_type: labFlowEvent.event_type || 'OTHER',
                start_date: labFlowEvent.start_date!,
                end_date: labFlowEvent.end_date!,
                location: labFlowEvent.location,
                all_day: labFlowEvent.all_day,
                metadata: {
                  ...(typeof labFlowEvent.metadata === 'object' && labFlowEvent.metadata !== null ? labFlowEvent.metadata : {}),
                  lastSyncedFromGoogle: new Date().toISOString()
                },
                updated_at: new Date().toISOString()
              })
              .eq('id', existingEvent.id)

            if (error) {
              console.error('Error updating event from Google:', error)
            } else {
              console.log('Updated event from Google:', googleEvent.summary)
            }
          }
        } else {
          // Create new event if it doesn't exist
          // Try to determine lab_id from event description or default
          const labIdMatch = googleEvent.description?.match(/lab_id:([a-f0-9-]+)/i)
          const labId = labIdMatch?.[1] || null

          if (labId) {
            const { error } = await supabase
              .from('calendar_events')
              .insert({
                title: labFlowEvent.title!,
                description: labFlowEvent.description,
                event_type: labFlowEvent.event_type || 'OTHER',
                start_date: labFlowEvent.start_date!,
                end_date: labFlowEvent.end_date!,
                all_day: labFlowEvent.all_day,
                location: labFlowEvent.location,
                lab_id: labId,
                created_by: null,
                external_calendar_id: googleEvent.id,
                external_event_id: googleEvent.htmlLink || googleEvent.id,
                external_provider: 'google',
                organizer_id: null,
                metadata: {
                  ...(typeof labFlowEvent.metadata === 'object' && labFlowEvent.metadata !== null ? labFlowEvent.metadata : {}),
                  createdFromGoogle: true,
                  syncedAt: new Date().toISOString()
                }
              })

            if (error) {
              console.error('Error creating event from Google:', error)
            } else {
              console.log('Created new event from Google:', googleEvent.summary)
            }
          }
        }
      } catch (error) {
        console.error('Error processing Google event:', error)
      }
    }

    return NextResponse.json({ 
      success: true,
      eventsProcessed: googleEvents.length 
    })

  } catch (error: any) {
    console.error('Google Calendar webhook error:', error)
    return NextResponse.json({ 
      error: error.message || 'Webhook processing failed' 
    }, { status: 500 })
  }
}

// Endpoint to set up Google Calendar watch/push notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has calendar management permission
    const { data: labMember } = await supabase
      .from('lab_members')
      .select('can_schedule_meetings, is_admin, can_manage_calendar')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!labMember?.is_admin && !labMember?.can_schedule_meetings && !labMember?.can_manage_calendar) {
      return NextResponse.json({ 
        error: 'Admin or calendar management access required to set up calendar sync' 
      }, { status: 403 })
    }

    // Note: Setting up push notifications requires OAuth2 authentication
    // and a verified domain with HTTPS endpoint
    
    // For now, we'll use polling instead of push notifications
    // This endpoint can be called periodically to sync changes
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7) // Sync last 7 days
    
    const googleEvents = await googleCalendarService.fetchGoogleCalendarEvents(
      startDate,
      undefined,
      'manual-sync'
    )

    let created = 0
    let updated = 0
    let skipped = 0

    for (const googleEvent of googleEvents) {
      try {
        const labFlowEvent = googleCalendarService.convertGoogleEventToLabFlow(googleEvent)
        if (!labFlowEvent) {
          skipped++
          continue
        }

        // Check if event exists
        const { data: existing } = await supabase
          .from('calendar_events')
          .select('id')
          .eq('google_calendar_id', googleEvent.id)
          .single()

        if (existing) {
          updated++
        } else {
          created++
        }
      } catch (error) {
        console.error('Error processing event:', error)
        skipped++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Manual sync completed',
      stats: {
        total: googleEvents.length,
        created,
        updated,
        skipped
      }
    })

  } catch (error: any) {
    console.error('Calendar sync setup error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to set up calendar sync' 
    }, { status: 500 })
  }
}