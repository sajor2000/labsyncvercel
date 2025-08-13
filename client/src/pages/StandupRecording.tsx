import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLabContext } from "@/hooks/useLabContext";
import { useRecording } from "@/contexts/RecordingContext";
import { 
  Mic, 
  Square, 
  Play, 
  Volume2, 
  FileText, 
  Calendar, 
  Clock, 
  Users,
  CheckCircle,
  AlertCircle,
  Mail,
  Eye,
  ChevronLeft,
  ChevronRight,
  Brain,
  Zap,
  Activity,
  Target,
  UserCheck,
  Settings,
  Presentation,
  Link,
  Maximize2,
  Minimize2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TranscriptProcessor } from "@/components/TranscriptProcessor";
import type { StandupMeeting, TeamMember } from "@shared/schema";

// RICCC and RHEDAS meeting schedules - SWAPPED per user request
const MEETING_SCHEDULES = {
  'riccc': {
    name: 'Data Analytics Studio Weekly Check In',  
    schedule: 'Thursday, 2:30 PM - 3:00 PM',
    duration: '30 minutes',
    frequency: 'Weekly',
    participants: ['Jada Sherrod', 'Jason Stanghelle', 'Juan Rojas', 'Meher Sapna Masanpally'],
    agenda: [
      'Project Updates and sprint review/Timeline Check-in',
      'Additional resources needed', 
      'Challenges/Hurdles',
      'Discuss shared work opportunities'
    ]
  },
  'rhedas': {
    name: 'RICCC Lab Biweekly Check-In',
    schedule: 'Tuesday & Thursday, 12:30 PM - 1:00 PM',
    duration: '30 minutes',
    frequency: 'Biweekly',
    participants: ['Kevin Buell', 'Juan Carlos Rojas', 'Mia Mcclintic', 'Vaishvik Chaudhari', 'Hoda Masteri', 'Jason Stanghelle'],
    agenda: [
      'Research progress updates',
      'Critical care trials status',
      'Data collection review',
      'Upcoming milestones',
      'Resource needs and blockers'
    ]
  }
};

export default function StandupRecording() {
  // Get recording state from global context
  const {
    isRecording,
    recordingTime,
    audioBlob,
    transcript,
    selectedAttendees,
    slidesUrl,
    showSlides,
    startRecording: startRecordingFromContext,
    stopRecording: stopRecordingFromContext,
    setTranscript,
    setAudioBlob,
    setSelectedAttendees,
    setSlidesUrl,
    setShowSlides,
    clearRecording
  } = useRecording();
  
  // Local state for this page only
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [showAttendeeSelection, setShowAttendeeSelection] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedSlidesUrls, setSavedSlidesUrls] = useState<Record<string, string>>({});
  
  const { selectedLab } = useLabContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get meeting schedule for current lab
  const meetingSchedule = selectedLab?.id === '069efa27-bbf8-4c27-8c1e-3800148e4985' ? 
    MEETING_SCHEDULES.riccc : MEETING_SCHEDULES.rhedas;

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ['/api/standups/meetings', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: standups = [], isLoading: standupsLoading } = useQuery({
    queryKey: ['/api/standups', selectedLab?.id],
    enabled: !!selectedLab?.id,
  });

  const { data: teamMembers = [], isLoading: teamMembersLoading } = useQuery({
    queryKey: ['/api/team-members', selectedLab?.id],
    queryFn: async () => {
      const url = selectedLab?.id ? `/api/team-members?labId=${selectedLab.id}` : '/api/team-members';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      return response.json();
    },
    enabled: !!selectedLab?.id,
  });

  const { data: meetingEmail, isLoading: emailLoading } = useQuery({
    queryKey: ['/api/standups/meeting-email', selectedMeetingId],
    enabled: !!selectedMeetingId && showEmailPreview,
  });

  // Helper function to extract Google Slides embed URL
  const getGoogleSlidesEmbedUrl = (inputUrl: string) => {
    if (!inputUrl) return null;
    
    // Check if it's already an embed URL
    if (inputUrl.includes('/embed')) {
      return inputUrl;
    }
    
    // Extract presentation ID from various Google Slides URL formats
    const patterns = [
      /\/presentation\/d\/([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/
    ];
    
    for (const pattern of patterns) {
      const match = inputUrl.match(pattern);
      if (match && match[1]) {
        // Return embed URL with presentation ID
        return `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false&delayms=3000`;
      }
    }
    
    // If no pattern matches, try to use the URL as-is
    return inputUrl;
  };

  // Save slides URL for a meeting
  const saveSlidesUrlForMeeting = (meetingId: string, url: string) => {
    const embedUrl = getGoogleSlidesEmbedUrl(url);
    if (embedUrl) {
      setSavedSlidesUrls(prev => ({
        ...prev,
        [meetingId]: embedUrl
      }));
      localStorage.setItem(`slides_${meetingId}`, embedUrl);
    }
  };

  // Load saved slides URL for a meeting
  useEffect(() => {
    if (selectedMeetingId) {
      const savedUrl = localStorage.getItem(`slides_${selectedMeetingId}`);
      if (savedUrl) {
        setSlidesUrl(savedUrl);
        setSavedSlidesUrls(prev => ({
          ...prev,
          [selectedMeetingId]: savedUrl
        }));
      }
    }
  }, [selectedMeetingId]);

  // Auto-select core RICCC team members when lab switches to RICCC
  useEffect(() => {
    if (teamMembers && teamMembers.length > 0 && selectedLab?.id === '400b6659-bce2-4fa0-b297-daebd110c31b') {
      // Core RICCC team members names to pre-select
      const coreRicccMembers = [
        'Hoda Masteri',
        'J.C. Rojas', 
        'Kevin Buell',
        'Mia Mcclintic',
        'Vaishvik Chaudhari'
      ];
      
      const coreTeamIds = (teamMembers as TeamMember[])
        .filter((member: TeamMember) => coreRicccMembers.includes(member.name))
        .map((member: TeamMember) => member.id);
      
      if (coreTeamIds.length > 0) {
        setSelectedAttendees(coreTeamIds);
      }
    } else if (selectedLab?.id === '069efa27-bbf8-4c27-8c1e-3800148e4985') {
      // Reset selection for RHEDAS or other labs
      setSelectedAttendees([]);
    }
  }, [teamMembers, selectedLab?.id]);

  const createMeetingMutation = useMutation({
    mutationFn: async (meetingData: any) => {
      const response = await fetch('/api/standups/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...meetingData,
          attendees: selectedAttendees,
          labId: selectedLab?.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create meeting');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/standups/meetings'] });
      toast({
        title: "Meeting Recorded",
        description: "Standup meeting has been successfully processed and recorded.",
      });
      setSelectedAttendees([]);
      setShowAttendeeSelection(false);
    },
    onError: (error) => {
      toast({
        title: "Recording Failed",
        description: "Failed to record meeting. Please try again.",
        variant: "destructive",
      });
      console.error("Meeting creation failed:", error);
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Wrapper functions to handle recording with page-specific toast messages
  const startRecording = () => {
    startRecordingFromContext();
  };

  const stopRecording = () => {
    stopRecordingFromContext();
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      setTranscript(data.transcript);
      
      toast({
        title: "Transcription Complete",
        description: "Audio has been successfully transcribed.",
      });
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription Failed",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const selectedMeeting = (meetings as StandupMeeting[])?.find((m: StandupMeeting) => m.id === selectedMeetingId);
  const sortedMeetings = meetings ? [...(meetings as StandupMeeting[])].sort((a: StandupMeeting, b: StandupMeeting) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  }) : [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-red-300 text-red-600';
      case 'medium': return 'border-yellow-300 text-yellow-600'; 
      case 'low': return 'border-green-300 text-green-600';
      default: return 'border-gray-300 text-gray-600';
    }
  };

  if (!selectedLab) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <Mic className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Please select a lab to start standup recording</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="h-6 w-6 text-teal-600" />
          <h1 className="text-3xl font-bold">Standup Recording & AI Processing</h1>
        </div>
        <Badge variant="outline" className="text-sm">
          {selectedLab?.name} • Live Recording System
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recording Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Meeting Schedule Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal-600" />
                {meetingSchedule.name}
              </CardTitle>
              <CardDescription>
                {meetingSchedule.schedule} • {meetingSchedule.frequency}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{meetingSchedule.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{meetingSchedule.participants.length} participants</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Standard Agenda:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {meetingSchedule.agenda.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-teal-600">{index + 1}.</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Meeting Attendees:</h4>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowAttendeeSelection(!showAttendeeSelection)}
                    data-testid="button-select-attendees"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Select Attendees
                  </Button>
                </div>
                
                {showAttendeeSelection && (
                  <div className="mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <h5 className="text-sm font-medium mb-3">Choose who's attending this meeting:</h5>
                    {teamMembersLoading ? (
                      <div className="text-sm text-muted-foreground">Loading team members...</div>
                    ) : teamMembers.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(teamMembers as TeamMember[]).map((member: TeamMember) => (
                          <div key={member.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={member.id}
                              checked={selectedAttendees.includes(member.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedAttendees([...selectedAttendees, member.id]);
                                } else {
                                  setSelectedAttendees(selectedAttendees.filter(id => id !== member.id));
                                }
                              }}
                            />
                            <label 
                              htmlFor={member.id} 
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {member.name} - {member.role}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No team members found. Add team members to select attendees.
                      </div>
                    )}
                    
                    {selectedAttendees.length > 0 && (
                      <div className="mt-3 p-2 bg-green-50 dark:bg-green-950/20 rounded border">
                        <p className="text-sm text-green-800 dark:text-green-400">
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                          {selectedAttendees.length} attendee{selectedAttendees.length > 1 ? 's' : ''} selected for meeting email
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {selectedAttendees.length > 0 ? (
                    (teamMembers as TeamMember[])
                      .filter((member: TeamMember) => selectedAttendees.includes(member.id))
                      .map((member: TeamMember) => (
                        <Badge key={member.id} className="text-xs bg-teal-100 text-teal-800 border-teal-200">
                          {member.name}
                        </Badge>
                      ))
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      Select attendees above to personalize the meeting invitation
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google Slides Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Presentation className="h-5 w-5 text-purple-600" />
                Meeting Presentation
              </CardTitle>
              <CardDescription>
                Embed Google Slides to guide your meeting discussion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showSlides ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="slides-url" className="text-sm font-medium">
                      Google Slides URL
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="slides-url"
                        type="url"
                        placeholder="https://docs.google.com/presentation/d/..."
                        value={slidesUrl}
                        onChange={(e) => setSlidesUrl(e.target.value)}
                        className="flex-1"
                        data-testid="input-slides-url"
                      />
                      <Button
                        onClick={() => {
                          const embedUrl = getGoogleSlidesEmbedUrl(slidesUrl);
                          if (embedUrl) {
                            setSlidesUrl(embedUrl);
                            setShowSlides(true);
                            if (selectedMeetingId) {
                              saveSlidesUrlForMeeting(selectedMeetingId, embedUrl);
                            }
                            toast({
                              title: "Presentation Loaded",
                              description: "Google Slides presentation is now embedded",
                            });
                          } else {
                            toast({
                              title: "Invalid URL",
                              description: "Please enter a valid Google Slides URL",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={!slidesUrl}
                        className="bg-purple-600 hover:bg-purple-700"
                        data-testid="button-load-slides"
                      >
                        <Link className="h-4 w-4 mr-2" />
                        Load Slides
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Share your Google Slides with "Anyone with the link" for embedding
                    </p>
                  </div>
                  
                  {savedSlidesUrls[selectedMeetingId || ''] && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-800 dark:text-purple-400">
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        Previous slides saved for this meeting
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          setSlidesUrl(savedSlidesUrls[selectedMeetingId || '']);
                          setShowSlides(true);
                        }}
                        data-testid="button-load-saved-slides"
                      >
                        Load Previous Slides
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        <Presentation className="h-3 w-3 mr-1" />
                        Slides Active
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        data-testid="button-toggle-fullscreen"
                      >
                        {isFullscreen ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowSlides(false);
                        setSlidesUrl('');
                      }}
                      data-testid="button-close-slides"
                    >
                      Close Slides
                    </Button>
                  </div>
                  
                  <div className={`border rounded-lg overflow-hidden bg-white ${
                    isFullscreen ? 'fixed inset-4 z-50' : 'relative'
                  }`}>
                    <iframe
                      src={slidesUrl}
                      frameBorder="0"
                      className={isFullscreen ? 'w-full h-full' : 'w-full h-96'}
                      allowFullScreen
                      data-testid="iframe-google-slides"
                    />
                    {isFullscreen && (
                      <Button
                        className="absolute top-4 right-4 z-10"
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsFullscreen(false)}
                        data-testid="button-exit-fullscreen"
                      >
                        <Minimize2 className="h-4 w-4 mr-2" />
                        Exit Fullscreen
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Use arrow keys in the slides to navigate. Recording continues while presenting.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recording Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-teal-600" />
                Live Recording
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isRecording && !audioBlob && (
                <div className="text-center py-8">
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="bg-teal-600 hover:bg-teal-700"
                    data-testid="button-start-recording"
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    Start Recording Standup
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click to begin recording your {meetingSchedule.name.toLowerCase()}
                  </p>
                </div>
              )}

              {isRecording && (
                <div className="text-center py-8 space-y-4">
                  <div className="flex items-center gap-2 justify-center text-red-600">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-lg font-medium">Recording in progress</span>
                  </div>
                  <div className="text-2xl font-mono">{formatTime(recordingTime)}</div>
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    size="lg"
                    data-testid="button-stop-recording"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop Recording
                  </Button>
                </div>
              )}

              {audioBlob && !isRecording && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 justify-center text-green-600 dark:text-green-400">
                    <Volume2 className="h-5 w-5" />
                    <span>Recording Complete ({formatTime(recordingTime)})</span>
                  </div>
                  
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={transcribeAudio}
                      disabled={isTranscribing}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="button-transcribe"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      {isTranscribing ? "Processing with Whisper..." : "Transcribe with AI"}
                    </Button>
                    <Button
                      onClick={startRecording}
                      variant="outline"
                      data-testid="button-record-again"
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Record Again
                    </Button>
                  </div>

                  {transcript && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border">
                      <p className="text-sm text-green-800 dark:text-green-400 font-medium">
                        ✅ Transcript ready! Scroll down to process with AI and generate meeting summary.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Processing Section */}
          {transcript && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI Processing & Meeting Summary
                </CardTitle>
                <CardDescription>
                  Process the transcript with AI to generate meeting summary and action items
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedAttendees.length === 0 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800 dark:text-yellow-400 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Select meeting attendees above to personalize the email summary and ensure proper distribution.</span>
                    </p>
                  </div>
                )}
                
                <div className="p-4 border rounded-lg bg-white dark:bg-gray-900">
                  <h5 className="font-medium mb-3">Meeting Transcript:</h5>
                  <div className="max-h-48 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 rounded border text-sm">
                    {transcript}
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => {
                        // Process transcript with AI
                        fetch('/api/standups/meetings', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            transcript,
                            attendees: selectedAttendees,
                            labId: selectedLab?.id,
                            meetingType: 'standup',
                            slidesUrl: showSlides ? slidesUrl : undefined
                          }),
                        })
                        .then(response => response.json())
                        .then((meeting: StandupMeeting) => {
                          queryClient.invalidateQueries({ queryKey: ['/api/standups/meetings'] });
                          setSelectedMeetingId(meeting.id);
                          toast({
                            title: "Meeting Processed",
                            description: "AI has successfully analyzed your meeting and extracted action items.",
                          });
                        })
                        .catch((error) => {
                          toast({
                            title: "Processing Failed",
                            description: "Failed to process meeting. Please try again.",
                            variant: "destructive",
                          });
                        });
                      }}
                      disabled={selectedAttendees.length === 0}
                      className="bg-purple-600 hover:bg-purple-700"
                      data-testid="button-process-transcript"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Process with AI & Generate Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Meeting History & Preview Sidebar */}
        <div className="space-y-6">
          {/* Recent Meetings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Recent Meetings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meetingsLoading ? (
                <div className="text-center py-4">Loading meetings...</div>
              ) : sortedMeetings.length > 0 ? (
                <div className="space-y-3">
                  {sortedMeetings.slice(0, 5).map((meeting: StandupMeeting) => (
                    <div 
                      key={meeting.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedMeetingId === meeting.id ? 'bg-teal-50 border-teal-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedMeetingId(meeting.id);
                        setShowEmailPreview(true);
                      }}
                      data-testid={`meeting-${meeting.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {meetingSchedule.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {meeting.createdAt ? new Date(meeting.createdAt).toLocaleDateString() : 'Unknown date'}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {meeting.meetingType}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recorded meetings yet</p>
                  <p className="text-xs text-muted-foreground">Start recording to see your meeting history</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                Meeting Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Meetings</span>
                <Badge variant="outline">{sortedMeetings.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">This Month</span>
                <Badge variant="outline">
                  {sortedMeetings.filter((m: StandupMeeting) => {
                    if (!m.createdAt) return false;
                    const meetingDate = new Date(m.createdAt);
                    const currentMonth = new Date().getMonth();
                    return meetingDate.getMonth() === currentMonth;
                  }).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Lab Activity</span>
                <Badge className="bg-green-100 text-green-800">
                  {sortedMeetings.length > 0 ? 'Active' : 'Getting Started'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Email Preview Button */}
          {selectedMeetingId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-teal-600" />
                  Meeting Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowEmailPreview(!showEmailPreview)}
                  className="w-full"
                  variant="outline"
                  data-testid="button-toggle-preview"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {showEmailPreview ? 'Hide' : 'Show'} Email Preview
                </Button>
                
                {showEmailPreview && !!meetingEmail && (
                  <div className="mt-4 border rounded-lg p-4 bg-white dark:bg-gray-900 max-h-96 overflow-y-auto">
                    <div 
                      dangerouslySetInnerHTML={{ __html: String((meetingEmail as any)?.html || '') }}
                      className="text-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}