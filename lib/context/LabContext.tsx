'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { toast } from 'sonner'

// Types
interface Lab {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

interface LabMembership {
  id: string
  lab_id: string
  user_id: string
  role: string
  is_active: boolean
  permissions: Record<string, boolean>
  created_at: string
  updated_at: string
  labs: Lab
}

interface LabContextType {
  // State
  currentLab: Lab | null
  labMemberships: LabMembership[]
  isLoading: boolean
  
  // Actions
  switchLab: (labId: string) => Promise<void>
  refreshMemberships: () => Promise<void>
  joinLab: (inviteCode: string) => Promise<boolean>
  
  // Computed
  availableLabs: Lab[]
  userRole: string | null
  userPermissions: Record<string, boolean>
}

const LabContext = createContext<LabContextType | undefined>(undefined)

interface LabProviderProps {
  children: ReactNode
  user: User | null
}

export function LabProvider({ children, user }: LabProviderProps) {
  const [currentLab, setCurrentLab] = useState<Lab | null>(null)
  const [labMemberships, setLabMemberships] = useState<LabMembership[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Get stored lab from localStorage/server
  const getStoredLabId = (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('currentLabId')
  }

  // Store lab selection
  const storeLabId = (labId: string | null) => {
    if (typeof window === 'undefined') return
    if (labId) {
      localStorage.setItem('currentLabId', labId)
    } else {
      localStorage.removeItem('currentLabId')
    }
  }

  // Load user's lab memberships
  const loadLabMemberships = async (): Promise<LabMembership[]> => {
    if (!user) return []
    
    try {
      const { data, error } = await supabase
        .from('lab_members')
        .select(`
          *,
          labs:lab_id (
            id,
            name,
            description,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data as LabMembership[]
    } catch (error) {
      console.error('Error loading lab memberships:', error)
      toast.error('Failed to load lab memberships')
      return []
    }
  }

  // Switch to a specific lab
  const switchLab = async (labId: string): Promise<void> => {
    const membership = labMemberships.find(m => m.lab_id === labId)
    if (!membership) {
      toast.error('You are not a member of this lab')
      return
    }

    try {
      // Update current lab in state
      setCurrentLab(membership.labs)
      storeLabId(labId)

      // Update user profile with last selected lab
      const { error } = await supabase
        .from('user_profiles')
        .update({ last_selected_lab_id: labId })
        .eq('id', user?.id)

      if (error) {
        console.error('Error updating last selected lab:', error)
        // Don't throw error as the lab switch still works locally
      }

      toast.success(`Switched to ${membership.labs.name}`)
    } catch (error) {
      console.error('Error switching lab:', error)
      toast.error('Failed to switch lab')
    }
  }

  // Refresh lab memberships
  const refreshMemberships = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const memberships = await loadLabMemberships()
      setLabMemberships(memberships)

      // If no current lab is selected, try to restore from storage or select the first one
      if (!currentLab && memberships.length > 0) {
        const storedLabId = getStoredLabId()
        let targetLab: Lab | null = null

        if (storedLabId) {
          // Try to restore from storage
          const storedMembership = memberships.find(m => m.lab_id === storedLabId)
          targetLab = storedMembership?.labs || null
        }

        if (!targetLab) {
          // Fallback to first lab
          targetLab = memberships[0]?.labs || null
        }

        if (targetLab) {
          setCurrentLab(targetLab)
          storeLabId(targetLab.id)
        }
      }

      // If current lab is no longer in memberships, clear it
      if (currentLab && !memberships.find(m => m.lab_id === currentLab.id)) {
        setCurrentLab(null)
        storeLabId(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Join a lab using invite code
  const joinLab = async (inviteCode: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { data, error } = await supabase.rpc('join_lab_by_invite', {
        invite_code: inviteCode,
        user_id: user.id
      })

      if (error) throw error

      if (data?.success) {
        toast.success('Successfully joined lab!')
        await refreshMemberships()
        return true
      } else {
        toast.error(data?.message || 'Failed to join lab')
        return false
      }
    } catch (error: any) {
      console.error('Error joining lab:', error)
      toast.error(error.message || 'Failed to join lab')
      return false
    }
  }

  // Load memberships when user changes
  useEffect(() => {
    if (user) {
      refreshMemberships()
    } else {
      setLabMemberships([])
      setCurrentLab(null)
      setIsLoading(false)
    }
  }, [user])

  // Computed values
  const availableLabs = labMemberships.map(m => m.labs)
  const currentMembership = currentLab ? labMemberships.find(m => m.lab_id === currentLab.id) : null
  const userRole = currentMembership?.role || null
  const userPermissions = currentMembership?.permissions || {}

  const value: LabContextType = {
    currentLab,
    labMemberships,
    isLoading,
    switchLab,
    refreshMemberships,
    joinLab,
    availableLabs,
    userRole,
    userPermissions
  }

  return (
    <LabContext.Provider value={value}>
      {children}
    </LabContext.Provider>
  )
}

// Hook to use lab context
export function useLab(): LabContextType {
  const context = useContext(LabContext)
  if (context === undefined) {
    throw new Error('useLab must be used within a LabProvider')
  }
  return context
}

// Helper hook for lab-based queries
export function useLabFilter() {
  const { currentLab } = useLab()
  
  return {
    labId: currentLab?.id || null,
    hasLab: !!currentLab,
    // Helper to add lab filter to Supabase queries
    addLabFilter: (query: any) => {
      if (currentLab) {
        return query.eq('lab_id', currentLab.id)
      }
      return query
    }
  }
}