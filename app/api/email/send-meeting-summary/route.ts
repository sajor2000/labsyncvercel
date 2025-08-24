import { createClient } from '@/utils/supabase/server'
import { resendEmailService } from '@/lib/email/resend-service'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { SendMeetingSummarySchema, validateBody, sanitizeHtml } from '@/lib/validation/schemas'
import { rateLimit } from '@/lib/rate-limit/rate-limiter'

export async function POST(request: NextRequest) {
  const correlationId = uuidv4()
  
  try {
    await rateLimit('email', 5)
    
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate and sanitize request body
    const requestBody = await request.json()
    const validatedData = validateBody(SendMeetingSummarySchema)(requestBody)
    
    const { 
      meetingId,
      meetingTitle,
      meetingDate,
      summary,
      actionItems = [],
      labId,
      attendeeUserIds 
    } = validatedData

    // Sanitize HTML content
    const sanitizedSummary = sanitizeHtml(summary)
    const sanitizedActionItems = actionItems.map((item: any) => 
      typeof item === 'string' 
        ? { description: sanitizeHtml(item), priority: 'MEDIUM' }
        : { 
            description: sanitizeHtml(item.description || item), 
            assignee: item.assignee,
            priority: item.priority || 'MEDIUM',
            dueDate: item.dueDate
          }
    )

    // Fetch lab details
    const { data: lab } = await supabase
      .from('labs')
      .select('name')
      .eq('id', labId)
      .single()

    const labName = lab?.name || 'Research Lab'

    // Fetch attendee details
    const { data: attendees } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email')
      .in('id', attendeeUserIds)

    if (!attendees || attendees.length === 0) {
      return NextResponse.json({ 
        error: 'No valid attendees found' 
      }, { status: 400 })
    }

    // Prepare email data
    const attendeeNames = attendees.map(a => 
      `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Team Member'
    )

    const emailPromises = attendees.map(async (attendee) => {
      const recipientName = `${attendee.first_name || ''} ${attendee.last_name || ''}`.trim() || 'Team Member'
      
      try {
        return await resendEmailService.sendMeetingSummaryEmail(
          {
            recipientName,
            labName,
            meetingTitle,
            meetingDate,
            summary: sanitizedSummary,
            actionItems: sanitizedActionItems,
            attendees: attendeeNames,
            nextMeetingDate: undefined, // Could be calculated
          },
          {
            to: {
              email: attendee.email,
              name: recipientName
            },
            subject: `Meeting Summary: ${meetingTitle} - ${new Date(meetingDate).toLocaleDateString()}`,
            from: {
              email: process.env.FROM_EMAIL || 'noreply@labflow.dev',
              name: 'LabFlow'
            },
            tags: [
              { name: 'meeting_id', value: meetingId },
              { name: 'lab_id', value: labId }
            ]
          },
          correlationId
        )
      } catch (error) {
        console.error(`Failed to send email to ${attendee.email}:`, error)
        return { success: false, email: attendee.email, error: String(error) }
      }
    })

    const results = await Promise.all(emailPromises)
    const successCount = results.filter(r => r.success).length

    // Store email send record
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        lab_id: labId,
        type: 'meeting_summary',
        title: `Meeting Summary: ${meetingTitle}`,
        message: `Sent to ${successCount} of ${attendees.length} attendees`,
        data: {
          meetingId,
          results,
          correlationId
        }
      })

    return NextResponse.json({
      success: true,
      emailsSent: successCount,
      totalAttendees: attendees.length,
      results
    })

  } catch (error: any) {
    console.error(`[${correlationId}] Error sending meeting summary emails:`, error)
    return NextResponse.json({ 
      error: error.message || 'Failed to send meeting summary emails' 
    }, { status: 500 })
  }
}