import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProjectsPageClient from './projects-client'

// Force dynamic rendering for auth-dependent page
export const dynamic = 'force-dynamic'

export default async function LabProjectsPage({ params }: { params: Promise<{ labId: string }> }) {
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
      .select('id, role, can_create_projects, can_edit_all_projects, can_delete_projects')
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

    // Get lab's buckets for organization
    const { data: buckets, error: bucketsError } = await supabase
      .from('buckets')
      .select('id, name, color')
      .eq('lab_id', labId)
      .order('position', { ascending: true })

    if (bucketsError) {
      console.error('Error fetching buckets:', bucketsError)
    }

    // Get lab's projects through buckets
    let projects: any[] = []
    if (buckets && buckets.length > 0) {
      const bucketIds = buckets.map(b => b.id)
      
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          start_date,
          due_date,
          bucket_id,
          lab_id,
          irb_status,
          irb_number,
          manuscript_status,
          created_at,
          updated_at,
          deleted_at
        `)
        .in('bucket_id', bucketIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (projectsError) {
        console.error('Error fetching projects:', projectsError)
      } else {
        projects = projectsData || []
      }
    }

    return (
      <ProjectsPageClient 
        lab={lab}
        buckets={buckets || []}
        initialProjects={projects}
        userPermissions={{
          canCreate: membership.can_create_projects || false,
          canEdit: membership.can_edit_all_projects || false,
          canDelete: membership.can_delete_projects || false,
          canView: true // All members can view projects in their lab
        }}
      />
    )

  } catch (error) {
    console.error('Lab projects page error:', error)
    redirect('/dashboard')
  }
}