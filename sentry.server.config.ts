import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Enable structured logging
  _experiments: {
    enableLogs: true,
  },
  
  // Server-side error filtering and enhancement
  beforeSend(event) {
    // Add server context
    if (event.request) {
      event.tags = {
        ...event.tags,
        component: 'server'
      }
    }

    // Filter out expected errors in development
    if (process.env.NODE_ENV === 'development') {
      if (event.exception) {
        const error = event.exception.values?.[0]
        if (error?.value?.includes('ECONNREFUSED') || error?.value?.includes('fetch failed')) {
          return null
        }
      }
    }

    return event
  },

  // Add additional context
  initialScope: {
    tags: {
      component: 'server'
    }
  },

  // Integrations
  integrations: [
    // Send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
    Sentry.httpIntegration({ tracing: true }),
    Sentry.nodeContextIntegration(),
  ]
})