import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mic, FileText, Users, Clock, Mail, Send } from "lucide-react";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedLab } = useLabContext();

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

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
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
              placeholder="Paste your meeting transcript here... The AI will automatically extract tasks, timelines, and action items from the conversation."
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
              Clear
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