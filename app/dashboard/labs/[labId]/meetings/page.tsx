import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MeetingsPageClient from './meetings-client'

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

    // Verify user has access to this lab
    const { data: membership, error: memberError } = await supabase
      .from('lab_members')
      .select('id, role, can_schedule_meetings, can_manage_standups')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError || !membership) {
      redirect('/dashboard/labs')
    }

    // Get lab details
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .select('id, name, description')
      .eq('id', labId)
      .single()

    if (labError || !lab) {
      redirect('/dashboard/labs')
    }

    // Get lab's meetings (using the meetings table if it exists)
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select(`
        id,
        title,
        description,
        meeting_type,
        start_datetime,
        end_datetime,
        location,
        transcript,
        summary,
        action_items_extracted,
        attendee_count,
        recording_url,
        is_recurring,
        recurrence_pattern,
        status,
        created_at,
        updated_at
      `)
      .eq('lab_id', labId)
      .order('start_datetime', { ascending: false })
      .limit(20)

    // Get standup meetings (AI-processed meetings)
    const { data: standupMeetings, error: standupError } = await supabase
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

    // Get action items from AI-processed meetings
    const { data: actionItems, error: actionItemsError } = await supabase
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

    // Get lab members for meeting attendees
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

    if (meetingsError) console.error('Error fetching meetings:', meetingsError)
    if (standupError) console.error('Error fetching standup meetings:', standupError)
    if (actionItemsError) console.error('Error fetching action items:', actionItemsError)
    if (membersError) console.error('Error fetching members:', membersError)

    // Transform lab members to handle Supabase join structure
    const transformedMembers = (labMembers || []).map(member => ({
      ...member,
      user_profiles: Array.isArray(member.user_profiles) 
        ? member.user_profiles[0] 
        : member.user_profiles
    }))

    return (
      <MeetingsPageClient 
        lab={lab}
        initialMeetings={meetings || []}
        standupMeetings={standupMeetings || []}
        actionItems={actionItems || []}
        labMembers={transformedMembers}
        userPermissions={{
          canSchedule: membership.can_schedule_meetings || false,
          canManage: membership.can_manage_standups || false
        }}
      />
    )

  } catch (error) {
    console.error('Lab meetings page error:', error)
    redirect('/dashboard/labs')
  }
}