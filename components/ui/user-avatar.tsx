'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  user?: {
    first_name?: string | null
    last_name?: string | null
    full_name?: string | null
    email?: string | null
  } | null
  currentLab?: {
    name: string
  } | null
  userRole?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabBadge?: boolean
  showLabName?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
  xl: 'h-12 w-12 text-lg'
}

const badgeClasses = {
  sm: 'px-1 py-0.5 text-xs',
  md: 'px-1.5 py-0.5 text-xs',
  lg: 'px-2 py-1 text-xs',
  xl: 'px-2 py-1 text-sm'
}

// Role color mapping for badges - matching database enum values
const roleColors: Record<string, string> = {
  // Leadership roles
  'lab_director': 'bg-purple-600 text-white',
  'principal_investigator': 'bg-blue-600 text-white',
  'co_investigator': 'bg-indigo-600 text-white',
  'associate_investigator': 'bg-indigo-500 text-white',
  'lab_manager': 'bg-green-600 text-white',
  
  // Academic roles
  'postdoctoral_researcher': 'bg-cyan-600 text-white',
  'research_scientist': 'bg-teal-600 text-white',
  'senior_researcher': 'bg-emerald-600 text-white',
  'staff_scientist': 'bg-lime-600 text-white',
  
  // Student roles
  'phd_student': 'bg-orange-600 text-white',
  'masters_student': 'bg-amber-600 text-white',
  'undergraduate_researcher': 'bg-yellow-600 text-black',
  'visiting_researcher': 'bg-rose-600 text-white',
  
  // Technical roles
  'research_technician': 'bg-slate-600 text-white',
  'lab_technician': 'bg-gray-600 text-white',
  'data_analyst': 'bg-primary text-white',
  'bioinformatician': 'bg-pink-600 text-white',
  
  // Support roles
  'research_coordinator': 'bg-red-600 text-white',
  'lab_assistant': 'bg-stone-600 text-white',
  'intern': 'bg-neutral-600 text-white',
  
  // Default
  'default': 'bg-slate-500 text-white'
}

// Role display names - converting from database format
const roleDisplayNames: Record<string, string> = {
  'lab_director': 'Director',
  'principal_investigator': 'PI',
  'co_investigator': 'Co-PI',
  'associate_investigator': 'Assoc. PI',
  'lab_manager': 'Manager',
  'postdoctoral_researcher': 'Postdoc',
  'research_scientist': 'Scientist',
  'senior_researcher': 'Sr. Researcher',
  'staff_scientist': 'Staff Scientist',
  'phd_student': 'PhD',
  'masters_student': 'Masters',
  'undergraduate_researcher': 'Undergrad',
  'visiting_researcher': 'Visiting',
  'research_technician': 'Tech',
  'lab_technician': 'Lab Tech',
  'data_analyst': 'Analyst',
  'bioinformatician': 'Bioinformatics',
  'research_coordinator': 'Coordinator',
  'lab_assistant': 'Assistant',
  'intern': 'Intern'
}

function getInitials(user: UserAvatarProps['user']): string {
  if (!user) return '?'
  
  // Try first_name + last_name first
  if (user.first_name && user.last_name) {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
  }
  
  // Try full_name
  if (user.full_name) {
    const names = user.full_name.trim().split(' ')
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
    }
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase()
    }
  }
  
  // Fallback to email
  if (user.email) {
    return user.email.charAt(0).toUpperCase()
  }
  
  return '?'
}

function generateColorFromString(str: string): string {
  // Simple hash function to generate consistent colors
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Convert to HSL for better color distribution
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 65%, 45%)`
}

export function UserAvatar({
  user,
  currentLab,
  userRole,
  size = 'md',
  showLabBadge = true,
  showLabName = false,
  className
}: UserAvatarProps) {
  const initials = useMemo(() => getInitials(user), [user])
  
  const backgroundColor = useMemo(() => {
    if (!user) return '#64748b' // slate-500
    const identifier = user.email || user.full_name || 'default'
    return generateColorFromString(identifier)
  }, [user])

  const roleDisplayName = userRole ? (roleDisplayNames[userRole] || userRole) : null
  const roleColorClass = userRole ? (roleColors[userRole] || roleColors.default) : roleColors.default

  const userDisplayName = user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user?.full_name || user?.email || 'Unknown User'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Avatar with Badge */}
      <div className="relative inline-flex">
        {/* Avatar Circle */}
        <div 
          className={cn(
            'flex items-center justify-center rounded-full font-semibold border-2 border-white/10',
            sizeClasses[size]
          )}
          style={{ backgroundColor }}
        >
          <span className="text-white font-semibold select-none">
            {initials}
          </span>
        </div>
        
        {/* Lab Role Badge */}
        {showLabBadge && currentLab && userRole && (
          <div className="absolute -bottom-1 -right-1">
            <div 
              className={cn(
                'rounded-full font-medium whitespace-nowrap border border-slate-700 shadow-sm',
                roleColorClass,
                badgeClasses[size]
              )}
              title={`${roleDisplayName} in ${currentLab.name}`}
            >
              {roleDisplayName}
            </div>
          </div>
        )}
      </div>

      {/* User Info */}
      {showLabName && (
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-white truncate">
            {userDisplayName}
          </span>
          {currentLab && userRole && (
            <span className="text-xs text-slate-400 truncate">
              {roleDisplayName} • {currentLab.name}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Utility component for showing multiple lab badges
interface MultiLabAvatarProps extends Omit<UserAvatarProps, 'currentLab' | 'userRole' | 'showLabBadge'> {
  labMemberships: Array<{
    labs: { name: string }
    role: string
  }>
  maxLabsShown?: number
}

export function MultiLabAvatar({
  user,
  labMemberships,
  size = 'md',
  maxLabsShown = 3,
  className
}: MultiLabAvatarProps) {
  const initials = useMemo(() => getInitials(user), [user])
  
  const backgroundColor = useMemo(() => {
    if (!user) return '#64748b' // slate-500
    const identifier = user.email || user.full_name || 'default'
    return generateColorFromString(identifier)
  }, [user])

  const visibleMemberships = labMemberships.slice(0, maxLabsShown)
  const hasMore = labMemberships.length > maxLabsShown

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      {/* Avatar Circle */}
      <div 
        className={cn(
          'flex items-center justify-center rounded-full font-semibold border-2 border-white/10',
          sizeClasses[size]
        )}
        style={{ backgroundColor }}
      >
        <span className="text-white font-semibold select-none">
          {initials}
        </span>
      </div>
      
      {/* Multiple Lab Badges */}
      {visibleMemberships.length > 0 && (
        <div className="absolute -bottom-1 -right-1 flex items-center space-x-1">
          {visibleMemberships.map((membership, index) => {
            const roleDisplayName = roleDisplayNames[membership.role] || membership.role
            const roleColorClass = roleColors[membership.role] || roleColors.default
            
            return (
              <div
                key={index}
                className={cn(
                  'rounded-full font-medium whitespace-nowrap border border-slate-700 shadow-sm',
                  roleColorClass,
                  badgeClasses[size]
                )}
                title={`${roleDisplayName} in ${membership.labs.name}`}
              >
                {roleDisplayName}
              </div>
            )
          })}
          {hasMore && (
            <div className={cn(
              'rounded-full font-medium border border-slate-700 bg-slate-600 text-white shadow-sm',
              badgeClasses[size]
            )}>
              +{labMemberships.length - maxLabsShown}
            </div>
          )}
        </div>
      )}
    </div>
  )
}