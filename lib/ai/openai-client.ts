import OpenAI from 'openai'
import { openaiConfig } from '@/lib/config/api-keys'
import { retryOpenAI } from '@/lib/utils/retry'
import { mapOpenAIError, ExternalApiError } from '@/lib/errors/api-errors'

// Initialize OpenAI client with proper configuration
export const openai = new OpenAI({
  apiKey: openaiConfig.apiKey,
  organization: openaiConfig.organization,
  timeout: openaiConfig.timeoutMs,
  maxRetries: 0, // We handle retries manually with our retry utility
})

// AI Processing interfaces
export interface AIProcessingResult {
  transcript: string
  aiSummary: {
    meetingSummary?: {
      keyPoints: string[]
      decisions: string[]
      concerns: string[]
      achievements: string[]
    }
    actionItems: Array<{
      description: string
      assignee?: string
      priority: string
      dueDate?: string
      relatedStudy?: string
    }>
    studyUpdates: Array<{
      studyName: string
      updateType: string
      content: string
      mentionedBy?: string
    }>
    followUpNeeded: Array<{
      topic: string
      participants: string[]
      urgency: string
    }>
    nextMeetingTopics: string[]
  }
}

export interface TranscriptionResult {
  transcript: string
  confidence: number
  duration: number
  processingTimeMs: number
  language?: string
  segments?: Array<{
    text: string
    start: number
    end: number
  }>
}

export interface StreamingTranscriptionChunk {
  text: string
  isFinal: boolean
  timestamp?: number
}

export interface TaskExtractionResult {
  tasks: Array<{
    member: string
    task: string
    start_date?: string
    due_date?: string
    status: string
    blocker?: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  }>
  summary: {
    tasks_due_this_week: string[]
    overdue_tasks: string[]
    blockers: string[]
  }
}

// AI Service Class
export class AIService {
  
  /**
   * Transcribe audio file using OpenAI Whisper with retry logic
   */
  async transcribeAudio(audioFile: File, correlationId?: string): Promise<TranscriptionResult> {
    const startTime = Date.now()
    
    try {
      console.log(`[${correlationId}] Starting transcription for file: ${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(2)}MB)`)
      
      // Validate file size (OpenAI limit is 25MB)
      if (audioFile.size > 25 * 1024 * 1024) {
        throw new ExternalApiError('OpenAI', new Error('File size exceeds 25MB limit'), correlationId)
      }

      const transcription = await retryOpenAI(async () => {
        return await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          response_format: 'verbose_json',
          timestamp_granularities: ['word', 'segment'],
          language: undefined // Auto-detect language
        })
      })
      
      const processingTimeMs = Date.now() - startTime
      
      console.log(`[${correlationId}] Transcription completed in ${processingTimeMs}ms - Language: ${transcription.language}`)
      
      return {
        transcript: transcription.text,
        confidence: 0.95, // Whisper doesn't return confidence scores
        duration: transcription.duration || 0,
        processingTimeMs,
        language: transcription.language,
        segments: transcription.segments?.map(segment => ({
          text: segment.text,
          start: segment.start,
          end: segment.end
        }))
      }
    } catch (error) {
      console.error(`[${correlationId}] Error transcribing audio:`, error)
      throw mapOpenAIError(error, correlationId)
    }
  }

  /**
   * Transcribe audio with streaming support (for real-time feedback)
   */
  async *transcribeAudioStream(audioFile: File, correlationId?: string): AsyncGenerator<StreamingTranscriptionChunk> {
    // Note: OpenAI Whisper API doesn't support streaming yet
    // This is a workaround that processes in chunks for better UX
    
    try {
      yield { text: 'Starting transcription...', isFinal: false, timestamp: Date.now() }
      
      const result = await this.transcribeAudio(audioFile, correlationId)
      
      // Simulate streaming by yielding segments if available
      if (result.segments && result.segments.length > 0) {
        for (const segment of result.segments) {
          yield {
            text: segment.text,
            isFinal: false,
            timestamp: segment.start * 1000 // Convert to milliseconds
          }
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      // Final result
      yield {
        text: result.transcript,
        isFinal: true,
        timestamp: Date.now()
      }
      
    } catch (error) {
      console.error(`[${correlationId}] Error in streaming transcription:`, error)
      throw mapOpenAIError(error, correlationId)
    }
  }

  /**
   * Process meeting transcript using GPT-4o-mini for task extraction with streaming
   */
  async processTranscript(
    transcript: string, 
    meetingDate: string,
    labContext?: { labName: string; teamMembers: string[] },
    correlationId?: string
  ): Promise<{
    processedNotes: string
    extractedTasks: TaskExtractionResult
  }> {
    const teamMembersList = labContext?.teamMembers?.join(', ') || 'team members'
    
    const systemPrompt = `
SYSTEM PROMPT: Advanced Task & Timeline Tracker for ${labContext?.labName || 'Lab'} Members

PURPOSE: Extract actionable tasks and timelines from lab standup meetings with high precision.

TEAM CONTEXT: Known team members: ${teamMembersList}

TASK EXTRACTION RULES:
1. Identify WHO is doing WHAT with WHEN
2. Extract specific deliverables, experiments, analyses
3. Convert time references to absolute dates (today: ${meetingDate})
4. Flag blockers and dependencies
5. Assess priority based on urgency and importance

OUTPUT REQUIREMENTS:
Return both HTML summary and JSON structure:

JSON Structure:
{
  "tasks": [
    {
      "member": "exact name from transcript",
      "task": "specific actionable description",
      "start_date": "YYYY-MM-DD or null",
      "due_date": "YYYY-MM-DD or null",
      "status": "percentage or phase description",
      "blocker": "specific blocker if mentioned",
      "priority": "HIGH|MEDIUM|LOW|URGENT"
    }
  ],
  "summary": {
    "tasks_due_this_week": ["task descriptions"],
    "overdue_tasks": ["overdue task descriptions"],
    "blockers": ["blocker descriptions"]
  }
}

HTML Summary: Create a structured report with member sections, timeline highlights, and priority flags.

PRIORITY ASSESSMENT:
- URGENT: Deadlines within 2 days, critical blockers
- HIGH: Important deliverables within 1 week
- MEDIUM: Standard work items, 1-4 weeks
- LOW: Long-term planning, >1 month

Parse the transcript carefully and extract all actionable items with accurate timeline information.`

    try {
      console.log(`[${correlationId}] Processing transcript (${transcript.length} characters) for ${labContext?.labName || 'Unknown Lab'}`)
      
      const response = await retryOpenAI(async () => {
        return await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Process this standup meeting transcript:\n\n${transcript}` }
          ],
          temperature: 0.1,
          max_tokens: 2000,
          stream: false // We'll add streaming in a separate method
        })
      })

      const content = response.choices[0]?.message?.content || ''
      
      if (!content) {
        throw new ExternalApiError('OpenAI', new Error('Empty response from GPT-4o-mini'), correlationId)
      }
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*"tasks"[\s\S]*\}/)
      let extractedTasks: TaskExtractionResult = {
        tasks: [],
        summary: {
          tasks_due_this_week: [],
          overdue_tasks: [],
          blockers: []
        }
      }
      
      if (jsonMatch) {
        try {
          extractedTasks = JSON.parse(jsonMatch[0])
        } catch (parseError) {
          console.error('Error parsing extracted tasks JSON:', parseError)
        }
      }
      
      // Extract HTML summary (everything before JSON)
      const htmlSummary = jsonMatch ? content.replace(jsonMatch[0], '').trim() : content
      
      return {
        processedNotes: htmlSummary,
        extractedTasks
      }
    } catch (error) {
      console.error(`[${correlationId}] Error processing transcript:`, error)
      throw mapOpenAIError(error, correlationId)
    }
  }

  /**
   * Generate AI-powered email content for notifications with retry logic
   */
  async generateEmailContent(
    emailType: 'task_assignment' | 'task_reminder' | 'deadline_reminder' | 'meeting_summary',
    context: {
      recipientName: string
      labName: string
      taskTitle?: string
      dueDate?: string
      meetingTitle?: string
      summary?: string
      actionItems?: string[]
    },
    correlationId?: string
  ): Promise<{
    subject: string
    htmlContent: string
    textContent: string
  }> {
    const systemPrompt = `
You are an AI assistant that generates professional, clear, and actionable email content for medical research laboratory communications.

Generate email content that is:
1. Professional and respectful
2. Clear and actionable
3. Appropriately urgent without being alarming
4. Tailored to medical research context
5. Include proper formatting for both HTML and plain text

Email Type: ${emailType}
Lab Context: Medical research laboratory
Tone: Professional, supportive, collaborative`

    let userPrompt = ''
    
    switch (emailType) {
      case 'task_assignment':
        userPrompt = `Generate an email to ${context.recipientName} about a new task assignment:
Task: ${context.taskTitle}
Due Date: ${context.dueDate}
Lab: ${context.labName}

Include clear next steps and offer support.`
        break
        
      case 'task_reminder':
        userPrompt = `Generate a friendly reminder email to ${context.recipientName}:
Task: ${context.taskTitle}
Due Date: ${context.dueDate}
Lab: ${context.labName}

Make it encouraging and supportive, not demanding.`
        break
        
      case 'deadline_reminder':
        userPrompt = `Generate a deadline reminder email to ${context.recipientName}:
Deadline: ${context.taskTitle}
Due Date: ${context.dueDate}
Lab: ${context.labName}

Include importance and any preparation needed.`
        break
        
      case 'meeting_summary':
        userPrompt = `Generate a meeting summary email to ${context.recipientName}:
Meeting: ${context.meetingTitle}
Lab: ${context.labName}
Summary: ${context.summary}
Action Items: ${context.actionItems?.join(', ')}

Make it comprehensive but concise.`
        break
    }

    try {
      console.log(`[${correlationId}] Generating ${emailType} email for ${context.recipientName} at ${context.labName}`)
      
      const response = await retryOpenAI(async () => {
        return await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt + '\n\nProvide both subject line and email body in HTML and plain text formats. Format as JSON with keys: subject, htmlContent, textContent' }
          ],
          temperature: 0.2,
          max_tokens: 1000
        })
      })

      const content = response.choices[0]?.message?.content || ''
      
      if (!content) {
        throw new ExternalApiError('OpenAI', new Error('Empty response from email generation'), correlationId)
      }
      
      // Try to parse JSON response
      try {
        const emailContent = JSON.parse(content)
        return {
          subject: emailContent.subject || `${emailType.replace('_', ' ')} - ${context.labName}`,
          htmlContent: emailContent.htmlContent || content,
          textContent: emailContent.textContent || content.replace(/<[^>]*>/g, '')
        }
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          subject: `${emailType.replace('_', ' ')} - ${context.labName}`,
          htmlContent: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${content.replace(/\n/g, '<br>')}</div>`,
          textContent: content
        }
      }
    } catch (error) {
      console.error(`[${correlationId}] Error generating email content:`, error)
      throw mapOpenAIError(error, correlationId)
    }
  }

  /**
   * Comprehensive standup recording processing (combines all AI features)
   */
  async processStandupRecording(
    audioFile: File,
    context: {
      meetingId: string
      participants: string[]
      labName: string
      meetingDate: string
    },
    correlationId?: string
  ): Promise<AIProcessingResult> {
    try {
      console.log(`[${correlationId}] Processing standup recording for meeting ${context.meetingId}`)
      
      // Step 1: Transcribe audio
      const transcriptionResult = await this.transcribeAudio(audioFile, correlationId)
      
      // Step 2: Process transcript for task extraction
      const processedTranscript = await this.processTranscript(
        transcriptionResult.transcript,
        context.meetingDate,
        {
          labName: context.labName,
          teamMembers: context.participants
        },
        correlationId
      )
      
      // Step 3: Convert extracted tasks to action items format
      const actionItems = processedTranscript.extractedTasks.tasks.map(task => ({
        description: task.task,
        assignee: task.member,
        priority: task.priority,
        dueDate: task.due_date,
        relatedStudy: undefined // Would need additional processing to link to studies
      }))
      
      // Step 4: Create comprehensive AI summary
      const aiSummary = {
        meetingSummary: {
          keyPoints: processedTranscript.extractedTasks.summary.tasks_due_this_week,
          decisions: [], // Would need additional processing
          concerns: processedTranscript.extractedTasks.summary.blockers,
          achievements: [] // Would need additional processing
        },
        actionItems,
        studyUpdates: [], // Would need additional processing to extract study mentions
        followUpNeeded: processedTranscript.extractedTasks.summary.blockers.map(blocker => ({
          topic: blocker,
          participants: context.participants,
          urgency: 'HIGH'
        })),
        nextMeetingTopics: [] // Would need additional processing
      }
      
      console.log(`Successfully processed standup recording: ${actionItems.length} action items extracted`)
      
      return {
        transcript: transcriptionResult.transcript,
        aiSummary
      }
    } catch (error) {
      console.error(`[${correlationId}] Error processing standup recording:`, error)
      throw mapOpenAIError(error, correlationId)
    }
  }
}