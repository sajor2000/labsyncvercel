import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

// Helper function to get client identifier for rate limiting
function getClientIdentifier(request: NextRequest): string {
  // Get the real IP, handling proxy headers securely
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfIp = request.headers.get('cf-connecting-ip')
  
  // Use the first IP from x-forwarded-for (most reliable)
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIp ?? cfIp ?? '127.0.0.1'
}

// Helper function to determine if path should skip middleware
function shouldSkipMiddleware(pathname: string): boolean {
  const skipPaths = [
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/images/',
    '/fonts/',
    '/api/health',
    '/api/robots',
    '/api/sitemap',
  ]
  return skipPaths.some(path => pathname.startsWith(path))
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Skip middleware for static assets and health checks
  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next()
  }

  // Use official Supabase SSR middleware pattern
  return await updateSession(request)
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
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf)$).*)',
  ],
}