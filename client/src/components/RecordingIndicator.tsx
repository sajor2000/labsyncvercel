import { useRecording } from "@/contexts/RecordingContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, Square, Clock } from "lucide-react";
import { Link } from "wouter";

export function RecordingIndicator() {
  const { isRecording, recordingTime, stopRecording } = useRecording();

  if (!isRecording) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-xl border-2 border-red-500 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Mic className="h-5 w-5 text-red-600" />
            <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-600 rounded-full animate-pulse" />
          </div>
          <Badge variant="destructive" className="font-mono">
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(recordingTime)}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/standups">
            <Button size="sm" variant="outline" data-testid="button-back-to-recording">
              Back to Recording
            </Button>
          </Link>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={stopRecording}
            data-testid="button-stop-recording-indicator"
          >
            <Square className="h-3 w-3 mr-1" />
            Stop
          </Button>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground">
        Recording in progress • Navigate freely
      </div>
    </div>
  );
}