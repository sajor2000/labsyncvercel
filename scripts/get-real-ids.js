#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getRealIds() {
  // Get a real lab
  const { data: labs } = await supabase
    .from('labs')
    .select('id, name')
    .limit(1)
    .single()
  
  if (labs) {
    console.log('Real lab:', labs)
  }

  // Check user_profiles structure
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1)
  
  console.log('\nuser_profiles query:', { 
    hasData: !!profileData,
    error: profileError?.message,
    fields: profileData?.[0] ? Object.keys(profileData[0]) : 'No data'
  })

  // Get the auth user first
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
  
  if (users && users.length > 0) {
    console.log('\nAuth users found:', users.length)
    const firstUser = users[0]
    console.log('First user ID:', firstUser.id)
    
    // Check if this user has a profile
    const { data: existingProfile, error: profileFetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', firstUser.id)
      .single()
    
    if (existingProfile) {
      console.log('\nExisting profile fields:', Object.keys(existingProfile))
      console.log('Has current_lab_id?', 'current_lab_id' in existingProfile)
      console.log('Has last_selected_lab_id?', 'last_selected_lab_id' in existingProfile)
      console.log('last_selected_lab_id value:', existingProfile.last_selected_lab_id)
    } else {
      console.log('\nNo profile for user, error:', profileFetchError?.message)
    }
  } else {
    console.log('\nNo auth users found')
  }
}

getRealIds()