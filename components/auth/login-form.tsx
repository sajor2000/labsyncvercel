'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Welcome back!')
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      console.error('Sign in error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoAccess = () => {
    // Use demo credentials
    setEmail('demo@labsync.io')
    setPassword('demo123456')
    toast.info('Demo credentials filled. Click Sign In to continue.')
  }

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      {/* Email field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11"
          disabled={isLoading}
          required
          autoFocus
        />
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link 
            href="/auth/forgot-password" 
            className="text-sm text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11"
          disabled={isLoading}
          required
        />
      </div>

      {/* Sign in button */}
      <Button 
        type="submit" 
        className="w-full h-12 text-base font-medium"
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>

      {/* Demo Access */}
      <Button 
        type="button"
        variant="outline"
        className="w-full h-11 text-base"
        onClick={handleDemoAccess}
      >
        Use Demo Account
      </Button>

      {/* Sign up link */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">NEW USER?</span>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="text-primary hover:underline font-semibold">
          Create an account
        </Link>
      </p>
    </form>
  )
}