import { signIn } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Mail, Lock } from 'lucide-react'

interface SignInPageProps {
  searchParams: Promise<{
    error?: string
    message?: string
    redirect?: string
  }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error, message, redirect } = await searchParams

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
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your Lab Sync account</p>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/20 border border-destructive rounded-lg">
              <p className="text-destructive text-sm">
                {error === 'missing_credentials' && 'Please enter both email and password'}
                {error === 'invalid_credentials' && 'Invalid email or password'}
                {error === 'email_not_confirmed' && 'Please verify your email address first'}
                {error === 'too_many_requests' && 'Too many login attempts. Please wait a moment and try again.'}
                {error === 'no_user_data' && 'Authentication failed - no user data received'}
                {error === 'authentication_failed' && 'Authentication failed - please try again'}
                {error === 'reset_link_expired' && 'Password reset link has expired. Please request a new one.'}
                {error === 'access_denied' && 'Access denied. Please try signing in again.'}
                {error === 'callback_failed' && 'Authentication callback failed. Please try again.'}
                {error === 'no_code' && 'No authentication code provided. Please try again.'}
                {error.startsWith('server_error:') && `Server error: ${error.replace('server_error:', '').trim()}`}
                {!['missing_credentials', 'invalid_credentials', 'email_not_confirmed', 'too_many_requests', 'no_user_data', 'authentication_failed', 'reset_link_expired', 'access_denied', 'callback_failed', 'no_code'].includes(error) && 
                 !error.startsWith('server_error:') && 
                 decodeURIComponent(error)}
              </p>
            </div>
          )}

          {/* Success Messages */}
          {message && (
            <div className="mb-6 p-4 bg-success/20 border border-success rounded-lg">
              <p className="text-success text-sm">
                {message === 'signup_success' && 'Account created successfully! Please sign in.'}
                {message === 'check_email' && 'Please check your email to verify your account.'}
                {message === 'logout_success' && 'You have been signed out successfully.'}
                {message === 'password_updated' && 'Password updated successfully! You can now sign in.'}
                {message === 'email_confirmed' && 'Email verified successfully! You can now sign in.'}
                {!['signup_success', 'check_email', 'logout_success', 'password_updated', 'email_confirmed'].includes(message) && 
                 decodeURIComponent(message)}
              </p>
            </div>
          )}

          {/* Sign In Form using Server Action */}
          <form action={signIn} className="space-y-6">
            {/* Hidden redirect field */}
            {redirect && (
              <input type="hidden" name="redirect" value={redirect} />
            )}

            {/* Email Field */}
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-2 bg-900 border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-2 bg-900 border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              Sign In
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-slate-400 text-sm">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-violet-400 hover:text-violet-300 font-medium">
                Sign up here
              </Link>
            </p>
            
            <p className="text-slate-400 text-sm">
              Forgot your password?{' '}
              <Link href="/auth/forgot-password" className="text-violet-400 hover:text-violet-300 font-medium">
                Reset it here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}