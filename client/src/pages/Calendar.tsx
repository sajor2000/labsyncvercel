import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Users, Filter, Grid3X3, List, Eye, MapPin, Target, Calendar as CalendarEventIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLabContext } from "@/hooks/useLabContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface CalendarEvent {
  id: string;
  title: string;
  type: "standup" | "deadline" | "meeting" | "milestone" | "task" | "study" | "irb" | "regulatory";
  date: string;
  time?: string;
  description?: string;
  participants?: number;
  status?: string;
  priority?: string;
  metadata?: {
    studyId?: string;
    taskId?: string;
    milestoneId?: string;
    progress?: number;
    assignees?: string[];
    irbStatus?: string;
    deliverables?: string[];
  };
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<"month" | "week">("month");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventFilters, setEventFilters] = useState({
    standups: true,
    deadlines: true,
    tasks: true,
    studies: true,
    meetings: true,
    milestones: true,
    irb: true,
  });
  const { selectedLab } = useLabContext();

  // Fetch events from multiple sources
  const { data: standups = [] } = useQuery<any[]>({
    queryKey: ['/api/standups', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: deadlines = [] } = useQuery<any[]>({
    queryKey: ['/api/deadlines', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ['/api/tasks', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: studies = [] } = useQuery<any[]>({
    queryKey: ['/api/studies', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: milestones = [] } = useQuery<any[]>({
    queryKey: ['/api/study-milestones', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  // Combine all events from multiple sources
  const allEvents: CalendarEvent[] = [
    // Standups (Blue)
    ...standups.map((standup: any) => ({
      id: `standup-${standup.id}`,
      title: standup.title,
      type: "standup" as const,
      date: standup.scheduledDate,
      description: standup.description,
      participants: standup.participantIds?.length || 0,
      status: standup.status,
    })),
    
    // Deadlines (Red)
    ...deadlines.map((deadline: any) => ({
      id: `deadline-${deadline.id}`,
      title: deadline.title,
      type: "deadline" as const,
      date: deadline.dueDate,
      description: deadline.description,
      status: deadline.status,
      priority: deadline.priority,
    })),
    
    // Task Deadlines (Orange)
    ...tasks
      .filter((task: any) => task.dueDate)
      .map((task: any) => ({
        id: `task-${task.id}`,
        title: `Task: ${task.title}`,
        type: "task" as const,
        date: task.dueDate,
        description: task.description,
        status: task.status,
        priority: task.priority,
        metadata: {
          taskId: task.id,
          assignees: task.assignees || [],
        },
      })),
    
    // Study Milestones (Purple) - now from dedicated milestones table
    ...milestones.map((milestone: any) => ({
      id: `milestone-${milestone.id}`,
      title: `${milestone.name}`,
      type: "milestone" as const,
      date: milestone.targetDate,
      description: milestone.description,
      status: milestone.status,
      priority: milestone.priority,
      metadata: {
        studyId: milestone.studyId,
        milestoneId: milestone.id,
        progress: milestone.progress,
        deliverables: milestone.deliverables || [],
      },
    })),

    // IRB Submissions (Green) - from studies with IRB dates
    ...studies
      .filter((study: any) => study.irbSubmissionDate)
      .map((study: any) => ({
        id: `irb-${study.id}`,
        title: `IRB: ${study.name}`,
        type: "irb" as const,
        date: study.irbSubmissionDate,
        description: `IRB submission for ${study.name}`,
        status: study.irbStatus,
        priority: "HIGH",
        metadata: {
          studyId: study.id,
          irbStatus: study.irbStatus,
        },
      })),

    // Study Due Dates (Indigo) - for studies with general due dates
    ...studies
      .filter((study: any) => study.dueDate)
      .map((study: any) => ({
        id: `study-${study.id}`,
        title: `Study: ${study.name}`,
        type: "study" as const,
        date: study.dueDate,
        description: study.notes,
        status: study.status,
        priority: study.priority,
        metadata: {
          studyId: study.id,
        },
      })),
  ];

  // Apply filters to events
  const events = allEvents.filter(event => {
    switch (event.type) {
      case "standup": return eventFilters.standups;
      case "deadline": return eventFilters.deadlines;
      case "task": return eventFilters.tasks;
      case "study": return eventFilters.studies;
      case "meeting": return eventFilters.meetings;
      case "milestone": return eventFilters.milestones;
      case "irb": return eventFilters.irb;
      case "regulatory": return eventFilters.irb;
      default: return true;
    }
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getDaysInWeek = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Start from Sunday
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDay = (day: number | Date) => {
    if (!day) return [];
    
    let dateStr: string;
    if (day instanceof Date) {
      dateStr = day.toISOString().split('T')[0];
    } else {
      dateStr = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      ).toISOString().split('T')[0];
    }
    
    return events.filter(event => 
      event.date.startsWith(dateStr)
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (calendarView === 'month') {
        if (direction === 'prev') {
          newDate.setMonth(prev.getMonth() - 1);
        } else {
          newDate.setMonth(prev.getMonth() + 1);
        }
      } else { // week view
        if (direction === 'prev') {
          newDate.setDate(prev.getDate() - 7);
        } else {
          newDate.setDate(prev.getDate() + 7);
        }
      }
      return newDate;
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "standup": return "bg-blue-500";
      case "deadline": return "bg-red-500";
      case "meeting": return "bg-green-500";
      case "milestone": return "bg-purple-500";
      case "task": return "bg-orange-500";
      case "study": return "bg-indigo-500";
      case "irb":
      case "regulatory": return "bg-green-600";
      default: return "bg-gray-500";
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = calendarView === 'month' ? getDaysInMonth(currentDate) : getDaysInWeek(currentDate);

  const formatWeekRange = (weekDays: Date[]) => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  if (!selectedLab) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a lab to view calendar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">Comprehensive research management hub with events, deadlines, tasks, and milestones</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {calendarView === 'month' 
                    ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                    : formatWeekRange(days as Date[])
                  }
                </CardTitle>
                <div className="flex space-x-2">
                  <Select value={calendarView} onValueChange={(value: "month" | "week") => setCalendarView(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    data-testid="button-toggle-filters"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                    data-testid="button-prev-month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                    data-testid="button-today"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                    data-testid="button-next-month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {showFilters && (
                <div className="mt-4 p-4 bg-muted/20 rounded-lg border">
                  <h4 className="text-sm font-medium mb-3">Event Filters</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(eventFilters).map(([type, enabled]) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-${type}`}
                          checked={enabled}
                          onCheckedChange={(checked) => 
                            setEventFilters(prev => ({ ...prev, [type]: checked }))
                          }
                        />
                        <label htmlFor={`filter-${type}`} className="text-sm capitalize">
                          {type === 'standups' ? 'Standups' :
                           type === 'deadlines' ? 'Deadlines' :
                           type === 'tasks' ? 'Task Deadlines' :
                           type === 'studies' ? 'Study Milestones' :
                           type === 'meetings' ? 'Meetings' :
                           type === 'milestones' ? 'Milestones' :
                           type === 'irb' ? 'IRB Submissions' : type}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Showing {events.length} of {allEvents.length} events
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {calendarView === 'month' ? (
                  dayNames.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))
                ) : (
                  (days as Date[]).map((day, index) => (
                    <div key={index} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      <div>{dayNames[index]}</div>
                      <div className="text-lg font-semibold">
                        {day.getDate()}
                      </div>
                    </div>
                  ))
                )}
                
                {/* Calendar days */}
                {calendarView === 'month' ? (
                  // Month View
                  (days as (number | null)[]).map((day, index) => {
                    const dayEvents = day ? getEventsForDay(day) : [];
                    const isToday = day && 
                      new Date().toDateString() === 
                      new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                    
                    return (
                      <div
                        key={index}
                        className={`min-h-[80px] p-1 border rounded-lg ${
                          day ? 'bg-background hover:bg-muted/50' : 'bg-muted/20'
                        } ${isToday ? 'ring-2 ring-primary' : ''}`}
                        data-testid={day ? `calendar-day-${day}` : `calendar-empty-${index}`}
                      >
                        {day && (
                          <>
                            <div className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                              {day}
                            </div>
                            <div className="space-y-1">
                              {dayEvents.slice(0, 2).map(event => (
                                <Dialog key={event.id}>
                                  <DialogTrigger asChild>
                                    <div
                                      className={`text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80 ${getEventTypeColor(event.type)}`}
                                      title={event.title}
                                      data-testid={`event-${event.id}`}
                                      onClick={() => setSelectedEvent(event)}
                                    >
                                      {event.title}
                                    </div>
                                  </DialogTrigger>
                                </Dialog>
                              ))}
                              {dayEvents.length > 2 && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <div 
                                      className="text-xs text-muted-foreground cursor-pointer hover:text-primary"
                                      onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                                    >
                                      +{dayEvents.length - 2} more
                                    </div>
                                  </DialogTrigger>
                                </Dialog>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                ) : (
                  // Week View - no day display in grid, handled in headers
                  (days as Date[]).map((day, index) => {
                    const dayEvents = getEventsForDay(day);
                    const isToday = new Date().toDateString() === day.toDateString();
                    
                    return (
                      <div
                        key={index}
                        className={`min-h-[150px] p-2 border rounded-lg bg-background hover:bg-muted/50 ${
                          isToday ? 'ring-2 ring-primary' : ''
                        }`}
                        data-testid={`calendar-day-${day.getDate()}`}
                      >
                        <div className="space-y-1">
                          {dayEvents.map(event => (
                            <Dialog key={event.id}>
                              <DialogTrigger asChild>
                                <div
                                  className={`text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80 ${getEventTypeColor(event.type)}`}
                                  title={event.title}
                                  data-testid={`event-${event.id}`}
                                  onClick={() => setSelectedEvent(event)}
                                >
                                  {event.title}
                                </div>
                              </DialogTrigger>
                            </Dialog>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events
                  .filter(event => new Date(event.date) >= new Date())
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 5)
                  .map(event => (
                    <Dialog key={event.id}>
                      <DialogTrigger asChild>
                        <div 
                          className="flex items-start space-x-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg" 
                          data-testid={`upcoming-event-${event.id}`}
                          onClick={() => setSelectedEvent(event)}
                        >
                          <Badge className={`${getEventTypeColor(event.type)} text-white`}>
                            {event.type}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{event.title}</p>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="mr-1 h-3 w-3" />
                              {new Date(event.date).toLocaleDateString()}
                            </div>
                            {event.participants && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Users className="mr-1 h-3 w-3" />
                                {event.participants} participants
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogTrigger>
                    </Dialog>
                  ))}
                {events.filter(event => new Date(event.date) >= new Date()).length === 0 && (
                  <p className="text-sm text-muted-foreground">No upcoming events</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Event Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm">Standups</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm">Deadlines</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-sm">Task Deadlines</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded"></div>
                  <span className="text-sm">Study Milestones</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm">Meetings</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span className="text-sm">Milestones</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                  <span className="text-sm">IRB Submissions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getEventTypeColor(selectedEvent.type)}`} />
                <span>{selectedEvent.title}</span>
                <Badge className={`${getEventTypeColor(selectedEvent.type)} text-white ml-2`}>
                  {selectedEvent.type}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Basic Event Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <CalendarEventIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Date:</span>
                  <span className="text-sm">{new Date(selectedEvent.date).toLocaleDateString()}</span>
                </div>
                {selectedEvent.time && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Time:</span>
                    <span className="text-sm">{selectedEvent.time}</span>
                  </div>
                )}
                {selectedEvent.status && (
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant="outline">{selectedEvent.status}</Badge>
                  </div>
                )}
                {selectedEvent.priority && (
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Priority:</span>
                    <Badge variant={selectedEvent.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                      {selectedEvent.priority}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedEvent.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {/* Participants */}
              {selectedEvent.participants && selectedEvent.participants > 0 && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Participants:</span>
                  <span className="text-sm">{selectedEvent.participants} people</span>
                </div>
              )}

              {/* Metadata based on event type */}
              {selectedEvent.metadata && (
                <div className="space-y-3">
                  <Separator />
                  <h4 className="text-sm font-medium">Additional Details</h4>
                  
                  {selectedEvent.metadata.assignees && selectedEvent.metadata.assignees.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Assignees:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedEvent.metadata.assignees.map((assignee, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {assignee}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEvent.metadata.progress !== undefined && (
                    <div>
                      <span className="text-sm font-medium">Progress:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${selectedEvent.metadata.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {selectedEvent.metadata.progress}%
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedEvent.metadata.deliverables && selectedEvent.metadata.deliverables.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Deliverables:</span>
                      <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                        {selectedEvent.metadata.deliverables.map((deliverable, index) => (
                          <li key={index}>{deliverable}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedEvent.metadata.irbStatus && (
                    <div>
                      <span className="text-sm font-medium">IRB Status:</span>
                      <Badge variant="outline" className="ml-2">
                        {selectedEvent.metadata.irbStatus}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Day Details Modal */}
      {selectedDate && (
        <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5" />
                <span>Events for {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {getEventsForDay(selectedDate).length > 0 ? (
                <div className="space-y-3">
                  {getEventsForDay(selectedDate).map(event => (
                    <div key={event.id} className="border rounded-lg p-4 hover:bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)}`} />
                          <div>
                            <h4 className="font-medium">{event.title}</h4>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center space-x-1">
                                <Badge className={`${getEventTypeColor(event.type)} text-white text-xs`}>
                                  {event.type}
                                </Badge>
                              </div>
                              {event.time && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{event.time}</span>
                                </div>
                              )}
                              {event.participants && (
                                <div className="flex items-center space-x-1">
                                  <Users className="w-3 h-3" />
                                  <span>{event.participants} participants</span>
                                </div>
                              )}
                              {event.status && (
                                <Badge variant="outline" className="text-xs">
                                  {event.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                          data-testid={`view-event-${event.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-2 pl-6">
                          {event.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No events scheduled for this day</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}