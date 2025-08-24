'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutGrid,
  Users,
  TestTube,
  User,
  Settings,
  Mail,
  LogOut,
  FlaskConical,
  ChevronDown
} from 'lucide-react'

// Lab-centric navigation - only shows lab selection and user settings
const navigation = [
  { name: 'Lab Selection', href: '/dashboard', icon: LayoutGrid },
  { name: 'Join Lab', href: '/dashboard/join-lab', icon: Users },
  { name: 'Test Integrations', href: '/dashboard/test-integrations', icon: TestTube },
]

const bottomNavigation = [
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Email Notifications', href: '/dashboard/notifications', icon: Mail },
  { name: 'Sign out', href: '/auth/signout', icon: LogOut },
]

interface DashboardSidebarProps {
  user: any
  labs: any[]
}

export default function DashboardSidebar({ user, labs }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [selectedLabId, setSelectedLabId] = useState<string>('')
  const [isLabSwitcherOpen, setIsLabSwitcherOpen] = useState(false)

  useEffect(() => {
    // Load selected lab from localStorage
    const storedLabId = localStorage.getItem('selectedLabId')
    if (storedLabId && labs.some(lab => lab.id === storedLabId)) {
      setSelectedLabId(storedLabId)
    } else if (labs.length > 0) {
      setSelectedLabId(labs[0].id)
      localStorage.setItem('selectedLabId', labs[0].id)
    }
  }, [labs])

  const selectedLab = labs.find(lab => lab.id === selectedLabId)

  const handleLabSwitch = (labId: string) => {
    setSelectedLabId(labId)
    localStorage.setItem('selectedLabId', labId)
    setIsLabSwitcherOpen(false)
  }

  return (
    <div className="w-64 bg-[#0F172A] border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-800">
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-white" />
        </div>
        <span className="ml-3 text-white font-semibold">Lab Sync</span>
      </div>

      {/* Lab Switcher */}
      {selectedLab && (
        <div className="px-4 py-4 border-b border-gray-800">
          <button
            onClick={() => setIsLabSwitcherOpen(!isLabSwitcherOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <div className="text-left">
                <div className="text-sm font-medium text-white">{selectedLab.name}</div>
                <div className="text-xs text-gray-400 truncate max-w-[150px]">
                  {selectedLab.description}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isLabSwitcherOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isLabSwitcherOpen && labs.length > 1 && (
            <div className="mt-2 py-2 bg-gray-800 rounded-lg">
              {labs.filter(lab => lab.id !== selectedLabId).map((lab) => (
                <button
                  key={lab.id}
                  onClick={() => handleLabSwitch(lab.id)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors"
                >
                  <div className="text-sm font-medium text-white">{lab.name}</div>
                  <div className="text-xs text-gray-400 truncate">{lab.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all
                  ${isActive 
                    ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                `}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-800 p-4">
        <div className="px-3 space-y-1">
          {bottomNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 rounded-lg hover:text-white hover:bg-gray-800 transition-all"
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.name}
            </Link>
          ))}
        </div>
        
        <div className="mt-4 px-3 py-2 bg-gray-800 rounded-lg">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-white">
                {user?.user_metadata?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-white">
                {user?.user_metadata?.first_name || 'User'}
              </div>
              <div className="text-xs text-gray-400">Making Science Easier</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}