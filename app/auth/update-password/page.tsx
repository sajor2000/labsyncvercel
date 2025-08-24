'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordReset, setPasswordReset] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          setIsValidToken(false)
          // Check URL parameters for specific error details
          const urlParams = new URLSearchParams(window.location.search)
          const urlError = urlParams.get('error')
          const errorDescription = urlParams.get('error_description')
          
          if (urlError === 'access_denied' && errorDescription?.includes('expired')) {
            toast.error('Password reset link has expired. Please request a new one.')
          } else {
            toast.error('Invalid or expired reset link. Please request a new one.')
          }
          setTimeout(() => router.push('/auth/forgot-password'), 2000)
        } else {
          setIsValidToken(true)
        }
      } catch (error) {
        console.error('Session check error:', error)
        setIsValidToken(false)
        toast.error('Something went wrong. Please try again.')
        setTimeout(() => router.push('/auth/reset-password'), 2000)
      }
    }

    checkSession()
  }, [supabase, router])

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors }
    
    switch (name) {
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required'
        } else if (value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters'
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          newErrors.password = 'Password must contain uppercase, lowercase, and number'
        } else {
          delete newErrors.password
        }
        break
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password'
        } else if (value !== password) {
          newErrors.confirmPassword = 'Passwords do not match'
        } else {
          delete newErrors.confirmPassword
        }
        break
    }
    
    setErrors(newErrors)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    validateField('password', value)
    
    // Also validate confirmPassword if it's been filled
    if (confirmPassword) {
      validateField('confirmPassword', confirmPassword)
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirmPassword(value)
    validateField('confirmPassword', value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate both fields
    validateField('password', password)
    validateField('confirmPassword', confirmPassword)
    
    if (Object.keys(errors).length > 0 || !password || !confirmPassword) {
      toast.error('Please fix all validation errors')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setPasswordReset(true)
      toast.success('Password updated successfully!')
      
      // Sign out and redirect to signin after a short delay
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/auth/signin')
      }, 2000)
    } catch (error: any) {
      console.error('Password update error:', error)
      toast.error(error.message || 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while checking token
  if (isValidToken === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-900 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Verifying reset link...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Invalid token state
  if (isValidToken === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-900 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-600">
              <span className="text-xl font-bold text-foreground">LS</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Lab Sync</h1>
            <p className="text-slate-400 text-sm">Making Science Easier</p>
          </div>

          <div className="bg-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
            <div className="text-center">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Invalid reset link</h2>
              <p className="text-slate-400 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <div className="space-y-3">
                <Link 
                  href="/auth/reset-password"
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-violet-600 hover:bg-violet-700 text-foreground font-medium rounded-lg transition-colors"
                >
                  Request new reset link
                </Link>
                <Link 
                  href="/auth/signin"
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-700 hover:bg-600 text-foreground font-medium rounded-lg transition-colors"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (passwordReset) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-900 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-600">
              <span className="text-xl font-bold text-foreground">LS</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Lab Sync</h1>
            <p className="text-slate-400 text-sm">Making Science Easier</p>
          </div>

          <div className="bg-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Password updated!</h2>
              <p className="text-slate-400 mb-4">
                Your password has been successfully updated. Redirecting you to sign in...
              </p>
              <div className="flex justify-center">
                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Reset password form
  return (
    <div className="flex min-h-screen items-center justify-center bg-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-600">
            <span className="text-xl font-bold text-foreground">LS</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Lab Sync</h1>
          <p className="text-slate-400 text-sm">Making Science Easier</p>
        </div>

        <div className="bg-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Set new password</h2>
            <p className="text-slate-400">Choose a strong password for your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  className={`w-full pl-10 pr-12 py-2 bg-900 border rounded-lg text-foreground placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
                    errors.password
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-600 focus:ring-violet-500 focus:border-transparent'
                  }`}
                  placeholder="Enter new password"
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
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password}</p>
              )}
              {!errors.password && password && (
                <p className="mt-1 text-xs text-slate-500">
                  Must include uppercase, lowercase, and number
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className={`w-full pl-10 pr-12 py-2 bg-900 border rounded-lg text-foreground placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-600 focus:ring-violet-500 focus:border-transparent'
                  }`}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-foreground transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || Object.keys(errors).length > 0 || !password || !confirmPassword}
              className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 disabled:bg-700 disabled:text-slate-500 text-foreground font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Updating password...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Update password
                </div>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/auth/signin"
              className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
