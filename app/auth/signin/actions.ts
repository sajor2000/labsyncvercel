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

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim(),
  })

  if (error) {
    console.error('Signin error:', error)
    redirect('/auth/signin?error=' + encodeURIComponent(error.message))
  }

  if (!data.user) {
    redirect('/auth/signin?error=authentication_failed')
  }

  console.log('✅ Server-side signin successful for:', data.user.email)
  
  // MCP Best Practice: revalidate path before redirect
  revalidatePath('/', 'layout')
  redirect('/dashboard')
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
    redirect('/auth/signup?error=' + encodeURIComponent(error.message))
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
      redirect('/auth/forgot-password?error=' + encodeURIComponent(error.message))
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