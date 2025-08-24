'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Beaker } from 'lucide-react'
import { toast } from 'sonner'
import LabCard from '@/components/dashboard/lab-card'
import CreateLabDialog from './create-lab-dialog'
import { ErrorBoundaryWrapper } from '@/components/ui/error-boundary'
import { LabCardSkeleton } from '@/components/ui/skeleton'

interface Lab {
  id: string
  name: string
  description: string | null
  role: string
  studyCount: number
  bucketCount: number
  memberCount: number
  created_at: string
}

interface LabsPageClientProps {
  initialLabs: Lab[]
  isLoading?: boolean
}

export default function LabsPageClient({ initialLabs, isLoading = false }: LabsPageClientProps) {
  const router = useRouter()
  const [labs, setLabs] = useState<Lab[]>(initialLabs)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [localLoading, setLocalLoading] = useState(false)

  const filteredLabs = labs.filter(lab =>
    lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lab.description && lab.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    lab.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleLabCreated = async () => {
    setLocalLoading(true)
    try {
      toast.success('Lab created successfully!')
      router.refresh()
    } finally {
      setLocalLoading(false)
    }
  }

  const showLoading = isLoading || localLoading

  return (
    <ErrorBoundaryWrapper>
      <div className="p-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Research Labs</h1>
              <p className="text-slate-400 mt-1">Manage your research laboratories and teams</p>
            </div>
            <button 
              onClick={() => setShowCreateDialog(true)}
              disabled={showLoading}
              className="flex items-center px-4 py-2 bg-primary hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Lab
            </button>
          </div>
        </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search labs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>
      </div>

        {/* Labs Grid */}
        {showLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <LabCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredLabs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLabs.map((lab) => (
              <LabCard 
                key={lab.id} 
                lab={{
                  ...lab,
                  createdAt: lab.created_at
                }} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Beaker className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {searchTerm ? 'No labs found' : 'No labs yet'}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms or create a new lab.'
                : 'Get started by creating your first research lab'
              }
            </p>
            <button 
              onClick={() => setShowCreateDialog(true)}
              disabled={showLoading}
              className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Lab
            </button>
          </div>
        )}

      {/* Create Lab Dialog */}
      <CreateLabDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleLabCreated}
      />
      </div>
    </ErrorBoundaryWrapper>
  )
}