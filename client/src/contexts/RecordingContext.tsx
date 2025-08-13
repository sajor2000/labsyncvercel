import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RecordingContextType {
  isRecording: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  transcript: string;
  selectedAttendees: string[];
  slidesUrl: string;
  showSlides: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  setTranscript: (transcript: string) => void;
  setAudioBlob: (blob: Blob | null) => void;
  setSelectedAttendees: (attendees: string[]) => void;
  setSlidesUrl: (url: string) => void;
  setShowSlides: (show: boolean) => void;
  clearRecording: () => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export function RecordingProvider({ children }: { children: ReactNode }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [slidesUrl, setSlidesUrl] = useState("");
  const [showSlides, setShowSlides] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setTranscript("");
      
      toast({
        title: "Recording Started",
        description: "Your standup meeting is being recorded. You can navigate to other pages while recording.",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording Stopped",
        description: "Your recording has been saved and is ready for transcription.",
      });
    }
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setTranscript("");
    setRecordingTime(0);
  };

  const value = {
    isRecording,
    recordingTime,
    audioBlob,
    transcript,
    selectedAttendees,
    slidesUrl,
    showSlides,
    startRecording,
    stopRecording,
    setTranscript,
    setAudioBlob,
    setSelectedAttendees,
    setSlidesUrl,
    setShowSlides,
    clearRecording,
  };

  return (
    <RecordingContext.Provider value={value}>
      {children}
    </RecordingContext.Provider>
  );
}

export function useRecording() {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error('useRecording must be used within RecordingProvider');
  }
  return context;
}