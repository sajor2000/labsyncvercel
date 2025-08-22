'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SentryService } from '@/lib/monitoring/sentry-service'
import { User } from '@supabase/supabase-js'

interface SentryUserProviderProps {
  children: React.ReactNode
}

export function SentryUserProvider({ children }: SentryUserProviderProps) {
  useEffect(() => {
    const supabase = createClient()

    // Get current user and set Sentry context
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await setUserContext(user)
      }
    }

    getCurrentUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await setUserContext(session.user)
        } else if (event === 'SIGNED_OUT') {
          SentryService.clearUser()
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const setUserContext = async (user: User) => {
    try {
      const supabase = createClient()
      
      // Get user profile and lab memberships
      const [profileResult, labMembershipsResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('name, first_name, last_name, title, department')
          .eq('id', user.id)
          .single(),
        supabase
          .from('lab_members')
          .select(`
            lab_role,
            is_active,
            labs(name)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
      ])

      const profile = profileResult.data
      const labMemberships = labMembershipsResult.data || []
      const primaryLab = labMemberships[0]

      SentryService.setUser({
        id: user.id,
        email: user.email,
        username: profile?.name || user.email?.split('@')[0],
        lab: primaryLab?.labs?.name,
        role: primaryLab?.lab_role,
      })

      // Add breadcrumb for user context
      SentryService.addBreadcrumb(
        'User context set in Sentry',
        'auth',
        {
          userId: user.id,
          labCount: labMemberships.length,
          hasProfile: !!profile,
        }
      )

    } catch (error) {
      console.warn('Failed to set Sentry user context:', error)
      
      // Fallback to basic user info
      SentryService.setUser({
        id: user.id,
        email: user.email,
        username: user.email?.split('@')[0],
      })
    }
  }

  return <>{children}</>
}