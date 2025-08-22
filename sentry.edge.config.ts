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
  
  // Integrations for edge runtime
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
  
  // Edge runtime specific configuration
  beforeSend(event) {
    event.tags = {
      ...event.tags,
      component: 'edge'
    }
    return event
  },

  initialScope: {
    tags: {
      component: 'edge'
    }
  }
})