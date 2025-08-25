import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    database: ServiceStatus
    redis: ServiceStatus
    api: ServiceStatus
  }
  version: string
  environment: string
}

interface ServiceStatus {
  status: 'up' | 'down'
  responseTime?: number
  error?: string
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    
    // Simple query to verify database connection
    const { error } = await supabase
      .from('labs')
      .select('id')
      .limit(1)
      .single()
    
    // No data is fine, connection error is not
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    return {
      status: 'up',
      responseTime: Date.now() - start
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  // Redis removed - using simple in-memory rate limiting
  return {
    status: 'up',
    responseTime: 0
  }
}

export async function GET() {
  try {
    const [dbStatus, redisStatus] = await Promise.all([
      checkDatabase(),
      checkRedis()
    ])
    
    const allServicesUp = 
      dbStatus.status === 'up' && 
      redisStatus.status === 'up'
    
    const anyServiceDown = 
      dbStatus.status === 'down' || 
      redisStatus.status === 'down'
    
    const health: HealthCheck = {
      status: anyServiceDown ? 'unhealthy' : allServicesUp ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
        api: { status: 'up' }
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
    
    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': health.status
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: { status: 'down' },
          redis: { status: 'down' },
          api: { status: 'down' }
        },
        error: error instanceof Error ? error.message : 'Health check failed',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      { status: 503 }
    )
  }
}
