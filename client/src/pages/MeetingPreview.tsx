import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Clock, 
  Users, 
  Mail, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  CheckCircle,
  AlertCircle 
} from "lucide-react";
import { useLabContext } from "@/hooks/useLabContext";

interface Meeting {
  id: string;
  transcript: string;
  aiSummary?: {
    processedNotes: string;
    taskExtraction: {
      tasks: Array<{
        assignee: string;
        task: string;
        dueDate?: string;
        status?: string;
        priority?: string;
        blocker?: string;
      }>;
    };
  };
  meetingType: string;
  participants?: string[];
  createdAt: string;
}

export default function MeetingPreview() {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const { selectedLab } = useLabContext();

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['/api/standups/meetings', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: meetingEmail, isLoading: isLoadingEmail } = useQuery({
    queryKey: ['/api/standups/meeting-email', selectedMeetingId],
    enabled: !!selectedMeetingId,
  });

  const selectedMeeting = (meetings as Meeting[])?.find((m: Meeting) => m.id === selectedMeetingId);
  const sortedMeetings = meetings ? [...(meetings as Meeting[])].sort((a: Meeting, b: Meeting) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) : [];

  const navigateMeeting = (direction: 'prev' | 'next') => {
    if (!selectedMeetingId || !sortedMeetings.length) return;
    
    const currentIndex = sortedMeetings.findIndex((m: Meeting) => m.id === selectedMeetingId);
    if (currentIndex === -1) return;
    
    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : sortedMeetings.length - 1;
    } else {
      newIndex = currentIndex < sortedMeetings.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedMeetingId(sortedMeetings[newIndex].id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in-progress':
      case 'in progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'blocked':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Eye className="h-6 w-6 text-teal-600" />
          <h1 className="text-3xl font-bold">Meeting Preview & Review</h1>
        </div>
        <div className="text-center py-12">Loading meetings...</div>
      </div>
    );
  }

  if (!meetings || (meetings as Meeting[]).length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Eye className="h-6 w-6 text-teal-600" />
          <h1 className="text-3xl font-bold">Meeting Preview & Review</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No meetings found for {selectedLab?.name}</p>
            <p className="text-sm text-muted-foreground mt-2">Process a meeting transcript to see previews here</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Eye className="h-6 w-6 text-teal-600" />
        <h1 className="text-3xl font-bold">Meeting Preview & Review</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meeting List Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Meetings ({sortedMeetings.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortedMeetings.map((meeting: Meeting) => (
                <button
                  key={meeting.id}
                  onClick={() => setSelectedMeetingId(meeting.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedMeetingId === meeting.id
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  }`}
                  data-testid={`meeting-item-${meeting.id}`}
                >
                  <div className="flex items-center justify-between">
                    <Badge className="text-xs">{meeting.meetingType}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(meeting.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-medium truncate">
                    {meeting.aiSummary?.taskExtraction?.tasks?.length || 0} tasks
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDate(meeting.createdAt)}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Meeting Preview */}
        <div className="lg:col-span-2">
          {selectedMeeting ? (
            <div className="space-y-6">
              {/* Navigation Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMeeting('prev')}
                    data-testid="button-prev-meeting"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMeeting('next')}
                    data-testid="button-next-meeting"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="outline" className="text-sm">
                  {sortedMeetings.findIndex((m: Meeting) => m.id === selectedMeetingId) + 1} of {sortedMeetings.length}
                </Badge>
              </div>

              {/* Meeting Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {selectedLab?.name} Standup Meeting
                      </CardTitle>
                      <p className="text-muted-foreground mt-1">
                        AI-Generated Summary • {formatDate(selectedMeeting.createdAt)}
                      </p>
                    </div>
                    <Badge className={getStatusColor()}>{selectedMeeting.meetingType}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(selectedMeeting.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(selectedMeeting.createdAt).toLocaleTimeString()}</span>
                    </div>
                    {selectedMeeting.participants && selectedMeeting.participants.length > 0 && (
                      <div className="col-span-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedMeeting.participants.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Items */}
              {(selectedMeeting.aiSummary as any)?.taskExtraction?.tasks && (selectedMeeting.aiSummary as any).taskExtraction.tasks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Action Items & Tasks ({selectedMeeting.aiSummary.taskExtraction.tasks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedMeeting.aiSummary.taskExtraction.tasks.map((task: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{task.task}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Assigned to: <span className="font-medium">{task.assignee}</span>
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {task.status && (
                                <Badge className={getStatusColor(task.status)}>
                                  {task.status}
                                </Badge>
                              )}
                              {task.priority && (
                                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                  {task.priority}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {task.dueDate && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Due: {task.dueDate}</span>
                            </div>
                          )}
                          
                          {task.blocker && (
                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                              <AlertCircle className="h-4 w-4" />
                              <span>Blocker: {task.blocker}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Meeting Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Meeting Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedMeeting.aiSummary?.processedNotes || selectedMeeting.transcript || 'No summary available'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email Preview */}
              {meetingEmail && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="border rounded-lg p-6 bg-white dark:bg-gray-900"
                      dangerouslySetInnerHTML={{ __html: (meetingEmail as any)?.html || '' }}
                      data-testid="email-preview"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">Select a meeting to preview</p>
                <p className="text-sm text-muted-foreground mt-2">Choose from the list on the left to view the formatted summary</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}