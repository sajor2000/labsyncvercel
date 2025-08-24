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
      lab_role,
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
      
      // Get study count
      const { count: studyCount } = await supabase
        .from('studies')
        .select('*', { count: 'exact', head: true })
        .eq('lab_id', lab.id)
      
      // Get member count
      const { count: memberCount } = await supabase
        .from('lab_members')
        .select('*', { count: 'exact', head: true })
        .eq('lab_id', lab.id)
      
      return {
        ...lab,
        role: membership.lab_role,
        studyCount: studyCount || 0,
        bucketCount: 3, // Placeholder - implement bucket counting when table exists
        memberCount: memberCount || 0,
      }
    })
  )

  return <LabsPageClient initialLabs={labsWithStats || []} />
}