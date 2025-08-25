'use client'

import { Beaker, Users, FolderOpen, Calendar, TrendingUp, Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

  const handleNewProject = () => {
    router.push(`/dashboard/labs/${lab.id}/projects/new`)
  }

  const handleViewBuckets = () => {
    router.push(`/dashboard/labs/${lab.id}/buckets`)
  }

  const handleTeam = () => {
    router.push(`/dashboard/labs/${lab.id}?tab=members`)
  }

  const handleCalendar = () => {
    router.push(`/dashboard/labs/${lab.id}/calendar`)
  }

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Members</p>
                <p className="text-2xl font-bold text-foreground">{lab.memberCount}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Active Studies</p>
                <p className="text-2xl font-bold text-foreground">{lab.studyCount}</p>
              </div>
              <Beaker className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Project Buckets</p>
                <p className="text-2xl font-bold text-foreground">{lab.bucketCount}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Lab Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${lab.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-semibold text-foreground">
                    {lab.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lab Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lab Details */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Lab Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lab Name</p>
              <p className="text-foreground">{lab.name}</p>
            </div>
            
            {lab.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-foreground text-sm">{lab.description}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Your Role</p>
              <Badge variant="secondary">
                {formatRole(lab.userRole)}
              </Badge>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-foreground">
                {new Date(lab.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-foreground">Lab created successfully</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(lab.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {lab.studyCount > 0 && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    {lab.studyCount} active {lab.studyCount === 1 ? 'study' : 'studies'}
                  </p>
                  <p className="text-xs text-muted-foreground">Current status</p>
                </div>
              </div>
            )}
            
            {lab.memberCount > 1 && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    {lab.memberCount} team {lab.memberCount === 1 ? 'member' : 'members'}
                  </p>
                  <p className="text-xs text-muted-foreground">Current team size</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline"
              onClick={handleNewProject}
              className="flex flex-col items-center h-auto py-4"
            >
              <Beaker className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm">New Project</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleViewBuckets}
              className="flex flex-col items-center h-auto py-4"
            >
              <FolderOpen className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm">View Buckets</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleTeam}
              className="flex flex-col items-center h-auto py-4"
            >
              <Users className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm">Team</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleCalendar}
              className="flex flex-col items-center h-auto py-4"
            >
              <Calendar className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm">Calendar</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}