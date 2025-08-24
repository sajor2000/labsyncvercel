'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const supabase = createClient()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      return 'Email is required'
    } else if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return null
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    
    const error = validateEmail(value)
    if (error) {
      setErrors({ email: error })
    } else {
      setErrors({})
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const emailError = validateEmail(email)
    if (emailError) {
      setErrors({ email: emailError })
      toast.error('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/update-password`
      })

      if (error) throw error

      setEmailSent(true)
      toast.success('Password reset email sent!')
    } catch (error: any) {
      console.error('Password reset error:', error)
      if (error.message?.includes('Email not found')) {
        toast.error('No account found with that email address')
      } else if (error.message?.includes('Too many requests')) {
        toast.error('Too many requests. Please try again later.')
      } else {
        toast.error(error.message || 'Failed to send password reset email')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12">
        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-600">
              <span className="text-xl font-bold text-white">LS</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Lab Sync</h1>
            <p className="text-slate-400 text-sm">Making Science Easier</p>
          </div>

          {/* Success Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
              <p className="text-slate-400 mb-6">
                We've sent a password reset link to <strong className="text-white">{email}</strong>
              </p>
              <p className="text-sm text-slate-500 mb-6">
                If you don't see the email in your inbox, check your spam folder.
              </p>
              
              <div className="space-y-3">
                <Link 
                  href="/auth/signin"
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
                >
                  Back to sign in
                </Link>
                
                <button
                  onClick={() => {
                    setEmailSent(false)
                    setEmail('')
                  }}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                >
                  Send to different email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-600">
            <span className="text-xl font-bold text-white">LS</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Lab Sync</h1>
          <p className="text-slate-400 text-sm">Making Science Easier</p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Reset your password</h2>
            <p className="text-slate-400">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className={`w-full pl-10 pr-4 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
                    errors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-600 focus:ring-violet-500 focus:border-transparent'
                  }`}
                  placeholder="Enter your email address"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !!errors.email || !email}
              className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending reset link...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Send reset link
                </div>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/auth/signin"
              className="inline-flex items-center text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
