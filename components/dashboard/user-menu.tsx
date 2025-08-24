'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useLab } from '@/lib/context/LabContext'
import { UserAvatar } from '@/components/ui/user-avatar'
import { 
  LogOut, 
  Settings, 
  User, 
  Mail,
  Building2,
  ChevronDown,
  Check
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const { currentLab, labMemberships, availableLabs, switchLab, userRole } = useLab()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return

      setUser(user)

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      router.push('/auth/signin')
      toast.success('Signed out successfully')
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error(error.message || 'Failed to sign out')
    }
  }

  const handleLabSwitch = async (labId: string) => {
    try {
      await switchLab(labId)
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Lab switch error:', error)
    }
  }

  if (!user || !userProfile) return null

  const userDisplayName = userProfile?.first_name && userProfile?.last_name
    ? `${userProfile.first_name} ${userProfile.last_name}`
    : userProfile?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 text-white hover:bg-slate-700 rounded-lg transition-colors"
      >
        <UserAvatar 
          user={userProfile}
          currentLab={currentLab}
          userRole={userRole}
          size="sm"
          showLabBadge={true}
          showLabName={false}
        />
        <div className="flex flex-col items-start text-left min-w-0">
          <span className="text-sm font-medium text-white truncate">
            {userDisplayName}
          </span>
          {currentLab && userRole && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400 truncate">
                {currentLab.name}
              </span>
            </div>
          )}
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50">
            {/* User Info */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <UserAvatar 
                  user={userProfile}
                  currentLab={currentLab}
                  userRole={userRole}
                  size="md"
                  showLabBadge={true}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {userDisplayName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user.email}
                  </p>
                  {currentLab && userRole && (
                    <p className="text-xs text-slate-500 truncate">
                      {userRole.replace('_', ' ')} • {currentLab.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Lab Switcher (if multiple labs) */}
            {availableLabs.length > 1 && (
              <>
                <div className="p-2 border-b border-slate-700">
                  <div className="text-xs font-medium text-slate-400 px-2 py-1 mb-1">Switch Lab</div>
                  <div className="space-y-1">
                    {availableLabs.map((lab) => {
                      const membership = labMemberships.find(m => m.lab_id === lab.id)
                      const isActive = currentLab?.id === lab.id
                      
                      return (
                        <button
                          key={lab.id}
                          onClick={() => handleLabSwitch(lab.id)}
                          className="w-full flex items-center justify-between px-2 py-2 text-sm text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <div className="flex flex-col items-start min-w-0">
                            <span className="truncate">{lab.name}</span>
                            {membership && (
                              <span className="text-xs text-slate-400 truncate">
                                {membership.role.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          {isActive && (
                            <Check className="h-4 w-4 text-violet-400 ml-2 flex-shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Menu Items */}
            <div className="p-2">
              <button
                onClick={() => {
                  setOpen(false)
                  router.push('/dashboard/profile')
                }}
                className="w-full flex items-center gap-3 px-2 py-2 text-sm text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <User className="h-4 w-4 text-slate-400" />
                Profile
              </button>

              <button
                onClick={() => {
                  setOpen(false)
                  router.push('/dashboard/settings')
                }}
                className="w-full flex items-center gap-3 px-2 py-2 text-sm text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                Settings
              </button>

              <button
                onClick={() => {
                  setOpen(false)
                  router.push('/dashboard/labs')
                }}
                className="w-full flex items-center gap-3 px-2 py-2 text-sm text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Building2 className="h-4 w-4 text-slate-400" />
                Lab Management
              </button>

              <button
                onClick={() => {
                  setOpen(false)
                  router.push('/dashboard/notifications')
                }}
                className="w-full flex items-center gap-3 px-2 py-2 text-sm text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Mail className="h-4 w-4 text-slate-400" />
                Email Notifications
              </button>
            </div>

            {/* Sign Out */}
            <div className="p-2 border-t border-slate-700">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-2 py-2 text-sm text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}