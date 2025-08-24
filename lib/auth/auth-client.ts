/**
 * Authentication client for Supabase auth operations
 * Provides a simplified interface for common auth operations
 */

import { createClient } from '@/lib/supabase/client'
import type { User, AuthError, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js'

export interface AuthResult {
  user: User | null
  error: AuthError | null
}

export interface SignUpResult {
  user: User | null
  error: AuthError | null
  needsEmailConfirmation?: boolean
}

class AuthClient {
  private supabase = createClient()

  /**
   * Sign in with email and password
   */
  async signIn(credentials: SignInWithPasswordCredentials): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword(credentials)
    return {
      user: data.user,
      error
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(credentials: SignUpWithPasswordCredentials): Promise<SignUpResult> {
    const { data, error } = await this.supabase.auth.signUp(credentials)
    return {
      user: data.user,
      error,
      needsEmailConfirmation: !data.session && !error
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.auth.signOut()
    return { error }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }

  /**
   * Get current session
   */
  async getSession() {
    const { data: { session } } = await this.supabase.auth.getSession()
    return session
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    return { error }
  }

  /**
   * Update password
   */
  async updatePassword(password: string): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.auth.updateUser({ password })
    return { error }
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithProvider(provider: 'google' | 'github') {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    return { error }
  }

  /**
   * Sign in with Google specifically 
   */
  async signInWithGoogle() {
    return this.signInWithProvider('google')
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

export const authClient = new AuthClient()