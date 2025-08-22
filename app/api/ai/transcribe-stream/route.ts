import { createClient } from '@/lib/supabase/server'
import { AIService } from '@/lib/ai/openai-client'
import { NextRequest, NextResponse } from 'next/server'
import { checkAILimit } from '@/lib/rate-limit/rate-limiter'
import { ValidationError, AuthenticationError, normalizeError, isApiError } from '@/lib/errors/api-errors'
import { v4 as uuidv4 } from 'uuid'

// Streaming transcription with real-time progress updates
export async function POST(request: NextRequest) {
  const correlationId = uuidv4()
  
  try {
    const supabase = await createClient()
    
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

    // Validate file type and size
    const allowedTypes = ['audio/mp3', 'audio/mp4', 'audio/mpeg', 'audio/mpga', 'audio/m4a', 'audio/wav', 'audio/webm']
    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError(
        'Invalid file type. Supported formats: MP3, MP4, MPEG, MPGA, M4A, WAV, WEBM',
        { fileType: file.type, allowedTypes },
        correlationId
      )
    }

    const maxSize = 25 * 1024 * 1024 // 25MB
    if (file.size > maxSize) {
      throw new ValidationError(
        'File too large. Maximum size is 25MB.',
        { fileSize: file.size, maxSize },
        correlationId
      )
    }

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const aiService = new AIService()
          
          // Stream transcription chunks
          for await (const chunk of aiService.transcribeAudioStream(file, correlationId)) {
            const sseData = `data: ${JSON.stringify({
              type: 'transcription_chunk',
              data: chunk,
              correlationId
            })}\n\n`
            
            controller.enqueue(encoder.encode(sseData))
            
            // If this is the final chunk, close the stream
            if (chunk.isFinal) {
              const finalData = `data: ${JSON.stringify({
                type: 'transcription_complete',
                correlationId
              })}\n\n`
              controller.enqueue(encoder.encode(finalData))
              controller.close()
              break
            }
          }
        } catch (error) {
          console.error(`[${correlationId}] Streaming transcription error:`, error)
          
          const apiError = isApiError(error) ? error : normalizeError(error, correlationId)
          
          const errorData = `data: ${JSON.stringify({
            type: 'error',
            error: apiError.toJSON(),
            correlationId
          })}\n\n`
          
          controller.enqueue(encoder.encode(errorData))
          controller.close()
        }
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Correlation-ID': correlationId
      }
    })

  } catch (error: any) {
    console.error(`[${correlationId}] Streaming transcription setup error:`, error)
    
    const apiError = isApiError(error) ? error : normalizeError(error, correlationId)
    
    return NextResponse.json(apiError.toJSON(), {
      status: apiError.statusCode,
      headers: {
        'X-Correlation-ID': correlationId,
        'Content-Type': 'application/json'
      }
    })
  }
}