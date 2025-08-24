#!/usr/bin/env node

/**
 * Script to verify Supabase tables and their actual structure
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyTables() {
  console.log('Verifying Supabase tables...\n')
  
  const tablesToCheck = [
    'user_profiles',
    'labs',
    'lab_members',
    'calendar_events',
    'notifications',
    'standup_meetings',
    'standup_action_items',
    'tasks',
    'files',
    'project_buckets',
    'studies',
    'workflow_steps'
  ]

  for (const table of tablesToCheck) {
    try {
      console.log(`\n=== ${table} ===`)
      
      // Try to fetch one row to see if table exists and get structure
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(1)
      
      if (error) {
        console.log(`❌ Error: ${error.message}`)
        if (error.code === 'PGRST116') {
          console.log('   Table does not exist!')
        }
      } else {
        console.log(`✅ Table exists`)
        console.log(`   Row count: ${count}`)
        
        if (data && data.length > 0) {
          console.log('   Sample fields:', Object.keys(data[0]).join(', '))
        } else {
          // Try to get schema even with no data
          const { data: emptyInsert, error: insertError } = await supabase
            .from(table)
            .insert({})
            .select()
          
          if (insertError) {
            // Parse error message to understand required fields
            if (insertError.message.includes('null value')) {
              const match = insertError.message.match(/column "([^"]+)"/)
              if (match) {
                console.log(`   Required field found: ${match[1]}`)
              }
            }
          }
        }
      }
    } catch (err) {
      console.log(`❌ Unexpected error: ${err.message}`)
    }
  }

  // Special check for user_profiles fields
  console.log('\n\n=== Checking user_profiles fields specifically ===')
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1)
    .single()
  
  if (!profileError && profile) {
    console.log('user_profiles fields:', Object.keys(profile))
    console.log('Has current_lab_id?', 'current_lab_id' in profile)
    console.log('Has last_selected_lab_id?', 'last_selected_lab_id' in profile)
  }

  // Check if we can insert into calendar_events
  console.log('\n\n=== Testing calendar_events insert ===')
  const testEvent = {
    title: 'Test Event',
    event_type: 'MEETING',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 3600000).toISOString(),
    lab_id: '00000000-0000-0000-0000-000000000000' // dummy UUID
  }
  
  const { error: eventError } = await supabase
    .from('calendar_events')
    .insert(testEvent)
    .select()
  
  if (eventError) {
    console.log('Insert error:', eventError.message)
    if (eventError.message.includes('violates foreign key')) {
      console.log('Need valid lab_id')
    }
  } else {
    console.log('✅ Can insert into calendar_events')
  }
}

verifyTables()