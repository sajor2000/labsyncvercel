import { createClient } from '@/lib/supabase/server'
import { googleCalendarService } from '@/lib/google-calendar/calendar-service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters for date range
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Fetch events from Google Calendar
    const googleEvents = await googleCalendarService.fetchGoogleCalendarEvents(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )

    // Convert Google events to LabFlow format
    const labFlowEvents = googleEvents
      .map(event => googleCalendarService.convertGoogleEventToLabFlow(event))
      .filter(event => event !== null)

    return NextResponse.json({ 
      success: true,
      events: labFlowEvents,
      count: labFlowEvents.length
    })

  } catch (error: any) {
    console.error('Google Calendar sync error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to sync Google Calendar' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Fetch the event from database
    const { data: event, error: eventError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const eventData = event as { lab_id: string; [key: string]: any }

    // Check permission to sync event
    const { data: labMember } = await supabase
      .from('lab_members')
      .select('id, can_manage_calendar')
      .eq('user_id', user.id)
      .eq('lab_id', eventData.lab_id)
      .single()

    const memberData = labMember as { id: string; can_manage_calendar: boolean } | null
    if (!memberData || !memberData.can_manage_calendar) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to sync calendar events' 
      }, { status: 403 })
    }

    // Sync event to Google Calendar
    const googleEventId = await googleCalendarService.syncEventToGoogle(eventData as any)

    if (!googleEventId) {
      return NextResponse.json({ 
        error: 'Failed to sync event to Google Calendar' 
      }, { status: 500 })
    }

    // Update event with Google Calendar ID
    const { error: updateError } = await (supabase
      .from('calendar_events') as any)
      .update({
        google_calendar_id: googleEventId,
        google_calendar_url: `https://calendar.google.com/calendar/u/0/r/eventedit/${googleEventId}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)

    if (updateError) {
      console.error('Error updating event with Google Calendar ID:', updateError)
    }

    return NextResponse.json({
      success: true,
      googleEventId,
      message: 'Event successfully synced to Google Calendar'
    })

  } catch (error: any) {
    console.error('Google Calendar sync error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to sync event to Google Calendar' 
    }, { status: 500 })
  }
}