import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LabsPageClient from '@/components/dashboard/labs/labs-page-client'

export default async function LabsPage() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/signin')
  }

  // Fetch user's labs with details
  const { data: userLabs } = await supabase
    .from('lab_members')
    .select(`
      id,
      role,
      created_at,
      labs!inner (
        id,
        name,
        description,
        created_at
      )
    `)
    .eq('user_id', user.id)

  // For each lab, get counts
  const labsWithStats = await Promise.all(
    (userLabs || []).map(async (membership: any) => {
      const lab = membership.labs
      
      // Get project count through buckets
      const { data: buckets } = await supabase
        .from('buckets')
        .select('id')
        .eq('lab_id', lab.id)
      
      let studyCount = 0
      if (buckets && buckets.length > 0) {
        const bucketIds = buckets.map(b => b.id)
        const { count } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .in('bucket_id', bucketIds)
        studyCount = count || 0
      }
      
      // Get member count
      const { count: memberCount } = await supabase
        .from('lab_members')
        .select('*', { count: 'exact', head: true })
        .eq('lab_id', lab.id)
      
      return {
        ...lab,
        role: membership.role,
        studyCount: studyCount || 0,
        bucketCount: buckets?.length || 0,
        memberCount: memberCount || 0,
      }
    })
  )

  return <LabsPageClient initialLabs={labsWithStats || []} />
}