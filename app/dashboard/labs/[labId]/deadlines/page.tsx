import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DeadlinesPageClient from './deadlines-client'

// Force dynamic rendering for auth-dependent page
export const dynamic = 'force-dynamic'

export default async function LabDeadlinesPage({ params }: { params: Promise<{ labId: string }> }) {
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
      .select('id, role, can_manage_deadlines')
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

    // Get lab's deadlines
    const { data: deadlines, error: deadlinesError } = await supabase
      .from('deadlines')
      .select(`
        id,
        title,
        description,
        deadline_type,
        due_date,
        priority,
        status,
        responsible_party,
        external_url,
        completion_requirements,
        notification_days_before,
        is_recurring,
        recurrence_pattern,
        tags,
        created_by,
        created_at,
        updated_at
      `)
      .eq('lab_id', labId)
      .order('due_date', { ascending: true })

    // Get deadline reminders for context
    const { data: reminders, error: remindersError } = await supabase
      .from('deadline_reminders')
      .select(`
        id,
        deadline_id,
        reminder_date,
        reminder_type,
        sent_at,
        recipient_email
      `)
      .eq('lab_id', labId)
      .is('sent_at', null) // Only unsent reminders
      .order('reminder_date', { ascending: true })

    // Get lab members for assignment
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

    if (deadlinesError) console.error('Error fetching deadlines:', deadlinesError)
    if (remindersError) console.error('Error fetching reminders:', remindersError)
    if (membersError) console.error('Error fetching members:', membersError)

    // Transform lab members to handle Supabase join structure
    const transformedMembers = (labMembers || []).map(member => ({
      ...member,
      user_profiles: Array.isArray(member.user_profiles) 
        ? member.user_profiles[0] 
        : member.user_profiles
    }))

    return (
      <DeadlinesPageClient 
        lab={lab}
        initialDeadlines={deadlines || []}
        reminders={reminders || []}
        labMembers={transformedMembers}
        userPermissions={{
          canManage: membership.can_manage_deadlines || false
        }}
      />
    )

  } catch (error) {
    console.error('Lab deadlines page error:', error)
    redirect('/dashboard/labs')
  }
}