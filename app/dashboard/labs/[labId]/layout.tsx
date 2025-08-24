import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LabBreadcrumb } from '@/components/dashboard/lab-breadcrumb'

interface LabLayoutProps {
  children: React.ReactNode
  params: Promise<{ labId: string }>
}

export default async function LabLayout({ children, params }: LabLayoutProps) {
  const { labId } = await params
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/signin')
  }

  // Check if user has access to this lab and get lab details
  const { data: membership, error: memberError } = await supabase
    .from('lab_members')
    .select(`
      role,
      labs!inner (
        id,
        name,
        description
      )
    `)
    .eq('lab_id', labId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (memberError || !membership) {
    redirect('/dashboard')
  }

  const lab = Array.isArray(membership.labs) ? membership.labs[0] : membership.labs

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Lab Context Breadcrumb */}
      <LabBreadcrumb lab={lab} />
      
      {/* Lab-specific content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}