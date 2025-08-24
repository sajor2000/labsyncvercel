'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUser } from '@/lib/hooks/use-user'
import { Calendar, User, FileText, DollarSign } from 'lucide-react'

interface CreateProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  bucket_id: string
  lab_id: string
}

export default function CreateProjectDialog({ 
  isOpen, 
  onClose, 
  onSuccess, 
  bucket_id, 
  lab_id 
}: CreateProjectDialogProps) {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [labMembers, setLabMembers] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    // Basic project info
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    due_date: '',
    estimated_hours: '',
    
    // IRB and ethics
    irb_number: '',
    irb_status: 'planning',
    human_subjects_research: true,
    exempt_research: false,
    minimal_risk: false,
    ethics_committee: '',
    irb_notes: '',
    
    // Publication authorship
    first_author_id: '',
    last_author_id: '',
    corresponding_author_id: '',
    publication_title: '',
    target_journal: '',
    
    // Grant association
    associated_grant_number: '',
    funding_source: '',
  })

  // Fetch lab members for author selection
  useEffect(() => {
    if (isOpen && lab_id) {
      fetchLabMembers()
    }
  }, [isOpen, lab_id])

  const fetchLabMembers = async () => {
    try {
      const response = await fetch(`/api/labs/${lab_id}/members`)
      if (response.ok) {
        const { members } = await response.json()
        setLabMembers(members || [])
      }
    } catch (error) {
      console.error('Failed to fetch lab members:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Project name must be at least 2 characters'
    } else if (formData.name.length > 255) {
      newErrors.name = 'Project name must be less than 255 characters'
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters'
    }

    if (formData.irb_number && formData.irb_number.length < 3) {
      newErrors.irb_number = 'IRB number must be at least 3 characters'
    }

    if (formData.estimated_hours && parseFloat(formData.estimated_hours) < 0) {
      newErrors.estimated_hours = 'Estimated hours must be positive'
    }

    if (formData.start_date && formData.due_date) {
      const start = new Date(formData.start_date)
      const due = new Date(formData.due_date)
      if (start > due) {
        newErrors.due_date = 'Due date must be after start date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const payload = {
        bucket_id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        priority: formData.priority,
        start_date: formData.start_date || null,
        due_date: formData.due_date || null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        // IRB fields
        irb_number: formData.irb_number.trim() || null,
        irb_status: formData.irb_status,
        human_subjects_research: formData.human_subjects_research,
        exempt_research: formData.exempt_research,
        minimal_risk: formData.minimal_risk,
        // Publication fields
        first_author_id: formData.first_author_id || null,
        last_author_id: formData.last_author_id || null,
        corresponding_author_id: formData.corresponding_author_id || null,
        publication_title: formData.publication_title.trim() || null,
        target_journal: formData.target_journal.trim() || null,
        // Grant association
        associated_grant_number: formData.associated_grant_number.trim() || null,
        funding_source: formData.funding_source.trim() || null,
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create project')
      }

      // Reset form
      setFormData({
        name: '', description: '', status: 'planning', priority: 'medium',
        start_date: '', due_date: '', estimated_hours: '',
        irb_number: '', irb_status: 'planning', human_subjects_research: true,
        exempt_research: false, minimal_risk: false, ethics_committee: '', irb_notes: '',
        first_author_id: '', last_author_id: '', corresponding_author_id: '',
        publication_title: '', target_journal: '',
        associated_grant_number: '', funding_source: '',
      })
      setErrors({})
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating project:', error)
      if (error instanceof Error && error.message.includes('already exists')) {
        setErrors({ name: 'A project with this name already exists in this bucket' })
      } else {
        setErrors({ general: error instanceof Error ? error.message : 'Failed to create project' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '', description: '', status: 'planning', priority: 'medium',
      start_date: '', due_date: '', estimated_hours: '',
      irb_number: '', irb_status: 'planning', human_subjects_research: true,
      exempt_research: false, minimal_risk: false, ethics_committee: '', irb_notes: '',
      first_author_id: '', last_author_id: '', corresponding_author_id: '',
      publication_title: '', target_journal: '',
      associated_grant_number: '', funding_source: '',
    })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Research Project</DialogTitle>
          <DialogDescription className="text-slate-400">
            Set up a new research project with IRB tracking and publication planning.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">
                <FileText className="w-4 h-4 mr-2" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="irb">
                <Calendar className="w-4 h-4 mr-2" />
                IRB & Ethics
              </TabsTrigger>
              <TabsTrigger value="publication">
                <User className="w-4 h-4 mr-2" />
                Publication
              </TabsTrigger>
              <TabsTrigger value="funding">
                <DollarSign className="w-4 h-4 mr-2" />
                Funding
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter project name"
                    className={`bg-slate-900 border-slate-600 text-white ${
                      errors.name ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the research project objectives and methodology..."
                    className="bg-slate-900 border-slate-600 text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
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
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                  {errors.due_date && <p className="text-red-400 text-sm mt-1">{errors.due_date}</p>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="irb" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="irb_number">IRB Number</Label>
                  <Input
                    id="irb_number"
                    value={formData.irb_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, irb_number: e.target.value }))}
                    placeholder="e.g., IRB-2024-001"
                    className={`bg-slate-900 border-slate-600 text-white ${
                      errors.irb_number ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.irb_number && <p className="text-red-400 text-sm mt-1">{errors.irb_number}</p>}
                  <p className="text-xs text-slate-500 mt-1">Optional - For regulatory tracking</p>
                </div>

                <div>
                  <Label htmlFor="irb_status">IRB Status</Label>
                  <Select value={formData.irb_status} onValueChange={(value) => setFormData(prev => ({ ...prev, irb_status: value }))}>
                    <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_required">Not Required</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="exempt">Exempt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="ethics_committee">Ethics Committee</Label>
                  <Input
                    id="ethics_committee"
                    value={formData.ethics_committee}
                    onChange={(e) => setFormData(prev => ({ ...prev, ethics_committee: e.target.value }))}
                    placeholder="e.g., Rush University Medical Center IRB"
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>

                <div className="col-span-2 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="human_subjects"
                      checked={formData.human_subjects_research}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, human_subjects_research: checked }))}
                    />
                    <Label htmlFor="human_subjects">Human Subjects Research</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="exempt_research"
                      checked={formData.exempt_research}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, exempt_research: checked }))}
                    />
                    <Label htmlFor="exempt_research">Exempt Research</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="minimal_risk"
                      checked={formData.minimal_risk}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, minimal_risk: checked }))}
                    />
                    <Label htmlFor="minimal_risk">Minimal Risk</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="publication" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="publication_title">Planned Publication Title</Label>
                  <Input
                    id="publication_title"
                    value={formData.publication_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, publication_title: e.target.value }))}
                    placeholder="Enter planned manuscript title"
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="target_journal">Target Journal</Label>
                  <Input
                    id="target_journal"
                    value={formData.target_journal}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_journal: e.target.value }))}
                    placeholder="e.g., Nature Medicine"
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>

                <div></div>

                <div>
                  <Label htmlFor="first_author">First Author</Label>
                  <Select value={formData.first_author_id} onValueChange={(value) => setFormData(prev => ({ ...prev, first_author_id: value }))}>
                    <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                      <SelectValue placeholder="Select first author" />
                    </SelectTrigger>
                    <SelectContent>
                      {labMembers.map(member => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.user_profiles?.display_name || member.user_profiles?.full_name || member.user_profiles?.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="last_author">Last Author (Senior Author)</Label>
                  <Select value={formData.last_author_id} onValueChange={(value) => setFormData(prev => ({ ...prev, last_author_id: value }))}>
                    <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                      <SelectValue placeholder="Select last author" />
                    </SelectTrigger>
                    <SelectContent>
                      {labMembers.map(member => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.user_profiles?.display_name || member.user_profiles?.full_name || member.user_profiles?.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="corresponding_author">Corresponding Author</Label>
                  <Select value={formData.corresponding_author_id} onValueChange={(value) => setFormData(prev => ({ ...prev, corresponding_author_id: value }))}>
                    <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                      <SelectValue placeholder="Select corresponding author" />
                    </SelectTrigger>
                    <SelectContent>
                      {labMembers.map(member => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.user_profiles?.display_name || member.user_profiles?.full_name || member.user_profiles?.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="funding" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="associated_grant_number">Grant Number</Label>
                  <Input
                    id="associated_grant_number"
                    value={formData.associated_grant_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, associated_grant_number: e.target.value }))}
                    placeholder="e.g., R01-HD123456"
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="funding_source">Funding Source</Label>
                  <Input
                    id="funding_source"
                    value={formData.funding_source}
                    onChange={(e) => setFormData(prev => ({ ...prev, funding_source: e.target.value }))}
                    placeholder="e.g., NIH, NSF, Rush University"
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="estimated_hours">Estimated Hours</Label>
                  <Input
                    id="estimated_hours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
                    placeholder="0"
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                  {errors.estimated_hours && <p className="text-red-400 text-sm mt-1">{errors.estimated_hours}</p>}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="bg-primary hover:bg-primary"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}