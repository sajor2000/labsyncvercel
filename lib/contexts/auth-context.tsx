'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { profileHandler } from '@/lib/auth/profile-handler'

interface UserProfile {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  created_at: string
  updated_at: string
}

interface LabMembership {
  lab_id: string
  role: string
  joined_at: string
  lab: {
    id: string
    name: string
    description?: string | null
  }
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  labMemberships: LabMembership[]
  currentLab: LabMembership | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  refreshProfile: () => Promise<void>
  setCurrentLab: (labId: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [labMemberships, setLabMemberships] = useState<LabMembership[]>([])
  const [currentLab, setCurrentLabState] = useState<LabMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.warn('No profile found for user, will be created on first dashboard visit:', profileError)
        // Don't throw error - user can still authenticate
        setProfile(null)
        return
      }
      setProfile(profileData)

      // Fetch lab memberships with lab details
      const { data: memberships, error: membershipError } = await supabase
        .from('lab_members')
        .select(`
          lab_id,
          role,
          joined_at,
          lab:labs (
            id,
            name,
            description
          )
        `)
        .eq('user_id', userId)
        .is('removed_at', null)

      if (membershipError) throw membershipError
      
      const formattedMemberships = memberships?.map(m => ({
        lab_id: m.lab_id,
        role: m.role,
        joined_at: m.joined_at,
        lab: Array.isArray(m.lab) ? m.lab[0] : m.lab
      })) || []
      
      setLabMemberships(formattedMemberships)

      // Set current lab from localStorage or first membership
      const savedLabId = localStorage.getItem('currentLabId')
      const savedLab = formattedMemberships.find(m => m.lab_id === savedLabId)
      
      if (savedLab) {
        setCurrentLabState(savedLab)
      } else if (formattedMemberships.length > 0) {
        setCurrentLabState(formattedMemberships[0])
        localStorage.setItem('currentLabId', formattedMemberships[0].lab_id)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }, [supabase])

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          await fetchProfile(user.id)
        }
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLabMemberships([])
          setCurrentLabState(null)
        }
        
        if (event === 'SIGNED_IN') {
          console.log('✅ User signed in, redirecting to dashboard')
          // Broadcast auth state change to other tabs
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('auth-event', JSON.stringify({
              event: 'SIGNED_IN',
              timestamp: Date.now(),
              userId: session?.user?.id
            }))
          }
          router.push('/dashboard')
        } else if (event === 'SIGNED_OUT') {
          console.log('🔓 User signed out')
          // Broadcast auth state change to other tabs
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('auth-event', JSON.stringify({
              event: 'SIGNED_OUT',
              timestamp: Date.now()
            }))
          }
          router.push('/auth/signin')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, fetchProfile])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    if (error) throw error
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    localStorage.removeItem('currentLabId')
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const setCurrentLab = (labId: string) => {
    const lab = labMemberships.find(m => m.lab_id === labId)
    if (lab) {
      setCurrentLabState(lab)
      localStorage.setItem('currentLabId', labId)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        labMemberships,
        currentLab,
        loading,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
        setCurrentLab,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}