import { createClient } from '@/utils/supabase/server'
import { resendEmailService } from '@/lib/email/resend-service'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { TestEmailSchema, validateBody, sanitizeHtml, ValidationError } from '@/lib/validation/schemas'
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
    const validatedData = validateBody(TestEmailSchema)(requestBody)
    
    const { to, subject, content } = validatedData
    const sanitizedContent = content ? sanitizeHtml(content) : undefined

    // Send test email
    const result = await resendEmailService.sendCustomEmail(
      {
        to: {
          email: to || user.email || 'test@example.com',
          name: 'Test User'
        },
        subject: subject || 'LabFlow Test Email',
        from: {
          email: process.env.FROM_EMAIL || 'noreply@labflow.dev',
          name: 'LabFlow'
        },
        tags: [
          { name: 'type', value: 'test' },
          { name: 'user_id', value: user.id }
        ]
      },
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">LabFlow Integration Test</h2>
          <p style="color: #666;">${sanitizedContent || 'This is a test email to verify that the email integration is working correctly.'}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Sent from LabFlow at ${new Date().toLocaleString()}<br>
            Correlation ID: ${correlationId}
          </p>
        </div>
      `,
      sanitizedContent || 'This is a test email to verify that the email integration is working correctly.',
      correlationId
    )

    return NextResponse.json({
      success: true,
      emailId: result.id,
      correlationId,
      message: 'Test email sent successfully'
    })

  } catch (error: any) {
    console.error(`[${correlationId}] Test email error:`, error)
    
    if (error instanceof ValidationError) {
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        correlationId
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: error.message || 'Failed to send test email',
      correlationId
    }, { status: 500 })
  }
}