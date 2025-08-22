import { createClient } from '@/lib/supabase/server'
import { AIService } from '@/lib/ai/openai-client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const meetingId = formData.get('meetingId') as string
    const labId = formData.get('labId') as string

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 })
    }

    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 })
    }

    if (!labId) {
      return NextResponse.json({ error: 'Lab ID is required' }, { status: 400 })
    }

    // Validate file type and size
    const allowedTypes = ['audio/mp3', 'audio/mp4', 'audio/mpeg', 'audio/mpga', 'audio/m4a', 'audio/wav', 'audio/webm']
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Supported formats: MP3, MP4, MPEG, MPGA, M4A, WAV, WEBM' 
      }, { status: 400 })
    }

    const maxSize = 25 * 1024 * 1024 // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 25MB.' 
      }, { status: 400 })
    }

    // Validate meeting access
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select(`
        id, 
        title, 
        scheduled_date, 
        lab_id,
        created_by,
        labs!inner (
          id,
          name,
          lab_members!inner (
            user_id,
            users!inner (
              id,
              first_name,
              last_name
            )
          )
        )
      `)
      .eq('id', meetingId)
      .eq('lab_id', labId)
      .single()

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Check if user has access
    const hasAccess = meeting.created_by === user.id || 
      meeting.labs.lab_members.some((member: any) => member.user_id === user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Extract participants and lab context
    const participants = meeting.labs.lab_members.map((member: any) => 
      `${member.users.first_name} ${member.users.last_name}`.trim()
    )

    const context = {
      meetingId: meeting.id,
      participants,
      labName: meeting.labs.name,
      meetingDate: new Date(meeting.scheduled_date).toISOString().split('T')[0]
    }

    const aiService = new AIService()
    const result = await aiService.processStandupRecording(audioFile, context)

    // Store comprehensive results in database
    const { error: updateError } = await supabase
      .from('meetings')
      .update({
        transcript: result.transcript,
        ai_summary: JSON.stringify(result.aiSummary),
        status: 'COMPLETED',
        updated_at: new Date().toISOString()
      })
      .eq('id', meetingId)

    if (updateError) {
      console.error('Error updating meeting with AI results:', updateError)
    }

    // Create tasks from action items
    const tasks = result.aiSummary.actionItems.map(item => ({
      meeting_id: meetingId,
      title: item.description,
      description: item.description,
      assignee_name: item.assignee,
      due_date: item.dueDate,
      priority: item.priority,
      status: 'TODO',
      created_by: user.id,
      created_at: new Date().toISOString()
    }))

    if (tasks.length > 0) {
      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(tasks)

      if (tasksError) {
        console.error('Error creating tasks from action items:', tasksError)
      }
    }

    // Create follow-up items if any
    const followUps = result.aiSummary.followUpNeeded.map(item => ({
      meeting_id: meetingId,
      topic: item.topic,
      participants: item.participants,
      urgency: item.urgency,
      created_by: user.id,
      created_at: new Date().toISOString()
    }))

    if (followUps.length > 0) {
      const { error: followUpError } = await supabase
        .from('meeting_follow_ups')
        .insert(followUps)

      if (followUpError) {
        console.error('Error creating follow-up items:', followUpError)
      }
    }

    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      aiSummary: result.aiSummary,
      tasksCreated: tasks.length,
      followUpsCreated: followUps.length
    })

  } catch (error: any) {
    console.error('Standup processing API error:', error)
    
    // Handle specific errors
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
      error: error.message || 'Standup processing failed' 
    }, { status: 500 })
  }
}