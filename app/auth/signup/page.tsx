import { signup } from '../signin/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Mail, Lock, User } from 'lucide-react'

interface SignUpPageProps {
  searchParams: Promise<{
    error?: string
    message?: string
  }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { error, message } = await searchParams

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
            <h2 className="text-2xl font-bold text-foreground mb-2">Create your account</h2>
            <p className="text-muted-foreground">Join Lab Sync to manage your research</p>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/20 border border-destructive rounded-lg">
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
            <div className="mb-6 p-4 bg-success/20 border border-success rounded-lg">
              <p className="text-success text-sm">
                {message === 'signup_success' && 'Account created successfully! Please check your email.'}
                {message === 'check_email' && 'Please check your email to verify your account.'}
                {!['signup_success', 'check_email'].includes(message) && 
                 decodeURIComponent(message)}
              </p>
            </div>
          )}

          {/* MCP Server Action Form */}
          <form action={signup} className="space-y-6">
            {/* First Name Field */}
            <div>
              <Label htmlFor="firstName" className="block text-sm font-medium text-muted-foreground mb-2">
                First Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  placeholder="Enter your first name"
                  className="input-slack pl-10"
                />
              </div>
            </div>

            {/* Last Name Field */}
            <div>
              <Label htmlFor="lastName" className="block text-sm font-medium text-muted-foreground mb-2">
                Last Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  placeholder="Enter your last name"
                  className="input-slack pl-10"
                />
              </div>
            </div>

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
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-2">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Create a password (min 8 characters)"
                  className="input-slack pl-10"
                  minLength={8}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="btn-slack-primary w-full py-2.5 font-medium"
            >
              Create Account
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-muted-foreground text-sm">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-primary hover:text-primary/80 font-medium">
                Sign in here
              </Link>
            </p>
            
            <p className="text-muted-foreground text-sm">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:text-primary/80">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:text-primary/80">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}