'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, MessageSquare } from 'lucide-react'
import { SentryService, sentryLogger } from '@/lib/monitoring/sentry-service'
import * as Sentry from '@sentry/nextjs'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to Sentry and console
    sentryLogger.error('Application Error Boundary Triggered', {
      errorMessage: error.message,
      errorStack: error.stack,
      digest: error.digest,
    })

    // Capture the error in Sentry with additional context
    SentryService.captureException(error, {
      tags: {
        errorBoundary: 'app-level',
        hasDigest: !!error.digest,
      },
      extra: {
        digest: error.digest,
        componentStack: error.stack,
      },
      level: 'error',
    })
  }, [error])

  const handleFeedback = () => {
    // Open Sentry user feedback dialog
    const eventId = Sentry.lastEventId()
    if (eventId) {
      Sentry.showReportDialog({ eventId })
    } else {
      // Fallback: capture a new event and show dialog
      const eventId = Sentry.captureMessage('User feedback requested from error boundary')
      Sentry.showReportDialog({ eventId })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6 text-center">
        <div className="mb-6">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Something went wrong
          </h1>
          <p className="text-muted-foreground mb-4">
            We apologize for the inconvenience. An error occurred while processing your request.
          </p>
          {error.digest && (
            <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={reset}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
          
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            variant="outline"
            className="w-full"
          >
            Return to Dashboard
          </Button>

          <Button
            onClick={handleFeedback}
            variant="ghost"
            className="w-full mt-2"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Send Feedback
          </Button>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <p>
            If this problem persists, you can send feedback above or contact support with the error ID.
          </p>
        </div>
      </div>
    </div>
  )
}