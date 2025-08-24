'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application error:', error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-destructive">500</h1>
        </div>
        <h2 className="mb-4 text-3xl font-semibold tracking-tight">
          Something went wrong
        </h2>
        <p className="mb-8 text-muted-foreground">
          An unexpected error occurred. We've been notified and are working to fix it.
        </p>
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-8 rounded-lg bg-muted p-4 text-left">
            <p className="font-mono text-sm text-muted-foreground">
              {error.message}
            </p>
          </div>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button onClick={reset}>
            Try Again
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
