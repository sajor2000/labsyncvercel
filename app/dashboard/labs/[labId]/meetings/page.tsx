import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MeetingsPageClient from './meetings-client'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

// Force dynamic rendering for auth-dependent page
export const dynamic = 'force-dynamic'

export default async function LabMeetingsPage({ params }: { params: Promise<{ labId: string }> }) {
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

    // Get lab's meetings from calendar_events
    const { data: calendarEvents, error: meetingsError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('lab_id', labId)
      .or('summary.ilike.%meeting%,summary.ilike.%standup%')
      .order('start_time', { ascending: false })
      .limit(20)
    
    // Transform calendar events to meeting format
    const meetings = calendarEvents?.map(event => ({
      id: event.id,
      title: event.summary,
      description: event.description,
      meeting_type: 'scheduled' as const,
      meeting_date: event.start_time,
      start_datetime: event.start_time,
      end_datetime: event.end_time,
      location: event.location,
      attendees: event.attendees || [],
      all_day: event.all_day,
      google_event_id: event.google_event_id,
      google_meet_link: event.google_meet_link,
      transcript: null,
      ai_summary: null,
      duration_minutes: null,
      action_items_count: 0,
      created_at: event.created_at,
      updated_at: event.updated_at
    })) || []

    // Get standup meetings (AI-processed meetings) - table may not exist
    let standupMeetings: any[] = []
    try {
      const { data, error } = await supabase
        .from('standup_meetings')
        .select(`
          id,
          title,
          description,
          meeting_date,
          transcript,
          ai_summary,
          attendees,
          duration_minutes,
          recording_url,
          action_items_count,
          created_at,
          updated_at
        `)
        .eq('lab_id', labId)
        .order('meeting_date', { ascending: false })
        .limit(10)
      
      if (!error) standupMeetings = data || []
    } catch (e) {
      console.log('Standup meetings table not available')
    }

    // Get action items from AI-processed meetings - table may not exist
    let actionItems: any[] = []
    try {
      const { data, error } = await supabase
        .from('standup_action_items')
        .select(`
          id,
          meeting_id,
          description,
          assignee_email,
          priority,
          due_date,
          status,
          created_at
        `)
        .eq('lab_id', labId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
      
      if (!error) actionItems = data || []
    } catch (e) {
      console.log('Standup action items table not available')
    }

    // Get lab members for meeting attendees
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

    if (meetingsError) console.error('Error fetching meetings:', meetingsError)
    if (membersError) console.error('Error fetching members:', membersError)

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
          <MeetingsPageClient 
            lab={lab}
            initialMeetings={(meetings || []) as any}
            standupMeetings={standupMeetings}
            actionItems={actionItems}
            labMembers={transformedMembers as any}
            userPermissions={{
              canSchedule: membership.can_create_tasks || false,
              canManage: membership.can_edit_all_tasks || false
            }}
          />
        </main>
      </div>
    )

  } catch (error) {
    console.error('Lab meetings page error:', error)
    redirect('/dashboard')
  }
}