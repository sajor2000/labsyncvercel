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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Mic, 
  Plus, 
  Search, 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Users, 
  Brain, 
  CheckCircle2,
  Play,
  Upload,
  Calendar
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

interface Meeting {
  id: string
  title: string
  description: string | null
  meeting_type: string
  start_datetime: string
  end_datetime: string
  location: string | null
  transcript: string | null
  summary: string | null
  action_items_extracted: boolean
  attendee_count: number | null
  recording_url: string | null
  is_recurring: boolean
  recurrence_pattern: string | null
  status: string
  created_at: string
  updated_at: string
}

interface StandupMeeting {
  id: string
  title: string
  description: string | null
  meeting_date: string
  transcript: string | null
  ai_summary: any
  attendees: string[] | null
  duration_minutes: number | null
  recording_url: string | null
  action_items_count: number | null
  created_at: string
  updated_at: string
}

interface ActionItem {
  id: string
  meeting_id: string
  description: string
  assignee_email: string | null
  priority: string
  due_date: string | null
  status: string
  created_at: string
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

interface MeetingsPageClientProps {
  lab: Lab
  initialMeetings: Meeting[]
  standupMeetings: StandupMeeting[]
  actionItems: ActionItem[]
  labMembers: LabMember[]
  userPermissions: {
    canSchedule: boolean
    canManage: boolean
  }
}

const meetingTypeColors = {
  'standup': 'bg-blue-500',
  'planning': 'bg-purple-500',
  'review': 'bg-green-500',
  'presentation': 'bg-orange-500',
  'training': 'bg-teal-500',
  'social': 'bg-pink-500',
  'other': 'bg-gray-500'
}

const priorityColors = {
  'low': 'bg-gray-500',
  'medium': 'bg-blue-500',
  'high': 'bg-orange-500',
  'urgent': 'bg-red-500'
}

export default function MeetingsPageClient({ 
  lab, 
  initialMeetings,
  standupMeetings,
  actionItems,
  labMembers,
  userPermissions 
}: MeetingsPageClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("scheduled")
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meeting_type: 'standup',
    start_datetime: '',
    end_datetime: '',
    location: ''
  })

  const [uploadData, setUploadData] = useState({
    title: '',
    meeting_date: '',
    audio_file: null as File | null
  })

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('meetings')
        .insert({
          lab_id: lab.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          meeting_type: formData.meeting_type,
          start_datetime: formData.start_datetime,
          end_datetime: formData.end_datetime,
          location: formData.location.trim() || null,
          status: 'scheduled',
          attendee_count: 0,
          action_items_extracted: false
        })
        .select()
        .single()

      if (error) throw error

      setMeetings(prev => [data, ...prev])
      setFormData({
        title: '',
        description: '',
        meeting_type: 'standup',
        start_datetime: '',
        end_datetime: '',
        location: ''
      })
      setIsCreateDialogOpen(false)
      toast.success('Meeting scheduled successfully!')
      
    } catch (error: any) {
      console.error('Error creating meeting:', error)
      toast.error('Failed to schedule meeting')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadAudio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadData.title.trim() || !uploadData.audio_file) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('audio', uploadData.audio_file)
      formData.append('title', uploadData.title)
      formData.append('meeting_date', uploadData.meeting_date)
      formData.append('lab_id', lab.id)

      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      toast.success('Audio uploaded and AI processing started!')
      setIsUploadDialogOpen(false)
      setUploadData({ title: '', meeting_date: '', audio_file: null })
      
      // Refresh to show new standup meeting
      window.location.reload()
      
    } catch (error: any) {
      console.error('Error uploading audio:', error)
      toast.error('Failed to upload audio')
    } finally {
      setIsLoading(false)
    }
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
              {lab.name} - Meetings
            </h1>
            <p className="text-muted-foreground">
              Schedule meetings and process standups with AI transcription
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {userPermissions.canManage && (
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-green-600 text-green-400 hover:bg-green-900/20">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Standup Audio
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Standup Audio for AI Processing</DialogTitle>
                  <DialogDescription>
                    Upload an audio recording to extract action items and insights with AI
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUploadAudio} className="space-y-4">
                  <div>
                    <Label htmlFor="upload-title">Meeting Title</Label>
                    <Input
                      id="upload-title"
                      value={uploadData.title}
                      onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Weekly Lab Standup - January 15"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="upload-date">Meeting Date</Label>
                    <Input
                      id="upload-date"
                      type="date"
                      value={uploadData.meeting_date}
                      onChange={(e) => setUploadData(prev => ({ ...prev, meeting_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="upload-audio">Audio File</Label>
                    <Input
                      id="upload-audio"
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setUploadData(prev => ({ 
                        ...prev, 
                        audio_file: e.target.files?.[0] || null 
                      }))}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports MP3, WAV, M4A, and other audio formats
                    </p>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Processing...' : 'Upload & Process'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {userPermissions.canSchedule && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-slack-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule New Meeting</DialogTitle>
                  <DialogDescription>
                    Create a new meeting for {lab.name}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateMeeting} className="space-y-4">
                  <div>
                    <Label htmlFor="meeting-title">Meeting Title</Label>
                    <Input
                      id="meeting-title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Weekly Lab Meeting"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="meeting-type">Meeting Type</Label>
                    <Select 
                      value={formData.meeting_type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, meeting_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standup">Standup</SelectItem>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="presentation">Presentation</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-datetime">Start Date & Time</Label>
                      <Input
                        id="start-datetime"
                        type="datetime-local"
                        value={formData.start_datetime}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_datetime: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-datetime">End Date & Time</Label>
                      <Input
                        id="end-datetime"
                        type="datetime-local"
                        value={formData.end_datetime}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_datetime: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Conference Room A, Zoom, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Meeting agenda, notes, etc."
                      rows={3}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Scheduling...' : 'Schedule Meeting'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Meeting Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scheduled">Scheduled Meetings</TabsTrigger>
          <TabsTrigger value="standups">AI-Processed Standups</TabsTrigger>
          <TabsTrigger value="action-items">Action Items</TabsTrigger>
        </TabsList>

        {/* Scheduled Meetings Tab */}
        <TabsContent value="scheduled" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {meetings.length === 0 ? (
            <Card className="card-slack p-12 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">No Meetings Scheduled</h3>
              <p className="text-muted-foreground mb-6">
                Schedule your first lab meeting to get started
              </p>
              {userPermissions.canSchedule && (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="btn-slack-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule First Meeting
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {meetings
                .filter(meeting => 
                  meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (meeting.description && meeting.description.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map((meeting) => (
                <Card key={meeting.id} className="card-slack hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge 
                            variant="outline"
                            className={`text-xs text-white ${meetingTypeColors[meeting.meeting_type as keyof typeof meetingTypeColors] || 'bg-gray-500'}`}
                          >
                            {meeting.meeting_type}
                          </Badge>
                          <h3 className="text-lg font-medium text-foreground truncate">
                            {meeting.title}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {meeting.status}
                          </Badge>
                        </div>
                        
                        {meeting.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {meeting.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(new Date(meeting.start_datetime), 'MMM d, h:mm a')} - {format(new Date(meeting.end_datetime), 'h:mm a')}
                            </span>
                          </div>
                          {meeting.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{meeting.location}</span>
                            </div>
                          )}
                          {meeting.attendee_count && (
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{meeting.attendee_count} attendees</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        {meeting.transcript && (
                          <Badge variant="outline" className="text-green-400 border-green-600">
                            <Brain className="h-3 w-3 mr-1" />
                            AI Processed
                          </Badge>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/dashboard/labs/${lab.id}/meetings/${meeting.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* AI-Processed Standups Tab */}
        <TabsContent value="standups" className="space-y-4">
          {standupMeetings.length === 0 ? (
            <Card className="card-slack p-12 text-center">
              <Mic className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">No AI-Processed Standups</h3>
              <p className="text-muted-foreground mb-6">
                Upload standup audio recordings to extract action items with AI
              </p>
              {userPermissions.canManage && (
                <Button 
                  onClick={() => setIsUploadDialogOpen(true)}
                  className="btn-slack-primary"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Recording
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {standupMeetings.map((standup) => (
                <Card key={standup.id} className="card-slack">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Brain className="h-5 w-5 text-blue-400" />
                          <h3 className="text-lg font-medium text-foreground">
                            {standup.title}
                          </h3>
                          <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400">
                            AI Processed
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                          <span>{format(new Date(standup.meeting_date), 'MMM d, yyyy')}</span>
                          {standup.duration_minutes && (
                            <span>{standup.duration_minutes} minutes</span>
                          )}
                          {standup.action_items_count && (
                            <span>{standup.action_items_count} action items extracted</span>
                          )}
                        </div>

                        {standup.ai_summary && (
                          <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                            <p className="text-sm text-slate-300">
                              {typeof standup.ai_summary === 'string' 
                                ? standup.ai_summary 
                                : JSON.stringify(standup.ai_summary)
                              }
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/dashboard/labs/${lab.id}/meetings/standup/${standup.id}`)}
                        >
                          View Analysis
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Action Items Tab */}
        <TabsContent value="action-items" className="space-y-4">
          {actionItems.length === 0 ? (
            <Card className="card-slack p-12 text-center">
              <CheckCircle2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">No Action Items</h3>
              <p className="text-muted-foreground mb-6">
                Action items will appear here when extracted from meeting transcripts
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {actionItems.map((item) => (
                <Card key={item.id} className="card-slack">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge 
                            variant="outline"
                            className={`text-xs text-white ${priorityColors[item.priority as keyof typeof priorityColors] || 'bg-gray-500'}`}
                          >
                            {item.priority}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Assigned to: {item.assignee_email || 'Unassigned'}
                          </span>
                          {item.due_date && (
                            <span className="text-sm text-muted-foreground">
                              Due: {format(new Date(item.due_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                        <p className="text-foreground">{item.description}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Mark Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}