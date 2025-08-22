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
        .select('id, can_send_notifications')
        .eq('user_id', user.id)
        .eq('lab_id', context.labId)
        .single()

      if (!labMember) {
        return NextResponse.json({ error: 'Access denied to lab' }, { status: 403 })
      }

      if (!labMember.can_send_notifications) {
        return NextResponse.json({ 
          error: 'Insufficient permissions to send notifications' 
        }, { status: 403 })
      }
    }

    const aiService = new AIService()
    const result = await aiService.generateEmailContent(emailType, context)

    // Optional: Store email generation for audit/history
    const { error: auditError } = await supabase
      .from('email_audit_log')
      .insert({
        user_id: user.id,
        email_type: emailType,
        recipient_name: context.recipientName,
        lab_name: context.labName,
        subject: result.subject,
        generated_at: new Date().toISOString()
      })

    if (auditError) {
      console.error('Error logging email generation:', auditError)
      // Continue anyway - email generation was successful
    }

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