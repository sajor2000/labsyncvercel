"use client"

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, X, Minimize2, Maximize2 } from 'lucide-react'
import { createPortal } from 'react-dom'

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void
  onRecordingStart?: () => void
  onRecordingStop?: () => void
}

export function AudioRecorder({ 
  onRecordingComplete, 
  onRecordingStart,
  onRecordingStop 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const startTimeRef = useRef<number>(0)

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      })
      
      streamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      startTimeRef.current = Date.now()

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        onRecordingComplete(audioBlob, duration)
        
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      onRecordingStart?.()

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Failed to start recording. Please check microphone permissions.')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setRecordingTime(0)
      onRecordingStop?.()
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
  }

  // Handle drag
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [isRecording])

  const recorderUI = (
    <div 
      className={`fixed z-50 bg-gray-900 border-2 ${
        isRecording ? 'border-red-500' : 'border-gray-700'
      } rounded-lg shadow-2xl transition-all ${
        isMinimized ? 'w-auto' : 'w-80'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 border-b border-gray-700"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'
          }`} />
          <span className="text-sm font-medium text-white">
            {isRecording ? 'Recording' : 'Audio Recorder'}
          </span>
          {isRecording && (
            <span className="text-xs text-gray-400">
              {formatTime(recordingTime)}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {!isRecording && (
            <button
              onClick={() => onRecordingComplete(new Blob(), 0)}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-4">
          <div className="flex flex-col items-center space-y-4">
            {/* Recording Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-4 rounded-full transition-all ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-cyan-500 hover:bg-cyan-600'
              }`}
            >
              {isRecording ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Status */}
            <div className="text-center">
              {isRecording ? (
                <>
                  <p className="text-sm text-white font-medium">Recording in progress</p>
                  <p className="text-xs text-gray-400 mt-1">
                    You can navigate to other pages while recording
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Click to start recording</p>
              )}
            </div>

            {/* Audio Visualizer (optional) */}
            {isRecording && (
              <div className="w-full h-8 bg-gray-800 rounded-lg flex items-center justify-center space-x-1">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-cyan-400 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 24 + 8}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  // Use portal to render outside of current component tree
  if (typeof window !== 'undefined') {
    return createPortal(recorderUI, document.body)
  }

  return null
}

// Global recorder state for persistence across navigation
interface GlobalRecorderState {
  isActive: boolean
  props?: AudioRecorderProps
}

let globalRecorderState: GlobalRecorderState = { isActive: false }

export function useGlobalRecorder() {
  const [recorderState, setRecorderState] = useState(globalRecorderState)

  const startGlobalRecording = (props: AudioRecorderProps) => {
    globalRecorderState = { isActive: true, props }
    setRecorderState(globalRecorderState)
  }

  const stopGlobalRecording = () => {
    globalRecorderState = { isActive: false }
    setRecorderState(globalRecorderState)
  }

  return {
    recorderState,
    startGlobalRecording,
    stopGlobalRecording,
    isRecording: recorderState.isActive
  }
}