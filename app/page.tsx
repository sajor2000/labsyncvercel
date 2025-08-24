import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Calendar, Users, Mic, Brain, Mail } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 btn-slack-primary rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">LabFlow</h1>
            </div>
            <div className="space-x-4">
              <Link 
                href="/auth/signin"
                className="text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup"
                className="btn-slack-primary"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="py-20 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Streamline Your Medical Research Lab
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            AI-powered meeting transcription, intelligent task extraction, and seamless team collaboration 
            for modern medical research laboratories.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/signup"
              className="btn-slack-primary px-8 py-4 font-semibold inline-flex items-center justify-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link 
              href="#features"
              className="btn-slack-secondary px-8 py-4 font-semibold"
            >
              Learn More
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need for Lab Management
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful AI-driven tools designed specifically for medical research teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card-slack p-6">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                AI Meeting Transcription
              </h3>
              <p className="text-muted-foreground">
                Automatically transcribe lab meetings with OpenAI Whisper. Never miss important discussions again.
              </p>
            </div>

            <div className="card-slack p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Intelligent Task Extraction
              </h3>
              <p className="text-muted-foreground">
                GPT-4o-mini automatically identifies action items, deadlines, and assigns tasks from meeting transcripts.
              </p>
            </div>

            <div className="card-slack p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                AI-Powered Emails
              </h3>
              <p className="text-muted-foreground">
                Generate professional email notifications and reminders tailored for medical research contexts.
              </p>
            </div>

            <div className="card-slack p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Google Calendar Integration
              </h3>
              <p className="text-muted-foreground">
                Seamless bi-directional sync with Google Calendar for scheduling and meeting management.
              </p>
            </div>

            <div className="card-slack p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Multi-Lab Support
              </h3>
              <p className="text-muted-foreground">
                Team members can belong to multiple labs with different roles and granular permissions.
              </p>
            </div>

            <div className="card-slack p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <ArrowRight className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Real-time Collaboration
              </h3>
              <p className="text-muted-foreground">
                Live updates and notifications keep your entire research team synchronized and informed.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="btn-slack-primary rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Lab Management?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join medical research teams who are already using LabFlow to streamline their operations.
            </p>
            <Link 
              href="/auth/signup"
              className="bg-white text-primary px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold inline-flex items-center"
            >
              Get Started Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 LabFlow. Built for medical research excellence.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}