'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/custom-input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selectedLabs, setSelectedLabs] = useState<string[]>(['riccc']) // Default to RICCC
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLabToggle = (labSlug: string) => {
    setSelectedLabs(prev => 
      prev.includes(labSlug) 
        ? prev.filter(lab => lab !== labSlug)
        : [...prev, labSlug]
    )
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Sign up button clicked')
    console.log('Form values:', { email, password, firstName, lastName, selectedLabs, inviteCode })
    
    if (!email || !password || !firstName || !lastName) {
      console.log('Validation failed: Missing required fields')
      toast.error('Please fill in all fields')
      return
    }

    if (selectedLabs.length === 0 && !inviteCode.trim()) {
      toast.error('Please select at least one lab or enter an invite code')
      return
    }
    
    setLoading(true)
    console.log('Starting sign up process...')

    try {
      console.log('Calling supabase.auth.signUp...')
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`,
            selected_labs: selectedLabs.join(','), // Pass selected labs to trigger
            invite_code: inviteCode.trim() || null, // Pass invite code if provided
          },
        },
      })
      
      console.log('Supabase response:', { data, error })

      if (error) {
        console.error('Sign up error details:', {
          message: error.message,
          status: error.status,
          code: error.code
        })
        
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
          toast.error('An account with this email already exists. Please sign in instead.')
          router.push('/auth/signin')
          return
        }
        
        if (error.message?.includes('email confirmation')) {
          toast.success('Account created! Please check your email to verify your account.')
          router.push('/auth/signin?message=check-email')
          return
        }
        
        throw error
      }

      if (data?.user?.identities?.length === 0) {
        console.log('User already exists')
        toast.error('An account with this email already exists. Please sign in instead.')
        router.push('/auth/signin')
        return
      }

      console.log('Sign up successful:', data.user)
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        toast.success('Account created! Please check your email to verify your account.')
        router.push('/auth/signin?message=check-email')
      } else {
        toast.success('Account created successfully!')
        router.push('/dashboard')
      }
      
    } catch (error: any) {
      console.error('Signup error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        toast.error('Network error. Please check your internet connection and try again.')
      } else if (error.message?.includes('rate limit')) {
        toast.error('Too many signup attempts. Please wait a moment and try again.')
      } else {
        toast.error(error.message || 'Failed to create account. Please try again.')
      }
    } finally {
      console.log('Sign up process completed')
      setLoading(false)
    }
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <span className="text-xl font-bold text-primary-foreground">LS</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
          <p className="mt-2 text-muted-foreground">
            Join Lab Sync to streamline your research
          </p>
          <p className="text-sm text-muted-foreground">
            Making Science Easier
          </p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>

            {/* Lab Selection */}
            <div className="space-y-3">
              <Label>Select Labs to Join (you can join multiple):</Label>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 border border-slate-600 rounded-lg bg-800/50 hover:bg-700/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLabs.includes('riccc')}
                    onChange={() => handleLabToggle('riccc')}
                    className="w-4 h-4 text-blue-600 bg-700 border-slate-500 rounded focus:ring-blue-500"
                    disabled={loading}
                  />
                  <div>
                    <div className="font-medium text-foreground">RICCC</div>
                    <div className="text-sm text-slate-400">Rush Interdisciplinary Consortium for Critical Care Trials & Data Science</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 border border-slate-600 rounded-lg bg-800/50 hover:bg-700/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLabs.includes('rhedas')}
                    onChange={() => handleLabToggle('rhedas')}
                    className="w-4 h-4 text-violet-600 bg-700 border-slate-500 rounded focus:ring-violet-500"
                    disabled={loading}
                  />
                  <div>
                    <div className="font-medium text-foreground">RHEDAS</div>
                    <div className="text-sm text-slate-400">Rush Health Equity Data Analytics Studio</div>
                  </div>
                </label>
              </div>

              {/* Invite Code Option */}
              <div className="pt-2 border-t border-slate-600">
                <Label htmlFor="inviteCode" className="text-sm">Or enter invite code for specific role:</Label>
                <Input
                  id="inviteCode"
                  type="text"
                  placeholder="Enter invite code (optional)"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Invite codes provide specific roles and permissions
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
