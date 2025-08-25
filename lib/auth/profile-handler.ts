/**
 * Simple profile handler
 */

import { createClient } from '@/utils/supabase/client'

export const profileHandler = {
  async ensureProfile(userId: string, email: string) {
    const supabase = createClient()
    
    // Check if profile exists
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (!profile) {
      // Create profile
      await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email,
          full_name: email.split('@')[0] // Default name from email
        })
    }
    
    return profile
  }
}