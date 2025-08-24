import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🏥 Running comprehensive health check...')
    
    const healthCheck = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      services: {} as any,
      overall: { status: 'unknown', errors: [] as string[] },
      summary: {} as any,
      recommendations: [] as string[]
    }
    
    // Test all services in parallel for speed
    const testPromises = [
      // Supabase test
      fetch('http://localhost:3001/api/test-supabase')
        .then(res => res.json())
        .then(data => ({ service: 'supabase', ...data }))
        .catch(error => ({ service: 'supabase', success: false, error: error.message })),
      
      // OpenAI test  
      fetch('http://localhost:3001/api/test-openai')
        .then(res => res.json())
        .then(data => ({ service: 'openai', ...data }))
        .catch(error => ({ service: 'openai', success: false, error: error.message })),
      
      // Redis test
      fetch('http://localhost:3001/api/test-redis')
        .then(res => res.json())
        .then(data => ({ service: 'redis', ...data }))
        .catch(error => ({ service: 'redis', success: false, error: error.message })),
      
      // Google Calendar test
      fetch('http://localhost:3001/api/test-google-calendar')
        .then(res => res.json())
        .then(data => ({ service: 'google_calendar', ...data }))
        .catch(error => ({ service: 'google_calendar', success: false, error: error.message })),
      
      // Email test
      fetch('http://localhost:3001/api/test-email')
        .then(res => res.json())
        .then(data => ({ service: 'email', ...data }))
        .catch(error => ({ service: 'email', success: false, error: error.message }))
    ]
    
    console.log('⚡ Running all integration tests in parallel...')
    const startTime = Date.now()
    
    const results = await Promise.allSettled(testPromises)
    const totalTime = Date.now() - startTime
    
    // Process results
    let successCount = 0
    let criticalErrors = 0
    let warnings = 0
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const testResult = result.value
        healthCheck.services[testResult.service] = {
          status: testResult.success ? '✅ Healthy' : '❌ Failed',
          ...testResult
        }
        
        if (testResult.success) {
          successCount++
        } else {
          // Categorize errors
          if (['supabase', 'redis'].includes(testResult.service)) {
            criticalErrors++
            healthCheck.overall.errors.push(`${testResult.service}: ${testResult.error}`)
          } else {
            warnings++
          }
        }
      } else {
        const services = ['supabase', 'openai', 'redis', 'google_calendar', 'email']
        const serviceName = services[index]
        healthCheck.services[serviceName] = {
          status: '💥 Test Failed',
          success: false,
          error: result.reason?.message || 'Test execution failed'
        }
        criticalErrors++
      }
    })
    
    // Determine overall health
    if (criticalErrors === 0) {
      healthCheck.overall.status = warnings === 0 ? '✅ All Systems Healthy' : '⚠️ Healthy with Warnings'
    } else {
      healthCheck.overall.status = '❌ System Issues Detected'
    }
    
    // Add summary
    healthCheck.summary = {
      totalTests: results.length,
      successful: successCount,
      failed: results.length - successCount,
      criticalErrors,
      warnings,
      testTime: totalTime + 'ms'
    }
    
    // Add recommendations
    healthCheck.recommendations = []
    if (criticalErrors > 0) {
      healthCheck.recommendations.push('🚨 Critical services failing - check database and Redis connections')
    }
    if (warnings > 0) {
      healthCheck.recommendations.push('⚠️ Some services have limited functionality - check API keys and configurations')
    }
    if (successCount === results.length) {
      healthCheck.recommendations.push('🎉 All integrations working perfectly! Ready for production.')
    }
    
    console.log('✅ Health check completed:', healthCheck.overall.status)
    console.log('📊 Summary:', healthCheck.summary)
    
    return NextResponse.json(healthCheck, {
      status: criticalErrors > 0 ? 500 : (warnings > 0 ? 200 : 200)
    })
    
  } catch (error) {
    console.error('💥 Health check failed:', error)
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overall: { status: '💥 Health Check Failed' },
      error: 'Failed to execute health check',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}