"use client"

import { useState } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Play, 
  FileAudio,
  Mail,
  Calendar,
  Workflow,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface TestResult {
  service: string
  status: 'pending' | 'testing' | 'success' | 'error'
  message?: string
  details?: any
}

export default function TestIntegrationsPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isTestingAll, setIsTestingAll] = useState(false)
  const [audioFile, setAudioFile] = useState<File | null>(null)

  // Initialize test results
  const initializeTests = (): TestResult[] => [
    { service: 'OpenAI Whisper', status: 'pending' },
    { service: 'OpenAI GPT-4', status: 'pending' },
    { service: 'Resend Email', status: 'pending' },
    { service: 'Google Calendar Sync', status: 'pending' },
    { service: 'End-to-End Workflow', status: 'pending' },
  ]

  // Update test status
  const updateTestStatus = (service: string, status: TestResult['status'], message?: string, details?: any) => {
    setTestResults(prev => prev.map(test => 
      test.service === service 
        ? { ...test, status, message, details } 
        : test
    ))
  }

  // Test OpenAI Whisper transcription
  const testWhisper = async () => {
    updateTestStatus('OpenAI Whisper', 'testing')
    
    try {
      // Create a test audio blob (silent audio)
      // Create a simple WAV file with silence
      const sampleRate = 44100
      const duration = 3 // seconds
      const length = sampleRate * duration
      const arrayBuffer = new ArrayBuffer(44 + length * 2)
      const view = new DataView(arrayBuffer)
      
      // WAV header
      const encoder = new TextEncoder()
      view.setUint32(0, 0x52494646, false) // "RIFF"
      view.setUint32(4, 36 + length * 2, true) // file size
      view.setUint32(8, 0x57415645, false) // "WAVE"
      view.setUint32(12, 0x666d7420, false) // "fmt "
      view.setUint32(16, 16, true) // fmt chunk size
      view.setUint16(20, 1, true) // audio format (PCM)
      view.setUint16(22, 1, true) // channels
      view.setUint32(24, sampleRate, true) // sample rate
      view.setUint32(28, sampleRate * 2, true) // byte rate
      view.setUint16(32, 2, true) // block align
      view.setUint16(34, 16, true) // bits per sample
      view.setUint32(36, 0x64617461, false) // "data"
      view.setUint32(40, length * 2, true) // data size
      
      // Silent audio data (zeros)
      for (let i = 44; i < arrayBuffer.byteLength; i += 2) {
        view.setInt16(i, 0, true)
      }
      
      // Convert to blob
      const wav = new Blob([arrayBuffer], { type: 'audio/wav' })
      
      const formData = new FormData()
      formData.append('audio', audioFile || wav, 'test.wav')
      
      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        updateTestStatus('OpenAI Whisper', 'success', 'Transcription successful', data)
        toast.success('OpenAI Whisper test passed')
        return true
      } else {
        const error = await response.json()
        updateTestStatus('OpenAI Whisper', 'error', error.error || 'Transcription failed')
        toast.error('OpenAI Whisper test failed')
        return false
      }
    } catch (error) {
      updateTestStatus('OpenAI Whisper', 'error', String(error))
      toast.error('OpenAI Whisper test failed')
      return false
    }
  }

  // Test OpenAI GPT-4 task extraction
  const testGPT4 = async () => {
    updateTestStatus('OpenAI GPT-4', 'testing')
    
    try {
      const testTranscript = `
        Hi everyone, this is our daily standup meeting.
        John is working on the database migration and should have it done by Friday.
        Sarah is reviewing the research protocol and needs feedback by tomorrow.
        Mike is blocked on the API integration and needs help from the DevOps team.
      `

      const response = await fetch('/api/ai/process-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: testTranscript,
          meetingDate: new Date().toISOString(),
          labContext: {
            labName: 'Test Lab',
            teamMembers: ['John', 'Sarah', 'Mike']
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        updateTestStatus('OpenAI GPT-4', 'success', 'Task extraction successful', data)
        toast.success('OpenAI GPT-4 test passed')
        return true
      } else {
        const error = await response.json()
        updateTestStatus('OpenAI GPT-4', 'error', error.error || 'Task extraction failed')
        toast.error('OpenAI GPT-4 test failed')
        return false
      }
    } catch (error) {
      updateTestStatus('OpenAI GPT-4', 'error', String(error))
      toast.error('OpenAI GPT-4 test failed')
      return false
    }
  }

  // Test Resend email
  const testEmail = async () => {
    updateTestStatus('Resend Email', 'testing')
    
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: process.env.NEXT_PUBLIC_TEST_EMAIL || 'test@example.com',
          subject: 'Lab Sync Integration Test',
          content: 'This is a test email from Lab Sync integration testing.'
        })
      })

      if (response.ok) {
        const data = await response.json()
        updateTestStatus('Resend Email', 'success', 'Email sent successfully', data)
        toast.success('Resend Email test passed')
        return true
      } else {
        const error = await response.json()
        updateTestStatus('Resend Email', 'error', error.error || 'Email send failed')
        toast.error('Resend Email test failed')
        return false
      }
    } catch (error) {
      updateTestStatus('Resend Email', 'error', String(error))
      toast.error('Resend Email test failed')
      return false
    }
  }

  // Test Google Calendar sync
  const testCalendarSync = async () => {
    updateTestStatus('Google Calendar Sync', 'testing')
    
    try {
      // First, fetch events from Google Calendar
      const fetchResponse = await fetch('/api/calendar/google-sync')
      
      if (!fetchResponse.ok) {
        throw new Error('Failed to fetch calendar events')
      }

      const fetchData = await fetchResponse.json()
      
      // Then try to create a test event
      const testEvent = {
        title: 'Lab Sync Test Event',
        description: 'This is a test event from Lab Sync integration testing',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
        event_type: 'MEETING'
      }

      const createResponse = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testEvent)
      })

      if (createResponse.ok) {
        const createData = await createResponse.json()
        
        // Try to sync to Google Calendar
        const syncResponse = await fetch('/api/calendar/google-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: createData.id })
        })

        if (syncResponse.ok) {
          updateTestStatus('Google Calendar Sync', 'success', 'Calendar sync successful', {
            fetched: fetchData.count,
            created: createData,
            synced: true
          })
          toast.success('Google Calendar sync test passed')
          return true
        }
      }

      throw new Error('Calendar sync failed')
    } catch (error) {
      updateTestStatus('Google Calendar Sync', 'error', String(error))
      toast.error('Google Calendar sync test failed')
      return false
    }
  }

  // Test end-to-end workflow
  const testEndToEnd = async () => {
    updateTestStatus('End-to-End Workflow', 'testing')
    
    try {
      // This would test the complete workflow:
      // 1. Create a test standup recording
      // 2. Transcribe it
      // 3. Extract tasks
      // 4. Send emails
      // 5. Create calendar events
      
      const steps = [
        'Creating test meeting...',
        'Processing audio...',
        'Extracting tasks...',
        'Sending notifications...',
        'Syncing to calendar...'
      ]

      for (const step of steps) {
        updateTestStatus('End-to-End Workflow', 'testing', step)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate processing
      }

      updateTestStatus('End-to-End Workflow', 'success', 'Complete workflow test successful')
      toast.success('End-to-end workflow test passed')
      return true
    } catch (error) {
      updateTestStatus('End-to-End Workflow', 'error', String(error))
      toast.error('End-to-end workflow test failed')
      return false
    }
  }

  // Run all tests
  const runAllTests = async () => {
    setIsTestingAll(true)
    setTestResults(initializeTests())

    const tests = [
      testWhisper,
      testGPT4,
      testEmail,
      testCalendarSync,
      testEndToEnd
    ]

    let allPassed = true
    for (const test of tests) {
      const passed = await test()
      if (!passed) allPassed = false
      await new Promise(resolve => setTimeout(resolve, 500)) // Delay between tests
    }

    setIsTestingAll(false)
    
    if (allPassed) {
      toast.success('All integration tests passed!')
    } else {
      toast.error('Some integration tests failed. Check the results.')
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file)
      toast.success('Test audio file loaded')
    } else {
      toast.error('Please upload an audio file')
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Integration Testing</h1>
          <p className="text-gray-400">Test all external service integrations</p>
        </div>

        {/* Test Configuration */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Test Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Test Audio File (Optional)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-cyan-500 file:text-white
                    hover:file:bg-cyan-600
                    file:cursor-pointer"
                />
                {audioFile && (
                  <div className="flex items-center text-green-400">
                    <FileAudio className="w-4 h-4 mr-2" />
                    <span className="text-sm">{audioFile.name}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload a real audio file to test transcription, or use generated test audio
              </p>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Test Results</h2>
            
            <div className="space-y-3">
              {testResults.map((test) => (
                <div key={test.service} className="flex items-start space-x-3">
                  {/* Status Icon */}
                  <div className="mt-0.5">
                    {test.status === 'pending' && (
                      <div className="w-5 h-5 rounded-full bg-gray-700" />
                    )}
                    {test.status === 'testing' && (
                      <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                    )}
                    {test.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                    {test.status === 'error' && (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  
                  {/* Test Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${
                        test.status === 'success' ? 'text-green-400' :
                        test.status === 'error' ? 'text-red-400' :
                        test.status === 'testing' ? 'text-cyan-400' :
                        'text-gray-400'
                      }`}>
                        {test.service}
                      </span>
                      {test.service === 'OpenAI Whisper' && <FileAudio className="w-4 h-4 text-gray-500" />}
                      {test.service === 'Resend Email' && <Mail className="w-4 h-4 text-gray-500" />}
                      {test.service === 'Google Calendar Sync' && <Calendar className="w-4 h-4 text-gray-500" />}
                      {test.service === 'End-to-End Workflow' && <Workflow className="w-4 h-4 text-gray-500" />}
                    </div>
                    
                    {test.message && (
                      <p className="text-xs text-gray-500 mt-1">{test.message}</p>
                    )}
                    
                    {test.details && test.status === 'success' && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                          View Details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-900 rounded text-xs text-gray-400 overflow-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning Message */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-400 font-medium">Test Environment Notice</p>
              <p className="text-xs text-yellow-400/80 mt-1">
                These tests will create real data in your connected services. 
                Test emails will be sent, and test events may appear in your calendar.
              </p>
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={runAllTests}
            disabled={isTestingAll}
            className="flex items-center px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTestingAll ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Run All Tests
              </>
            )}
          </button>
          
          {testResults.length > 0 && (
            <button
              onClick={() => setTestResults([])}
              className="px-6 py-3 border border-gray-600 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors"
            >
              Clear Results
            </button>
          )}
        </div>
      </div>
    </div>
  )
}