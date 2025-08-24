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

    const { emailType, context } = await request.json()

    if (!emailType) {
      return NextResponse.json({ error: 'Email type is required' }, { status: 400 })
    }

    const validEmailTypes = ['task_assignment', 'task_reminder', 'deadline_reminder', 'meeting_summary']
    if (!validEmailTypes.includes(emailType)) {
      return NextResponse.json({ 
        error: `Invalid email type. Must be one of: ${validEmailTypes.join(', ')}` 
      }, { status: 400 })
    }

    if (!context || !context.recipientName || !context.labName) {
      return NextResponse.json({ 
        error: 'Context with recipientName and labName is required' 
      }, { status: 400 })
    }

    // Validate lab access if context includes lab information
    if (context.labId) {
      const { data: labMember } = await supabase
        .from('lab_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('lab_id', context.labId)
        .single()

      if (!labMember) {
        return NextResponse.json({ error: 'Access denied to lab' }, { status: 403 })
      }

      // Note: Removed can_send_notifications check as this field doesn't exist in the database schema
      // All lab members can send notifications for now
    }

    const aiService = new AIService()
    const result = await aiService.generateEmailContent(emailType, context)

    // Note: Email audit logging removed as table doesn't exist in current schema
    // Email generation successful - returning result

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Email generation API error:', error)
    
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
      error: error.message || 'Email generation failed' 
    }, { status: 500 })
  }
}