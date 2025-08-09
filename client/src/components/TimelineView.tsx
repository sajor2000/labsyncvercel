import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Clock, User, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { Task, Study, TeamMember } from "@shared/schema";

interface TimelineViewProps {
  tasks: Task[];
  studies: Study[];
  teamMembers: TeamMember[];
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

// Timeline component for Gantt-style view
export function TimelineView({ tasks, studies, teamMembers, onTaskEdit, onTaskDelete }: TimelineViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewRange, setViewRange] = useState<'week' | 'month' | 'quarter'>('month');
  
  // Calculate timeline dates based on current view
  const timelineDates = useMemo(() => {
    const dates = [];
    const start = new Date(currentDate);
    
    if (viewRange === 'week') {
      start.setDate(start.getDate() - start.getDay()); // Start of week
      for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        dates.push(date);
      }
    } else if (viewRange === 'month') {
      start.setDate(1); // Start of month
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      for (let i = 0; i < daysInMonth; i++) {
        const date = new Date(start);
        date.setDate(i + 1);
        dates.push(date);
      }
    } else { // quarter
      const quarter = Math.floor(start.getMonth() / 3);
      start.setMonth(quarter * 3, 1); // Start of quarter
      for (let i = 0; i < 90; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        dates.push(date);
      }
    }
    
    return dates;
  }, [currentDate, viewRange]);

  // Filter tasks with dates and organize by study
  const tasksWithDates = useMemo(() => {
    return tasks.filter(task => task.dueDate || task.createdAt);
  }, [tasks]);

  const tasksByStudy = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    
    tasksWithDates.forEach(task => {
      const studyId = task.studyId || 'unassigned';
      if (!grouped.has(studyId)) {
        grouped.set(studyId, []);
      }
      grouped.get(studyId)!.push(task);
    });
    
    return grouped;
  }, [tasksWithDates]);

  // Calculate task position and width on timeline
  const getTaskPosition = (task: Task) => {
    const startDate = task.createdAt ? new Date(task.createdAt) : timelineDates[0];
    const endDate = task.dueDate ? new Date(task.dueDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const timelineStart = timelineDates[0];
    const timelineEnd = timelineDates[timelineDates.length - 1];
    
    const totalDays = Math.max(1, Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (24 * 60 * 60 * 1000)));
    
    const taskStartDays = Math.max(0, Math.ceil((startDate.getTime() - timelineStart.getTime()) / (24 * 60 * 60 * 1000)));
    const taskDurationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
    
    const left = (taskStartDays / totalDays) * 100;
    const width = Math.min((taskDurationDays / totalDays) * 100, 100 - left);
    
    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-gray-200 border-gray-300';
      case 'IN_PROGRESS': return 'bg-blue-200 border-blue-300';
      case 'REVIEW': return 'bg-yellow-200 border-yellow-300';
      case 'DONE': return 'bg-green-200 border-green-300';
      case 'BLOCKED': return 'bg-red-200 border-red-300';
      default: return 'bg-gray-200 border-gray-300';
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (viewRange === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewRange === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
    }
    
    setCurrentDate(newDate);
  };

  const formatDateHeader = () => {
    if (viewRange === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
    } else if (viewRange === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
      return `Q${quarter} ${currentDate.getFullYear()}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Project Timeline
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Gantt chart view showing task schedules and dependencies
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Range Selector */}
              <div className="flex items-center border rounded-lg p-1 bg-muted/50">
                <Button
                  variant={viewRange === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewRange('week')}
                >
                  Week
                </Button>
                <Button
                  variant={viewRange === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewRange('month')}
                >
                  Month
                </Button>
                <Button
                  variant={viewRange === 'quarter' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewRange('quarter')}
                >
                  Quarter
                </Button>
              </div>
              
              {/* Date Navigation */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium min-w-[200px] text-center">
                  {formatDateHeader()}
                </div>
                <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline Grid */}
      <Card>
        <CardContent className="p-0">
          {/* Date Header */}
          <div className="border-b bg-muted/20 p-4">
            <div className="flex">
              <div className="w-80 flex-shrink-0 font-medium text-sm">
                Projects & Tasks
              </div>
              <div className="flex-1 relative">
                <div className="flex text-xs text-muted-foreground">
                  {timelineDates.map((date, index) => (
                    <div 
                      key={index} 
                      className="flex-1 text-center border-l first:border-l-0 px-1 py-2"
                      style={{ minWidth: viewRange === 'quarter' ? '20px' : viewRange === 'month' ? '30px' : '80px' }}
                    >
                      {viewRange === 'week' ? date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }) :
                       viewRange === 'month' ? date.getDate() :
                       date.getDate() % 5 === 0 ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Rows */}
          <div className="divide-y">
            {Array.from(tasksByStudy.entries()).map(([studyId, studyTasks]) => {
              const study = studies.find(s => s.id === studyId);
              const studyName = study?.name || 'Unassigned Tasks';
              
              return (
                <div key={studyId} className="group">
                  {/* Study Header */}
                  <div className="p-4 bg-muted/10 border-l-4 border-l-primary">
                    <div className="flex">
                      <div className="w-80 flex-shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <h4 className="font-medium text-sm">{studyName}</h4>
                            <p className="text-xs text-muted-foreground">
                              {studyTasks.length} task{studyTasks.length !== 1 ? 's' : ''}
                              {study && (
                                <span className="ml-2">
                                  <Badge variant="outline" className="text-xs">
                                    {study.status?.replace('_', ' ') || 'Planning'}
                                  </Badge>
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 relative h-12">
                        {/* Study timeline bar */}
                        {study && study.createdAt && (
                          <div 
                            className="absolute top-3 h-6 bg-primary/20 border border-primary/30 rounded-sm"
                            style={getTaskPosition({
                              ...study,
                              createdAt: study.createdAt,
                              dueDate: study.dueDate
                            } as any)}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Task Rows */}
                  {studyTasks.map((task, taskIndex) => {
                    const assignee = teamMembers.find(m => m.id === task.assigneeId);
                    const position = getTaskPosition(task);
                    
                    return (
                      <div key={task.id} className="p-3 hover:bg-muted/50 border-l-4 border-l-transparent hover:border-l-muted">
                        <div className="flex">
                          <div className="w-80 flex-shrink-0">
                            <div className="flex items-center gap-3">
                              <div className="w-1 h-8 bg-muted rounded-full" />
                              <div className="flex flex-col flex-1 min-w-0">
                                <h5 className="font-medium text-sm truncate">{task.title}</h5>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {assignee && (
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      <span>{assignee.name || assignee.email}</span>
                                    </div>
                                  )}
                                  {task.estimatedHours && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{task.estimatedHours}h</span>
                                    </div>
                                  )}
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs"
                                  >
                                    {task.status?.replace('_', ' ') || 'TODO'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => onTaskEdit(task)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0 text-destructive"
                                  onClick={() => onTaskDelete(task.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 relative h-12">
                            {/* Task timeline bar */}
                            <div 
                              className={`absolute top-3 h-6 rounded-sm border cursor-pointer transition-colors hover:opacity-80 ${getStatusColor(task.status || 'TODO')}`}
                              style={position}
                              title={`${task.title} (${task.status || 'TODO'})`}
                            >
                              <div className="h-full flex items-center justify-center px-2">
                                <span className="text-xs font-medium truncate">
                                  {task.title}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {tasksByStudy.size === 0 && (
            <div className="p-12 text-center">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No scheduled tasks</h3>
              <p className="text-muted-foreground">
                Tasks with due dates or creation dates will appear in the timeline view.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}