import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import DashboardClient from '@/components/dashboard/dashboard-client'

// Force dynamic rendering for auth-dependent page
export const dynamic = 'force-dynamic'

// MCP Pattern: Server Component with Auth Check
export default async function DashboardPage() {
  try {
    const supabase = await createClient()

    // MCP Standard: Check auth on server side
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      console.log('❌ [Dashboard] No auth user, redirecting to signin')
      redirect('/auth/signin')
    }

    const user = data.user
    console.log('✅ [Dashboard] Authenticated user:', user.email)

    // Simple user profile check (non-blocking)
    try {
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        console.log('📝 [Dashboard] Creating user profile...')
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
        console.log('✅ [Dashboard] User profile created')
      }
    } catch (profileError) {
      console.warn('⚠️ [Dashboard] Profile creation failed, continuing...', profileError)
      // Don't block dashboard - profile creation is optional
    }

    // Simple lab membership check (non-blocking)
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

    let selectedLab = null
    let labData: any[] = []

    if (!labError && userLabs && userLabs.length > 0) {
      console.log('✅ [Dashboard] Found lab memberships:', userLabs.length)
      labData = userLabs.map(membership => ({
        ...membership,
        lab: Array.isArray(membership.labs) ? membership.labs[0] : membership.labs
      }))
      selectedLab = labData[0]?.lab || null
    } else {
      console.log('ℹ️ [Dashboard] No lab memberships found')
    }

    // Always return a working dashboard (even without lab data)
    const dashboardData = {
      selectedLab,
      labCount: labData.length,
      studyCount: 0,
      bucketCount: 0,
      taskStats: { total: 0, completed: 0, inProgress: 0, urgent: 0 },
      studies: [],
      completionPercentage: 0,
      recentMeetings: [],
      upcomingDeadlines: [],
      recentTasks: []
    }

    console.log('✅ [Dashboard] Rendering dashboard for:', user.email)
    return (
      <DashboardClient 
        user={user} 
        labs={labData} 
        selectedLab={selectedLab} 
        dashboardData={dashboardData}
        showWelcome={!selectedLab}
      />
    )

  } catch (error) {
    console.error('❌ [Dashboard] Critical error:', error)
    
    // Fallback error page
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="card-slack p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-foreground mb-4">Dashboard Error</h1>
          <p className="text-muted-foreground mb-6">
            Something went wrong loading your dashboard. This might be a temporary issue.
          </p>
          <div className="space-y-3">
            <a 
              href="/dashboard" 
              className="btn-slack-primary w-full inline-block px-4 py-2 text-center"
            >
              Try Again
            </a>
            <a 
              href="/auth/signin" 
              className="btn-slack-secondary w-full inline-block px-4 py-2 text-center"
            >
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    )
  }
}