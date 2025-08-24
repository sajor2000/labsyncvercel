"use client"

import { useRouter } from 'next/navigation'
import { Beaker, FolderOpen, Users, Settings, Eye } from 'lucide-react'

interface LabCardProps {
  lab: {
    id: string
    name: string
    description: string | null
    role: string
    createdAt: string
    studyCount: number
    bucketCount: number
    memberCount: number
  }
}

export default function LabCard({ lab }: LabCardProps) {
  const router = useRouter()

  const handleSettings = () => {
    router.push(`/dashboard/labs/${lab.id}/settings`)
  }

  const handleView = () => {
    router.push(`/dashboard/labs/${lab.id}`)
  }

  const handleBuckets = () => {
    router.push(`/dashboard/buckets?lab=${lab.id}`)
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all">
      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-3 ${
            lab.role === 'LAB_ADMIN' ? 'bg-green-500' : 'bg-orange-500'
          }`}></div>
          <h3 className="text-lg font-semibold text-white">{lab.name}</h3>
        </div>
        <button 
          onClick={handleSettings}
          className="p-1 text-gray-400 hover:text-white transition-colors"
          title="Lab Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
        {lab.description || 'No description provided'}
      </p>

      {/* Stats */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center">
          <Beaker className="w-4 h-4 text-cyan-400 mr-1" />
          <span className="text-sm text-white font-medium">{lab.studyCount}</span>
          <span className="text-xs text-gray-400 ml-1">Studies</span>
        </div>
        <div className="flex items-center">
          <FolderOpen className="w-4 h-4 text-orange-400 mr-1" />
          <span className="text-sm text-white font-medium">{lab.bucketCount}</span>
          <span className="text-xs text-gray-400 ml-1">Buckets</span>
        </div>
        <div className="flex items-center">
          <Users className="w-4 h-4 text-green-400 mr-1" />
          <span className="text-sm text-white font-medium">{lab.memberCount}</span>
          <span className="text-xs text-gray-400 ml-1">Members</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <button 
            onClick={handleView}
            className="px-3 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4 inline mr-1" />
            View
          </button>
          <button 
            onClick={handleBuckets}
            className="px-3 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FolderOpen className="w-4 h-4 inline mr-1" />
            Buckets
          </button>
        </div>
        <span className="text-xs text-gray-500">
          Joined {new Date(lab.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}