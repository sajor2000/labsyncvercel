import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import FilesPageClient from './files-client'

// Force dynamic rendering for auth-dependent page
export const dynamic = 'force-dynamic'

export default async function LabFilesPage({ params }: { params: Promise<{ labId: string }> }) {
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
      .select('id, role, can_upload_files, can_share_files, can_delete_files, can_manage_file_permissions')
      .eq('lab_id', labId)
      .eq('user_id', user.id)
      .eq('is_active', true)
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

    // Get lab's files with versions and permissions
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select(`
        id,
        name,
        description,
        file_type,
        file_size,
        mime_type,
        storage_path,
        storage_provider,
        is_public,
        download_count,
        last_accessed_at,
        uploaded_by,
        project_id,
        tags,
        metadata,
        is_deleted,
        created_at,
        updated_at
      `)
      .eq('lab_id', labId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    // Get file versions for version history
    const { data: fileVersions, error: versionsError } = await supabase
      .from('file_versions')
      .select(`
        id,
        file_id,
        version_number,
        file_size,
        storage_path,
        change_description,
        uploaded_by,
        created_at
      `)
      .eq('lab_id', labId)
      .order('created_at', { ascending: false })

    // Get file permissions for sharing info
    const { data: filePermissions, error: permissionsError } = await supabase
      .from('file_permissions')
      .select(`
        id,
        file_id,
        user_id,
        permission_type,
        granted_by,
        expires_at,
        created_at
      `)
      .eq('lab_id', labId)
      .is('expires_at', null) // Active permissions

    // Get lab members for file sharing
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

    // Get projects for file organization
    const { data: buckets } = await supabase
      .from('buckets')
      .select('id, name')
      .eq('lab_id', labId)

    let projects: any[] = []
    if (buckets && buckets.length > 0) {
      const bucketIds = buckets.map(b => b.id)
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, bucket_id')
        .in('bucket_id', bucketIds)
      projects = projectsData || []
    }

    if (filesError) console.error('Error fetching files:', filesError)
    if (versionsError) console.error('Error fetching file versions:', versionsError)
    if (permissionsError) console.error('Error fetching file permissions:', permissionsError)
    if (membersError) console.error('Error fetching members:', membersError)

    // Transform lab members to handle Supabase join structure
    const transformedMembers = (labMembers || []).map(member => ({
      ...member,
      user_profiles: Array.isArray(member.user_profiles) 
        ? member.user_profiles[0] 
        : member.user_profiles
    }))

    return (
      <FilesPageClient 
        lab={lab}
        initialFiles={files || []}
        fileVersions={fileVersions || []}
        filePermissions={filePermissions || []}
        projects={projects}
        labMembers={transformedMembers}
        userPermissions={{
          canUpload: membership.can_upload_files || false,
          canShare: membership.can_share_files || false,
          canDelete: membership.can_delete_files || false,
          canManagePermissions: membership.can_manage_file_permissions || false
        }}
      />
    )

  } catch (error) {
    console.error('Lab files page error:', error)
    redirect('/dashboard')
  }
}