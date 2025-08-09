import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mic, MicOff, FileText, Users, Clock, Mail, Send, Play, Square, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLabContext } from "@/hooks/useLabContext";

interface ProcessedResult {
  meetingId: string | null;
  processedNotes: string;
  extractedTasks: Array<{
    member: string;
    task: string;
    start_date?: string;
    due_date?: string;
    status: string;
    blocker?: string;
  }>;
}

export function TranscriptProcessor() {
  const [transcript, setTranscript] = useState("");
  const [processedResult, setProcessedResult] = useState<ProcessedResult | null>(null);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedLab } = useLabContext();

  const transcribeMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      setTranscript(result.transcript);
      setIsTranscribing(false);
      toast({
        title: "Success",
        description: "Audio transcribed successfully",
      });
    },
    onError: (error) => {
      setIsTranscribing(false);
      toast({
        title: "Error",
        description: "Failed to transcribe audio",
        variant: "destructive",
      });
      console.error("Transcription error:", error);
    },
  });

  const processMutation = useMutation({
    mutationFn: async (data: { transcript: string; labId?: string }) => {
      return apiRequest('/api/standups/process-transcript', 'POST', data);
    },
    onSuccess: async (response) => {
      const result = await response.json();
      setProcessedResult(result);
      queryClient.invalidateQueries({ queryKey: ['/api/standups'] });
      toast({
        title: "Success",
        description: "Meeting transcript processed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process transcript",
        variant: "destructive",
      });
      console.error("Transcript processing error:", error);
    },
  });

  const emailMutation = useMutation({
    mutationFn: async (data: { meetingId: string; recipients: string[]; labName: string }) => {
      return apiRequest(`/api/standups/${data.meetingId}/send-email`, 'POST', {
        recipients: data.recipients,
        labName: data.labName,
      });
    },
    onSuccess: async (response) => {
      const result = await response.json();
      toast({
        title: "Success",
        description: `Email sent successfully to ${result.recipients?.length || 'all'} recipients`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
      console.error("Email sending error:", error);
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly for best transcription quality",
      });
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description: "Failed to start recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      toast({
        title: "Recording Stopped",
        description: "Processing audio for transcription...",
      });
    }
  };

  const transcribeAudio = () => {
    if (!audioBlob) {
      toast({
        title: "Error",
        description: "No audio recording found",
        variant: "destructive",
      });
      return;
    }

    setIsTranscribing(true);
    transcribeMutation.mutate(audioBlob);
  };

  const handleProcess = () => {
    if (!transcript.trim()) {
      toast({
        title: "Error",
        description: "Please enter a transcript to process",
        variant: "destructive",
      });
      return;
    }

    processMutation.mutate({
      transcript: transcript.trim(),
      labId: selectedLab?.id,
    });
  };

  const handleClear = () => {
    setTranscript("");
    setProcessedResult(null);
    setEmailRecipients("");
    setAudioBlob(null);
    setRecordingTime(0);
    
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }
  };

  const handleSendEmail = () => {
    if (!processedResult?.meetingId) {
      toast({
        title: "Error",
        description: "No meeting to send. Process a transcript first.",
        variant: "destructive",
      });
      return;
    }

    if (!emailRecipients.trim()) {
      toast({
        title: "Error",
        description: "Please enter email recipients",
        variant: "destructive",
      });
      return;
    }

    const recipients = emailRecipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (recipients.length === 0) {
      toast({
        title: "Error",
        description: "Please enter valid email addresses",
        variant: "destructive",
      });
      return;
    }

    emailMutation.mutate({
      meetingId: processedResult.meetingId,
      recipients,
      labName: selectedLab?.name || "Your Lab",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Recording Section */}
      <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isRecording ? (
              <MicOff className="h-5 w-5 text-red-500 animate-pulse" />
            ) : (
              <Mic className="h-5 w-5 text-blue-500" />
            )}
            Live Audio Recording
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg">
            <div className="text-center space-y-4">
              {!isRecording && !audioBlob ? (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
                  data-testid="button-start-recording"
                >
                  <Mic className="h-6 w-6 mr-2" />
                  Start Recording
                </Button>
              ) : isRecording ? (
                <div className="space-y-4">
                  <div className="text-red-600 dark:text-red-400 font-semibold text-lg">
                    Recording: {formatTime(recordingTime)}
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      variant="destructive"
                      className="px-8 py-4"
                      data-testid="button-stop-recording"
                    >
                      <Square className="h-6 w-6 mr-2" />
                      Stop Recording
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Speak clearly for best transcription quality...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 justify-center text-green-600 dark:text-green-400">
                    <Volume2 className="h-5 w-5" />
                    <span>Recording Complete ({formatTime(recordingTime)})</span>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={transcribeAudio}
                      disabled={isTranscribing}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="button-transcribe"
                    >
                      {isTranscribing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      {isTranscribing ? "Transcribing..." : "Transcribe with Whisper"}
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
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AI-Powered Meeting Transcript Processor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="transcript" className="text-sm font-medium mb-2 block">
              Meeting Transcript
            </label>
            <Textarea
              id="transcript"
              placeholder="Paste your meeting transcript here or use the recording feature above... The AI will automatically extract tasks, timelines, and action items from the conversation."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={8}
              className="min-h-[200px]"
              data-testid="textarea-transcript"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleProcess}
              disabled={processMutation.isPending || !transcript.trim()}
              className="flex items-center gap-2"
              data-testid="button-process-transcript"
            >
              {processMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {processMutation.isPending ? "Processing..." : "Process Transcript"}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleClear}
              disabled={processMutation.isPending}
              data-testid="button-clear-transcript"
            >
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {processedResult && (
        <div className="space-y-4">
          {/* Extracted Tasks */}
          {processedResult.extractedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Extracted Tasks ({processedResult.extractedTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {processedResult.extractedTasks.map((task, index) => (
                    <div 
                      key={index}
                      className="border rounded-lg p-4 space-y-2"
                      data-testid={`task-card-${index}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{task.member}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.task}
                          </p>
                        </div>
                        <Badge 
                          variant={task.status === "completed" ? "default" : "secondary"}
                          className="ml-2"
                        >
                          {task.status}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {task.start_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Started: {task.start_date}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due: {task.due_date}
                          </span>
                        )}
                      </div>
                      
                      {task.blocker && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                          <span className="font-medium text-red-600 dark:text-red-400">
                            Blocker:
                          </span>{" "}
                          {task.blocker}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processed Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                AI-Generated Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: processedResult.processedNotes }}
                data-testid="processed-notes"
              />
            </CardContent>
          </Card>

          {/* Email Section */}
          {processedResult?.meetingId && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Send Email Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="email-recipients" className="text-sm font-medium mb-2 block">
                    Email Recipients (comma-separated)
                  </label>
                  <Input
                    id="email-recipients"
                    placeholder="john@lab.edu, jane@lab.edu, team@lab.edu"
                    value={emailRecipients}
                    onChange={(e) => setEmailRecipients(e.target.value)}
                    data-testid="input-email-recipients"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter email addresses separated by commas
                  </p>
                </div>
                
                <Button 
                  onClick={handleSendEmail}
                  disabled={emailMutation.isPending || !emailRecipients.trim()}
                  className="flex items-center gap-2"
                  data-testid="button-send-email"
                >
                  {emailMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {emailMutation.isPending ? "Sending..." : "Send Email Summary"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          {processedResult?.meetingId && selectedLab && (
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Meeting saved to {selectedLab.name} lab with ID: {processedResult.meetingId}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}