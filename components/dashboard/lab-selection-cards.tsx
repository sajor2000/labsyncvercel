'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FlaskConical, 
  Users, 
  FolderOpen, 
  Calendar, 
  Plus, 
  ArrowRight,
  Building2,
  Settings,
  UserPlus
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Lab {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  role: string
  studyCount: number
  bucketCount: number
  memberCount: number
}

interface LabSelectionCardsProps {
  labs: Lab[]
  user: any
}

export function LabSelectionCards({ labs, user }: LabSelectionCardsProps) {
  const router = useRouter()

  const handleLabClick = async (labId: string) => {
    try {
      // Update user's last selected lab preference
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          last_selected_lab_id: labId,
        }),
      })

      if (!response.ok) {
        console.warn('Failed to update lab preference, but proceeding with navigation')
      }
    } catch (error) {
      console.warn('Error updating lab preference:', error)
    }

    // Navigate to lab workspace
    router.push(`/dashboard/labs/${labId}`)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'principal_investigator':
        return 'bg-violet-100 text-violet-800 border-violet-200'
      case 'co_investigator':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'lab_manager':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'data_analyst':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  if (labs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No Labs Yet</h3>
          <p className="text-muted-foreground mb-6">
            Get started by creating your first lab or joining an existing one.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => router.push('/dashboard/labs/new')}
              className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Lab
            </Button>
            <Button 
              onClick={() => router.push('/dashboard/join-lab')}
              variant="outline" 
              className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              Join Lab
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Your Labs</h2>
          <p className="text-muted-foreground">Select a lab to continue working</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => router.push('/dashboard/join-lab')}
            variant="outline" 
            size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Join Lab
          </Button>
          <Button 
            onClick={() => router.push('/dashboard/labs/new')}
            size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Lab
          </Button>
        </div>
      </div>

      {/* Lab Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {labs.map((lab) => (
          <Card 
            key={lab.id} 
            className="card-slack hover:border-primary/50 transition-all duration-200 cursor-pointer group"
            onClick={() => handleLabClick(lab.id)}
          >
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                  <FlaskConical className="h-5 w-5 text-violet-600" />
                </div>
                <Badge className={`text-xs ${getRoleBadgeColor(lab.role)}`}>
                  {formatRole(lab.role)}
                </Badge>
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {lab.name}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                  {lab.description || 'No description provided'}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="space-y-1">
                  <div className="flex items-center justify-center">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-sm font-medium text-foreground">{lab.studyCount}</div>
                  <div className="text-xs text-muted-foreground">Studies</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-sm font-medium text-foreground">{lab.bucketCount}</div>
                  <div className="text-xs text-muted-foreground">Buckets</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-sm font-medium text-foreground">{lab.memberCount}</div>
                  <div className="text-xs text-muted-foreground">Members</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  Created {format(new Date(lab.created_at), 'MMM d, yyyy')}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}