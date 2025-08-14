import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mic, StopCircle, Send, Clock, CheckCircle, XCircle, AlertCircle, Database } from "lucide-react";

interface WorkflowStep {
  id: string;
  stepType: string;
  stepName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processingTimeMs?: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

interface WorkflowStepResult {
  success: boolean;
  processingTime: number;
  error?: string;
}

interface CompleteWorkflowResult {
  success: boolean;
  workflowId: string;
  meetingId: string;
  steps: {
    transcription: WorkflowStepResult;
    aiAnalysis: WorkflowStepResult;
    emailGeneration: WorkflowStepResult;
    emailDelivery: WorkflowStepResult;
  };
}

export default function ProductionWorkflow() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recipients, setRecipients] = useState("jc.rojas@mail.utoronto.ca");
  const [labName, setLabName] = useState("RICCC Lab");
  const [labId, setLabId] = useState("");
  const [meetingType, setMeetingType] = useState("standup");
  const [attendees, setAttendees] = useState("J.C. Rojas, Research Team");
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CompleteWorkflowResult | null>(null);

  // Query to fetch workflow steps for current workflow
  const { data: workflowSteps, refetch: refetchSteps } = useQuery({
    queryKey: ['/api/workflow', currentWorkflowId, 'steps'],
    enabled: !!currentWorkflowId,
    refetchInterval: 2000, // Poll every 2 seconds while workflow is active
  });

  // Complete workflow mutation
  const completeWorkflowMutation = useMutation({
    mutationFn: async () => {
      if (!audioBlob) {
        throw new Error('No audio recorded');
      }

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('recipients', JSON.stringify(recipients.split(',').map(r => r.trim())));
      formData.append('labName', labName);
      formData.append('labId', labId || '');
      formData.append('meetingType', meetingType);
      formData.append('attendees', JSON.stringify(attendees.split(',').map(a => a.trim())));

      const response = await fetch('/api/workflow/complete', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Workflow failed');
      }

      return response.json() as Promise<CompleteWorkflowResult>;
    },
    onSuccess: (result) => {
      setLastResult(result);
      setCurrentWorkflowId(result.workflowId);
      toast({
        title: "Workflow Completed!",
        description: `Meeting processing completed with workflow ID: ${result.workflowId}`,
      });
      refetchSteps();
    },
    onError: (error) => {
      toast({
        title: "Workflow Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/workflow/cleanup', {
        method: 'POST',
      });
    },
    onSuccess: (result) => {
      toast({
        title: "Cleanup Completed",
        description: `Cleaned up ${result.deletedCount} expired workflow steps`,
      });
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioBlob(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Production workflow recording is active",
      });
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      
      toast({
        title: "Recording Stopped",
        description: "Audio captured and ready for processing",
      });
    }
  };

  const processWorkflow = () => {
    if (!audioBlob) {
      toast({
        title: "No Audio",
        description: "Please record audio first",
        variant: "destructive",
      });
      return;
    }
    
    if (!recipients.trim()) {
      toast({
        title: "No Recipients",
        description: "Please enter email recipients",
        variant: "destructive",
      });
      return;
    }

    completeWorkflowMutation.mutate();
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStepBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = () => {
    if (!lastResult) return 0;
    const steps = lastResult.steps;
    const completed = [
      steps.transcription.success,
      steps.aiAnalysis.success,
      steps.emailGeneration.success,
      steps.emailDelivery.success,
    ].filter(Boolean).length;
    return (completed / 4) * 100;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Production Workflow System
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Database-backed meeting processing with 2-week retention and persistent step tracking
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-teal-600" />
          <Badge variant="secondary" className="bg-teal-100 text-teal-800">
            Production Ready
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recording and Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Audio Recording & Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recording Controls */}
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <Button 
                  onClick={startRecording}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-start-recording"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button 
                  onClick={stopRecording}
                  variant="destructive"
                  className="animate-pulse"
                  data-testid="button-stop-recording"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              )}
              
              {audioBlob && (
                <Badge variant="outline" className="text-green-700 border-green-300">
                  Audio Ready ({Math.round(audioBlob.size / 1024)}KB)
                </Badge>
              )}
            </div>

            {/* Configuration Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="labName">Lab Name</Label>
                <Input
                  id="labName"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  placeholder="RICCC Lab"
                  data-testid="input-lab-name"
                />
              </div>
              <div>
                <Label htmlFor="meetingType">Meeting Type</Label>
                <Input
                  id="meetingType"
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                  placeholder="standup"
                  data-testid="input-meeting-type"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="recipients">Email Recipients (comma-separated)</Label>
              <Input
                id="recipients"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="jc.rojas@mail.utoronto.ca, team@lab.com"
                data-testid="input-recipients"
              />
            </div>

            <div>
              <Label htmlFor="attendees">Meeting Attendees (comma-separated)</Label>
              <Textarea
                id="attendees"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="J.C. Rojas, Research Team"
                rows={2}
                data-testid="textarea-attendees"
              />
            </div>

            {/* Process Button */}
            <Button 
              onClick={processWorkflow}
              disabled={!audioBlob || completeWorkflowMutation.isPending}
              className="w-full bg-teal-600 hover:bg-teal-700"
              data-testid="button-process-workflow"
            >
              {completeWorkflowMutation.isPending ? (
                <>
                  <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
                  Processing Workflow...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Process Complete Workflow
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Workflow Progress Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Workflow Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastResult && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Workflow Progress</span>
                    <span>{Math.round(calculateProgress())}%</span>
                  </div>
                  <Progress value={calculateProgress()} className="w-full" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 bg-blue-50 rounded">
                    <strong>Workflow ID:</strong><br />
                    <code className="text-xs">{lastResult.workflowId}</code>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <strong>Meeting ID:</strong><br />
                    <code className="text-xs">{lastResult.meetingId}</code>
                  </div>
                </div>

                {/* Step Results */}
                <div className="space-y-2">
                  <h4 className="font-medium">Processing Steps:</h4>
                  {Object.entries(lastResult.steps).map(([stepName, result]) => (
                    <div key={stepName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        {getStepIcon(result.success ? 'completed' : 'failed')}
                        <span className="capitalize">{stepName.replace(/([A-Z])/g, ' $1')}</span>
                      </div>
                      <div className="text-right text-xs">
                        <Badge className={getStepBadgeColor(result.success ? 'completed' : 'failed')}>
                          {result.success ? 'Success' : 'Failed'}
                        </Badge>
                        {result.processingTime && (
                          <div className="text-gray-500 mt-1">
                            {result.processingTime}ms
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!lastResult && (
              <div className="text-center text-gray-500 py-8">
                <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No workflow in progress</p>
                <p className="text-sm">Record audio and start processing to see progress</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Database Workflow Steps Panel */}
      {workflowSteps && workflowSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Database Workflow Steps (2-Week Retention)</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => cleanupMutation.mutate()}
                disabled={cleanupMutation.isPending}
                data-testid="button-cleanup-steps"
              >
                {cleanupMutation.isPending ? 'Cleaning...' : 'Cleanup Expired'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workflowSteps.map((step: WorkflowStep) => (
                <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStepIcon(step.status)}
                    <div>
                      <div className="font-medium">{step.stepName}</div>
                      <div className="text-sm text-gray-500">
                        {step.stepType} • Started: {new Date(step.startedAt).toLocaleString()}
                      </div>
                      {step.errorMessage && (
                        <div className="text-sm text-red-600 mt-1">
                          Error: {step.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStepBadgeColor(step.status)}>
                      {step.status}
                    </Badge>
                    {step.processingTimeMs && (
                      <div className="text-xs text-gray-500 mt-1">
                        {step.processingTimeMs}ms
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Production Features Info */}
      <Card className="border-teal-200 bg-teal-50">
        <CardHeader>
          <CardTitle className="text-teal-800">Production Features</CardTitle>
        </CardHeader>
        <CardContent className="text-teal-700 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>✅ Database Persistence:</strong> All workflow steps stored in PostgreSQL with full audit trail
            </div>
            <div>
              <strong>✅ 2-Week Retention:</strong> Automatic cleanup of expired workflow data
            </div>
            <div>
              <strong>✅ Real-time Tracking:</strong> Live progress monitoring with status updates
            </div>
            <div>
              <strong>✅ Error Handling:</strong> Comprehensive error tracking and recovery
            </div>
            <div>
              <strong>✅ Performance Metrics:</strong> Processing time tracking for optimization
            </div>
            <div>
              <strong>✅ Production Ready:</strong> Full authentication and security validation
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}