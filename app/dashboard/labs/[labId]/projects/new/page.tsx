import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import CreateProjectForm from './create-project-form'

// Force dynamic rendering for auth-dependent page
export const dynamic = 'force-dynamic'

export default async function NewProjectPage({ params }: { params: Promise<{ labId: string }> }) {
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

    // Verify user has access to this lab and can create projects
    const { data: membership, error: memberError } = await supabase
      .from('lab_members')
      .select('id, role, can_create_projects')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership || !membership.can_create_projects) {
      redirect(`/dashboard/labs/${labId}/projects`)
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

    // Get lab's buckets for project organization
    const { data: buckets, error: bucketsError } = await supabase
      .from('buckets')
      .select('id, name, color')
      .eq('lab_id', labId)
      .is('deleted_at', null)
      .order('position', { ascending: true })

    if (bucketsError || !buckets || buckets.length === 0) {
      // If no buckets exist, redirect to buckets page
      redirect(`/dashboard/labs/${labId}/buckets`)
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
        <DashboardHeader 
          user={{
            email: user.email,
            name: profile?.full_name || user.email?.split('@')[0]
          }} 
        />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CreateProjectForm 
            lab={lab}
            buckets={buckets}
            userId={user.id}
          />
        </main>
      </div>
    )

  } catch (error) {
    console.error('New project page error:', error)
    redirect('/dashboard')
  }
}