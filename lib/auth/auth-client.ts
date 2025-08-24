/**
 * Simplified Authentication client for client-side operations
 * Main auth flows now use MCP-compliant server actions
 */

import { createClient } from '@/lib/supabase/client'
import type { User, AuthError } from '@supabase/supabase-js'

class AuthClient {
  private supabase = createClient()

  /**
   * Get current user (client-side)
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }

  /**
   * Get current session (client-side)
   */
  async getSession() {
    const { data: { session } } = await this.supabase.auth.getSession()
    return session
  }

  /**
   * Sign out current user (client-side)
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.auth.signOut()
    return { error }
  }

  /**
   * Listen to auth state changes (client-side)
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }

  /**
   * Update password (client-side - for authenticated users)
   */
  async updatePassword(password: string): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.auth.updateUser({ password })
    return { error }
  }
}

export const authClient = new AuthClient()