"use client"

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Mic, MicOff, Upload, Loader2, CheckCircle, AlertCircle, Play, Pause, FileAudio } from 'lucide-react'
import { toast } from 'sonner'

interface ProcessingStep {
  id: string
  label: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  message?: string
}

export default function StandupsPage() {
  const supabase = createClient()
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([])
  const [meetingTitle, setMeetingTitle] = useState('')
  const [selectedLab, setSelectedLab] = useState('')
  const [participants, setParticipants] = useState('')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize processing steps
  const initializeSteps = (): ProcessingStep[] => [
    { id: 'transcribe', label: 'Transcribing audio with AI', status: 'pending' },
    { id: 'extract', label: 'Extracting tasks and action items', status: 'pending' },
    { id: 'create', label: 'Creating tasks in database', status: 'pending' },
    { id: 'email', label: 'Sending email notifications', status: 'pending' },
    { id: 'calendar', label: 'Syncing to Google Calendar', status: 'pending' },
  ]

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        setAudioUrl(URL.createObjectURL(audioBlob))
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      toast.success('Recording started')
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording. Please check microphone permissions.')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      toast.info('Recording stopped')
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error('Please upload an audio file')
        return
      }
      
      const blob = new Blob([file], { type: file.type })
      setAudioBlob(blob)
      setAudioUrl(URL.createObjectURL(blob))
      toast.success('Audio file loaded')
    }
  }

  // Update step status
  const updateStepStatus = (stepId: string, status: ProcessingStep['status'], message?: string) => {
    setProcessingSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, message } : step
    ))
  }

  // Process the recording through the complete workflow
  const processRecording = async () => {
    if (!audioBlob) {
      toast.error('No audio to process')
      return
    }

    if (!meetingTitle || !selectedLab) {
      toast.error('Please fill in meeting details')
      return
    }

    setIsProcessing(true)
    setProcessingSteps(initializeSteps())

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Step 1: Create meeting record
      const { data: meeting, error: meetingError } = await supabase
        .from('standup_meetings')
        .insert({
          title: meetingTitle,
          date: new Date().toISOString(),
          lab_id: selectedLab,
          created_by: user.id,
          duration_minutes: 15, // Default duration
          attendees: participants.split(',').map(p => p.trim()),
        })
        .select()
        .single()

      if (meetingError) throw meetingError

      // Step 2: Transcribe audio
      updateStepStatus('transcribe', 'processing')
      
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('meetingId', meeting.id)

      const transcribeResponse = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!transcribeResponse.ok) {
        throw new Error('Transcription failed')
      }

      const { transcript } = await transcribeResponse.json()
      updateStepStatus('transcribe', 'completed', `Transcribed ${transcript.split(' ').length} words`)

      // Step 3: Extract tasks
      updateStepStatus('extract', 'processing')
      
      const processResponse = await fetch('/api/ai/process-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          meetingDate: new Date().toISOString(),
          meetingId: meeting.id,
          labContext: {
            labName: 'Research Lab', // Would fetch from database
            teamMembers: participants.split(',').map(p => p.trim())
          }
        }),
      })

      if (!processResponse.ok) {
        throw new Error('Task extraction failed')
      }

      const { extractedTasks } = await processResponse.json()
      updateStepStatus('extract', 'completed', `Found ${extractedTasks.tasks.length} tasks`)

      // Step 4: Create tasks in database
      updateStepStatus('create', 'processing')
      
      const tasksToCreate = extractedTasks.tasks.map((task: any) => ({
        title: task.task,
        description: task.task,
        lab_id: selectedLab,
        study_id: null, // Would need to match to actual study
        status: 'TODO',
        priority: task.priority,
        due_date: task.due_date,
        created_by: user.id,
        assignee_name: task.member,
      }))

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksToCreate)

      if (tasksError) throw tasksError
      updateStepStatus('create', 'completed', `Created ${tasksToCreate.length} tasks`)

      // Step 5: Send email notifications
      updateStepStatus('email', 'processing')
      
      // For each task, send assignment email
      let emailsSent = 0
      for (const task of extractedTasks.tasks) {
        try {
          const emailResponse = await fetch('/api/email/send-assignment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientEmail: `${task.member.toLowerCase().replace(' ', '.')}@lab.com`, // Would need real emails
              taskData: {
                recipientName: task.member,
                labName: 'Research Lab',
                taskTitle: task.task,
                dueDate: task.due_date,
                assignedBy: user.email?.split('@')[0] || 'Lab Coordinator',
                meetingTitle,
                priority: task.priority,
              }
            }),
          })
          
          if (emailResponse.ok) emailsSent++
        } catch (error) {
          console.error('Email failed for task:', task, error)
        }
      }
      
      updateStepStatus('email', 'completed', `Sent ${emailsSent} email notifications`)

      // Step 6: Sync to Google Calendar
      updateStepStatus('calendar', 'processing')
      
      let calendarEventsSynced = 0
      for (const task of extractedTasks.tasks) {
        if (task.due_date) {
          try {
            const { error } = await supabase
              .from('calendar_events')
              .insert({
                title: `Task: ${task.task}`,
                description: `Assigned to: ${task.member}`,
                event_type: 'DEADLINE',
                start_date: task.due_date,
                end_date: task.due_date,
                all_day: true,
                lab_id: selectedLab,
                created_by: user.id,
                metadata: {
                  sourceType: 'meeting_task',
                  meetingId: meeting.id,
                  taskAssignee: task.member,
                  taskPriority: task.priority,
                }
              })
            
            if (!error) {
              calendarEventsSynced++
              
              // Trigger Google Calendar sync
              await fetch('/api/calendar/google-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId: meeting.id }),
              })
            }
          } catch (error) {
            console.error('Calendar sync failed for task:', task, error)
          }
        }
      }
      
      updateStepStatus('calendar', 'completed', `Synced ${calendarEventsSynced} events to calendar`)

      toast.success('Standup processed successfully!')
      
      // Reset form
      setTimeout(() => {
        setAudioBlob(null)
        setAudioUrl(null)
        setMeetingTitle('')
        setParticipants('')
        setProcessingSteps([])
        setIsProcessing(false)
      }, 3000)

    } catch (error) {
      console.error('Processing error:', error)
      toast.error('Failed to process standup recording')
      
      // Mark remaining steps as error
      setProcessingSteps(prev => prev.map(step => 
        step.status === 'processing' || step.status === 'pending' 
          ? { ...step, status: 'error' as const } 
          : step
      ))
      setIsProcessing(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Standup Recording</h1>
          <p className="text-gray-400">Record or upload your standup meeting for AI processing</p>
        </div>

        {/* Meeting Details */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Meeting Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Meeting Title</label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g., Daily Standup - Research Team"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Lab</label>
              <select
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Select a lab</option>
                <option value="lab-1">RICCC Lab</option>
                <option value="lab-2">RHEDAS Lab</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Participants (comma-separated)</label>
              <input
                type="text"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g., John Doe, Jane Smith, Bob Johnson"
              />
            </div>
          </div>
        </div>

        {/* Recording Controls */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Audio Recording</h2>
          
          <div className="flex flex-col items-center space-y-4">
            {/* Record Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`p-6 rounded-full transition-all ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-cyan-500 hover:bg-cyan-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
            
            <p className="text-sm text-gray-400">
              {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
            </p>

            {/* Upload Option */}
            <div className="flex items-center space-x-2 text-gray-400">
              <span>or</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing || isRecording}
                className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Audio
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Audio Preview */}
            {audioUrl && (
              <div className="w-full mt-4 p-4 bg-gray-900 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <FileAudio className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm text-white">Audio Ready</span>
                </div>
                <audio controls className="w-full">
                  <source src={audioUrl} type="audio/webm" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        </div>

        {/* Processing Steps */}
        {processingSteps.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Processing Workflow</h2>
            <div className="space-y-3">
              {processingSteps.map((step) => (
                <div key={step.id} className="flex items-center space-x-3">
                  {step.status === 'pending' && (
                    <div className="w-6 h-6 rounded-full bg-gray-700" />
                  )}
                  {step.status === 'processing' && (
                    <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  )}
                  {step.status === 'completed' && (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  )}
                  {step.status === 'error' && (
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  )}
                  
                  <div className="flex-1">
                    <p className={`text-sm ${
                      step.status === 'completed' ? 'text-green-400' :
                      step.status === 'error' ? 'text-red-400' :
                      step.status === 'processing' ? 'text-cyan-400' :
                      'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                    {step.message && (
                      <p className="text-xs text-gray-500 mt-1">{step.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Process Button */}
        <div className="flex justify-center">
          <button
            onClick={processRecording}
            disabled={!audioBlob || isProcessing || !meetingTitle || !selectedLab}
            className="flex items-center px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Process Recording
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}