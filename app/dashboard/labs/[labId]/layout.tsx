import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

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

  // Check if user has access to this lab
  const { data: membership, error: memberError } = await supabase
    .from('lab_members')
    .select('role')
    .eq('lab_id', labId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (memberError || !membership) {
    redirect('/dashboard')
  }

  return (
    <>
      {children}
    </>
  )
}