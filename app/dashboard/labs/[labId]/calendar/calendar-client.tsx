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
import { Calendar, Plus, Search, ArrowLeft, Clock, MapPin, Users, RotateCcw, Settings } from "lucide-react"
import { format, isToday, isTomorrow, isThisWeek } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

interface CalendarEvent {
  id: string
  summary: string
  description: string | null
  start_time: string
  end_time: string
  location: string | null
  attendees: any | null
  all_day: boolean
  google_event_id: string | null
  google_meet_link: string | null
  created_at: string
  updated_at: string
}

interface Lab {
  id: string
  name: string
  description: string | null
}

interface CalendarIntegration {
  id: string
  provider: string
  name: string
  external_calendar_id: string
  sync_enabled: boolean
  status: string
  last_sync_at: string | null
}

interface LabMember {
  user_id: string
  role: string
  user_profiles: {
    id: string
    email: string
    full_name: string | null
  } | null
}

interface CalendarPageClientProps {
  lab: Lab
  calendarIntegration: CalendarIntegration | null
  initialEvents: CalendarEvent[]
  labMembers: LabMember[]
  userPermissions: {
    canSchedule: boolean
    canManage: boolean
  }
}

// Event type colors can be based on keywords in summary or description
const getEventColor = (summary: string) => {
  const lower = summary.toLowerCase()
  if (lower.includes('meeting')) return 'bg-blue-500'
  if (lower.includes('deadline')) return 'bg-red-500'
  if (lower.includes('conference')) return 'bg-purple-500'
  if (lower.includes('training')) return 'bg-green-500'
  return 'bg-gray-500'
}

export default function CalendarPageClient({ 
  lab, 
  calendarIntegration,
  initialEvents, 
  labMembers,
  userPermissions 
}: CalendarPageClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    all_day: false
  })

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesType = filterType === "all" || 
      (filterType === "meeting" && event.summary.toLowerCase().includes("meeting")) ||
      (filterType === "deadline" && event.summary.toLowerCase().includes("deadline")) ||
      (filterType === "conference" && event.summary.toLowerCase().includes("conference")) ||
      (filterType === "training" && event.summary.toLowerCase().includes("training"))
    
    return matchesSearch && matchesType
  })

  const getDateCategory = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    if (isThisWeek(date)) return 'This Week'
    return 'Later'
  }

  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const category = getDateCategory(event.start_time)
    if (!groups[category]) groups[category] = []
    groups[category].push(event)
    return groups
  }, {} as Record<string, CalendarEvent[]>)

  const handleSyncCalendar = async () => {
    if (!calendarIntegration) return
    
    setSyncLoading(true)
    try {
      const response = await fetch(`/api/calendar/google-sync?labId=${lab.id}`)
      if (response.ok) {
        const data = await response.json()
        toast.success(`Synced ${data.count} events from Google Calendar`)
        // Refresh events
        window.location.reload()
      } else {
        throw new Error('Sync failed')
      }
    } catch (error) {
      console.error('Calendar sync error:', error)
      toast.error('Failed to sync calendar')
    } finally {
      setSyncLoading(false)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.summary.trim()) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          lab_id: lab.id,
          summary: formData.summary.trim(),
          description: formData.description.trim() || null,
          start_time: formData.start_time,
          end_time: formData.end_time,
          location: formData.location.trim() || null,
          all_day: formData.all_day,
          attendees: null,
          google_event_id: null,
          google_meet_link: null
        })
        .select()
        .single()

      if (error) throw error

      setEvents(prev => [...prev, data].sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      ))
      
      setFormData({
        summary: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        all_day: false
      })
      setIsCreateDialogOpen(false)
      toast.success('Event created successfully!')
      
    } catch (error: any) {
      console.error('Error creating event:', error)
      toast.error('Failed to create event')
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
              {lab.name} - Calendar
            </h1>
            <p className="text-muted-foreground">
              Manage lab meetings, deadlines, and important events
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Calendar Integration Status */}
          {calendarIntegration ? (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncCalendar}
                disabled={syncLoading}
                className="text-blue-400 border-blue-600"
              >
                <RotateCcw className={`h-4 w-4 mr-2 ${syncLoading ? 'animate-spin' : ''}`} />
                {syncLoading ? 'Syncing...' : 'Sync Google Calendar'}
              </Button>
              <Link href={`/dashboard/labs/${lab.id}/settings`}>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Calendar Settings
                </Button>
              </Link>
            </div>
          ) : (
            <Link href={`/dashboard/labs/${lab.id}/settings`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Connect Calendar
              </Button>
            </Link>
          )}

          {userPermissions.canSchedule && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-slack-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  New Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>
                    Schedule a new event for {lab.name}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <Label htmlFor="event-title">Event Title</Label>
                    <Input
                      id="event-title"
                      value={formData.summary}
                      onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                      placeholder="e.g., Weekly Lab Meeting"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-time">Start Date & Time</Label>
                      <Input
                        id="start-time"
                        type="datetime-local"
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-time">End Date & Time</Label>
                      <Input
                        id="end-time"
                        type="datetime-local"
                        value={formData.end_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
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
                      placeholder="Event details, agenda, notes..."
                      rows={3}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Event'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Calendar Integration Status */}
      {!calendarIntegration && (
        <Card className="card-slack border-yellow-600/20 bg-yellow-900/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-medium">Calendar Not Connected</p>
                <p className="text-sm text-muted-foreground">
                  Connect Google Calendar to sync events and enable advanced features.
                </p>
              </div>
              <Link href={`/dashboard/labs/${lab.id}/settings`}>
                <Button variant="outline" size="sm" className="ml-auto">
                  Connect Calendar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
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
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="meeting">Meetings</SelectItem>
            <SelectItem value="deadline">Deadlines</SelectItem>
            <SelectItem value="conference">Conferences</SelectItem>
            <SelectItem value="training">Training</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Display */}
      {Object.keys(groupedEvents).length === 0 ? (
        <Card className="card-slack p-12 text-center">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium text-foreground mb-2">
            {events.length === 0 ? 'No Upcoming Events' : 'No Matching Events'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {events.length === 0 
              ? 'Schedule your first lab event to get started'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {userPermissions.canSchedule && events.length === 0 && (
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="btn-slack-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule First Event
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([category, categoryEvents]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-foreground mb-4">{category}</h3>
              <div className="space-y-3">
                {categoryEvents.map((event) => (
                  <Card key={event.id} className="card-slack hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge 
                              variant="outline"
                              className={`text-xs text-white ${getEventColor(event.summary)}`}
                            >
                              {event.summary.toLowerCase().includes('meeting') ? 'Meeting' :
                               event.summary.toLowerCase().includes('deadline') ? 'Deadline' :
                               event.summary.toLowerCase().includes('conference') ? 'Conference' :
                               event.summary.toLowerCase().includes('training') ? 'Training' : 'Event'}
                            </Badge>
                            <h4 className="text-lg font-medium text-foreground truncate">
                              {event.summary}
                            </h4>
                            {calendarIntegration && event.google_event_id && (
                              <Badge variant="outline" className="text-xs">
                                Synced
                              </Badge>
                            )}
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {event.all_day 
                                  ? format(new Date(event.start_time), 'MMM d, yyyy')
                                  : `${format(new Date(event.start_time), 'MMM d, h:mm a')} - ${format(new Date(event.end_time), 'h:mm a')}`
                                }
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                            {event.attendees && event.attendees.length > 0 && (
                              <div className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{event.attendees.length} attendees</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push(`/dashboard/labs/${lab.id}/calendar/${event.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}