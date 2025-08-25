"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Beaker, Plus, Search, Calendar, User, ArrowLeft, FolderOpen, Edit2, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  progress_percentage: number | null
  start_date: string | null
  due_date: string | null
  bucket_id: string
  lab_id: string
  irb_status: string | null
  irb_number: string | null
  manuscript_status: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
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
  const supabase = createClient()
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterBucket, setFilterBucket] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    bucket_id: '',
    start_date: '',
    due_date: '',
    irb_status: 'planning',
    irb_number: '',
    manuscript_status: 'not_started'
  })

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject || !formData.title.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          status: formData.status,
          priority: formData.priority,
          bucket_id: formData.bucket_id,
          start_date: formData.start_date || null,
          due_date: formData.due_date || null,
          irb_status: formData.irb_status,
          irb_number: formData.irb_number || null,
          manuscript_status: formData.manuscript_status
        })
      })

      if (!response.ok) throw new Error('Failed to update project')

      const { project } = await response.json()
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? project : p))
      setIsEditDialogOpen(false)
      setSelectedProject(null)
      toast.success('Project updated successfully!')
      
    } catch (error: any) {
      console.error('Error updating project:', error)
      toast.error('Failed to update project')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!selectedProject) return

    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete project')

      setProjects(prev => prev.filter(p => p.id !== selectedProject.id))
      setIsDeleteDialogOpen(false)
      setSelectedProject(null)
      toast.success('Project deleted successfully!')
      
    } catch (error: any) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (project: Project) => {
    setSelectedProject(project)
    setFormData({
      title: project.title,
      description: project.description || '',
      status: project.status,
      priority: project.priority,
      bucket_id: project.bucket_id,
      start_date: project.start_date || '',
      due_date: project.due_date || '',
      irb_status: project.irb_status || 'planning',
      irb_number: project.irb_number || '',
      manuscript_status: project.manuscript_status || 'not_started'
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (project: Project) => {
    setSelectedProject(project)
    setIsDeleteDialogOpen(true)
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
                  <CardTitle className="text-lg truncate">{project.title}</CardTitle>
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
                  {userPermissions.canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(project)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  {userPermissions.canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDeleteDialog(project)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update the project details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProject} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit-project-title">Project Title</Label>
                <Input
                  id="edit-project-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter project title"
                  required
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="edit-project-description">Description</Label>
                <Textarea
                  id="edit-project-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the project goals and scope"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-project-bucket">Bucket</Label>
                <Select value={formData.bucket_id} onValueChange={(value) => setFormData(prev => ({ ...prev, bucket_id: value }))}>
                  <SelectTrigger id="edit-project-bucket">
                    <SelectValue placeholder="Select a bucket" />
                  </SelectTrigger>
                  <SelectContent>
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
              </div>

              <div>
                <Label htmlFor="edit-project-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger id="edit-project-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-project-priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger id="edit-project-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-project-irb-status">IRB Status</Label>
                <Select value={formData.irb_status} onValueChange={(value) => setFormData(prev => ({ ...prev, irb_status: value }))}>
                  <SelectTrigger id="edit-project-irb-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_required">Not Required</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="exempt">Exempt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-project-irb-number">IRB Number</Label>
                <Input
                  id="edit-project-irb-number"
                  value={formData.irb_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, irb_number: e.target.value }))}
                  placeholder="e.g., IRB-2024-001"
                />
              </div>

              <div>
                <Label htmlFor="edit-project-manuscript">Manuscript Status</Label>
                <Select value={formData.manuscript_status} onValueChange={(value) => setFormData(prev => ({ ...prev, manuscript_status: value }))}>
                  <SelectTrigger id="edit-project-manuscript">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_preparation">In Preparation</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-project-start">Start Date</Label>
                <Input
                  id="edit-project-start"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-project-due">Due Date</Label>
                <Input
                  id="edit-project-due"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProject?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              All tasks associated with this project will also be deleted.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteProject}
              disabled={loading}
              variant="destructive"
            >
              {loading ? 'Deleting...' : 'Delete Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}