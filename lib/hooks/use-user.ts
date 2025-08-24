'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  last_selected_lab_id?: string | null
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const getUser = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError) throw authError
        
        if (authUser && mounted) {
          // Get user profile for additional data
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('last_selected_lab_id')
            .eq('id', authUser.id)
            .single()

          setUser({
            id: authUser.id,
            email: authUser.email!,
            last_selected_lab_id: profile?.last_selected_lab_id
          })
        } else if (mounted) {
          setUser(null)
        }
      } catch (err: any) {
        if (mounted) {
          console.error('Error fetching user:', err)
          setError(err.message)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user && mounted) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          last_selected_lab_id: null
        })
      } else if (event === 'SIGNED_OUT' && mounted) {
        setUser(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  return { user, loading, error }
}