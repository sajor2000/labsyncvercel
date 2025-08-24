import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/dashboard'

  // Handle auth errors (like expired OTP)
  if (error) {
    console.error('❌ Auth error received:', error, errorDescription)
    const errorMessage = error === 'access_denied' && errorDescription?.includes('expired') 
      ? 'reset_link_expired' 
      : error
    return NextResponse.redirect(new URL(`/auth/signin?error=${errorMessage}`, request.url))
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log('✅ Code exchange successful, redirecting to:', next)
      return NextResponse.redirect(new URL(next, request.url))
    }
    
    console.error('❌ Code exchange failed:', error)
    return NextResponse.redirect(new URL('/auth/signin?error=callback_failed', request.url))
  }

  // No code provided
  return NextResponse.redirect(new URL('/auth/signin?error=no_code', request.url))
}
