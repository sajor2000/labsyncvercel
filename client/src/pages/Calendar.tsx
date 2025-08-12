import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Users, Filter, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLabContext } from "@/hooks/useLabContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface CalendarEvent {
  id: string;
  title: string;
  type: "standup" | "deadline" | "meeting" | "milestone" | "task" | "study";
  date: string;
  time?: string;
  description?: string;
  participants?: number;
  status?: string;
  priority?: string;
  metadata?: {
    studyId?: string;
    taskId?: string;
    progress?: number;
    assignees?: string[];
  };
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<"month" | "week">("month");
  const [showFilters, setShowFilters] = useState(false);
  const [eventFilters, setEventFilters] = useState({
    standups: true,
    deadlines: true,
    tasks: true,
    studies: true,
    meetings: true,
    milestones: true,
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
    
    // Study Milestones (Purple)
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

  const getEventsForDay = (day: number) => {
    if (!day) return [];
    
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toISOString().split('T')[0];
    
    return events.filter(event => 
      event.date.startsWith(dateStr)
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
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
      default: return "bg-gray-500";
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = getDaysInMonth(currentDate);

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
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
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
                           type === 'milestones' ? 'Milestones' : type}
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
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {days.map((day, index) => {
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
                              <div
                                key={event.id}
                                className={`text-xs p-1 rounded text-white truncate ${getEventTypeColor(event.type)}`}
                                title={event.title}
                                data-testid={`event-${event.id}`}
                              >
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
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
                    <div key={event.id} className="flex items-start space-x-3" data-testid={`upcoming-event-${event.id}`}>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}