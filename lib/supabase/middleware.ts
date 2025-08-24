import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Database } from './database.types'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user }, error } = await supabase.auth.getUser()

  if (user) {
    console.log('🔐 User authenticated:', user.email)
  }

  return { response, user, error, supabase }
}

export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/dashboard',
    '/meetings',
    '/tasks',
    '/team',
    '/studies',
    '/calendar',
    '/settings',
    '/profile',
    '/labs',
    '/ideas',
    '/analytics',
    '/api/ai',
    '/api/calendar',
    '/api/email',
  ]

  return protectedRoutes.some(route => pathname.startsWith(route))
}

export function isAuthRoute(pathname: string): boolean {
  const authRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/callback',
    '/auth/reset-password',
    '/auth/update-password',
    '/auth/verify-email',
    '/auth/forgot-password'
  ]
  return authRoutes.some(route => pathname.startsWith(route))
}

export function requiresLabMembership(pathname: string): boolean {
  // Routes that require lab membership (exclude join-lab page)
  const labRequiredRoutes = [
    '/dashboard/studies',
    '/dashboard/tasks',
    '/dashboard/team',
    '/dashboard/buckets',
    '/dashboard/ideas',
    '/dashboard/analytics',
    '/dashboard/files',
    '/dashboard/calendar',
    '/dashboard/standups',
    '/api/labs/',
    '/api/studies/',
    '/api/tasks/',
  ]
  
  return labRequiredRoutes.some(route => pathname.startsWith(route))
}

export function isJoinLabRoute(pathname: string): boolean {
  return pathname === '/dashboard/join-lab'
}

export function createAuthRedirect(request: NextRequest): NextResponse {
  const redirectUrl = new URL('/auth/signin', request.url)
  redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(redirectUrl)
}

export function createDashboardRedirect(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/dashboard', request.url))
}

export function createJoinLabRedirect(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/dashboard/join-lab', request.url))
}