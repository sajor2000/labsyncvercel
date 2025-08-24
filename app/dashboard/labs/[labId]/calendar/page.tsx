import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CalendarPageClient from './calendar-client'

// Force dynamic rendering for auth-dependent page
export const dynamic = 'force-dynamic'

export default async function LabCalendarPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = await params
  
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      redirect('/auth/signin')
    }

    // Verify user has access to this lab
    const { data: membership, error: memberError } = await supabase
      .from('lab_members')
      .select('id, role, can_schedule_meetings, can_manage_calendar')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError || !membership) {
      redirect('/dashboard')
    }

    // Get lab details
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .select('id, name, description')
      .eq('id', labId)
      .single()

    if (labError || !lab) {
      redirect('/dashboard')
    }

    // Get calendar integration status
    const { data: calendarIntegration, error: integrationError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('lab_id', labId)
      .eq('is_primary', true)
      .single()

    // Get lab's calendar events
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select(`
        id,
        title,
        description,
        event_type,
        start_datetime,
        end_datetime,
        location,
        attendees,
        is_all_day,
        recurrence_rule,
        external_event_id,
        sync_status,
        created_at,
        updated_at
      `)
      .eq('lab_id', labId)
      .gte('end_datetime', new Date().toISOString()) // Only future events
      .order('start_datetime', { ascending: true })
      .limit(50)

    if (eventsError) {
      console.error('Error fetching calendar events:', eventsError)
    }

    // Get lab members for event attendees
    const { data: labMembers, error: membersError } = await supabase
      .from('lab_members')
      .select(`
        user_id,
        role,
        user_profiles (
          id,
          email,
          full_name,
          first_name,
          last_name
        )
      `)
      .eq('lab_id', labId)
      .eq('is_active', true)

    if (membersError) {
      console.error('Error fetching lab members:', membersError)
    }

    // Transform lab members to handle Supabase join structure
    const transformedMembers = (labMembers || []).map(member => ({
      ...member,
      user_profiles: Array.isArray(member.user_profiles) 
        ? member.user_profiles[0] 
        : member.user_profiles
    }))

    return (
      <CalendarPageClient 
        lab={lab}
        calendarIntegration={calendarIntegration}
        initialEvents={events || []}
        labMembers={transformedMembers}
        userPermissions={{
          canSchedule: membership.can_schedule_meetings || false,
          canManage: membership.can_manage_calendar || false
        }}
      />
    )

  } catch (error) {
    console.error('Lab calendar page error:', error)
    redirect('/dashboard')
  }
}