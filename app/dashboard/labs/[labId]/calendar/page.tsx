import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CalendarPageClient from './calendar-client'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

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

    // Get user profile for header
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Verify user has access to this lab
    const { data: membership, error: memberError } = await supabase
      .from('lab_members')
      .select('id, role, can_create_tasks, can_edit_all_tasks')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
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

    // Get calendar integration status (simplified - may not exist)
    const { data: calendarIntegration } = await supabase
      .from('google_calendar_integrations')
      .select('*')
      .eq('lab_id', labId)
      .single()

    // Get lab's calendar events
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select(`
        id,
        summary,
        description,
        start_time,
        end_time,
        location,
        attendees,
        all_day,
        google_event_id,
        google_meet_link,
        created_at,
        updated_at
      `)
      .eq('lab_id', labId)
      .gte('end_time', new Date().toISOString()) // Only future events
      .order('start_time', { ascending: true })
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
          full_name
        )
      `)
      .eq('lab_id', labId)

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
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
        <DashboardHeader 
          user={{
            email: user.email,
            name: profile?.full_name || user.email?.split('@')[0]
          }} 
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CalendarPageClient 
            lab={lab}
            calendarIntegration={calendarIntegration}
            initialEvents={events || []}
            labMembers={transformedMembers}
            userPermissions={{
              canSchedule: membership.can_create_tasks || false,
              canManage: membership.can_edit_all_tasks || false
            }}
          />
        </main>
      </div>
    )

  } catch (error) {
    console.error('Lab calendar page error:', error)
    redirect('/dashboard')
  }
}