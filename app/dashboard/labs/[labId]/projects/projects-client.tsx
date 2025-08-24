"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Beaker, Plus, Search, Calendar, User, ArrowLeft, FolderOpen } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  progress_percentage: number | null
  start_date: string | null
  due_date: string | null
  bucket_id: string
  created_at: string
  updated_at: string
}

interface Bucket {
  id: string
  name: string
  color: string | null
}

interface Lab {
  id: string
  name: string
  description: string | null
}

interface ProjectsPageClientProps {
  lab: Lab
  buckets: Bucket[]
  initialProjects: Project[]
  userPermissions: {
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canView: boolean
  }
}

const statusColors = {
  'planning': 'bg-blue-500',
  'active': 'bg-green-500', 
  'on_hold': 'bg-yellow-500',
  'completed': 'bg-purple-500',
  'cancelled': 'bg-red-500',
  'archived': 'bg-gray-500'
}

const priorityColors = {
  'low': 'bg-gray-500',
  'medium': 'bg-blue-500',
  'high': 'bg-orange-500', 
  'urgent': 'bg-red-500'
}

export default function ProjectsPageClient({ 
  lab, 
  buckets, 
  initialProjects, 
  userPermissions 
}: ProjectsPageClientProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterBucket, setFilterBucket] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesBucket = filterBucket === "all" || project.bucket_id === filterBucket
    const matchesStatus = filterStatus === "all" || project.status === filterStatus
    
    return matchesSearch && matchesBucket && matchesStatus
  })

  const getBucketName = (bucketId: string) => {
    return buckets.find(b => b.id === bucketId)?.name || 'Unknown Bucket'
  }

  const getBucketColor = (bucketId: string) => {
    return buckets.find(b => b.id === bucketId)?.color || '#6b7280'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href={`/dashboard/labs/${lab.id}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {lab.name} - Projects
            </h1>
            <p className="text-muted-foreground">
              Manage and track your lab's research projects and studies
            </p>
          </div>
        </div>
        
        {userPermissions.canCreate && (
          <Button 
            onClick={() => router.push(`/dashboard/labs/${lab.id}/projects/new`)}
            className="btn-slack-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterBucket} onValueChange={setFilterBucket}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by bucket" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buckets</SelectItem>
            {buckets.map(bucket => (
              <SelectItem key={bucket.id} value={bucket.id}>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: bucket.color || '#6b7280' }}
                  />
                  <span>{bucket.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="card-slack p-12 text-center">
          <Beaker className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium text-foreground mb-2">
            {projects.length === 0 ? 'No Projects Yet' : 'No Matching Projects'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {projects.length === 0 
              ? 'Create your first research project to get started'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {userPermissions.canCreate && projects.length === 0 && (
            <div className="space-y-4">
              <Button 
                onClick={() => router.push(`/dashboard/labs/${lab.id}/projects/new`)}
                className="btn-slack-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Project
              </Button>
              {buckets.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Tip: <Link href={`/dashboard/labs/${lab.id}/buckets`} className="text-primary hover:underline">
                    Create buckets first
                  </Link> to organize your projects
                </p>
              )}
            </div>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="card-slack hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs text-white ${statusColors[project.status as keyof typeof statusColors] || 'bg-gray-500'}`}
                    >
                      {project.status}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={`text-xs text-white ${priorityColors[project.priority as keyof typeof priorityColors] || 'bg-gray-500'}`}
                    >
                      {project.priority}
                    </Badge>
                  </div>
                </div>
                {project.description && (
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                {project.progress_percentage !== null && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{project.progress_percentage}%</span>
                    </div>
                    <Progress value={project.progress_percentage} className="h-2" />
                  </div>
                )}

                {/* Bucket */}
                <div className="flex items-center space-x-2 text-sm">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center space-x-1">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getBucketColor(project.bucket_id) }}
                    />
                    <span className="text-muted-foreground">{getBucketName(project.bucket_id)}</span>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Created {format(new Date(project.created_at), 'MMM d, yyyy')}</span>
                  {project.due_date && (
                    <span>Due {format(new Date(project.due_date), 'MMM d, yyyy')}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => router.push(`/dashboard/labs/${lab.id}/projects/${project.id}`)}
                    className="flex-1"
                  >
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => router.push(`/dashboard/labs/${lab.id}/projects/${project.id}/tasks`)}
                  >
                    Tasks
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}