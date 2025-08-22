import { createClient } from '@/lib/supabase/server'
import { googleCalendarService } from '@/lib/google-calendar/calendar-service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { startDate, endDate, labId } = await request.json()

    if (!labId) {
      return NextResponse.json({ error: 'Lab ID is required' }, { status: 400 })
    }

    // Check permission to sync calendar
    const { data: labMember } = await supabase
      .from('lab_members')
      .select('id, can_manage_calendar')
      .eq('user_id', user.id)
      .eq('lab_id', labId)
      .single()

    const memberData = labMember as { id: string; can_manage_calendar: boolean } | null
    if (!memberData || !memberData.can_manage_calendar) {
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
      .select('google_calendar_id')
      .eq('lab_id', labId)
      .not('google_calendar_id', 'is', null)

    if (existingEvents) {
      const events = existingEvents as { google_calendar_id: string | null }[]
      events.forEach(event => {
        if (event.google_calendar_id) {
          existingGoogleIds.add(event.google_calendar_id)
        }
      })
    }

    // Process Google events
    for (const googleEvent of googleEvents) {
      const labFlowEvent = googleCalendarService.convertGoogleEventToLabFlow(googleEvent)
      
      if (labFlowEvent && !existingGoogleIds.has(googleEvent.id)) {
        eventsToInsert.push({
          ...labFlowEvent,
          lab_id: labId,
          created_by: user.id,
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