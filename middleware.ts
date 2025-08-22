import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { 
  updateSession, 
  isProtectedRoute, 
  isAuthRoute, 
  createAuthRedirect, 
  createDashboardRedirect 
} from './lib/supabase/middleware'

// Helper function to get client identifier for rate limiting
function getClientIdentifier(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] ?? 
         request.headers.get('x-real-ip') ?? 
         request.headers.get('cf-connecting-ip') ??
         '127.0.0.1'
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
  
  // Content Security Policy - optimized for production
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.vercel.app https://vercel.live https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' blob: data:",
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://www.googleapis.com https://api.resend.com wss://*.supabase.co https://*.vercel-insights.com https://vitals.vercel-insights.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]
  
  if (process.env.NODE_ENV === 'production') {
    csp.push("upgrade-insecure-requests")
  }
  
  response.headers.set('Content-Security-Policy', csp.join('; '))

  // Handle Supabase auth session only for non-API routes
  // This reduces Edge runtime issues with Supabase
  if (!pathname.startsWith('/api/')) {
    try {
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
    } catch (error) {
      console.error('Middleware auth error:', error)
      // Continue without auth check if there's an error
    }
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
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf)$).*)',
  ],
}