import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Database } from './lib/supabase/database.types'
import { 
  updateSession, 
  isProtectedRoute, 
  isAuthRoute, 
  createAuthRedirect, 
  createDashboardRedirect 
} from './lib/supabase/middleware'
import { checkRateLimit } from './lib/rate-limit/rate-limiter'

// Helper function to get client identifier for rate limiting
function getClientIdentifier(request: NextRequest): string {
  return request.ip ?? 
         request.headers.get('x-forwarded-for')?.split(',')[0] ?? 
         request.headers.get('x-real-ip') ?? 
         '127.0.0.1'
}

// Helper function to determine rate limit operation type
function getRateLimitOperation(pathname: string): 'api' | 'auth' | 'strict' | null {
  if (pathname.startsWith('/api/ai/')) {
    return 'strict' // AI routes get stricter limits
  }
  if (pathname.startsWith('/api/auth/')) {
    return 'auth'
  }
  if (pathname.startsWith('/api/')) {
    return 'api'
  }
  return null
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const clientId = getClientIdentifier(request)
  const operation = getRateLimitOperation(pathname)

  // Rate limiting check for API routes
  if (operation) {
    try {
      await checkRateLimit(`middleware:${clientId}`, operation)
    } catch (error) {
      console.warn('Rate limit exceeded in middleware:', {
        pathname,
        clientId,
        operation,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          message: 'Too many requests. Please try again later.' 
        }), 
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Error': 'true',
          }
        }
      )
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.vercel.app https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://www.googleapis.com https://api.resend.com wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)

  // Handle Supabase auth session
  const { response: authResponse, user, error } = await updateSession(request)
  response = authResponse

  // Check if route requires authentication
  if (!user && isProtectedRoute(pathname)) {
    return createAuthRedirect(request)
  }

  // Redirect logged-in users away from auth pages
  if (user && isAuthRoute(pathname)) {
    return createDashboardRedirect(request)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}