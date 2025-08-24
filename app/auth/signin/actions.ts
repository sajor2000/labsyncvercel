import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

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
    },
  })

  if (error) {
    console.error('Signup error:', error)
    redirect('/auth/signup?error=' + encodeURIComponent(error.message))
  }

  console.log('✅ Server-side signup successful for:', email)
  redirect('/auth/signin?message=signup_success')
}