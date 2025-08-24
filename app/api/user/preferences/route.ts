import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { rateLimit } from '@/lib/rate-limit/rate-limiter'
import { z } from 'zod'

const UpdatePreferencesSchema = z.object({
  last_selected_lab_id: z.string().uuid().optional(),
  theme: z.enum(['dark', 'light', 'system']).optional(),
  notification_preferences: z.object({}).optional(),
  onboarding_completed: z.boolean().optional(),
})

// PATCH /api/user/preferences - Update user preferences
export async function PATCH(request: Request) {
  try {
    await rateLimit('api', 30) // 30 requests per minute
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = UpdatePreferencesSchema.parse(body)

    // Update user preferences
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(validatedData)
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user preferences:', updateError)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('User preferences PATCH error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/user/preferences - Get user preferences  
export async function GET() {
  try {
    await rateLimit('api', 50) // 50 requests per minute
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user preferences
    const { data: preferences, error } = await supabase
      .from('user_profiles')
      .select('last_selected_lab_id, theme, notification_preferences, onboarding_completed')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user preferences:', error)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    return NextResponse.json({ preferences })

  } catch (error) {
    console.error('User preferences GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}