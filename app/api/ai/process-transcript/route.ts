import { createClient } from '@/lib/supabase/server'
import { AIService } from '@/lib/ai/openai-client'
import { NextRequest, NextResponse } from 'next/server'
import { checkAILimit } from '@/lib/rate-limit/rate-limiter'
import { ValidationError, AuthenticationError, normalizeError, isApiError } from '@/lib/errors/api-errors'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  const correlationId = uuidv4()
  
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AuthenticationError('Authentication required', { authError: authError?.message }, correlationId)
    }

    // Rate limiting
    await checkAILimit(user.id, 'processing', correlationId)

    const { transcript, meetingDate, meetingId, labContext } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 })
    }

    if (!meetingDate) {
      return NextResponse.json({ error: 'Meeting date is required' }, { status: 400 })
    }

    // Validate meeting ownership if meetingId provided
    if (meetingId) {
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .select('id, created_by, lab_id')
        .eq('id', meetingId)
        .single()

      if (meetingError || !meeting) {
        return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
      }

      // Check if user has access (either creator or lab member)
      if (meeting.created_by !== user.id) {
        const { data: labMember } = await supabase
          .from('lab_members')
          .select('id')
          .eq('user_id', user.id)
          .eq('lab_id', meeting.lab_id)
          .single()

        if (!labMember) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      }
    }

    const aiService = new AIService()
    const result = await aiService.processTranscript(transcript, meetingDate, labContext)

    // Store processed results in database if meetingId provided
    if (meetingId) {
      // Save processed notes
      const { error: notesError } = await supabase
        .from('meetings')
        .update({
          ai_summary: result.processedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId)

      if (notesError) {
        console.error('Error saving processed notes:', notesError)
      }

      // Save extracted tasks
      const tasks = result.extractedTasks.tasks.map(task => ({
        meeting_id: meetingId,
        title: task.task,
        description: task.task,
        assignee_user_id: null, // Would need to resolve member name to user ID
        assignee_name: task.member,
        due_date: task.due_date,
        priority: task.priority,
        status: 'TODO',
        created_by: user.id,
        created_at: new Date().toISOString()
      }))

      if (tasks.length > 0) {
        const { error: tasksError } = await supabase
          .from('tasks')
          .insert(tasks)

        if (tasksError) {
          console.error('Error saving extracted tasks:', tasksError)
        }
      }
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Transcript processing API error:', error)
    
    // Handle specific OpenAI errors
    if (error.message.includes('API key')) {
      return NextResponse.json({ 
        error: 'OpenAI API configuration error' 
      }, { status: 500 })
    }
    
    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      return NextResponse.json({ 
        error: 'API rate limit exceeded. Please try again later.' 
      }, { status: 429 })
    }
    
    return NextResponse.json({ 
      error: error.message || 'Transcript processing failed' 
    }, { status: 500 })
  }
}