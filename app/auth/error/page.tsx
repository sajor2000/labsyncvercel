'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AuthError {
  type: string
  title: string
  message: string
  action?: {
    label: string
    href: string
  }
  canRetry?: boolean
}

const AUTH_ERRORS: Record<string, AuthError> = {
  'reset_link_expired': {
    type: 'warning',
    title: 'Reset Link Expired',
    message: 'Your password reset link has expired. Please request a new one to continue.',
    action: {
      label: 'Request New Reset Link',
      href: '/auth/forgot-password'
    }
  },
  'access_denied': {
    type: 'error',
    title: 'Access Denied',
    message: 'Access was denied. This could be due to an expired link or invalid permissions.',
    action: {
      label: 'Try Signing In Again',
      href: '/auth/signin'
    }
  },
  'invalid_request': {
    type: 'error',
    title: 'Invalid Request',
    message: 'The authentication request was invalid. Please try again.',
    action: {
      label: 'Back to Sign In',
      href: '/auth/signin'
    }
  },
  'server_error': {
    type: 'error',
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again in a few moments.',
    canRetry: true
  },
  'network_error': {
    type: 'warning',
    title: 'Network Error',
    message: 'Unable to connect to the authentication service. Please check your connection.',
    canRetry: true
  },
  'email_not_confirmed': {
    type: 'info',
    title: 'Email Not Confirmed',
    message: 'Please check your email and click the confirmation link before signing in.',
    action: {
      label: 'Resend Confirmation',
      href: '/auth/verify-email'
    }
  }
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const [authError, setAuthError] = useState<AuthError | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    const error = searchParams.get('error')
    const description = searchParams.get('error_description')
    
    if (error) {
      const knownError = AUTH_ERRORS[error]
      if (knownError) {
        setAuthError(knownError)
      } else {
        // Generic error handling
        setAuthError({
          type: 'error',
          title: 'Authentication Error',
          message: description || error || 'An unknown error occurred during authentication.',
          action: {
            label: 'Back to Sign In',
            href: '/auth/signin'
          }
        })
      }
    }
  }, [searchParams])

  const handleRetry = () => {
    setIsRetrying(true)
    // Reload the page to retry
    window.location.reload()
  }

  if (!authError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">No error information available.</p>
          <Link href="/auth/signin" className="btn-slack-primary mt-4 inline-block">
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  const getIconColor = () => {
    switch (authError.type) {
      case 'error': return 'text-destructive'
      case 'warning': return 'text-warning'
      case 'info': return 'text-info'
      default: return 'text-muted-foreground'
    }
  }

  const getBackgroundColor = () => {
    switch (authError.type) {
      case 'error': return 'bg-destructive/20 border-destructive'
      case 'warning': return 'bg-warning/20 border-warning'
      case 'info': return 'bg-info/20 border-info'
      default: return 'bg-muted/20 border-border'
    }
  }

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

        {/* Error Card */}
        <div className="card-slack p-8 shadow-2xl">
          <div className="text-center">
            <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${getBackgroundColor()}`}>
              <AlertTriangle className={`w-6 h-6 ${getIconColor()}`} />
            </div>
            
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {authError.title}
            </h2>
            
            <p className="text-muted-foreground mb-6">
              {authError.message}
            </p>
            
            <div className="space-y-3">
              {authError.action && (
                <Link href={authError.action.href}>
                  <Button className="w-full btn-slack-primary">
                    {authError.action.label}
                  </Button>
                </Link>
              )}
              
              {authError.canRetry && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Try Again
                </Button>
              )}
              
              <Link href="/auth/signin">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}