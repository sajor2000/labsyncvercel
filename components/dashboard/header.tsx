'use client'

import { useState } from 'react'
import { Moon, Sun, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LabSwitcher } from './lab-switcher'
import { GlobalSearch } from './global-search'
import { UserMenu } from './user-menu'

interface DashboardHeaderProps {
  user: any
  labs: any[]
}

export default function DashboardHeader({ user, labs }: DashboardHeaderProps) {
  const router = useRouter()
  const [isDarkMode, setIsDarkMode] = useState(true)

  return (
    <header className="h-16 bg-800 border-b border-slate-700 flex items-center justify-between px-6">
      {/* Left section - Brand and Lab Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <span className="text-foreground font-bold text-sm">LS</span>
          </div>
          <span className="text-foreground font-semibold hidden sm:block">Lab Sync</span>
        </div>
        <LabSwitcher />
      </div>

      {/* Center section - Search */}
      <div className="flex-1 max-w-2xl mx-4">
        <GlobalSearch />
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center space-x-3 ml-6">
        {/* Theme Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 text-slate-400 hover:text-foreground transition-colors rounded-lg hover:bg-700"
          title="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <button 
          className="relative p-2 text-slate-400 hover:text-foreground transition-colors rounded-lg hover:bg-700"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-800"></span>
        </button>

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  )
}