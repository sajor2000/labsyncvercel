import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Beaker, Brain, Users } from 'lucide-react'
import { LoginForm } from '@/components/auth/login-form'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      {/* Simple Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Beaker className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">Lab Sync</span>
          </div>
        </div>
      </header>

      {/* Hero with Integrated Login */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Simple Value Prop */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Manage Your Research Lab Efficiently
              </h1>
              <p className="text-xl text-muted-foreground mb-12">
                AI-powered tools for modern medical research teams
              </p>
              
              {/* Three Key Benefits */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">AI Meeting Intelligence</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatic transcription and task extraction from lab meetings
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Beaker className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">Smart Task Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Track experiments, deadlines, and research progress effortlessly
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">Team Collaboration</h3>
                    <p className="text-sm text-muted-foreground">
                      Multi-lab support with role-based permissions and real-time updates
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: Clean Login Form */}
            <div className="w-full max-w-md mx-auto">
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                  Welcome Back
                </h2>
                <LoginForm />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Lab Sync. Built for medical research excellence.
            </p>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="mailto:support@labsync.io" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}