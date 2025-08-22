import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // Capture 10% of transactions in production
  
  // Session Replay
  replaysSessionSampleRate: 0.1, // Capture 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
  
  // Enable structured logging
  _experiments: {
    enableLogs: true,
  },
  
  // Integrations
  integrations: [
    // Send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  
  // Client-side error filtering
  beforeSend(event) {
    // Filter out common non-actionable errors
    if (event.exception) {
      const error = event.exception.values?.[0]
      if (error?.value?.includes('Non-Error promise rejection captured')) {
        return null
      }
      if (error?.value?.includes('Script error')) {
        return null
      }
    }
    return event
  },

  // Add user context
  initialScope: {
    tags: {
      component: 'client'
    }
  }
})