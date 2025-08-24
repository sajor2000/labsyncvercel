'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [passwordUpdated, setPasswordUpdated] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const validateResetToken = async () => {
      try {
        setIsValidating(true)
        
        // Check for error parameters first
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          console.error('❌ URL error parameters:', error, errorDescription)
          if (error === 'access_denied' && errorDescription?.includes('expired')) {
            toast.error('Password reset link has expired. Please request a new one.')
          } else {
            toast.error('Invalid reset link. Please request a new one.')
          }
          setTokenValid(false)
          setIsValidating(false)
          return
        }

        // Parse URL hash parameters for tokens (MCP pattern)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        console.log('🔍 Token validation:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken, 
          type 
        })

        if (type === 'recovery' && accessToken && refreshToken) {
          // Set session with tokens from email (MCP pattern)
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError || !data.session) {
            console.error('❌ Session creation failed:', sessionError)
            toast.error('Invalid or expired reset link. Please request a new one.')
            setTokenValid(false)
          } else {
            console.log('✅ Valid reset token, session established')
            setTokenValid(true)
          }
        } else {
          // Check if there's already a valid session (fallback)
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (session && !sessionError) {
            console.log('✅ Existing valid session found')
            setTokenValid(true)
          } else {
            console.error('❌ No valid tokens or session found')
            toast.error('Invalid reset link. Please request a new password reset.')
            setTokenValid(false)
          }
        }
      } catch (error) {
        console.error('❌ Token validation error:', error)
        toast.error('Something went wrong. Please try requesting a new password reset.')
        setTokenValid(false)
      } finally {
        setIsValidating(false)
      }
    }

    validateResetToken()
  }, [searchParams, supabase])

  const validatePassword = (pwd: string) => {
    const newErrors: Record<string, string> = {}
    
    if (!pwd) {
      newErrors.password = 'Password is required'
    } else if (pwd.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwd)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number'
    }
    
    if (confirmPassword && pwd !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePassword(password) || password !== confirmPassword) {
      toast.error('Please fix the validation errors')
      return
    }

    setIsLoading(true)

    try {
      console.log('🔄 Updating password...')
      
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error('❌ Password update failed:', error)
        throw error
      }

      console.log('✅ Password updated successfully')
      setPasswordUpdated(true)
      toast.success('Password updated successfully!')
      
      // Sign out and redirect to signin after success
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/auth/signin?message=password_updated')
      }, 2000)

    } catch (error: any) {
      console.error('❌ Password update error:', error)
      
      if (error.message?.includes('session_not_found')) {
        toast.error('Session expired. Please request a new password reset.')
        setTimeout(() => router.push('/auth/forgot-password'), 2000)
      } else {
        toast.error(error.message || 'Failed to update password. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card-slack p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Validating reset link...</h2>
            <p className="text-muted-foreground">Please wait while we verify your password reset link.</p>
          </div>
        </div>
      </div>
    )
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <span className="text-xl font-bold text-primary-foreground">LS</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Lab Sync</h1>
            <p className="text-muted-foreground text-sm">Making Science Easier</p>
          </div>

          <div className="card-slack p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20 border border-destructive">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Invalid Reset Link</h2>
            <p className="text-muted-foreground mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <div className="space-y-3">
              <Link href="/auth/forgot-password">
                <Button className="btn-slack-primary w-full">
                  Request New Reset Link
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="ghost" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (passwordUpdated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <span className="text-xl font-bold text-primary-foreground">LS</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Lab Sync</h1>
            <p className="text-muted-foreground text-sm">Making Science Easier</p>
          </div>

          <div className="card-slack p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Password Updated!</h2>
            <p className="text-muted-foreground mb-6">
              Your password has been updated successfully. You can now sign in with your new password.
            </p>
            <Link href="/auth/signin">
              <Button className="btn-slack-primary w-full">
                Continue to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Main update password form
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <span className="text-xl font-bold text-primary-foreground">LS</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Lab Sync</h1>
          <p className="text-muted-foreground text-sm">Making Science Easier</p>
        </div>

        <div className="card-slack p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Update Your Password</h2>
            <p className="text-muted-foreground">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Field */}
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-2">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    validatePassword(e.target.value)
                  }}
                  placeholder="Enter new password"
                  className="input-slack pl-10 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <Label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground mb-2">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (password && e.target.value !== password) {
                      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }))
                    } else {
                      setErrors(prev => ({ ...prev, confirmPassword: '' }))
                    }
                  }}
                  placeholder="Confirm new password"
                  className="input-slack pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-destructive text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="p-4 bg-info/10 border border-info rounded-lg">
              <p className="text-sm text-info font-medium mb-2">Password Requirements:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Include uppercase and lowercase letters</li>
                <li>• Include at least one number</li>
                <li>• Passwords must match</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || Object.keys(errors).some(key => errors[key]) || !password || !confirmPassword}
              className="btn-slack-primary w-full py-2.5 font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/auth/forgot-password"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}