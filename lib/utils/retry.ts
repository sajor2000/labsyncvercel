/**
 * Retry utility with exponential backoff and circuit breaker pattern
 * Implements best practices for API resilience
 */

export interface RetryOptions {
  maxAttempts: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  jitter: boolean
  retryCondition?: (error: any) => boolean
}

export interface CircuitBreakerOptions {
  failureThreshold: number
  resetTimeoutMs: number
  monitoringPeriodMs: number
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
  retryCondition: (error) => {
    // Don't retry client errors (4xx) except rate limits
    if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
      return false
    }
    return true
  }
}

const DEFAULT_CIRCUIT_BREAKER_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeoutMs: 60000, // 1 minute
  monitoringPeriodMs: 300000 // 5 minutes
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private lastFailureTime = 0
  private nextAttemptTime = 0

  constructor(private options: CircuitBreakerOptions = DEFAULT_CIRCUIT_BREAKER_OPTIONS) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error('Circuit breaker is OPEN')
      }
      this.state = CircuitState.HALF_OPEN
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failureCount = 0
    this.state = CircuitState.CLOSED
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN
      this.nextAttemptTime = Date.now() + this.options.resetTimeoutMs
    }
  }

  getState(): CircuitState {
    return this.state
  }

  getFailureCount(): number {
    return this.failureCount
  }
}

// Global circuit breakers for different services
const circuitBreakers = new Map<string, CircuitBreaker>()

function getCircuitBreaker(key: string, options?: CircuitBreakerOptions): CircuitBreaker {
  if (!circuitBreakers.has(key)) {
    circuitBreakers.set(key, new CircuitBreaker(options))
  }
  return circuitBreakers.get(key)!
}

function calculateDelay(attempt: number, options: RetryOptions): number {
  let delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1)
  delay = Math.min(delay, options.maxDelayMs)
  
  if (options.jitter) {
    // Add ±25% jitter to prevent thundering herd
    const jitterAmount = delay * 0.25
    delay += (Math.random() - 0.5) * 2 * jitterAmount
  }
  
  return Math.max(0, delay)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  circuitBreakerKey?: string
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: any

  // Use circuit breaker if key provided
  const circuitBreaker = circuitBreakerKey 
    ? getCircuitBreaker(circuitBreakerKey) 
    : null

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const executeOperation = async () => {
        if (circuitBreaker) {
          return await circuitBreaker.execute(operation)
        }
        return await operation()
      }

      return await executeOperation()
    } catch (error) {
      lastError = error
      
      // Check if we should retry this error
      if (!opts.retryCondition!(error)) {
        throw error
      }

      // Don't wait on the last attempt
      if (attempt === opts.maxAttempts) {
        break
      }

      const delay = calculateDelay(attempt, opts)
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error?.message || error)
      
      await sleep(delay)
    }
  }

  throw lastError
}

// Specialized retry functions for different services
export const retryOpenAI = <T>(operation: () => Promise<T>) =>
  withRetry(
    operation,
    {
      maxAttempts: 3,
      initialDelayMs: 2000,
      maxDelayMs: 30000,
      retryCondition: (error) => {
        // Retry on rate limits and server errors
        return error?.status === 429 || error?.status >= 500
      }
    },
    'openai'
  )

export const retrySupabase = <T>(operation: () => Promise<T>) =>
  withRetry(
    operation,
    {
      maxAttempts: 3,
      initialDelayMs: 500,
      maxDelayMs: 5000,
      retryCondition: (error) => {
        // Retry on connection errors and server errors
        const retryableCodes = ['PGRST301', 'PGRST302', 'connection_error']
        return error?.status >= 500 || retryableCodes.includes(error?.code)
      }
    },
    'supabase'
  )

export const retryGoogleCalendar = <T>(operation: () => Promise<T>) =>
  withRetry(
    operation,
    {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      retryCondition: (error) => {
        // Retry on rate limits and server errors
        return error?.code === 429 || error?.code >= 500
      }
    },
    'google-calendar'
  )

export const retryResend = <T>(operation: () => Promise<T>) =>
  withRetry(
    operation,
    {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 15000,
      retryCondition: (error) => {
        // Retry on rate limits and server errors, but not validation errors
        return error?.name === 'rate_limit_exceeded' || 
               (error?.status >= 500 && error?.name !== 'validation_error')
      }
    },
    'resend'
  )

// Utility to get circuit breaker status for monitoring
export function getCircuitBreakerStatus(): Record<string, { state: CircuitState; failureCount: number }> {
  const status: Record<string, { state: CircuitState; failureCount: number }> = {}
  
  for (const [key, breaker] of circuitBreakers.entries()) {
    status[key] = {
      state: breaker.getState(),
      failureCount: breaker.getFailureCount()
    }
  }
  
  return status
}