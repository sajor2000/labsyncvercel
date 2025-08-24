import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signIn(formData: FormData) {
  'use server'

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/auth/signin?error=missing_credentials')
  }

  try {
    const supabase = await createClient()

    console.log('🔑 Attempting signin for:', email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })

    if (error) {
      console.error('❌ Signin error:', {
        message: error.message,
        status: error.status,
        name: error.name
      })
      
      // Handle specific error cases
      if (error.message.includes('Invalid login credentials')) {
        redirect('/auth/signin?error=invalid_credentials')
      } else if (error.message.includes('Email not confirmed')) {
        redirect('/auth/signin?error=email_not_confirmed')
      } else if (error.message.includes('Too many requests')) {
        redirect('/auth/signin?error=too_many_requests')
      } else {
        redirect(`/auth/signin?error=${encodeURIComponent(error.message)}`)
      }
    }

    if (!data.user) {
      console.error('❌ No user data returned from signin')
      redirect('/auth/signin?error=no_user_data')
    }

    console.log('✅ Server-side signin successful for:', data.user.email)
    
    // MCP Best Practice: revalidate path before redirect
    revalidatePath('/', 'layout')
    redirect('/dashboard')
    
  } catch (serverError: any) {
    console.error('❌ Server error during signin:', serverError)
    redirect(`/auth/signin?error=server_error: ${encodeURIComponent(serverError.message)}`)
  }
}

export async function signUp(formData: FormData) {
  'use server'

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string

  if (!email || !password || !firstName || !lastName) {
    redirect('/auth/signup?error=missing_fields')
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password.trim(),
    options: {
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://labsync-production.vercel.app'}/auth/callback`
    },
  })

  if (error) {
    console.error('Signup error:', error)
    // MCP Pattern: Simple error redirect
    redirect('/auth/signup?error=signup_failed')
  }

  console.log('✅ Server-side signup successful for:', email)
  
  // MCP Best Practice: revalidate path before redirect
  revalidatePath('/', 'layout')
  redirect('/auth/signin?message=signup_success')
}

export async function requestPasswordReset(formData: FormData) {
  'use server'
  
  const supabase = await createClient()
  const email = formData.get('email') as string
  
  if (!email) {
    redirect('/auth/forgot-password?error=missing_email')
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect('/auth/forgot-password?error=invalid_email')
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://labsync-production.vercel.app'}/auth/update-password`
    })

    if (error) {
      console.error('MCP Password reset error:', error)
      redirect('/auth/forgot-password?error=reset_failed')
    }

    console.log('✅ MCP Password reset email sent to:', email)
    
    // MCP Best Practice: revalidate path before redirect
    revalidatePath('/', 'layout')
    redirect('/auth/forgot-password?message=reset_sent&email=' + encodeURIComponent(email))

  } catch (error: any) {
    console.error('MCP Password reset exception:', error)
    redirect('/auth/forgot-password?error=server_error')
  }
}