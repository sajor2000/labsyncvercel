'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service (Sentry, etc.)
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body className="bg-slate-900 text-white min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-red-600">
              <span className="text-2xl font-bold text-white">!</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-slate-400">
              We apologize for the inconvenience. Our team has been notified of this issue.
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={reset}
              className="w-full bg-primary hover:bg-primary"
            >
              Try Again
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Return Home
            </Button>
          </div>

          <div className="mt-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-500 mb-2">Error Details (for support):</p>
            <code className="text-xs text-slate-400 break-all">
              {error.digest ? `ID: ${error.digest}` : 'No error ID available'}
            </code>
          </div>

          <p className="mt-6 text-xs text-slate-500">
            If this issue persists, please contact the Lab Sync team.
          </p>
        </div>
      </body>
    </html>
  )
}