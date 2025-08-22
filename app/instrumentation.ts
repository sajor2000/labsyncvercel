export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize Sentry for server-side monitoring
    if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NEXT_PUBLIC_SENTRY_DSN !== 'your_sentry_dsn') {
      await import('../sentry.server.config')
    }

    // Initialize OpenTelemetry for monitoring
    try {
      const { NodeSDK } = await import('@opentelemetry/sdk-node')
      const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node')
      
      const sdk = new NodeSDK({
        instrumentations: [getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false, // Disable filesystem instrumentation to reduce noise
          },
        })],
      })

      sdk.start()
      console.log('OpenTelemetry started successfully')
    } catch (error) {
      console.warn('Failed to initialize OpenTelemetry:', error)
    }
  }

  // Initialize Sentry for edge runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NEXT_PUBLIC_SENTRY_DSN !== 'your_sentry_dsn') {
      await import('../sentry.edge.config')
    }
  }
}

export async function onRequestError(
  err: Error,
  request: {
    path: string
    method: string
  },
  context: {
    routerKind: 'Pages Router' | 'App Router'
    routePath: string
    routeType: 'route' | 'page' | 'middleware' | 'api'
  }
) {
  // Log error with correlation context
  console.error('Request error:', {
    error: err.message,
    stack: err.stack,
    request: {
      path: request.path,
      method: request.method,
    },
    context,
    timestamp: new Date().toISOString(),
  })

  // Send to Sentry in production
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    try {
      const Sentry = await import('@sentry/nextjs')
      
      Sentry.withScope((scope) => {
        scope.setContext('request', {
          path: request.path,
          method: request.method,
        })
        scope.setContext('nextjs', {
          routerKind: context.routerKind,
          routePath: context.routePath,
          routeType: context.routeType,
        })
        scope.setLevel('error')
        
        Sentry.captureException(err)
      })
    } catch (reportingError) {
      console.error('Sentry error reporting failed:', reportingError)
    }
  }
}