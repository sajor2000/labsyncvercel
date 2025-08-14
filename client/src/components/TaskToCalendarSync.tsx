import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, CheckCircle2, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Study, Task } from "@shared/schema";

interface TaskToCalendarSyncProps {
  labId: string;
  meetingContext?: {
    title: string;
    date: Date;
  };
}

export function TaskToCalendarSync({ labId, meetingContext }: TaskToCalendarSyncProps) {
  const [selectedStudyIds, setSelectedStudyIds] = useState<string[]>([]);
  const [syncToGoogle, setSyncToGoogle] = useState(true);
  const [createMeetingEvent, setCreateMeetingEvent] = useState(!!meetingContext);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available studies
  const { data: studies = [] } = useQuery({
    queryKey: ['/api/studies', labId],
    enabled: !!labId
  });

  // Fetch tasks for selected studies to show preview
  const { data: tasks = [] } = useQuery({
    queryKey: ['/api/tasks', selectedStudyIds],
    enabled: selectedStudyIds.length > 0
  });

  const taskSyncMutation = useMutation({
    mutationFn: async (data: any) => {
      if (meetingContext) {
        return apiRequest('/api/google-calendar/meeting-task-sync', 'POST', {
          meetingTitle: meetingContext.title,
          meetingDate: meetingContext.date.toISOString(),
          studyIds: selectedStudyIds,
          labId,
          syncToGoogle,
          createMeetingEvent
        });
      } else {
        return apiRequest('/api/google-calendar/sync-tasks-to-calendar', 'POST', {
          studyId: selectedStudyIds[0], // For now, handle one at a time
          labId,
          syncToGoogle
        });
      }
    },
    onSuccess: (data: any) => {
      toast({
        title: "Tasks Synced to Calendar",
        description: `Successfully created ${data.taskDeadlineEvents || data.createdEvents} calendar events from task due dates.`,
      });
      
      // Reset selection
      setSelectedStudyIds([]);
      
      // Invalidate calendar queries
      queryClient.invalidateQueries({ queryKey: ['/api/google-calendar/events'] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Could not sync tasks to calendar",
        variant: "destructive",
      });
    }
  });

  const tasksWithDueDates = (tasks as Task[]).filter((task: Task) => task.dueDate);

  const handleSync = () => {
    if (selectedStudyIds.length === 0) {
      toast({
        title: "No Studies Selected",
        description: "Please select at least one study to sync tasks from",
        variant: "destructive",
      });
      return;
    }

    taskSyncMutation.mutate({});
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {meetingContext ? 'Meeting Task Sync' : 'Task to Calendar Sync'}
        </CardTitle>
        <CardDescription>
          {meetingContext 
            ? `Sync tasks from projects to calendar for ${meetingContext.title}` 
            : 'Automatically create calendar events from task due dates'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {meetingContext && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">{meetingContext.title}</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              {meetingContext.date.toLocaleDateString()} at {meetingContext.date.toLocaleTimeString()}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Select Studies/Projects</Label>
          <Select 
            value={selectedStudyIds.length > 0 ? selectedStudyIds[0] : ''}
            onValueChange={(value) => {
              if (value && !selectedStudyIds.includes(value)) {
                setSelectedStudyIds(prev => [...prev, value]);
              }
            }}
          >
            <SelectTrigger data-testid="select-study-for-sync">
              <SelectValue placeholder="Choose studies to sync tasks from" />
            </SelectTrigger>
            <SelectContent>
              {(studies as Study[]).map((study: Study) => (
                <SelectItem key={study.id} value={study.id}>
                  <div className="flex items-center gap-2">
                    <span>{study.name}</span>
                    {study.oraNumber && (
                      <Badge variant="secondary" className="text-xs">
                        {study.oraNumber}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedStudyIds.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Studies</Label>
            <div className="flex flex-wrap gap-2">
              {selectedStudyIds.map((studyId) => {
                const study = (studies as Study[]).find((s: Study) => s.id === studyId);
                return (
                  <Badge key={studyId} variant="outline" className="flex items-center gap-1">
                    {study?.name}
                    <button
                      onClick={() => setSelectedStudyIds(prev => prev.filter(id => id !== studyId))}
                      className="ml-1 text-red-500 hover:text-red-700"
                      data-testid={`button-remove-study-${studyId}`}
                    >
                      ×
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {tasksWithDueDates.length > 0 && (
          <div className="space-y-2">
            <Label>Tasks with Due Dates ({tasksWithDueDates.length})</Label>
            <div className="max-h-48 overflow-y-auto space-y-2 p-2 border rounded-md bg-gray-50">
              {tasksWithDueDates.map((task: Task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-white border rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{task.title}</span>
                      <Badge className={getTaskPriorityColor(task.priority || 'MEDIUM')}>
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="syncToGoogle"
                checked={syncToGoogle}
                onCheckedChange={setSyncToGoogle}
                data-testid="switch-sync-to-google"
              />
              <Label htmlFor="syncToGoogle" className="text-sm">
                Sync to Google Calendar
              </Label>
            </div>
          </div>

          {meetingContext && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="createMeetingEvent"
                  checked={createMeetingEvent}
                  onCheckedChange={setCreateMeetingEvent}
                  data-testid="switch-create-meeting"
                />
                <Label htmlFor="createMeetingEvent" className="text-sm">
                  Create meeting calendar event
                </Label>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={handleSync}
            disabled={taskSyncMutation.isPending || selectedStudyIds.length === 0}
            className="w-full"
            data-testid="button-sync-tasks"
          >
            {taskSyncMutation.isPending ? (
              'Syncing...'
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Sync {tasksWithDueDates.length} Task Deadlines to Calendar
              </>
            )}
          </Button>
          
          {tasksWithDueDates.length === 0 && selectedStudyIds.length > 0 && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              No tasks with due dates found in selected studies
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}