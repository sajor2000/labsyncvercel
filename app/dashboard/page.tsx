import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { LabSelectionCards } from '@/components/dashboard/lab-selection-cards'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

// Force dynamic rendering for auth-dependent page
export const dynamic = 'force-dynamic'

// Lab Selection Dashboard - Main hub for selecting labs
export default async function DashboardPage() {
  try {
    const supabase = await createClient()

    // Check auth - redirect to signin if not authenticated
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      redirect('/auth/signin')
    }

    const user = data.user

    // Ensure user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      // Create profile if it doesn't exist
      await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || 
                    (user.user_metadata?.first_name && user.user_metadata?.last_name
                      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                      : null),
          avatar_url: user.user_metadata?.avatar_url || null
        })
    }

    // Get user's lab memberships with stats
    const { data: userLabs } = await supabase
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

    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
        <DashboardHeader 
          user={{
            email: user.email,
            name: profile?.full_name || user.email?.split('@')[0]
          }} 
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LabSelectionCards labs={labsWithStats} user={user} />
        </main>
      </div>
    )

  } catch (error) {
    console.error('Dashboard error:', error)
    redirect('/auth/signin')
  }
}