import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CreateLabForm } from '@/components/dashboard/create-lab-form'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

export default async function CreateLabPage() {
  const supabase = await createClient()
  
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <DashboardHeader 
        user={{
          email: user.email,
          name: profile?.full_name || user.email?.split('@')[0]
        }} 
      />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreateLabForm user={user} />
      </main>
    </div>
  )
}