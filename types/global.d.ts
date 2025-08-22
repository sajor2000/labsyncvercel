declare global {
  interface Window {
    Sentry?: {
      captureMessage: (message: string, options?: {
        level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal'
        extra?: Record<string, any>
      }) => void
      captureException: (error: Error, options?: Record<string, any>) => void
    }
  }
}

export {}