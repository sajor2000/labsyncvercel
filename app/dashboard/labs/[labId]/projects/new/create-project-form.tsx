'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Beaker, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Lab {
  id: string
  name: string
  description: string | null
}

interface Bucket {
  id: string
  name: string
  color: string | null
}

interface CreateProjectFormProps {
  lab: Lab
  buckets: Bucket[]
  userId: string
}

export default function CreateProjectForm({ lab, buckets, userId }: CreateProjectFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bucket_id: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    due_date: '',
    irb_number: '',
    irb_status: 'not_required',
    manuscript_status: 'not_started'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.bucket_id) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    
    try {
      // Create the project
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          bucket_id: formData.bucket_id,
          lab_id: lab.id,
          status: formData.status,
          priority: formData.priority,
          start_date: formData.start_date || null,
          due_date: formData.due_date || null,
          irb_number: formData.irb_number.trim() || null,
          irb_status: formData.irb_status,
          manuscript_status: formData.manuscript_status,
          created_by: userId
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Project created successfully!')
      router.push(`/dashboard/labs/${lab.id}/projects`)
      
    } catch (error: any) {
      console.error('Error creating project:', error)
      toast.error(error.message || 'Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link 
          href={`/dashboard/labs/${lab.id}/projects`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Project</h1>
          <p className="text-muted-foreground">Add a new research project to {lab.name}</p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-primary" />
            Project Details
          </CardTitle>
          <CardDescription>
            Provide information about your new research project
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Clinical Trial for Novel Therapy"
                required
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the project objectives, methodology, and expected outcomes..."
                rows={4}
                disabled={isLoading}
              />
            </div>

            {/* Bucket Selection */}
            <div className="space-y-2">
              <Label htmlFor="bucket">Project Bucket *</Label>
              <Select 
                value={formData.bucket_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, bucket_id: value }))}
                disabled={isLoading}
              >
                <SelectTrigger id="bucket">
                  <SelectValue placeholder="Select a bucket for this project" />
                </SelectTrigger>
                <SelectContent>
                  {buckets.map((bucket) => (
                    <SelectItem key={bucket.id} value={bucket.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: bucket.color || '#6b7280' }}
                        />
                        {bucket.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger id="priority">
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

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  disabled={isLoading}
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  disabled={isLoading}
                />
              </div>

              {/* IRB Number */}
              <div className="space-y-2">
                <Label htmlFor="irb_number">IRB Number</Label>
                <Input
                  id="irb_number"
                  value={formData.irb_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, irb_number: e.target.value }))}
                  placeholder="e.g., IRB-2024-001"
                  disabled={isLoading}
                />
              </div>

              {/* IRB Status */}
              <div className="space-y-2">
                <Label htmlFor="irb_status">IRB Status</Label>
                <Select 
                  value={formData.irb_status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, irb_status: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger id="irb_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_required">Not Required</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="exempt">Exempt</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Manuscript Status */}
            <div className="space-y-2">
              <Label htmlFor="manuscript_status">Manuscript Status</Label>
              <Select 
                value={formData.manuscript_status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, manuscript_status: value }))}
                disabled={isLoading}
              >
                <SelectTrigger id="manuscript_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/labs/${lab.id}/projects`)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.title.trim() || !formData.bucket_id}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating Project...
                  </>
                ) : (
                  <>
                    <Beaker className="h-4 w-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}