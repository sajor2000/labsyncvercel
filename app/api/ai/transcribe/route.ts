/**
 * Simple audio transcription endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { transcribeAudio } from '@/lib/ai/simple-ai'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get audio file from form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Transcribe audio
    const transcript = await transcribeAudio(audioFile)
    
    return NextResponse.json({ 
      transcript,
      wordCount: transcript.split(' ').length 
    })
    
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}