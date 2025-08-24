import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CreateLabForm } from '@/components/dashboard/create-lab-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function CreateLabPage() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lab Selection
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Create New Lab</h1>
          <p className="text-muted-foreground">Set up a new research laboratory workspace</p>
        </div>

        {/* Create Lab Form */}
        <CreateLabForm user={user} />
      </div>
    </div>
  )
}