import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { googleCalendarService } from '@/lib/google-calendar/calendar-service'
import { AuthenticationError } from '@/lib/errors/api-errors'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  const correlationId = uuidv4()
  
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AuthenticationError('Authentication required')
    }

    // Get Google OAuth authorization URL
    const authUrl = googleCalendarService.getAuthUrl([
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ])

    // Store state for security
    const state = uuidv4()
    
    // Store state in session or database for verification
    // For now, we'll add it as a URL parameter
    const urlWithState = `${authUrl}&state=${state}`

    return NextResponse.json({
      authUrl: urlWithState,
      state,
      correlationId
    })

  } catch (error: any) {
    console.error(`[${correlationId}] Google auth URL generation failed:`, error)
    
    return NextResponse.json({
      error: error.message || 'Failed to generate Google auth URL',
      correlationId
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const correlationId = uuidv4()
  
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AuthenticationError('Authentication required')
    }

    const { code, state } = await request.json()

    if (!code) {
      return NextResponse.json({
        error: 'Authorization code is required',
        correlationId
      }, { status: 400 })
    }

    // TODO: Verify state parameter for security
    
    // Exchange code for tokens
    // This would be implemented with the OAuth2 flow
    console.log(`[${correlationId}] Received Google OAuth code for user ${user.id}`)

    // For now, return success - in a full implementation, you would:
    // 1. Exchange the code for access/refresh tokens
    // 2. Store tokens securely (encrypted in database)
    // 3. Set up the calendar service with the tokens
    
    return NextResponse.json({
      success: true,
      message: 'Google Calendar authorization completed',
      correlationId
    })

  } catch (error: any) {
    console.error(`[${correlationId}] Google OAuth callback failed:`, error)
    
    return NextResponse.json({
      error: error.message || 'Failed to process Google OAuth callback',
      correlationId
    }, { status: 500 })
  }
}