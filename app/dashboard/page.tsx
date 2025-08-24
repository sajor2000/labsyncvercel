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

  // Get or create user profile with lab selection
  let userProfile: any = null
  try {
    console.log('🔍 Checking user profile for:', user.email)
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, last_selected_lab_id')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      console.log('📝 Creating new user profile...')
      const { data: newProfile, error: insertError } = await supabase
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
        .select('id, email, last_selected_lab_id')
        .single()
      
      if (insertError) {
        console.error('❌ Profile creation error:', insertError)
        userProfile = null
      } else {
        console.log('✅ User profile created successfully')
        userProfile = newProfile
      }
    } else if (profileError) {
      console.error('❌ Profile fetch error:', profileError)
      userProfile = null
    } else {
      console.log('✅ User profile found')
      userProfile = existingProfile
    }
  } catch (error) {
    console.error('❌ Profile management error:', error)
    userProfile = null
  }

  // Get user's lab memberships with improved error handling
  console.log('🏢 Fetching user lab memberships...')
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

  if (labError) {
    console.error('❌ Lab membership fetch error:', labError)
    // Continue with empty lab data - user might not be in any labs yet
  } else if (userLabs && userLabs.length > 0) {
    console.log('✅ Found lab memberships:', userLabs.length)
    labData = userLabs.map(membership => ({
      ...membership,
      lab: Array.isArray(membership.labs) ? membership.labs[0] : membership.labs
    }))
    
    // Use user's preferred lab from profile, or fallback to first lab
    const preferredLabId = userProfile?.last_selected_lab_id
    if (preferredLabId) {
      const preferredLab = labData.find(l => l.lab?.id === preferredLabId)
      selectedLab = preferredLab?.lab || labData[0]?.lab || null
      console.log('✅ Selected preferred lab:', selectedLab?.name)
    } else {
      selectedLab = labData[0]?.lab || null
      console.log('✅ Selected default lab (first):', selectedLab?.name)
    }
  } else {
    console.log('ℹ️ User has no lab memberships yet')
  }

  // If no lab membership, show welcome/onboarding
  if (!selectedLab) {
    return <DashboardClient user={user} labs={[]} selectedLab={null} showWelcome={true} />
  }

  // Fetch lab-specific data with simplified, sequential queries
  const labId = selectedLab.id
  
  try {
    console.log('📊 Fetching dashboard data for lab:', labId)
    
    // Step 1: Get buckets for this lab
    const { data: buckets, count: bucketCount, error: bucketError } = await supabase
      .from('buckets')
      .select('*', { count: 'exact' })
      .eq('lab_id', labId)

    if (bucketError) {
      console.error('❌ Bucket fetch error:', bucketError)
      throw bucketError
    }
    
    console.log('✅ Found buckets:', buckets?.length || 0)
    
    // Step 2: Get projects count (only if we have buckets)
    let projectCount = 0
    let recentProjects: any[] = []
    
    if (buckets && buckets.length > 0) {
      const bucketIds = buckets.map(b => b.id)
      
      const { count, error: projectError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .in('bucket_id', bucketIds)
      
      if (projectError) {
        console.warn('⚠️ Project count error:', projectError)
      } else {
        projectCount = count || 0
      }
      
      // Get recent projects
      const { data: projects, error: recentProjectError } = await supabase
        .from('projects')
        .select('id, name, status, created_at')
        .in('bucket_id', bucketIds)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (recentProjectError) {
        console.warn('⚠️ Recent projects error:', recentProjectError)
      } else {
        recentProjects = projects || []
      }
    }
    
    console.log('✅ Found projects:', projectCount)

    const dashboardData = {
      selectedLab,
      labCount: 1,
      studyCount: projectCount, // Using projectCount but calling it studyCount for UI consistency
      bucketCount: bucketCount || 0,
      taskStats: {
        total: 0,
        completed: 0,
        inProgress: 0,
        urgent: 0
      },
      studies: recentProjects, // Using projects but calling them studies for UI consistency
      completionPercentage: 0,
      recentMeetings: [],
      upcomingDeadlines: [],
      recentTasks: []
    }

    console.log('✅ Dashboard data prepared:', dashboardData)
    return <DashboardClient user={user} labs={labData} selectedLab={selectedLab} dashboardData={dashboardData} />

  } catch (error) {
    console.error('❌ Dashboard data fetch error:', error)
    // Return basic dashboard without data
    const fallbackData = {
      selectedLab,
      labCount: 1,
      studyCount: 0,
      bucketCount: 0,
      taskStats: { total: 0, completed: 0, inProgress: 0, urgent: 0 },
      studies: [],
      completionPercentage: 0,
      recentMeetings: [],
      upcomingDeadlines: [],
      recentTasks: []
    }
    return <DashboardClient user={user} labs={labData} selectedLab={selectedLab} dashboardData={fallbackData} />
  }
}