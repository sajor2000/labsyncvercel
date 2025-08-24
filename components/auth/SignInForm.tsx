'use client'

import { useState, useEffect } from 'react'
import { authClient } from '@/lib/auth/auth-client'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Mail, Lock, LogIn } from 'lucide-react'
import Link from 'next/link'

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for messages from signup redirect
    const message = searchParams.get('message')
    if (message === 'check-email') {
      toast.info('Please check your email to verify your account before signing in.')
    }
  }, [searchParams])

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors }
    
    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!value) {
          newErrors.email = 'Email is required'
        } else if (!emailRegex.test(value)) {
          newErrors.email = 'Please enter a valid email address'
        } else {
          delete newErrors.email
        }
        break
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required'
        } else if (value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters'
        } else {
          delete newErrors.password
        }
        break
    }
    
    setErrors(newErrors)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    validateField('email', value)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    validateField('password', value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate fields
    validateField('email', email)
    validateField('password', password)
    
    if (Object.keys(errors).length > 0 || !email || !password) {
      toast.error('Please fix all errors before submitting')
      return
    }
    
    setIsLoading(true)

    try {
      console.log('🔄 Starting bulletproof signin for:', email.trim())
      
      // Use the bulletproof auth client
      const { user, error } = await authClient.signIn({ email, password })

      if (error) {
        throw error
      }

      if (!user) {
        throw new Error('Authentication failed - no user returned')
      }

      console.log('✅ Bulletproof signin successful!')
      toast.success('Signed in successfully!')
      
      // Verify session before redirect
      const session = await authClient.getSession()
      console.log('🔐 Auth verified:', !!session)
      
      if (!session) {
        throw new Error('Session verification failed')
      }
      
      // Force redirect to dashboard
      console.log('🚀 Redirecting to dashboard...')
      window.location.href = '/dashboard'
      
      // Exit immediately
      return
      
    } catch (error: any) {
      console.error('Sign in error:', error)
      
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please try again.')
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error('Please verify your email address before signing in.')
      } else if (error.message?.includes('Too many requests')) {
        toast.error('Too many sign in attempts. Please try again later.')
      } else {
        toast.error(error.message || 'Failed to sign in')
      }
    } finally {
      // Always stop loading after 2 seconds max
      setTimeout(() => {
        setIsLoading(false)
      }, 2000)
    }
  }

  const hasError = (fieldName: string) => !!errors[fieldName]
  const getFieldError = (fieldName: string) => errors[fieldName]

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back</h2>
          <p className="text-slate-400">Sign in to your Lab Sync account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={handleEmailChange}
                className={`w-full pl-10 pr-4 py-2 bg-900 border rounded-lg text-foreground placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
                  hasError('email')
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-slate-600 focus:ring-violet-500 focus:border-transparent'
                }`}
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>
            {hasError('email') && (
              <p className="mt-1 text-xs text-red-400">{getFieldError('email')}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <Link 
                href="/auth/forgot-password"
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={handlePasswordChange}
                className={`w-full pl-10 pr-12 py-2 bg-900 border rounded-lg text-foreground placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
                  hasError('password')
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-slate-600 focus:ring-violet-500 focus:border-transparent'
                }`}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {hasError('password') && (
              <p className="mt-1 text-xs text-red-400">{getFieldError('password')}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || Object.keys(errors).length > 0}
            className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 disabled:bg-700 disabled:text-slate-500 text-foreground font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Signing in...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <LogIn className="w-4 h-4 mr-2" />
                Sign in
              </div>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Don't have an account?{' '}
            <Link 
              href="/auth/signup" 
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}