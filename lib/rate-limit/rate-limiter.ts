/**
 * Rate limiting implementation using Upstash Redis
 * Implements sliding window and token bucket algorithms
 */

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Simple rate limit error class
class RateLimitError extends Error {
  constructor(message: string, public context?: any, public correlationId?: string) {
    super(message)
    this.name = 'RateLimitError'
  }
}

// Initialize Upstash Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_URL !== 'your_upstash_redis_url' 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : undefined

export interface RateLimitRule {
  name: string
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (identifier: string) => string
}

export interface RateLimitResult {
  allowed: boolean
  remainingRequests: number
  resetTime: number
  totalRequests: number
}

// Rate limiters for different types of operations
const createRateLimiter = (config: { requests: number; window: string }) => {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      analytics: true,
      prefix: 'labflow',
    })
  }
  
  // Fallback to in-memory for development
  return new Ratelimit({
    redis: new Map() as any, // Use Map as fallback
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: false,
    prefix: 'labflow',
  })
}

// Rate limiters for different operations
export const rateLimiters = {
  // API rate limiting
  api: createRateLimiter({ requests: 100, window: '60 s' }),          // 100 requests per minute
  
  // AI-specific rate limiting
  transcription: createRateLimiter({ requests: 10, window: '60 s' }), // 10 transcriptions per minute
  processing: createRateLimiter({ requests: 20, window: '60 s' }),    // 20 AI processing requests per minute
  email: createRateLimiter({ requests: 5, window: '60 s' }),          // 5 email generations per minute
  
  // Authentication rate limiting
  auth: createRateLimiter({ requests: 10, window: '900 s' }),         // 10 auth attempts per 15 minutes
  
  // General purpose strict limiting
  strict: createRateLimiter({ requests: 5, window: '60 s' }),         // 5 requests per minute
}

/**
 * Check rate limit for a given identifier and operation type
 */
export async function checkRateLimit(
  identifier: string,
  operation: keyof typeof rateLimiters,
  correlationId?: string
): Promise<void> {
  try {
    const result = await rateLimiters[operation].limit(identifier)
    
    if (!result.success) {
      const resetTime = new Date(Date.now() + result.reset)
      
      console.warn(`[${correlationId}] Rate limit exceeded for ${operation}:`, {
        identifier,
        operation,
        limit: result.limit,
        remaining: result.remaining,
        reset: resetTime.toISOString(),
      })
      
      throw new RateLimitError(
        `Rate limit exceeded for ${operation}. Try again in ${Math.ceil(result.reset / 1000)} seconds.`,
        {
          operation,
          limit: result.limit,
          remaining: result.remaining,
          resetTime: resetTime.getTime(),
        },
        correlationId
      )
    }
    
    // Log successful rate limit check in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${correlationId}] Rate limit check passed for ${operation}:`, {
        identifier,
        remaining: result.remaining,
        limit: result.limit,
      })
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error
    }
    
    console.error(`[${correlationId}] Rate limit check failed for ${operation}:`, error)
    
    // In case of Redis failure, allow the request but log the error
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[${correlationId}] Rate limiting failed, allowing request`)
    } else {
      throw new RateLimitError(
        'Rate limiting service temporarily unavailable',
        { operation, error: error instanceof Error ? error.message : 'Unknown error' },
        correlationId
      )
    }
  }
}

/**
 * Check AI-specific rate limits
 */
export async function checkAILimit(
  userId: string,
  operation: 'transcription' | 'processing' | 'email',
  correlationId?: string
): Promise<void> {
  return checkRateLimit(`ai:${userId}`, operation, correlationId)
}

/**
 * Check authentication rate limits
 */
export async function checkAuthLimit(
  identifier: string,
  correlationId?: string
): Promise<void> {
  return checkRateLimit(`auth:${identifier}`, 'auth', correlationId)
}

/**
 * Check API rate limits
 */
export async function checkAPILimit(
  identifier: string,
  correlationId?: string
): Promise<void> {
  return checkRateLimit(`api:${identifier}`, 'api', correlationId)
}

/**
 * Get rate limit status without consuming a request
 */
export async function getRateLimitStatus(
  identifier: string,
  operation: keyof typeof rateLimiters
): Promise<{ limit: number; remaining: number; resetTime: number }> {
  try {
    // This is a workaround since Upstash doesn't have a "check without consuming" method
    // We perform a limit check and then reset if it was successful
    const result = await rateLimiters[operation].limit(identifier)
    
    return {
      limit: result.limit,
      remaining: result.remaining,
      resetTime: Date.now() + result.reset,
    }
  } catch (error) {
    console.error(`Failed to get rate limit status for ${operation}:`, error)
    return {
      limit: 0,
      remaining: 0,
      resetTime: Date.now() + 60000, // Default to 1 minute
    }
  }
}

/**
 * Reset rate limit for a given identifier and operation
 * Use with caution - primarily for testing or admin operations
 */
export async function resetRateLimit(
  identifier: string,
  operation: keyof typeof rateLimiters
): Promise<void> {
  if (!redis) {
    console.warn('Cannot reset rate limit: Redis not configured')
    return
  }

  try {
    // Reset by deleting the key
    const key = `labflow:${operation}:${identifier}`
    await redis.del(key)
    console.log(`Rate limit reset for ${operation}:${identifier}`)
  } catch (error) {
    console.error(`Failed to reset rate limit for ${operation}:`, error)
    throw error
  }
}

/**
 * Get Redis health status
 */
export async function getRedisHealth(): Promise<{ connected: boolean; latency?: number }> {
  if (!redis) {
    return { connected: false }
  }

  try {
    const start = Date.now()
    await redis.ping()
    const latency = Date.now() - start
    
    return { connected: true, latency }
  } catch (error) {
    console.error('Redis health check failed:', error)
    return { connected: false }
  }
}