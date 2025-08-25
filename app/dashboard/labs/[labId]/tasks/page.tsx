import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TasksPageClient from './tasks-client'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

// Force dynamic rendering for auth-dependent page
export const dynamic = 'force-dynamic'

export default async function LabTasksPage({ params }: { params: Promise<{ labId: string }> }) {
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

    // Verify user has access to this lab
    const { data: membership, error: memberError } = await supabase
      .from('lab_members')
      .select('id, role, can_create_tasks, can_edit_all_tasks, can_delete_tasks')
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

    // Get lab members for task assignment
    const { data: labMembers, error: membersError } = await supabase
      .from('lab_members')
      .select(`
        user_id,
        role,
        user_profiles (
          id,
          email,
          full_name
        )
      `)
      .eq('lab_id', labId)

    if (membersError) {
      console.error('Error fetching lab members:', membersError)
    }

    // Get lab's projects and buckets for context
    const { data: buckets } = await supabase
      .from('buckets')
      .select('id, name, color')
      .eq('lab_id', labId)
      .order('position', { ascending: true })

    let projects: any[] = []
    let tasks: any[] = []
    
    if (buckets && buckets.length > 0) {
      const bucketIds = buckets.map(b => b.id)
      
      // Get projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, title, bucket_id')
        .in('bucket_id', bucketIds)
        .order('title', { ascending: true })

      projects = projectsData || []

      // Get tasks through projects
      if (projects.length > 0) {
        const projectIds = projects.map(p => p.id)
        
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            id,
            project_id,
            title,
            description,
            status,
            priority,
            assigned_to,
            due_date,
            created_at,
            updated_at
          `)
          .in('project_id', projectIds)
          .order('created_at', { ascending: false })

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError)
        } else {
          tasks = tasksData || []
        }
      }
    }

    // Transform lab members to handle Supabase join structure
    const transformedMembers = (labMembers || []).map(member => ({
      ...member,
      user_profiles: Array.isArray(member.user_profiles) 
        ? member.user_profiles[0] 
        : member.user_profiles
    }))

    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
        <DashboardHeader 
          user={{
            email: user.email,
            name: profile?.full_name || user.email?.split('@')[0]
          }} 
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TasksPageClient 
            lab={lab}
            buckets={buckets || []}
            projects={projects}
            initialTasks={tasks}
            labMembers={transformedMembers as any}
            userPermissions={{
              canCreate: membership.can_create_tasks || false,
              canAssign: membership.can_create_tasks || false, // Use create permission for assign
              canEdit: membership.can_edit_all_tasks || false,
              canDelete: membership.can_delete_tasks || false,
              canView: true // All lab members can view tasks
            }}
          />
        </main>
      </div>
    )

  } catch (error) {
    console.error('Lab tasks page error:', error)
    redirect('/dashboard')
  }
}