import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLabContext } from "@/hooks/useLabContext";
import { Mic, FileAudio, Send, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function StandupTestingPage() {
  const { toast } = useToast();
  const { selectedLab } = useLabContext();
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [attendeeEmails, setAttendeeEmails] = useState("juan_rojas@rush.edu");
  const [labName, setLabName] = useState(selectedLab?.name || "Test Lab");
  const [processedMeeting, setProcessedMeeting] = useState<any>(null);
  const [emailHtml, setEmailHtml] = useState("");
  const [emailResult, setEmailResult] = useState<any>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Sample transcript for testing
  const sampleTranscript = `Lab Standup Meeting - Today's Updates

Dr. Smith: Good morning everyone. Let's start with the updates. Sarah, what's your progress?

Sarah: I finished the RNA sequencing analysis for the cardiovascular study. The results show promising biomarker patterns. I need to review the statistical significance with the biostatistician by Friday. Next, I'm starting the protein expression analysis.

Dr. Smith: Great progress. Mike, how about the imaging study?

Mike: I completed 80% of the MRI data processing for the neurological cohort. The automated segmentation pipeline is working well. I'm expecting to finish all 150 scans by next Tuesday. There's one blocker - the new contrast protocol needs IRB approval before we can start the validation phase.

Dr. Smith: I'll help with the IRB submission. Lisa, what's your update?

Lisa: I finished coding the patient questionnaire data and ran the preliminary analysis. The anxiety scores correlate with biomarker levels as expected. I need to prepare the first draft of the methods section by Monday for the manuscript submission.

Dr. Smith: Excellent work everyone. Any other blockers or questions?

Sarah: Just to confirm - the manuscript deadline is still March 15th, right?

Dr. Smith: Yes, that's correct. Let's aim to have all sections complete by March 10th for final review.

All: Sounds good. Thanks everyone!`;

  // Whisper transcription mutation
  const transcribeMutation = useMutation({
    mutationFn: async (audioFile: File) => {
      const formData = new FormData();
      formData.append('audio', audioFile);
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setTranscript(data.transcript);
      toast({
        title: "Transcription Complete",
        description: "Audio has been successfully transcribed using OpenAI Whisper",
      });
    },
    onError: (error) => {
      toast({
        title: "Transcription Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Process transcript mutation
  const processMeetingMutation = useMutation({
    mutationFn: async (transcriptText: string) => {
      return apiRequest(`/api/standups/meetings`, 'POST', {
        transcript: transcriptText,
        labId: selectedLab?.id,
        meetingType: 'standup',
        attendees: [], // For demo purposes
      });
    },
    onSuccess: (data) => {
      setProcessedMeeting(data);
      toast({
        title: "Meeting Processed",
        description: "AI has processed the transcript and extracted tasks",
      });
    },
    onError: (error) => {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate email HTML mutation
  const generateEmailMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      return apiRequest(`/api/standups/meeting-email/${meetingId}`, 'GET');
    },
    onSuccess: (data) => {
      setEmailHtml((data as any)?.html || '');
      toast({
        title: "Email HTML Generated",
        description: "Professional email template has been created",
      });
    },
    onError: (error) => {
      toast({
        title: "Email Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ meetingId, recipients, labName }: any) => {
      return apiRequest(`/api/standups/${meetingId}/send-email`, 'POST', {
        recipients: recipients.split(',').map((email: string) => email.trim()),
        labName,
      });
    },
    onSuccess: (data) => {
      setEmailResult(data);
      toast({
        title: "Email Sent Successfully",
        description: `Email delivered to recipients. Message ID: ${(data as any)?.messageId || 'No ID'}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Email Send Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        setAudioFile(file);
        setIsRecording(false);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processWorkflow = async () => {
    if (!transcript) {
      toast({
        title: "No Transcript",
        description: "Please provide a transcript to process",
        variant: "destructive",
      });
      return;
    }

    try {
      // Step 1: Process transcript with AI
      const meeting = await processMeetingMutation.mutateAsync(transcript);
      
      // Step 2: Generate email HTML
      await generateEmailMutation.mutateAsync((meeting as any)?.id || '');
      
      // Step 3: Send email
      await sendEmailMutation.mutateAsync({
        meetingId: (meeting as any)?.id || '',
        recipients: attendeeEmails,
        labName: labName,
      });
    } catch (error) {
      console.error("Workflow failed:", error);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Standup Meeting Processor</h1>
          <p className="text-muted-foreground">Test the complete workflow: Whisper → AI Processing → Email Generation → Delivery</p>
        </div>
      </div>

      {/* Step 1: Audio Recording & Transcription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Step 1: Audio Recording & Whisper Transcription
          </CardTitle>
          <CardDescription>
            Record audio or upload a file for OpenAI Whisper transcription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              className="flex items-center gap-2"
              data-testid="button-record-audio"
            >
              <Mic className="h-4 w-4" />
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
            
            <Input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              data-testid="input-audio-file"
            />
            
            <Button
              onClick={() => setTranscript(sampleTranscript)}
              variant="outline"
              data-testid="button-use-sample"
            >
              Use Sample Transcript
            </Button>
          </div>

          {audioFile && (
            <div className="flex items-center gap-2">
              <FileAudio className="h-4 w-4" />
              <span>Audio file ready: {audioFile.name}</span>
              <Button
                onClick={() => transcribeMutation.mutate(audioFile)}
                disabled={transcribeMutation.isPending}
                size="sm"
                data-testid="button-transcribe"
              >
                {transcribeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Transcribe"}
              </Button>
            </div>
          )}

          <div>
            <Label htmlFor="transcript">Transcript</Label>
            <Textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Transcript will appear here after transcription..."
              className="min-h-[200px]"
              data-testid="textarea-transcript"
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 2: AI Processing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Step 2: AI Processing & Email Settings
          </CardTitle>
          <CardDescription>
            Configure meeting processing and email delivery settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lab-name">Lab Name</Label>
              <Input
                id="lab-name"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                data-testid="input-lab-name"
              />
            </div>
            <div>
              <Label htmlFor="attendee-emails">Attendee Emails (comma-separated)</Label>
              <Input
                id="attendee-emails"
                value={attendeeEmails}
                onChange={(e) => setAttendeeEmails(e.target.value)}
                placeholder="email1@domain.com, email2@domain.com"
                data-testid="input-attendee-emails"
              />
            </div>
          </div>

          <Button
            onClick={processWorkflow}
            disabled={!transcript || processMeetingMutation.isPending}
            className="w-full"
            data-testid="button-process-workflow"
          >
            {processMeetingMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Process Complete Workflow
          </Button>
        </CardContent>
      </Card>

      {/* Step 3: AI Processing Results */}
      {processedMeeting && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Step 3: AI Processing Results
            </CardTitle>
            <CardDescription>
              Meeting has been processed and tasks extracted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Meeting ID</Label>
                <div className="font-mono text-sm p-2 bg-muted rounded" data-testid="text-meeting-id">
                  {processedMeeting.id}
                </div>
              </div>
              <div>
                <Label>Processing Status</Label>
                <Badge variant="outline" className="ml-2" data-testid="badge-processing-status">
                  Completed
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Email HTML Preview */}
      {emailHtml && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Step 4: Generated Email HTML
            </CardTitle>
            <CardDescription>
              Professional email template with meeting summary and action items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>HTML Email Preview</Label>
                <div 
                  className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-white"
                  dangerouslySetInnerHTML={{ __html: emailHtml }}
                  data-testid="div-email-preview"
                />
              </div>
              <details>
                <summary className="cursor-pointer text-sm font-medium">View Raw HTML</summary>
                <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-x-auto" data-testid="pre-email-html">
                  {emailHtml}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Email Delivery Verification */}
      {emailResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {emailResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Step 5: Email Delivery Verification
            </CardTitle>
            <CardDescription>
              Email delivery status and confirmation details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Delivery Status</Label>
                  <Badge 
                    variant={emailResult.success ? "default" : "destructive"}
                    className="ml-2"
                    data-testid="badge-delivery-status"
                  >
                    {emailResult.success ? "Success" : "Failed"}
                  </Badge>
                </div>
                {emailResult.messageId && (
                  <div>
                    <Label>Message ID</Label>
                    <div className="font-mono text-sm p-2 bg-muted rounded" data-testid="text-message-id">
                      {emailResult.messageId}
                    </div>
                  </div>
                )}
              </div>
              
              {emailResult.error && (
                <div>
                  <Label>Error Details</Label>
                  <div className="text-red-600 p-2 bg-red-50 rounded" data-testid="text-error-details">
                    {emailResult.error}
                  </div>
                </div>
              )}
              
              <div>
                <Label>Full Response</Label>
                <pre className="p-4 bg-muted rounded text-xs overflow-x-auto" data-testid="pre-email-response">
                  {JSON.stringify(emailResult, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Status */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Status</CardTitle>
          <CardDescription>
            Track the progress of each step in the meeting processing workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-4 w-4 ${transcript ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={transcript ? 'text-green-600' : 'text-gray-400'}>Transcript Available</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-4 w-4 ${processedMeeting ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={processedMeeting ? 'text-green-600' : 'text-gray-400'}>AI Processing Complete</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-4 w-4 ${emailHtml ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={emailHtml ? 'text-green-600' : 'text-gray-400'}>Email HTML Generated</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-4 w-4 ${emailResult?.success ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={emailResult?.success ? 'text-green-600' : 'text-gray-400'}>Email Delivered</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}