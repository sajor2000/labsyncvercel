import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // MCP Exact Pattern: Create supabaseResponse object
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // MCP Pattern: Update both request and supabaseResponse
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // MCP Critical: Do not run code between createServerClient and supabase.auth.getUser()
  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/auth']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route)
  )
  
  // Only redirect unauthenticated users if they're trying to access protected routes
  if (!user && !isPublicRoute) {
    // Security: Prevent open redirects by validating the redirect URL
    const url = request.nextUrl.clone()
    url.pathname = '/'
    // Clear any potentially malicious search params
    url.search = ''
    return NextResponse.redirect(url)
  }

  // MCP Critical: Return supabaseResponse object exactly as specified
  return supabaseResponse
}