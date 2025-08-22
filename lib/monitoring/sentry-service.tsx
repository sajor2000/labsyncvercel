import * as Sentry from '@sentry/nextjs'
import React from 'react'

// Get the structured logger from Sentry
export const logger = Sentry.logger

/**
 * Enhanced Sentry service for LabFlow application
 */
export class SentryService {
  
  /**
   * Set user context for all subsequent Sentry events
   */
  static setUser(user: {
    id: string
    email?: string
    username?: string
    lab?: string
    role?: string
  }) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      lab: user.lab,
      role: user.role,
    })
  }

  /**
   * Clear user context (e.g., on logout)
   */
  static clearUser() {
    Sentry.setUser(null)
  }

  /**
   * Add a breadcrumb for user actions
   */
  static addBreadcrumb(message: string, category: string, data?: any, level: 'debug' | 'info' | 'warning' | 'error' = 'info') {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level,
      timestamp: Date.now() / 1000,
    })
  }

  /**
   * Capture an exception with additional context
   */
  static captureException(error: Error, context?: {
    tags?: Record<string, string>
    extra?: Record<string, any>
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
    correlationId?: string
  }) {
    Sentry.withScope((scope) => {
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value)
        })
      }
      
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value)
        })
      }
      
      if (context?.level) {
        scope.setLevel(context.level)
      }
      
      if (context?.correlationId) {
        scope.setTag('correlationId', context.correlationId)
      }
      
      Sentry.captureException(error)
    })
  }

  /**
   * Instrument an async function with performance monitoring
   */
  static async instrumentAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    options?: {
      op?: string
      description?: string
      data?: Record<string, any>
      tags?: Record<string, string>
    }
  ): Promise<T> {
    return Sentry.startSpan(
      {
        op: options?.op || 'function',
        name: operation,
        attributes: {
          ...options?.data,
          description: options?.description,
        },
      },
      async (span) => {
        // Add tags to span
        if (options?.tags) {
          Object.entries(options.tags).forEach(([key, value]) => {
            span.setAttribute(key, value)
          })
        }

        try {
          const result = await fn()
          span.setStatus({ code: 1, message: 'ok' }) // Success
          return result
        } catch (error) {
          span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Unknown error' }) // Error
          throw error
        }
      }
    )
  }

  /**
   * Instrument a UI interaction
   */
  static instrumentUI<T>(
    actionName: string,
    fn: () => T,
    options?: {
      elementType?: string
      elementId?: string
      data?: Record<string, any>
    }
  ): T {
    return Sentry.startSpan(
      {
        op: 'ui.action',
        name: actionName,
        attributes: options?.data || {},
      },
      (span) => {
        span.setAttribute('ui.elementType', options?.elementType || 'unknown')
        if (options?.elementId) {
          span.setAttribute('ui.elementId', options.elementId)
        }

        try {
          const result = fn()
          span.setStatus({ code: 1, message: 'ok' })
          return result
        } catch (error) {
          span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Unknown error' })
          throw error
        }
      }
    )
  }

  /**
   * Instrument an HTTP request
   */
  static async instrumentHTTP<T>(
    method: string,
    url: string,
    fn: () => Promise<T>,
    options?: {
      data?: Record<string, any>
      tags?: Record<string, string>
    }
  ): Promise<T> {
    return this.instrumentAsync(
      `${method} ${url}`,
      fn,
      {
        op: 'http.client',
        description: `${method} request to ${url}`,
        data: {
          'http.method': method,
          'http.url': url,
          ...options?.data,
        },
        tags: options?.tags,
      }
    )
  }

  /**
   * Instrument database operations
   */
  static async instrumentDB<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>,
    options?: {
      data?: Record<string, any>
      tags?: Record<string, string>
    }
  ): Promise<T> {
    return this.instrumentAsync(
      `${operation} ${table}`,
      fn,
      {
        op: 'db.query',
        description: `Database ${operation} on ${table}`,
        data: {
          'db.operation': operation,
          'db.table': table,
          ...options?.data,
        },
        tags: options?.tags,
      }
    )
  }

  /**
   * Instrument AI operations
   */
  static async instrumentAI<T>(
    operation: 'transcription' | 'processing' | 'email_generation',
    fn: () => Promise<T>,
    options?: {
      model?: string
      inputSize?: number
      correlationId?: string
      data?: Record<string, any>
    }
  ): Promise<T> {
    return this.instrumentAsync(
      `AI ${operation}`,
      fn,
      {
        op: 'ai.operation',
        description: `AI ${operation} operation`,
        data: {
          'ai.operation': operation,
          'ai.model': options?.model,
          'ai.inputSize': options?.inputSize,
          'ai.correlationId': options?.correlationId,
          ...options?.data,
        },
        tags: {
          operation,
          ...(options?.correlationId && { correlationId: options.correlationId }),
        },
      }
    )
  }
}

/**
 * Structured logging helpers using Sentry logger
 */
export const sentryLogger = {
  trace: (message: string, data?: Record<string, any>) => {
    logger.trace(message, data)
  },

  debug: (message: string, data?: Record<string, any>) => {
    logger.debug(message, data)
  },

  info: (message: string, data?: Record<string, any>) => {
    logger.info(message, data)
  },

  warn: (message: string, data?: Record<string, any>) => {
    logger.warn(message, data)
  },

  error: (message: string, data?: Record<string, any>) => {
    logger.error(message, data)
  },

  fatal: (message: string, data?: Record<string, any>) => {
    logger.fatal(message, data)
  },

  // Template literal function for interpolation
  fmt: logger.fmt,
}

/**
 * Error boundary HOC for React components
 */
export function withSentryErrorBoundary<P extends {}>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ComponentType<{ error: unknown; resetError: () => void }>
    beforeCapture?: (scope: Sentry.Scope, error: unknown, componentStack: string) => void
  }
) {
  return Sentry.withErrorBoundary(Component, {
    fallback: options?.fallback || (({ error, resetError }) => (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-6 text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-4">
            Something went wrong
          </h1>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <button 
            onClick={resetError}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </div>
    )),
    beforeCapture: options?.beforeCapture,
  })
}