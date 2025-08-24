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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Clock, 
  Plus, 
  Search, 
  ArrowLeft, 
  AlertTriangle, 
  Calendar,
  ExternalLink,
  Bell,
  User,
  Target
} from "lucide-react"
import { format, differenceInDays, isToday, isPast } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

interface Deadline {
  id: string
  title: string
  description: string | null
  deadline_type: string
  due_date: string
  priority: string
  status: string
  responsible_party: string | null
  external_url: string | null
  completion_requirements: string | null
  notification_days_before: number | null
  is_recurring: boolean
  recurrence_pattern: string | null
  tags: string[] | null
  created_by: string
  created_at: string
  updated_at: string
}

interface Reminder {
  id: string
  deadline_id: string
  reminder_date: string
  reminder_type: string
  sent_at: string | null
  recipient_email: string
}

interface Lab {
  id: string
  name: string
  description: string | null
}

interface LabMember {
  user_id: string
  role: string
  user_profiles: {
    id: string
    email: string
    full_name: string | null
    first_name: string | null
    last_name: string | null
  } | null
}

interface DeadlinesPageClientProps {
  lab: Lab
  initialDeadlines: Deadline[]
  reminders: Reminder[]
  labMembers: LabMember[]
  userPermissions: {
    canManage: boolean
  }
}

const deadlineTypeColors = {
  'grant_deadline': 'bg-green-500',
  'paper_submission': 'bg-blue-500',
  'conference_abstract': 'bg-purple-500',
  'irb_submission': 'bg-orange-500',
  'ethics_review': 'bg-red-500',
  'data_collection': 'bg-teal-500',
  'analysis_completion': 'bg-indigo-500',
  'milestone': 'bg-yellow-500',
  'presentation': 'bg-pink-500',
  'meeting': 'bg-gray-500',
  'other': 'bg-slate-500'
}

const priorityColors = {
  'low': 'bg-gray-500',
  'medium': 'bg-blue-500',
  'high': 'bg-orange-500',
  'urgent': 'bg-red-500'
}

const statusColors = {
  'pending': 'bg-yellow-500',
  'in_progress': 'bg-blue-500',
  'completed': 'bg-green-500',
  'missed': 'bg-red-500',
  'cancelled': 'bg-gray-500'
}

export default function DeadlinesPageClient({ 
  lab, 
  initialDeadlines,
  reminders,
  labMembers,
  userPermissions 
}: DeadlinesPageClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [deadlines, setDeadlines] = useState<Deadline[]>(initialDeadlines)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("active")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline_type: 'grant_deadline',
    due_date: '',
    priority: 'medium',
    responsible_party: '',
    external_url: '',
    completion_requirements: '',
    notification_days_before: '7'
  })

  const getMemberName = (userId: string) => {
    const member = labMembers.find(m => m.user_id === userId)
    if (!member || !member.user_profiles) return 'Unknown'
    
    const profile = member.user_profiles
    return profile.full_name || 
           `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
           profile.email || 'Unknown'
  }

  const getDeadlineUrgency = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date())
    if (isPast(new Date(dueDate))) return 'overdue'
    if (isToday(new Date(dueDate))) return 'today'
    if (days <= 3) return 'urgent'
    if (days <= 7) return 'soon'
    return 'upcoming'
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'overdue': return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'today': return 'text-orange-500 bg-orange-500/10 border-orange-500/20'
      case 'urgent': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'soon': return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      default: return 'text-muted-foreground bg-muted/10 border-muted/20'
    }
  }

  const handleCreateDeadline = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.due_date) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('deadlines')
        .insert({
          lab_id: lab.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          deadline_type: formData.deadline_type,
          due_date: formData.due_date,
          priority: formData.priority,
          status: 'pending',
          responsible_party: formData.responsible_party || null,
          external_url: formData.external_url.trim() || null,
          completion_requirements: formData.completion_requirements.trim() || null,
          notification_days_before: parseInt(formData.notification_days_before),
          created_by: 'current_user_id' // Will need to get from auth context
        })
        .select()
        .single()

      if (error) throw error

      setDeadlines(prev => [...prev, data].sort((a, b) => 
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      ))
      
      setFormData({
        title: '',
        description: '',
        deadline_type: 'grant_deadline',
        due_date: '',
        priority: 'medium',
        responsible_party: '',
        external_url: '',
        completion_requirements: '',
        notification_days_before: '7'
      })
      setIsCreateDialogOpen(false)
      toast.success('Deadline created successfully!')
      
    } catch (error: any) {
      console.error('Error creating deadline:', error)
      toast.error('Failed to create deadline')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDeadlines = deadlines.filter(deadline => {
    const matchesSearch = deadline.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (deadline.description && deadline.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesType = filterType === "all" || deadline.deadline_type === filterType
    
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && !['completed', 'cancelled', 'missed'].includes(deadline.status)) ||
      deadline.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  // Group deadlines by urgency
  const groupedDeadlines = filteredDeadlines.reduce((groups, deadline) => {
    const urgency = getDeadlineUrgency(deadline.due_date)
    if (!groups[urgency]) groups[urgency] = []
    groups[urgency].push(deadline)
    return groups
  }, {} as Record<string, Deadline[]>)

  const urgencyOrder = ['overdue', 'today', 'urgent', 'soon', 'upcoming']

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
              {lab.name} - Deadlines
            </h1>
            <p className="text-muted-foreground">
              Track important dates for grants, papers, and milestones
            </p>
          </div>
        </div>
        
        {userPermissions.canManage && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-slack-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Deadline
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Deadline</DialogTitle>
                <DialogDescription>
                  Track an important deadline for {lab.name}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateDeadline} className="space-y-4">
                <div>
                  <Label htmlFor="deadline-title">Deadline Title</Label>
                  <Input
                    id="deadline-title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., NIH Grant Application Due"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deadline-type">Deadline Type</Label>
                  <Select 
                    value={formData.deadline_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, deadline_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grant_deadline">Grant Deadline</SelectItem>
                      <SelectItem value="paper_submission">Paper Submission</SelectItem>
                      <SelectItem value="conference_abstract">Conference Abstract</SelectItem>
                      <SelectItem value="irb_submission">IRB Submission</SelectItem>
                      <SelectItem value="ethics_review">Ethics Review</SelectItem>
                      <SelectItem value="data_collection">Data Collection</SelectItem>
                      <SelectItem value="analysis_completion">Analysis Completion</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="due-date">Due Date</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
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
                </div>
                <div>
                  <Label htmlFor="responsible-party">Responsible Party</Label>
                  <Select 
                    value={formData.responsible_party} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, responsible_party: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {labMembers.map(member => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.user_profiles?.full_name || member.user_profiles?.email || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="external-url">External URL (optional)</Label>
                  <Input
                    id="external-url"
                    value={formData.external_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, external_url: e.target.value }))}
                    placeholder="https://grants.nih.gov/..."
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional details about this deadline..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="notification-days">Notification Days Before</Label>
                  <Input
                    id="notification-days"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.notification_days_before}
                    onChange={(e) => setFormData(prev => ({ ...prev, notification_days_before: e.target.value }))}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Add Deadline'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deadlines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="grant_deadline">Grant Deadlines</SelectItem>
            <SelectItem value="paper_submission">Paper Submissions</SelectItem>
            <SelectItem value="conference_abstract">Conference Abstracts</SelectItem>
            <SelectItem value="irb_submission">IRB Submissions</SelectItem>
            <SelectItem value="milestone">Milestones</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deadlines Display */}
      {filteredDeadlines.length === 0 ? (
        <Card className="card-slack p-12 text-center">
          <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium text-foreground mb-2">
            {deadlines.length === 0 ? 'No Deadlines Tracked' : 'No Matching Deadlines'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {deadlines.length === 0 
              ? 'Add your first deadline to stay on top of important dates'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {userPermissions.canManage && deadlines.length === 0 && (
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="btn-slack-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Deadline
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {urgencyOrder.map(urgency => {
            const urgencyDeadlines = groupedDeadlines[urgency]
            if (!urgencyDeadlines || urgencyDeadlines.length === 0) return null

            return (
              <div key={urgency}>
                <div className="flex items-center space-x-2 mb-4">
                  <AlertTriangle className={`h-5 w-5 ${
                    urgency === 'overdue' ? 'text-red-500' :
                    urgency === 'today' ? 'text-orange-500' :
                    urgency === 'urgent' ? 'text-yellow-500' :
                    'text-muted-foreground'
                  }`} />
                  <h3 className="text-lg font-semibold text-foreground capitalize">
                    {urgency === 'overdue' ? 'Overdue' :
                     urgency === 'today' ? 'Due Today' :
                     urgency === 'urgent' ? 'Due This Week' :
                     urgency === 'soon' ? 'Due Soon' :
                     'Upcoming'}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {urgencyDeadlines.length}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {urgencyDeadlines.map((deadline) => {
                    const urgency = getDeadlineUrgency(deadline.due_date)
                    const daysUntil = differenceInDays(new Date(deadline.due_date), new Date())
                    
                    return (
                      <Card key={deadline.id} className={`card-slack ${getUrgencyColor(urgency)} transition-colors`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                <Badge 
                                  variant="outline"
                                  className={`text-xs text-white ${deadlineTypeColors[deadline.deadline_type as keyof typeof deadlineTypeColors] || 'bg-gray-500'}`}
                                >
                                  {deadline.deadline_type.replace('_', ' ')}
                                </Badge>
                                <Badge 
                                  variant="outline"
                                  className={`text-xs text-white ${priorityColors[deadline.priority as keyof typeof priorityColors] || 'bg-gray-500'}`}
                                >
                                  {deadline.priority}
                                </Badge>
                                <Badge 
                                  variant="outline"
                                  className={`text-xs text-white ${statusColors[deadline.status as keyof typeof statusColors] || 'bg-gray-500'}`}
                                >
                                  {deadline.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              
                              <h4 className="text-lg font-medium text-foreground mb-2 line-clamp-1">
                                {deadline.title}
                              </h4>
                              
                              {deadline.description && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {deadline.description}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span className={daysUntil < 0 ? 'text-red-400 font-medium' : ''}>
                                    {format(new Date(deadline.due_date), 'MMM d, yyyy')}
                                    {daysUntil >= 0 && ` (${daysUntil} days)`}
                                    {daysUntil < 0 && ` (${Math.abs(daysUntil)} days overdue)`}
                                  </span>
                                </div>
                                {deadline.responsible_party && (
                                  <div className="flex items-center space-x-1">
                                    <User className="h-3 w-3" />
                                    <span>{getMemberName(deadline.responsible_party)}</span>
                                  </div>
                                )}
                                {deadline.notification_days_before && (
                                  <div className="flex items-center space-x-1">
                                    <Bell className="h-3 w-3" />
                                    <span>{deadline.notification_days_before}d notice</span>
                                  </div>
                                )}
                              </div>

                              {/* Tags */}
                              {deadline.tags && deadline.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {deadline.tags.slice(0, 3).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      #{tag}
                                    </Badge>
                                  ))}
                                  {deadline.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{deadline.tags.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col space-y-2 ml-4">
                              {deadline.external_url && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => window.open(deadline.external_url!, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Link
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => router.push(`/dashboard/labs/${lab.id}/deadlines/${deadline.id}`)}
                              >
                                View Details
                              </Button>
                              {userPermissions.canManage && deadline.status !== 'completed' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-green-400 border-green-600"
                                  onClick={async () => {
                                    try {
                                      await supabase
                                        .from('deadlines')
                                        .update({ status: 'completed' })
                                        .eq('id', deadline.id)
                                      
                                      setDeadlines(prev => prev.map(d => 
                                        d.id === deadline.id ? { ...d, status: 'completed' } : d
                                      ))
                                      toast.success('Deadline marked as completed!')
                                    } catch (error) {
                                      toast.error('Failed to update deadline')
                                    }
                                  }}
                                >
                                  <Target className="h-3 w-3 mr-1" />
                                  Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}