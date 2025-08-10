import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLabContext } from "@/hooks/useLabContext";

interface CalendarEvent {
  id: string;
  title: string;
  type: "standup" | "deadline" | "meeting" | "milestone";
  date: string;
  time?: string;
  description?: string;
  participants?: number;
  status?: string;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
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

  // Combine all events
  const events: CalendarEvent[] = [
    ...standups.map((standup: any) => ({
      id: standup.id,
      title: standup.title,
      type: "standup" as const,
      date: standup.scheduledDate,
      description: standup.description,
      participants: standup.participantIds?.length || 0,
      status: standup.status,
    })),
    ...deadlines.map((deadline: any) => ({
      id: deadline.id,
      title: deadline.title,
      type: "deadline" as const,
      date: deadline.dueDate,
      description: deadline.description,
      status: deadline.status,
    })),
  ];

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
        <p className="text-muted-foreground">View all lab events, deadlines, and meetings</p>
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