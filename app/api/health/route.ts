import { NextRequest, NextResponse } from 'next/server'
import { getRedisHealth } from '../../../lib/rate-limit/rate-limiter'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy' as 'healthy' | 'unhealthy',
    services: {
      redis: { status: 'unknown' as 'connected' | 'disconnected' | 'unknown', latency: undefined as number | undefined },
      sentry: { configured: false, environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development' },
      database: { status: 'not_checked' }, // We'll skip database check for now
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      nextjsVersion: process.env.npm_package_version,
      platform: process.platform,
    }
  }

  // Check Redis/Upstash connection
  try {
    const redisHealth = await getRedisHealth()
    checks.services.redis.status = redisHealth.connected ? 'connected' : 'disconnected'
    checks.services.redis.latency = redisHealth.latency
    
    if (!redisHealth.connected) {
      checks.status = 'unhealthy'
    }
  } catch (error) {
    checks.services.redis.status = 'disconnected'
    checks.status = 'unhealthy'
    console.error('Redis health check failed:', error)
  }

  // Check Sentry configuration
  try {
    checks.services.sentry.configured = Boolean(
      process.env.NEXT_PUBLIC_SENTRY_DSN && 
      process.env.NEXT_PUBLIC_SENTRY_DSN !== 'your_sentry_dsn'
    )

    // Test Sentry by capturing a test message (only in development)
    if (process.env.NODE_ENV === 'development' && checks.services.sentry.configured) {
      Sentry.addBreadcrumb({
        message: 'Health check performed',
        level: 'info',
        timestamp: Date.now() / 1000,
      })
    }
  } catch (error) {
    console.error('Sentry health check failed:', error)
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503

  return NextResponse.json(checks, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  })
}

// Test endpoint for intentional errors (development only)
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    const { errorType } = await request.json()

    switch (errorType) {
      case 'test_sentry':
        throw new Error('Test error for Sentry integration')
      
      case 'test_rate_limit':
        // This will trigger rate limiting
        const { checkRateLimit } = await import('../../../lib/rate-limit/rate-limiter')
        await checkRateLimit('test-client', 'strict')
        return NextResponse.json({ message: 'Rate limit check passed' })
      
      default:
        return NextResponse.json({ 
          availableTests: ['test_sentry', 'test_rate_limit'],
          usage: 'POST /api/health with { "errorType": "test_sentry" }'
        })
    }
  } catch (error) {
    // This should be caught by Sentry
    console.error('Test error:', error)
    
    return NextResponse.json({
      message: 'Test error triggered successfully',
      error: error instanceof Error ? error.message : 'Unknown error',
      sentryEnabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)
    }, { status: 500 })
  }
}