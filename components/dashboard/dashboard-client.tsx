'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LabSwitcher } from '@/components/dashboard/lab-switcher'
import { 
  Beaker,
  FlaskConical,
  FolderOpen,
  CheckCircle2,
  Calendar,
  Plus,
  Eye,
  CircleDot,
  AlertCircle,
  Building2,
  Users
} from 'lucide-react'

interface DashboardClientProps {
  user: any
  labs: any[]
  selectedLab: any
  dashboardData?: any
  showWelcome?: boolean
}

export default function DashboardClient({ 
  user, 
  labs, 
  selectedLab, 
  dashboardData,
  showWelcome = false 
}: DashboardClientProps) {
  const router = useRouter()

  // Welcome screen for users without lab membership
  if (showWelcome || !selectedLab) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center space-y-6">
          <div className="card-slack p-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Welcome to Lab Sync! 🔬
            </h1>
            <p className="text-muted-foreground text-lg mb-2">
              Hello <strong className="text-foreground">{user.email}</strong>!
            </p>
            <p className="text-muted-foreground text-lg mb-8">
              Your account has been created successfully. To get started, you need to join a research lab or create your own.
            </p>
            
            <div className="max-w-md mx-auto">
              <div className="card-slack p-6 text-center">
                <h3 className="text-xl font-semibold text-foreground mb-3">Create Your Lab</h3>
                <p className="text-muted-foreground mb-4">
                  Create your own research lab and invite team members to collaborate with advanced project management and AI-powered tools.
                </p>
                <Button 
                  className="btn-slack-primary w-full"
                  onClick={() => router.push('/dashboard/labs')}
                >
                  Create New Lab
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main dashboard with lab data
  const data = dashboardData || {
    selectedLab,
    labCount: 1,
    studyCount: 0,
    bucketCount: 0,
    taskStats: { total: 0, completed: 0, inProgress: 0, urgent: 0 },
    studies: [],
    completionPercentage: 0
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {data.selectedLab?.name} Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage research activities and collaborate with your team
              </p>
            </div>
            {/* Lab Switcher - always show for easy lab creation/switching */}
            {labs && labs.length > 0 && (
              <div className="ml-6">
                <LabSwitcher />
              </div>
            )}
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline"
              className="flex items-center space-x-2"
              onClick={() => router.push('/dashboard/labs')}
            >
              <Building2 className="w-4 h-4" />
              <span>Manage Labs</span>
            </Button>
            <Button 
              className="btn-slack-primary flex items-center space-x-2"
              onClick={() => router.push('/dashboard/projects')}
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card-slack p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary/20 rounded-lg mr-4">
              <Beaker className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.studyCount}</p>
              <p className="text-muted-foreground text-sm">Active Studies</p>
            </div>
          </div>
        </div>

        <div className="card-slack p-6">
          <div className="flex items-center">
            <div className="p-2 bg-success/20 rounded-lg mr-4">
              <FolderOpen className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.bucketCount}</p>
              <p className="text-muted-foreground text-sm">Project Buckets</p>
            </div>
          </div>
        </div>

        <div className="card-slack p-6">
          <div className="flex items-center">
            <div className="p-2 bg-warning/20 rounded-lg mr-4">
              <CheckCircle2 className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.taskStats.total}</p>
              <p className="text-muted-foreground text-sm">Total Tasks</p>
            </div>
          </div>
        </div>

        <div className="card-slack p-6">
          <div className="flex items-center">
            <div className="p-2 bg-info/20 rounded-lg mr-4">
              <Users className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{labs.length}</p>
              <p className="text-muted-foreground text-sm">Lab Memberships</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Studies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card-slack p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Recent Studies</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/dashboard/projects')}
              >
                <Eye className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>
            
            {data.studies && data.studies.length > 0 ? (
              <div className="space-y-3">
                {data.studies.map((study: any) => (
                  <div key={study.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CircleDot className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{study.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Status: {study.status || 'Active'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No studies yet</p>
                <Button 
                  className="btn-slack-primary"
                  onClick={() => router.push('/dashboard/projects')}
                >
                  Create Your First Study
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card-slack p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/projects')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Study
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/tasks')}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Manage Tasks
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/files')}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </div>
          </div>

          {/* Lab Info */}
          <div className="card-slack p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Lab Information</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Role:</span>{' '}
                <span className="text-foreground capitalize">{labs[0]?.role || 'Member'}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Joined:</span>{' '}
                <span className="text-foreground">
                  {labs[0]?.joined_at ? new Date(labs[0].joined_at).toLocaleDateString() : 'Recently'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}