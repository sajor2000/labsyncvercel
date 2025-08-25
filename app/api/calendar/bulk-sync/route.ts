import { createClient } from '@/utils/supabase/server'
import { googleCalendarService } from '@/lib/google-calendar/calendar-service'
import { NextRequest, NextResponse } from 'next/server'
import { bulkSyncSchema } from '@/lib/validation/schemas'
import { rateLimit } from '@/lib/rate-limit/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    await rateLimit('api', 10)
    
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    const requestBody = await request.json()
    const validation = bulkSyncSchema.safeParse(requestBody)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors }, { status: 400 })
    }
    const { events, syncDirection } = validation.data

    // For now, just verify the user is authenticated
    // Lab permissions can be added later when lab context is provided

    // Process events based on sync direction
    const results = await Promise.all(
      events.map(async (event) => {
        try {
          // Store event in database
          const { error } = await supabase
            .from('calendar_events')
            .upsert({
              ...event,
              user_id: user.id,
              lab_id: user.id // Use user ID as placeholder for lab ID
            })
          
          if (error) throw error
          return { success: true, event: event.summary }
        } catch (error) {
          return { success: false, event: event.summary, error: (error as Error).message }
        }
      })
    )

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      processed: events.length,
      successful,
      failed,
      message: `Processed ${successful} events successfully`
    })

  } catch (error: any) {
    console.error('Bulk calendar sync error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to perform bulk calendar sync' 
    }, { status: 500 })
  }
}