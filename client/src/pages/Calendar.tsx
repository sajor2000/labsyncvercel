import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Users, Filter, Grid3X3, List, Eye, MapPin, Target, Calendar as CalendarEventIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLabContext } from "@/hooks/useLabContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface CalendarEvent {
  id: string;
  title: string;
  type: "standup" | "deadline" | "meeting" | "milestone" | "task" | "study" | "irb" | "regulatory" | "clinical_service" | "pto";
  startDate: string;
  endDate: string;
  allDay?: boolean;
  time?: string;
  description?: string;
  participants?: number;
  status?: string;
  priority?: string;
  location?: string;
  duration?: number; // in hours
  piClinicalService?: boolean;
  pto?: boolean;
  metadata?: {
    studyId?: string;
    taskId?: string;
    milestoneId?: string;
    progress?: number;
    assignees?: string[];
    irbStatus?: string;
    deliverables?: string[];
    meetingType?: string;
    hasRecording?: boolean;
    hasTranscript?: boolean;
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
    clinicalService: true,
    pto: true,
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

  // Fetch calendar events (PTO and Clinical Service blocks)
  const { data: calendarEvents = [] } = useQuery<any[]>({
    queryKey: ['/api/calendar-events', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: milestones = [] } = useQuery<any[]>({
    queryKey: ['/api/study-milestones', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  // Combine all events from multiple sources
  const allEvents: CalendarEvent[] = [
    // Standups (Blue)
    ...standups.map((standup: any) => {
      const baseDate = standup.scheduledDate;
      let startDate = baseDate;
      let endDate = baseDate;
      let duration = 1; // Default 1 hour
      
      // Calculate duration from start/end times
      if (standup.startTime && standup.endTime) {
        const start = new Date(`${baseDate}T${standup.startTime}`);
        const end = new Date(`${baseDate}T${standup.endTime}`);
        duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60)));
        startDate = start.toISOString();
        endDate = end.toISOString();
      }
      
      return {
        id: `standup-${standup.id}`,
        title: 'Standup Meeting',
        type: "standup" as const,
        startDate,
        endDate,
        allDay: false,
        duration,
        time: (() => {
          if (standup.startTime && standup.startTime.includes(':')) {
            const [hours, minutes] = standup.startTime.split(':');
            const startDate = new Date();
            startDate.setHours(parseInt(hours), parseInt(minutes), 0);
            let timeStr = startDate.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            });
            
            if (standup.endTime && standup.endTime.includes(':')) {
              const [endHours, endMinutes] = standup.endTime.split(':');
              const endDate = new Date();
              endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0);
              const endTimeStr = endDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              });
              timeStr += ` - ${endTimeStr}`;
            }
            return timeStr;
          }
          return undefined;
        })(),
        description: standup.aiSummary || standup.transcript || 'Weekly standup meeting',
        participants: (() => {
          if (typeof standup.participants === 'string') {
            try {
              return JSON.parse(standup.participants).length;
            } catch {
              return 0;
            }
          }
          return Array.isArray(standup.participants) ? standup.participants.length : 0;
        })(),
        status: standup.isActive ? 'SCHEDULED' : 'COMPLETED',
        metadata: {
          meetingType: standup.meetingType || 'Weekly Standup',
          hasRecording: !!standup.recordingUrl,
          hasTranscript: !!standup.transcript,
        }
      };
    }),
    
    // Deadlines (Red) - All day events
    ...deadlines.map((deadline: any) => ({
      id: `deadline-${deadline.id}`,
      title: deadline.title,
      type: "deadline" as const,
      startDate: deadline.dueDate,
      endDate: deadline.dueDate,
      allDay: true,
      description: deadline.description,
      status: deadline.status,
      priority: deadline.priority,
    })),
    
    // Task Deadlines (Orange) - All day events
    ...tasks
      .filter((task: any) => task.dueDate)
      .map((task: any) => ({
        id: `task-${task.id}`,
        title: `Task: ${task.title}`,
        type: "task" as const,
        startDate: task.dueDate,
        endDate: task.dueDate,
        allDay: true,
        description: task.description,
        status: task.status,
        priority: task.priority,
        metadata: {
          taskId: task.id,
          assignees: task.assignees || [],
        },
      })),
    
    // Study Milestones (Purple) - All day events
    ...milestones.map((milestone: any) => ({
      id: `milestone-${milestone.id}`,
      title: `${milestone.name}`,
      type: "milestone" as const,
      startDate: milestone.targetDate,
      endDate: milestone.targetDate,
      allDay: true,
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

    // IRB Submissions (Green) - All day events
    ...studies
      .filter((study: any) => study.irbSubmissionDate)
      .map((study: any) => ({
        id: `irb-${study.id}`,
        title: `IRB: ${study.name}`,
        type: "irb" as const,
        startDate: study.irbSubmissionDate,
        endDate: study.irbSubmissionDate,
        allDay: true,
        description: `IRB submission for ${study.name}`,
        status: study.irbStatus,
        priority: "HIGH",
        metadata: {
          studyId: study.id,
          irbStatus: study.irbStatus,
        },
      })),

    // Study Due Dates (Indigo) - All day events
    ...studies
      .filter((study: any) => study.dueDate)
      .map((study: any) => ({
        id: `study-${study.id}`,
        title: `Study: ${study.name}`,
        type: "study" as const,
        startDate: study.dueDate,
        endDate: study.dueDate,
        allDay: true,
        description: study.notes,
        status: study.status,
        priority: study.priority,
        metadata: {
          studyId: study.id,
        },
      })),

    // PTO Events (Cyan) - Support multi-day and multi-hour events
    ...calendarEvents
      .filter((event: any) => event.pto)
      .map((event: any) => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        const duration = event.allDay ? 0 : Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
        
        return {
          id: `pto-${event.id}`,
          title: `PTO: ${event.title}`,
          type: "pto" as const,
          startDate: event.startDate,
          endDate: event.endDate,
          allDay: event.allDay,
          duration,
          time: event.allDay ? 'All Day' : `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
          description: event.description,
          location: event.location,
          pto: event.pto,
          metadata: {
            assignees: [event.userId],
          },
        };
      }),

    // Clinical Service Events (Teal) - Support multi-day and multi-hour events
    ...calendarEvents
      .filter((event: any) => event.piClinicalService)
      .map((event: any) => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        const duration = event.allDay ? 0 : Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
        
        return {
          id: `clinical-${event.id}`,
          title: `Clinical: ${event.title}`,
          type: "clinical_service" as const,
          startDate: event.startDate,
          endDate: event.endDate,
          allDay: event.allDay,
          duration,
          time: event.allDay ? 'All Day' : `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
          description: event.description,
          location: event.location,
          piClinicalService: event.piClinicalService,
          metadata: {
            assignees: [event.userId],
          },
        };
      }),
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
      case "clinical_service": return eventFilters.clinicalService;
      case "pto": return eventFilters.pto;
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
    
    let targetDate: Date;
    if (day instanceof Date) {
      targetDate = day;
    } else {
      targetDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
    }
    
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    return events.filter(event => {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      
      // Check if target date falls within the event's date range
      if (event.allDay) {
        // For all-day events, include any day within the range
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        return targetDateStr >= startDateStr && targetDateStr <= endDateStr;
      } else {
        // For timed events, check if it's on the same day as start date
        const eventDateStr = startDate.toISOString().split('T')[0];
        return eventDateStr === targetDateStr;
      }
    });
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
      case "pto": return "bg-cyan-500";
      case "clinical_service": return "bg-teal-600";
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
                           type === 'irb' ? 'IRB Submissions' :
                           type === 'clinicalService' ? 'PI Clinical Service' :
                           type === 'pto' ? 'PTO Events' : type}
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
                                      className={`text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80 ${getEventTypeColor(event.type)} ${
                                        event.allDay ? 'border-2 border-dashed border-white/30' : ''
                                      }`}
                                      title={`${event.title}${event.allDay ? ' (All Day)' : ''}${event.duration && event.duration > 1 ? ` (${event.duration}h)` : ''}`}
                                      data-testid={`event-${event.id}`}
                                      onClick={() => setSelectedEvent(event)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="truncate">{event.title}</span>
                                        {event.allDay && (
                                          <span className="ml-1 text-[10px] opacity-70">●</span>
                                        )}
                                        {event.duration && event.duration > 1 && !event.allDay && (
                                          <span className="ml-1 text-[10px] opacity-70">{event.duration}h</span>
                                        )}
                                      </div>
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
                                  className={`text-xs p-1 rounded text-white cursor-pointer hover:opacity-80 ${getEventTypeColor(event.type)} ${
                                    event.allDay ? 'border-2 border-dashed border-white/30' : ''
                                  }`}
                                  title={`${event.title}${event.allDay ? ' (All Day)' : ''}${event.duration && event.duration > 1 ? ` (${event.duration}h)` : ''}`}
                                  data-testid={`event-${event.id}`}
                                  onClick={() => setSelectedEvent(event)}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="truncate font-medium">{event.title}</span>
                                    {event.allDay && (
                                      <span className="ml-1 text-[10px] opacity-70">●</span>
                                    )}
                                  </div>
                                  {event.time && (
                                    <div className="text-[10px] opacity-80 truncate">
                                      {event.time}
                                      {event.duration && event.duration > 1 && !event.allDay && (
                                        <span className="ml-1">({event.duration}h)</span>
                                      )}
                                    </div>
                                  )}
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
                  .filter(event => new Date(event.startDate) >= new Date())
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
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
                              {event.allDay ? 'All Day' : new Date(event.startDate).toLocaleDateString()}
                              {event.duration && event.duration > 1 && !event.allDay && (
                                <span className="ml-1 text-xs">({event.duration}h)</span>
                              )}
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
                {events.filter(event => new Date(event.startDate) >= new Date()).length === 0 && (
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
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-cyan-500 rounded"></div>
                  <span className="text-sm">PTO Events</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-teal-600 rounded"></div>
                  <span className="text-sm">Clinical Service</span>
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
                <div className={`w-4 h-4 rounded-full ${getEventTypeColor(selectedEvent.type)}`} />
                <span className="text-xl font-semibold">{selectedEvent.title}</span>
                <Badge className={`${getEventTypeColor(selectedEvent.type)} text-white ml-2 text-xs px-2 py-1`}>
                  {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                View detailed information about this event
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Event Header Card */}
              <div className="bg-gradient-to-r from-background to-muted/30 p-4 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CalendarEventIcon className="w-5 h-5 text-primary" />
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Event Date</span>
                        <p className="text-base font-semibold">
                          {selectedEvent.allDay ? (
                            // Multi-day all-day event
                            new Date(selectedEvent.startDate).toDateString() === new Date(selectedEvent.endDate).toDateString() ? 
                            new Date(selectedEvent.startDate).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            }) :
                            `${new Date(selectedEvent.startDate).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })} - ${new Date(selectedEvent.endDate).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}`
                          ) : (
                            new Date(selectedEvent.startDate).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          )}
                        </p>
                      </div>
                    </div>
                    {selectedEvent.time && (
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-primary" />
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">
                            {selectedEvent.allDay ? 'Duration' : 'Time'}
                          </span>
                          <p className="text-base font-semibold">
                            {selectedEvent.time}
                            {selectedEvent.duration && selectedEvent.duration > 1 && !selectedEvent.allDay && (
                              <span className="ml-2 text-sm text-muted-foreground">
                                ({selectedEvent.duration} hour{selectedEvent.duration > 1 ? 's' : ''})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedEvent.location && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-primary" />
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Location</span>
                          <p className="text-base font-semibold">{selectedEvent.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {selectedEvent.status && (
                      <div className="flex items-center space-x-3">
                        <Target className="w-5 h-5 text-primary" />
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Status</span>
                          <div className="mt-1">
                            <Badge variant="outline" className="text-sm px-3 py-1">
                              {selectedEvent.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedEvent.priority && (
                      <div className="flex items-center space-x-3">
                        <Target className="w-5 h-5 text-primary" />
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Priority</span>
                          <div className="mt-1">
                            <Badge variant={selectedEvent.priority === 'HIGH' ? 'destructive' : selectedEvent.priority === 'MEDIUM' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                              {selectedEvent.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Team Participation</span>
                      <p className="text-base font-semibold">{selectedEvent.participants} team members</p>
                    </div>
                  </div>
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
              <DialogTitle className="flex items-center space-x-3">
                <CalendarIcon className="w-6 h-6 text-primary" />
                <span className="text-xl font-semibold">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                All events scheduled for this day ({getEventsForDay(selectedDate).length} events)
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {getEventsForDay(selectedDate).length > 0 ? (
                <div className="space-y-3">
                  {getEventsForDay(selectedDate)
                    .sort((a, b) => {
                      if (a.time && b.time) {
                        return a.time.localeCompare(b.time);
                      }
                      return 0;
                    })
                    .map(event => (
                    <div key={event.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={`w-4 h-4 rounded-full ${getEventTypeColor(event.type)} mt-1 flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-lg truncate">{event.title}</h4>
                              <Badge className={`${getEventTypeColor(event.type)} text-white text-xs px-2 py-1 flex-shrink-0`}>
                                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                              {event.time && (
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                                  <div>
                                    <span className="text-xs text-muted-foreground block">Time</span>
                                    <span className="text-sm font-medium">{event.time}</span>
                                  </div>
                                </div>
                              )}
                              {event.participants && (
                                <div className="flex items-center space-x-2">
                                  <Users className="w-4 h-4 text-primary flex-shrink-0" />
                                  <div>
                                    <span className="text-xs text-muted-foreground block">Participants</span>
                                    <span className="text-sm font-medium">{event.participants} people</span>
                                  </div>
                                </div>
                              )}
                              {event.status && (
                                <div className="flex items-center space-x-2">
                                  <Target className="w-4 h-4 text-primary flex-shrink-0" />
                                  <div>
                                    <span className="text-xs text-muted-foreground block">Status</span>
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {event.status}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {event.description && (
                              <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                                {event.description.length > 120 
                                  ? `${event.description.substring(0, 120)}...` 
                                  : event.description
                                }
                              </p>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                          data-testid={`view-event-${event.id}`}
                          className="ml-4 flex-shrink-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
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