import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardSidebar from '@/components/dashboard/sidebar'
import DashboardHeader from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/signin')
  }

  // Fetch user's labs
  const { data: userLabs } = await supabase
    .from('lab_members')
    .select(`
      id,
      lab_role,
      labs!inner (
        id,
        name,
        description
      )
    `)
    .eq('user_id', user.id)

  const labs = userLabs?.map((l: any) => l.labs).filter(Boolean) || []

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar user={user} labs={labs} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader user={user} labs={labs} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}