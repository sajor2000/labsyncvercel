import { createClient } from '@/lib/supabase/server'
import { AIService } from '@/lib/ai/openai-client'
import { NextRequest, NextResponse } from 'next/server'
import { checkAILimit } from '@/lib/rate-limit/rate-limiter'
import { ValidationError, AuthenticationError, normalizeError, isApiError } from '@/lib/errors/api-errors'
import { SentryService, sentryLogger } from '@/lib/monitoring/sentry-service'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  const correlationId = uuidv4()
  
  return await SentryService.instrumentAsync(
    'AI Transcription API',
    async () => {
      sentryLogger.info('Starting AI transcription request', {
        correlationId,
        userAgent: request.headers.get('user-agent'),
      })

      // Add breadcrumb for debugging
      SentryService.addBreadcrumb(
        'AI transcription started',
        'ai.transcription',
        { correlationId }
      )
  
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AuthenticationError('Authentication required', { authError: authError?.message }, correlationId)
    }

    // Rate limiting
    await checkAILimit(user.id, 'transcription', correlationId)

    const formData = await request.formData()
    const file = formData.get('audio') as File
    
    if (!file) {
      throw new ValidationError('Audio file is required', {}, correlationId)
    }

    // Validate file type
    const allowedTypes = ['audio/mp3', 'audio/mp4', 'audio/mpeg', 'audio/mpga', 'audio/m4a', 'audio/wav', 'audio/webm']
    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError(
        'Invalid file type. Supported formats: MP3, MP4, MPEG, MPGA, M4A, WAV, WEBM',
        { fileType: file.type, allowedTypes },
        correlationId
      )
    }

    // Validate file size (25MB limit for Whisper)
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (file.size > maxSize) {
      throw new ValidationError(
        'File too large. Maximum size is 25MB.',
        { fileSize: file.size, maxSize },
        correlationId
      )
    }

    const aiService = new AIService()
    
    // Instrument the AI transcription call
    const result = await SentryService.instrumentAI(
      'transcription',
      () => aiService.transcribeAudio(file, correlationId),
      {
        model: 'whisper-1',
        inputSize: file.size,
        correlationId,
        data: {
          fileType: file.type,
          fileName: file.name,
        }
      }
    )

    // Optional: Store transcription result in database
    const meetingId = formData.get('meetingId') as string
    if (meetingId) {
      const { error: dbError } = await supabase
        .from('meetings')
        .update({
          transcript: result.transcript,
          transcription_confidence: result.confidence,
          processing_time_ms: result.processingTimeMs,
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId)
        .eq('created_by', user.id) // Ensure user owns the meeting

      if (dbError) {
        console.error(`[${correlationId}] Error saving transcription to database:`, dbError)
        // Continue anyway - transcription was successful
      }
    }

    sentryLogger.info('AI transcription completed successfully', {
      correlationId,
      duration: result.processingTimeMs,
      confidence: result.confidence,
    })

    return NextResponse.json(result, {
      headers: {
        'X-Correlation-ID': correlationId
      }
    })

  } catch (error: any) {
    sentryLogger.error('Transcription API error occurred', {
      correlationId,
      error: error.message,
      stack: error.stack,
    })

    // Capture error in Sentry with context
    SentryService.captureException(error, {
      tags: {
        apiEndpoint: '/api/ai/transcribe',
        operation: 'transcription',
      },
      correlationId,
      level: 'error',
    })
    
    const apiError = isApiError(error) ? error : normalizeError(error, correlationId)
    
    return NextResponse.json(apiError.toJSON(), {
      status: apiError.statusCode,
      headers: {
        'X-Correlation-ID': correlationId,
        'Content-Type': 'application/json'
      }
    })
  }
    },
    {
      op: 'http.server',
      description: 'AI transcription API endpoint',
      data: {
        endpoint: '/api/ai/transcribe',
        method: 'POST',
        correlationId,
      },
      tags: {
        api: 'ai',
        operation: 'transcription',
      }
    }
  )
}