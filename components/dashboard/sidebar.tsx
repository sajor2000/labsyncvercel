'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutGrid,
  Beaker,
  FolderOpen,
  FlaskConical,
  LayoutList,
  Layers,
  CheckSquare,
  Lightbulb,
  Clock,
  FileText,
  Users,
  Mic,
  TestTube,
  Eye,
  Calendar,
  CalendarCog,
  BarChart3,
  User,
  Settings,
  Mail,
  LogOut,
  ChevronDown
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutGrid },
  { name: 'Labs', href: '/dashboard/labs', icon: Beaker },
  { name: 'Buckets', href: '/dashboard/buckets', icon: FolderOpen },
  { name: 'Studies', href: '/dashboard/studies', icon: FlaskConical },
  { name: 'Study Board', href: '/dashboard/study-board', icon: LayoutList },
  { name: 'Stacked by Bucket', href: '/dashboard/stacked', icon: Layers },
  { name: 'Task Management', href: '/dashboard/tasks', icon: CheckSquare },
  { name: 'Ideas Board', href: '/dashboard/ideas', icon: Lightbulb },
  { name: 'Deadlines', href: '/dashboard/deadlines', icon: Clock },
  { name: 'File Management', href: '/dashboard/files', icon: FileText },
  { name: 'Team Members', href: '/dashboard/team', icon: Users },
  { name: 'Standup Recording', href: '/dashboard/standup', icon: Mic },
  { name: 'Meeting Testing', href: '/dashboard/meeting-test', icon: TestTube },
  { name: 'Production Workflow', href: '/dashboard/workflow', icon: LayoutList },
  { name: 'Meeting Preview', href: '/dashboard/meeting-preview', icon: Eye },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Calendar Setup', href: '/dashboard/calendar-setup', icon: CalendarCog },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
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
          <Beaker className="w-5 h-5 text-white" />
        </div>
        <span className="ml-3 text-white font-semibold">LabFlow</span>
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