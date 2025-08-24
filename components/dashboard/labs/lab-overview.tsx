'use client'

import { Beaker, Users, FolderOpen, Calendar, TrendingUp, Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LabOverviewProps {
  lab: {
    id: string
    name: string
    description: string | null
    userRole: string
    memberCount: number
    studyCount: number
    bucketCount: number
    created_at: string
    is_active: boolean
  }
}

export default function LabOverview({ lab }: LabOverviewProps) {
  const router = useRouter()

  const handleNewStudy = () => {
    router.push(`/dashboard/studies/new?lab=${lab.id}`)
  }

  const handleViewBuckets = () => {
    router.push(`/dashboard/buckets?lab=${lab.id}`)
  }

  const handleTeam = () => {
    router.push(`/dashboard/labs/${lab.id}?tab=members`)
  }

  const handleCalendar = () => {
    router.push(`/dashboard/calendar?lab=${lab.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Members</p>
              <p className="text-2xl font-bold text-white">{lab.memberCount}</p>
            </div>
            <Users className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Active Studies</p>
              <p className="text-2xl font-bold text-white">{lab.studyCount}</p>
            </div>
            <Beaker className="h-8 w-8 text-cyan-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Project Buckets</p>
              <p className="text-2xl font-bold text-white">{lab.bucketCount}</p>
            </div>
            <FolderOpen className="h-8 w-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Lab Status</p>
              <p className={`text-sm font-semibold ${lab.is_active ? 'text-green-400' : 'text-red-400'}`}>
                {lab.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
            <Activity className={`h-8 w-8 ${lab.is_active ? 'text-green-400' : 'text-red-400'}`} />
          </div>
        </div>
      </div>

      {/* Lab Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lab Details */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Lab Information</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-400">Lab Name</p>
              <p className="text-white">{lab.name}</p>
            </div>
            
            {lab.description && (
              <div>
                <p className="text-sm font-medium text-slate-400">Description</p>
                <p className="text-white text-sm">{lab.description}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm font-medium text-slate-400">Your Role</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                {lab.userRole.replace('_', ' ')}
              </span>
            </div>
            
            <div>
              <p className="text-sm font-medium text-slate-400">Created</p>
              <p className="text-white">
                {new Date(lab.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity (Placeholder) */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-white">Lab created successfully</p>
                <p className="text-xs text-slate-400">
                  {new Date(lab.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {lab.studyCount > 0 && (
              <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-white">
                    {lab.studyCount} active {lab.studyCount === 1 ? 'study' : 'studies'}
                  </p>
                  <p className="text-xs text-slate-400">Current status</p>
                </div>
              </div>
            )}
            
            {lab.memberCount > 1 && (
              <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-white">
                    {lab.memberCount} team {lab.memberCount === 1 ? 'member' : 'members'}
                  </p>
                  <p className="text-xs text-slate-400">Current team size</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={handleNewStudy}
            className="flex flex-col items-center p-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Beaker className="h-6 w-6 text-cyan-400 mb-2" />
            <span className="text-sm text-white">New Study</span>
          </button>
          
          <button 
            onClick={handleViewBuckets}
            className="flex flex-col items-center p-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <FolderOpen className="h-6 w-6 text-orange-400 mb-2" />
            <span className="text-sm text-white">View Buckets</span>
          </button>
          
          <button 
            onClick={handleTeam}
            className="flex flex-col items-center p-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Users className="h-6 w-6 text-green-400 mb-2" />
            <span className="text-sm text-white">Team</span>
          </button>
          
          <button 
            onClick={handleCalendar}
            className="flex flex-col items-center p-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Calendar className="h-6 w-6 text-purple-400 mb-2" />
            <span className="text-sm text-white">Calendar</span>
          </button>
        </div>
      </div>
    </div>
  )
}