import { signup } from '../signin/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Beaker } from 'lucide-react'

interface SignUpPageProps {
  searchParams: Promise<{
    error?: string
    message?: string
  }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { error, message } = await searchParams

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
              Create Your Account
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              Join Lab Sync to manage your research
            </p>

            {/* Error Messages */}
            {error && (
              <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">
                  {error === 'missing_fields' && 'Please fill in all required fields'}
                  {error === 'password_too_short' && 'Password must be at least 8 characters long'}
                  {error === 'invalid_email' && 'Please enter a valid email address'}
                  {error === 'server_error' && 'Something went wrong. Please try again.'}
                  {!['missing_fields', 'password_too_short', 'invalid_email', 'server_error'].includes(error) && 
                   decodeURIComponent(error)}
                </p>
              </div>
            )}

            {/* Success Messages */}
            {message && (
              <div className="mb-6 p-3 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-success text-sm">
                  {message === 'signup_success' && 'Account created successfully! Please check your email.'}
                  {message === 'check_email' && 'Please check your email to verify your account.'}
                  {!['signup_success', 'check_email'].includes(message) && 
                   decodeURIComponent(message)}
                </p>
              </div>
            )}

            {/* Sign Up Form */}
            <form action={signup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* First Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    placeholder="John"
                    className="h-11"
                  />
                </div>

                {/* Last Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    placeholder="Doe"
                    className="h-11"
                  />
                </div>
              </div>

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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Minimum 8 characters"
                  className="h-11"
                  minLength={8}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
              >
                Create Account
              </Button>

              {/* Sign In Link */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">ALREADY HAVE AN ACCOUNT?</span>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Ready to continue your research?{' '}
                <Link href="/auth/signin" className="text-primary hover:underline font-semibold">
                  Sign in here
                </Link>
              </p>
            </form>

            {/* Terms */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              By creating an account, you agree to our{' '}
              <Link href="#" className="text-primary hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="#" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
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