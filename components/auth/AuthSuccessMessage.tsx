'use client'

import { CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface AuthSuccessMessageProps {
  type: 'signup' | 'password_reset' | 'email_confirmed'
  email?: string
  onContinue?: () => void
}

export function AuthSuccessMessage({ type, email, onContinue }: AuthSuccessMessageProps) {
  const getContent = () => {
    switch (type) {
      case 'signup':
        return {
          title: 'Account Created Successfully!',
          message: email 
            ? `Welcome to Lab Sync! A confirmation email has been sent to ${email}.`
            : 'Welcome to Lab Sync! Please check your email for confirmation.',
          action: 'Continue to Dashboard',
          href: '/dashboard'
        }
      case 'password_reset':
        return {
          title: 'Password Reset Email Sent',
          message: email
            ? `We've sent a password reset link to ${email}. Check your inbox and follow the instructions.`
            : 'Check your email for the password reset link.',
          action: 'Back to Sign In',
          href: '/auth/signin'
        }
      case 'email_confirmed':
        return {
          title: 'Email Confirmed!',
          message: 'Your email has been successfully confirmed. You can now sign in to your account.',
          action: 'Sign In Now',
          href: '/auth/signin'
        }
      default:
        return {
          title: 'Success!',
          message: 'Operation completed successfully.',
          action: 'Continue',
          href: '/dashboard'
        }
    }
  }

  const content = getContent()

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

        {/* Success Card */}
        <div className="card-slack p-8 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/20 border border-success">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {content.title}
            </h2>
            
            <p className="text-muted-foreground mb-6">
              {content.message}
            </p>
            
            <div className="space-y-3">
              {onContinue ? (
                <Button 
                  className="w-full btn-slack-primary"
                  onClick={onContinue}
                >
                  {content.action}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Link href={content.href}>
                  <Button className="w-full btn-slack-primary">
                    {content.action}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
              
              <Link href="/auth/signin">
                <Button variant="ghost" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
            
            {type === 'signup' && (
              <div className="mt-6 p-4 bg-info/10 border border-info rounded-lg">
                <p className="text-sm text-info">
                  <strong>Next steps:</strong> Check your email for a confirmation link, then sign in to access your lab dashboard.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}