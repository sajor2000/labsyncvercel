'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// MCP Exact Pattern: Simple login action
export async function login(formData: FormData) {
  const supabase = await createClient()

  // Basic validation
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/auth/signin?error=missing_credentials')
  }

  console.log('🔑 [MCP] Attempting login for:', email)

  // MCP Pattern: Simple auth call
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim(),
  })

  console.log('🔑 [MCP] Auth response:', { 
    hasUser: !!data?.user, 
    hasSession: !!data?.session,
    hasError: !!error,
    errorMessage: error?.message 
  })

  if (error) {
    console.error('❌ [MCP] Auth error:', error)
    
    // Handle specific common errors
    if (error.message.includes('Invalid login credentials')) {
      redirect('/auth/signin?error=invalid_credentials')
    }
    if (error.message.includes('Email not confirmed')) {
      redirect('/auth/signin?error=email_not_confirmed')
    }
    if (error.message.includes('Too many requests')) {
      redirect('/auth/signin?error=too_many_requests')
    }
    
    // Generic error
    redirect('/auth/signin?error=login_failed')
  }

  if (!data?.user) {
    console.error('❌ [MCP] No user returned')
    redirect('/auth/signin?error=no_user_returned')
  }

  console.log('✅ [MCP] Login successful for:', data.user.email)

  // Determine if this is a new or returning user based on profile and lab memberships
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, onboarding_completed')
      .eq('id', data.user.id)
      .single()

    const { data: memberships } = await supabase
      .from('lab_members')
      .select('lab_id')
      .eq('user_id', data.user.id)
      .eq('is_active', true)
      .limit(1)

    const isNewUser = !profile || !profile.onboarding_completed || !memberships || memberships.length === 0

    if (isNewUser) {
      console.log('🆕 [MCP] New user detected, redirecting to create/join lab flow')
      revalidatePath('/', 'layout')
      redirect('/dashboard/join-lab')
    } else {
      console.log('🔄 [MCP] Returning user, redirecting to lab selection dashboard')
      revalidatePath('/', 'layout')
      redirect('/dashboard')
    }
  } catch (error) {
    console.warn('⚠️ [MCP] Failed to determine user type, defaulting to lab selection')
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  }
}

// MCP Exact Pattern: Simple signup action  
export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string

  if (!email || !password || !firstName || !lastName) {
    redirect('/auth/signup?error=missing_fields')
  }

  console.log('📝 [MCP] Attempting signup for:', email)

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password.trim(),
    options: {
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://labsync-rush.vercel.app'}/auth/callback`
    },
  })

  console.log('📝 [MCP] Signup response:', { 
    hasUser: !!data?.user, 
    hasSession: !!data?.session,
    hasError: !!error,
    errorMessage: error?.message 
  })

  if (error) {
    console.error('❌ [MCP] Signup error:', error)
    redirect('/auth/signup?error=signup_failed')
  }

  console.log('✅ [MCP] Signup successful for:', email)

  // Handle email confirmation scenario
  if (data?.user && !data?.session) {
    console.log('📧 [MCP] Email confirmation required')
    revalidatePath('/', 'layout')
    redirect('/auth/signin?message=check_email')
  }

  // New user successfully signed up and confirmed - redirect to create/join lab
  console.log('🆕 [MCP] New user signup complete, redirecting to create/join lab flow')
  revalidatePath('/', 'layout')
  redirect('/dashboard/join-lab')
}

// Simple password reset
export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  
  if (!email) {
    redirect('/auth/forgot-password?error=missing_email')
  }

  console.log('🔄 [MCP] Requesting password reset for:', email)

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://labsync-rush.vercel.app'}/auth/update-password`
  })

  if (error) {
    console.error('❌ [MCP] Password reset error:', error)
    redirect('/auth/forgot-password?error=reset_failed')
  }

  console.log('✅ [MCP] Password reset email sent')
  revalidatePath('/', 'layout')
  redirect('/auth/forgot-password?message=reset_sent&email=' + encodeURIComponent(email))
}