import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { LabSelectionCards } from '@/components/dashboard/lab-selection-cards'

// Force dynamic rendering for auth-dependent page
export const dynamic = 'force-dynamic'

// Lab Selection Dashboard - Main hub for selecting labs
export default async function DashboardPage() {
  try {
    const supabase = await createClient()

    // Check auth - redirect to signin if not authenticated
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      console.log('❌ [Dashboard] No auth user, redirecting to signin')
      redirect('/auth/signin')
    }

    const user = data.user
    console.log('✅ [Dashboard] Authenticated user, loading lab selection:', user.email)

    // Ensure user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, last_selected_lab_id')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      // Create profile if it doesn't exist
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
          is_active: true
        })
      console.log('✅ [Dashboard] Created user profile')
    }

    // Get user's lab memberships with stats
    const { data: userLabs, error: labError } = await supabase
      .from('lab_members')
      .select(`
        id,
        role,
        labs!inner (
          id,
          name,
          description,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

    let labsWithStats = []
    
    if (userLabs && userLabs.length > 0) {
      // Get stats for each lab
      labsWithStats = await Promise.all(
        userLabs.map(async (membership: any) => {
          const lab = membership.labs

          // Get member count
          const { count: memberCount } = await supabase
            .from('lab_members')
            .select('*', { count: 'exact', head: true })
            .eq('lab_id', lab.id)
            .eq('is_active', true)

          // Get bucket count
          const { data: buckets } = await supabase
            .from('buckets')
            .select('id')
            .eq('lab_id', lab.id)
          
          // Get study count through projects
          let studyCount = 0
          if (buckets && buckets.length > 0) {
            const bucketIds = buckets.map(b => b.id)
            const { count } = await supabase
              .from('projects')
              .select('*', { count: 'exact', head: true })
              .in('bucket_id', bucketIds)
            studyCount = count || 0
          }

          return {
            ...lab,
            role: membership.role,
            memberCount: memberCount || 0,
            studyCount: studyCount || 0,
            bucketCount: buckets?.length || 0,
          }
        })
      )
    }

    console.log(`✅ [Dashboard] Loaded ${labsWithStats.length} labs for selection`)

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">LS</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Lab Sync</h1>
                <p className="text-muted-foreground">Choose your workspace</p>
              </div>
            </div>
          </div>

          {/* Lab Selection Cards */}
          <LabSelectionCards labs={labsWithStats} user={user} />
        </div>
      </div>
    )

  } catch (error) {
    console.error('❌ [Dashboard] Critical error:', error)
    redirect('/auth/signin')
  }
}