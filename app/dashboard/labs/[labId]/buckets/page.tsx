import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BucketsPageClient from './buckets-client'

// Force dynamic rendering for auth-dependent page
export const dynamic = 'force-dynamic'

export default async function LabBucketsPage({ params }: { params: Promise<{ labId: string }> }) {
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

    // Get lab's buckets (excluding soft-deleted ones)
    const { data: buckets, error: bucketsError } = await supabase
      .from('buckets')
      .select(`
        id,
        name,
        description,
        color,
        position,
        created_at,
        updated_at,
        deleted_at
      `)
      .eq('lab_id', labId)
      .is('deleted_at', null)
      .order('position', { ascending: true })

    if (bucketsError) {
      console.error('Error fetching buckets:', bucketsError)
    }

    return (
      <BucketsPageClient 
        lab={lab}
        initialBuckets={(buckets || []) as any}
        userPermissions={{
          canCreate: membership.can_create_projects || false,
          canEdit: membership.can_edit_all_projects || false,
          canDelete: membership.can_delete_projects || false
        }}
      />
    )

  } catch (error) {
    console.error('Lab buckets page error:', error)
    redirect('/dashboard')
  }
}