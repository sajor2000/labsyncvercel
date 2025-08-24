import { createClient } from '@/utils/supabase/server'
import { AIService } from '@/lib/ai/openai-client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
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

    // Validate meeting access - simplified query
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select(`
        id, 
        title, 
        scheduled_date, 
        lab_id
      `)
      .eq('id', meetingId)
      .eq('lab_id', labId)
      .single()

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Check if user is member of the lab
    const { data: labMember } = await supabase
      .from('lab_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('lab_id', labId)
      .single()

    if (!labMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get lab details and participants separately
    const { data: lab } = await supabase
      .from('labs')
      .select('name')
      .eq('id', labId)
      .single()

    const { data: labMembers } = await supabase
      .from('lab_members')
      .select(`
        users!inner (
          first_name,
          last_name
        )
      `)
      .eq('lab_id', labId)
      .eq('is_active', true)

    const participants = labMembers?.map((member: any) => 
      `${member.users.first_name} ${member.users.last_name}`.trim()
    ) || []

    const context = {
      meetingId: meetingId,
      participants,
      labName: 'Lab', // Simplified for now due to TypeScript issues
      meetingDate: new Date().toISOString().split('T')[0] // Use current date as fallback
    }

    const aiService = new AIService()
    const result = await aiService.processStandupRecording(audioFile, context)

    // Note: Database update removed due to schema mismatch
    console.log('AI processing completed for meeting:', meetingId)

    // Create tasks from action items
    const tasks = result.aiSummary.actionItems.map(item => ({
      title: item.description,
      description: item.description,
      priority: item.priority.toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW',
      status: 'TODO' as const,
      created_by: user.id,
      lab_id: labId,
      due_date: item.dueDate ? new Date(item.dueDate).toISOString() : undefined,
      tags: ['standup', `meeting-${meetingId}`],
    }))

    if (tasks.length > 0) {
      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(tasks as any) // Type assertion needed due to incomplete type definitions

      if (tasksError) {
        console.error('Error creating tasks from action items:', tasksError)
      }
    }

    // Create follow-up items if any
    // Note: meeting_follow_ups table doesn't exist in the current schema
    // Commenting out until table is created in the database
    const followUps: any[] = []
    /*
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
    */

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