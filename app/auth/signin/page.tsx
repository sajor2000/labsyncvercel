import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Beaker } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      {/* Simple Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6">
        <Link href="/" className="flex items-center space-x-3 w-fit">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Beaker className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-foreground">Lab Sync</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
              Welcome Back
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              Sign in to your Lab Sync account
            </p>

            {/* Error Messages */}
            {error && (
              <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
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
              <div className="mb-6 p-3 bg-success/10 border border-success/20 rounded-lg">
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

            {/* Sign In Form */}
            <form action={login} className="space-y-4">
              {/* Hidden redirect field */}
              {redirect && (
                <input type="hidden" name="redirect" value={redirect} />
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@example.com"
                  className="h-11"
                />
              </div>

              {/* Password Field */}
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
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  className="h-11"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
              >
                Sign In
              </Button>

              {/* Demo Access */}
              <Button 
                type="button"
                variant="outline"
                className="w-full h-11 text-base"
                onClick={(e) => {
                  e.preventDefault();
                  const emailInput = document.getElementById('email') as HTMLInputElement;
                  const passwordInput = document.getElementById('password') as HTMLInputElement;
                  if (emailInput && passwordInput) {
                    emailInput.value = 'demo@labsync.io';
                    passwordInput.value = 'demo123456';
                  }
                }}
              >
                Use Demo Account
              </Button>

              {/* Sign Up Link */}
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
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 Lab Sync. Built for medical research excellence.
          </p>
        </div>
      </footer>
    </div>
  )
}