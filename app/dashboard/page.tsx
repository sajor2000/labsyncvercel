import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import DashboardClient from '@/components/dashboard/dashboard-client'

// MCP Pattern: Server Component with Auth Check
export default async function DashboardPage() {
  const supabase = await createClient()

  // MCP Standard: Check auth on server side
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/auth/signin')
  }

  const user = data.user

  // Check if user profile exists, create if needed
  try {
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      // Create user profile
      await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email!,
          first_name: user.user_metadata?.first_name || null,
          last_name: user.user_metadata?.last_name || null,
          full_name: user.user_metadata?.full_name || 
                    (user.user_metadata?.first_name && user.user_metadata?.last_name
                      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                      : null),
          avatar_url: user.user_metadata?.avatar_url || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('Profile creation error:', error)
    // Don't block dashboard load
  }

  // Get user's lab memberships
  const { data: userLabs, error: labError } = await supabase
    .from('lab_members')
    .select(`
      id,
      role,
      labs!inner (
        id,
        name,
        description
      )
    `)
    .eq('user_id', user.id)

  // Handle lab membership gracefully
  let selectedLab: any = null
  let labData: any[] = []

  if (!labError && userLabs && userLabs.length > 0) {
    labData = userLabs.map(membership => ({
      ...membership,
      lab: Array.isArray(membership.labs) ? membership.labs[0] : membership.labs
    }))
    selectedLab = labData[0]?.lab || null
  }

  // If no lab membership, show welcome/onboarding
  if (!selectedLab) {
    return <DashboardClient user={user} labs={[]} selectedLab={null} showWelcome={true} />
  }

  // Fetch lab-specific data
  const labId = selectedLab.id
  
  try {
    // Parallel data fetching for dashboard
    const [
      { count: studyCount },
      { count: bucketCount },
      { count: taskCount },
      { data: recentStudies }
    ] = await Promise.all([
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('bucket_id', labId),
      supabase
        .from('buckets')
        .select('*', { count: 'exact', head: true })
        .eq('lab_id', labId),
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', labId),
      supabase
        .from('projects')
        .select('id, name, status, created_at')
        .eq('bucket_id', labId)
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    const dashboardData = {
      selectedLab,
      labCount: 1,
      studyCount: studyCount || 0,
      bucketCount: bucketCount || 0,
      taskStats: {
        total: taskCount || 0,
        completed: 0,
        inProgress: 0,
        urgent: 0
      },
      studies: recentStudies || [],
      completionPercentage: 0,
      recentMeetings: [],
      upcomingDeadlines: [],
      recentTasks: []
    }

    return <DashboardClient user={user} labs={labData} selectedLab={selectedLab} dashboardData={dashboardData} />

  } catch (error) {
    console.error('Dashboard data fetch error:', error)
    // Fallback to welcome screen
    return <DashboardClient user={user} labs={labData} selectedLab={selectedLab} showWelcome={false} />
  }
}