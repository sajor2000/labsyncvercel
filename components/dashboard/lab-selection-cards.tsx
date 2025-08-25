'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  FolderOpen, 
  Plus, 
  Building2,
  UserPlus,
  Beaker
} from 'lucide-react'
import { format } from 'date-fns'

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
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          last_selected_lab_id: labId,
        }),
      })
    } catch (error) {
      console.warn('Error updating lab preference:', error)
    }

    // Navigate to lab workspace
    router.push(`/dashboard/labs/${labId}`)
  }

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  if (labs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <Beaker className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground mb-2">Welcome to Lab Sync</h3>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          Get started by creating your first lab or joining an existing one.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => router.push('/dashboard/labs/new')}
            size="lg"
            className="h-12">
            <Plus className="h-5 w-5 mr-2" />
            Create New Lab
          </Button>
          <Button 
            onClick={() => router.push('/dashboard/join-lab')}
            variant="outline" 
            size="lg"
            className="h-12">
            <UserPlus className="h-5 w-5 mr-2" />
            Join Existing Lab
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Labs</h1>
          <p className="text-muted-foreground mt-1">Select a lab to continue your research</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => router.push('/dashboard/join-lab')}
            variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Join Lab
          </Button>
          <Button 
            onClick={() => router.push('/dashboard/labs/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Lab
          </Button>
        </div>
      </div>

      {/* Lab Cards - Simplified Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {labs.map((lab) => (
          <Card 
            key={lab.id} 
            className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm"
            onClick={() => handleLabClick(lab.id)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {lab.name}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {formatRole(lab.role)}
                </Badge>
              </div>
              <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                {lab.description || 'Research laboratory'}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Simple Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <FolderOpen className="h-4 w-4" />
                    <span>{lab.studyCount} studies</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{lab.memberCount} members</span>
                  </div>
                </div>
              </div>

              {/* Created Date */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Created {format(new Date(lab.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}