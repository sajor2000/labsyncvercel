import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import DashboardClient from '@/components/dashboard/dashboard-client'

// Force dynamic rendering for auth-dependent page
export const dynamic = 'force-dynamic'

// MCP Pattern: Server Component with Auth Check
export default async function DashboardPage() {
  try {
    const supabase = await createClient()

    // Check auth and redirect to user's preferred lab workspace
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      console.log('❌ [Dashboard] No auth user, redirecting to signin')
      redirect('/auth/signin')
    }

    const user = data.user
    console.log('✅ [Dashboard] Authenticated user, checking lab preferences:', user.email)

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
      .eq('is_active', true)

    if (labError || !userLabs || userLabs.length === 0) {
      console.log('ℹ️ [Dashboard] No lab memberships, showing welcome screen')
      // No labs - show welcome screen for lab creation
      return <DashboardClient user={user} labs={[]} selectedLab={null} showWelcome={true} />
    }

    // User has labs - redirect to preferred lab workspace
    const labData = userLabs.map(membership => ({
      ...membership,
      lab: Array.isArray(membership.labs) ? membership.labs[0] : membership.labs
    }))

    let targetLabId = profile?.last_selected_lab_id

    // Verify the preferred lab is still accessible
    if (targetLabId) {
      const hasAccess = labData.some(l => l.lab?.id === targetLabId)
      if (!hasAccess) {
        targetLabId = null
      }
    }

    // Use first available lab if no valid preference
    if (!targetLabId) {
      targetLabId = labData[0]?.lab?.id
    }

    if (targetLabId) {
      console.log('🎯 [Dashboard] Redirecting to lab workspace:', targetLabId)
      redirect(`/dashboard/labs/${targetLabId}`)
    } else {
      console.log('❌ [Dashboard] No valid lab found, showing welcome')
      return <DashboardClient user={user} labs={labData} selectedLab={null} showWelcome={true} />
    }

  } catch (error) {
    console.error('❌ [Dashboard] Critical error:', error)
    redirect('/auth/signin')
  }
}