import { createClient } from '@/utils/supabase/server'
import { googleCalendarService } from '@/lib/google-calendar/calendar-service'
import { NextRequest, NextResponse } from 'next/server'
import { BulkCalendarSyncSchema, validateBody } from '@/lib/validation/schemas'
import { rateLimit } from '@/lib/rate-limit/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    await rateLimit('api', 10)
    
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    const requestBody = await request.json()
    const { startDate, endDate, labId } = validateBody(BulkCalendarSyncSchema)(requestBody)

    // Check permission to sync calendar
    const { data: labMember } = await supabase
      .from('lab_members')
      .select('id, can_schedule_meetings, is_admin')
      .eq('user_id', user.id)
      .eq('lab_id', labId)
      .eq('is_active', true)
      .single() as { data: { id: string; can_schedule_meetings: boolean; is_admin: boolean } | null }

    if (!labMember || (!labMember.can_schedule_meetings && !labMember.is_admin)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to manage calendar' 
      }, { status: 403 })
    }

    // Fetch Google Calendar events
    const googleEvents = await googleCalendarService.fetchGoogleCalendarEvents(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )

    // Convert and prepare events for batch insert
    const eventsToInsert = []
    const existingGoogleIds = new Set<string>()

    // Get existing Google Calendar IDs to avoid duplicates
    const { data: existingEvents } = await supabase
      .from('calendar_events')
      .select('external_calendar_id')
      .eq('lab_id', labId)
      .not('external_calendar_id', 'is', null)

    if (existingEvents) {
      const events = existingEvents as { external_calendar_id: string | null }[]
      events.forEach(event => {
        if (event.external_calendar_id) {
          existingGoogleIds.add(event.external_calendar_id)
        }
      })
    }

    // Process Google events
    for (const googleEvent of googleEvents) {
      const labFlowEvent = googleCalendarService.convertGoogleEventToLabFlow(googleEvent)
      
      if (labFlowEvent && !existingGoogleIds.has(googleEvent.id)) {
        eventsToInsert.push({
          title: labFlowEvent.title!,
          description: labFlowEvent.description,
          event_type: labFlowEvent.event_type || 'OTHER',
          start_date: labFlowEvent.start_date!,
          end_date: labFlowEvent.end_date!,
          all_day: labFlowEvent.all_day,
          location: labFlowEvent.location,
          lab_id: labId,
          created_by: user.id,
          external_calendar_id: googleEvent.id,
          external_event_id: googleEvent.htmlLink || googleEvent.id,
          external_provider: 'google',
          metadata: labFlowEvent.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    }

    // Batch insert new events
    let insertedCount = 0
    if (eventsToInsert.length > 0) {
      const { data: insertedEvents, error: insertError } = await (supabase
        .from('calendar_events') as any)
        .insert(eventsToInsert)
        .select()

      if (insertError) {
        console.error('Error inserting Google Calendar events:', insertError)
        return NextResponse.json({ 
          error: 'Failed to import some events' 
        }, { status: 500 })
      }

      insertedCount = insertedEvents?.length || 0
    }

    // Now sync LabFlow events to Google Calendar
    const { data: labFlowEvents } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('lab_id', labId)
      .is('google_calendar_id', null)
      .gte('start_date', startDate || new Date().toISOString())
      .lte('start_date', endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())

    let syncedToGoogle = 0
    if (labFlowEvents) {
      const events = labFlowEvents as any[]
      for (const event of events) {
        const googleEventId = await googleCalendarService.syncEventToGoogle(event)
        
        if (googleEventId) {
          await (supabase
            .from('calendar_events') as any)
            .update({
              google_calendar_id: googleEventId,
              google_calendar_url: `https://calendar.google.com/calendar/u/0/r/eventedit/${googleEventId}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', event.id)
          
          syncedToGoogle++
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported: insertedCount,
      syncedToGoogle,
      skipped: googleEvents.length - insertedCount,
      message: `Imported ${insertedCount} events from Google, synced ${syncedToGoogle} events to Google`
    })

  } catch (error: any) {
    console.error('Bulk calendar sync error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to perform bulk calendar sync' 
    }, { status: 500 })
  }
}