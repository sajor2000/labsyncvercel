// Custom metrics collection for monitoring application health
interface MetricEvent {
  name: string
  value: number
  tags?: Record<string, string>
  timestamp?: number
}

interface UserEvent {
  userId: string
  event: string
  properties?: Record<string, any>
  timestamp?: number
}

class MetricsCollector {
  private events: MetricEvent[] = []
  private userEvents: UserEvent[] = []

  // Custom metrics
  recordAPILatency(endpoint: string, duration: number, status: number) {
    this.events.push({
      name: 'api_latency',
      value: duration,
      tags: { endpoint, status: status.toString() },
      timestamp: Date.now(),
    })
  }

  recordDatabaseQuery(operation: string, duration: number, table?: string) {
    this.events.push({
      name: 'db_query_duration',
      value: duration,
      tags: { operation, table },
      timestamp: Date.now(),
    })
  }

  recordAIProcessing(type: 'transcription' | 'processing' | 'email', duration: number, success: boolean) {
    this.events.push({
      name: 'ai_processing_duration',
      value: duration,
      tags: { type, success: success.toString() },
      timestamp: Date.now(),
    })
  }

  recordFileUpload(fileType: string, fileSize: number, duration: number) {
    this.events.push({
      name: 'file_upload',
      value: duration,
      tags: { fileType, sizeCategory: this.getFileSizeCategory(fileSize) },
      timestamp: Date.now(),
    })
  }

  // User analytics
  recordUserAction(userId: string, action: string, properties?: Record<string, any>) {
    this.userEvents.push({
      userId,
      event: action,
      properties,
      timestamp: Date.now(),
    })
  }

  recordPageView(userId: string, path: string, referrer?: string) {
    this.userEvents.push({
      userId,
      event: 'page_view',
      properties: { path, referrer },
      timestamp: Date.now(),
    })
  }

  recordFeatureUsage(userId: string, feature: string, metadata?: Record<string, any>) {
    this.userEvents.push({
      userId,
      event: 'feature_used',
      properties: { feature, ...metadata },
      timestamp: Date.now(),
    })
  }

  // Utility methods
  private getFileSizeCategory(bytes: number): string {
    if (bytes < 1024 * 1024) return 'small' // < 1MB
    if (bytes < 10 * 1024 * 1024) return 'medium' // < 10MB
    return 'large' // >= 10MB
  }

  // Export metrics for external systems
  getMetrics(): MetricEvent[] {
    return [...this.events]
  }

  getUserEvents(): UserEvent[] {
    return [...this.userEvents]
  }

  // Clear metrics (call periodically to prevent memory leaks)
  flush() {
    const metrics = this.getMetrics()
    const userEvents = this.getUserEvents()
    
    this.events = []
    this.userEvents = []
    
    return { metrics, userEvents }
  }
}

// Singleton instance
export const metrics = new MetricsCollector()

// Convenience functions for common metrics
export function recordAPICall(endpoint: string, startTime: number, status: number) {
  const duration = Date.now() - startTime
  metrics.recordAPILatency(endpoint, duration, status)
}

export function recordAICall(type: 'transcription' | 'processing' | 'email', startTime: number, success: boolean) {
  const duration = Date.now() - startTime
  metrics.recordAIProcessing(type, duration, success)
}

export function recordUserActivity(userId: string, activity: string, metadata?: Record<string, any>) {
  metrics.recordUserAction(userId, activity, metadata)
}

// Web Vitals reporting (for client-side)
export function reportWebVitals(metric: {
  id: string
  name: string
  value: number
  delta?: number
  rating?: 'good' | 'needs-improvement' | 'poor'
  navigationType?: string
}) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const rating = metric.rating ? ` (${metric.rating})` : ''
    console.log(`[Web Vital] ${metric.name}: ${Math.round(metric.value)}ms${rating}`)
  }

  // Send to analytics service in production
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Vercel Analytics handles this automatically via @vercel/analytics
    // Additional custom tracking can be added here if needed
    
    // Report poor performance to monitoring
    if (metric.rating === 'poor' && window.Sentry) {
      window.Sentry.captureMessage(`Poor ${metric.name} performance`, {
        level: 'warning',
        extra: {
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
          url: window.location.href,
        },
      })
    }
  }
}