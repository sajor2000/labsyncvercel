'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Loader2, Mail, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [isResending, setIsResending] = useState(false)
  const [email, setEmail] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      const type = searchParams.get('type')
      const emailFromUrl = searchParams.get('email')
      
      if (emailFromUrl) {
        setEmail(emailFromUrl)
      }

      if (token && type === 'email') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          })

          if (error) {
            console.error('Email verification error:', error)
            if (error.message.includes('expired')) {
              setStatus('expired')
              toast.error('Verification link has expired')
            } else {
              setStatus('error')
              toast.error(error.message || 'Failed to verify email')
            }
          } else {
            setStatus('success')
            toast.success('Email verified successfully!')
            
            // Check if user has lab memberships
            const { data: user } = await supabase.auth.getUser()
            if (user.user) {
              const { data: memberships } = await supabase
                .from('lab_members')
                .select('lab_id')
                .eq('user_id', user.user.id)
                .eq('is_active', true)
                .limit(1)

              setTimeout(() => {
                if (memberships && memberships.length > 0) {
                  router.push('/dashboard')
                } else {
                  router.push('/dashboard/join-lab')
                }
              }, 2000)
            }
          }
        } catch (error: any) {
          console.error('Verification error:', error)
          setStatus('error')
          toast.error('Failed to verify email')
        }
      } else if (!token) {
        // No token means user navigated directly to page
        setStatus('error')
      }
    }

    verifyEmail()
  }, [searchParams, router, supabase])

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Please provide your email address')
      return
    }

    setIsResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) throw error

      toast.success('Verification email sent! Please check your inbox.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend verification email')
    } finally {
      setIsResending(false)
    }
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

        {/* Verification Status Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Verifying your email</h2>
                <p className="text-slate-400">Please wait while we verify your email address...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Email verified!</h2>
                <p className="text-slate-400 mb-4">
                  Your account has been successfully verified. Redirecting you to the dashboard...
                </p>
                <div className="flex justify-center">
                  <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Verification failed</h2>
                <p className="text-slate-400 mb-6">
                  We couldn't verify your email address. The link may be invalid or you may have already verified your account.
                </p>
                <div className="space-y-3">
                  <Link 
                    href="/auth/signin"
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Try signing in
                  </Link>
                  <Link 
                    href="/auth/signup"
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Create new account
                  </Link>
                </div>
              </>
            )}

            {status === 'expired' && (
              <>
                <Mail className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Link expired</h2>
                <p className="text-slate-400 mb-6">
                  Your verification link has expired. Would you like us to send a new one?
                </p>
                
                {!email && (
                  <div className="mb-4">
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending || !email}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Send new verification email
                      </>
                    )}
                  </button>
                  <Link 
                    href="/auth/signin"
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Back to sign in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}