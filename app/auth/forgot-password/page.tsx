import { requestPasswordReset } from '../signin/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

interface ForgotPasswordPageProps {
  searchParams: Promise<{
    error?: string
    message?: string
    email?: string
  }>
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const { error, message, email } = await searchParams

  // Show success state if password reset email was sent
  if (message === 'reset_sent' && email) {
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
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Check your email</h2>
              <p className="text-muted-foreground mb-6">
                We've sent a password reset link to <strong className="text-foreground">{decodeURIComponent(email)}</strong>
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                If you don't see the email in your inbox, check your spam folder.
              </p>
              
              <div className="space-y-3">
                <Link href="/auth/signin">
                  <Button className="btn-slack-primary w-full">
                    Back to Sign In
                  </Button>
                </Link>
                
                <form action={requestPasswordReset} className="w-full">
                  <input type="hidden" name="email" value={decodeURIComponent(email)} />
                  <Button 
                    type="submit"
                    variant="outline"
                    className="w-full"
                  >
                    Send to different email
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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

        <div className="card-slack p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Reset your password</h2>
            <p className="text-muted-foreground">Enter your email to receive a reset link</p>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/20 border border-destructive rounded-lg">
              <p className="text-destructive text-sm">
                {error === 'missing_email' && 'Please enter your email address'}
                {error === 'invalid_email' && 'Please enter a valid email address'}
                {error === 'server_error' && 'Something went wrong. Please try again.'}
                {!['missing_email', 'invalid_email', 'server_error'].includes(error) && 
                 decodeURIComponent(error)}
              </p>
            </div>
          )}

          {/* MCP Server Action Form */}
          <form action={requestPasswordReset} className="space-y-6">
            {/* Email Field */}
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                  className="input-slack pl-10"
                  defaultValue={email ? decodeURIComponent(email) : ''}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="btn-slack-primary w-full py-2.5 font-medium"
            >
              Send Reset Link
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <Link 
              href="/auth/signin"
              className="inline-flex items-center text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}