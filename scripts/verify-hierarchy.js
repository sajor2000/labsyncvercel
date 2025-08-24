#!/usr/bin/env node

/**
 * Verify the hierarchy relationships in Supabase
 * Expected: bucket → study → task → subtask
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyHierarchy() {
  console.log('=== Verifying Database Hierarchy ===\n')
  
  // Check if tables exist
  const tables = ['project_buckets', 'studies', 'tasks']
  
  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`❌ Table ${table}: ${error.message}`)
    } else {
      console.log(`✅ Table ${table} exists (${count} rows)`)
    }
  }
  
  console.log('\n=== Checking Relationships ===\n')
  
  // Check studies table structure
  const { data: studySample } = await supabase
    .from('studies')
    .select('*')
    .limit(1)
  
  if (studySample && studySample.length > 0) {
    const studyFields = Object.keys(studySample[0])
    console.log('Studies fields:', studyFields.filter(f => f.includes('bucket')).join(', '))
    console.log('Has bucket_id?', studyFields.includes('bucket_id'))
    console.log('Has primary_bucket_id?', studyFields.includes('primary_bucket_id'))
  }
  
  // Check tasks table structure
  const { data: taskSample } = await supabase
    .from('tasks')
    .select('*')
    .limit(1)
  
  if (taskSample && taskSample.length > 0) {
    const taskFields = Object.keys(taskSample[0])
    console.log('\nTasks fields:', taskFields.filter(f => f.includes('study') || f.includes('parent')).join(', '))
    console.log('Has study_id?', taskFields.includes('study_id'))
    console.log('Has parent_task_id?', taskFields.includes('parent_task_id'))
  }
  
  // Test creating hierarchy
  console.log('\n=== Testing Hierarchy Creation ===\n')
  
  const { data: labs } = await supabase
    .from('labs')
    .select('id')
    .limit(1)
    .single()
  
  if (!labs) {
    console.log('❌ No lab found for testing')
    return
  }
  
  // 1. Create bucket
  const { data: bucket, error: bucketError } = await supabase
    .from('project_buckets')
    .insert({
      name: 'Test Bucket',
      lab_id: labs.id
    })
    .select()
    .single()
  
  if (bucketError) {
    console.log('❌ Bucket creation failed:', bucketError.message)
    return
  }
  console.log('✅ Created bucket:', bucket.id)
  
  // 2. Create study in bucket
  const { data: study, error: studyError } = await supabase
    .from('studies')
    .insert({
      title: 'Test Study',
      lab_id: labs.id,
      bucket_id: bucket.id,
      primary_bucket_id: bucket.id
    })
    .select()
    .single()
  
  if (studyError) {
    console.log('❌ Study creation failed:', studyError.message)
    console.log('   Trying without bucket_id...')
    
    const { data: study2, error: study2Error } = await supabase
      .from('studies')
      .insert({
        title: 'Test Study',
        lab_id: labs.id
      })
      .select()
      .single()
    
    if (study2Error) {
      console.log('❌ Study creation without bucket failed too:', study2Error.message)
    } else {
      console.log('⚠️  Study created without bucket link:', study2.id)
      
      // Try to link it
      const { error: linkError } = await supabase
        .from('study_buckets')
        .insert({
          study_id: study2.id,
          bucket_id: bucket.id
        })
      
      if (linkError) {
        console.log('❌ study_buckets link failed:', linkError.message)
      } else {
        console.log('✅ Linked study to bucket via study_buckets table')
      }
    }
  } else {
    console.log('✅ Created study in bucket:', study.id)
  }
  
  // Get the study ID for task creation
  const studyId = study?.id || study2?.id
  
  if (studyId) {
    // 3. Create task in study
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: 'Test Task',
        lab_id: labs.id,
        study_id: studyId
      })
      .select()
      .single()
    
    if (taskError) {
      console.log('❌ Task creation failed:', taskError.message)
    } else {
      console.log('✅ Created task in study:', task.id)
      
      // 4. Create subtask
      const { data: subtask, error: subtaskError } = await supabase
        .from('tasks')
        .insert({
          title: 'Test Subtask',
          lab_id: labs.id,
          study_id: studyId,
          parent_task_id: task.id
        })
        .select()
        .single()
      
      if (subtaskError) {
        console.log('❌ Subtask creation failed:', subtaskError.message)
      } else {
        console.log('✅ Created subtask:', subtask.id)
      }
      
      // Clean up
      await supabase.from('tasks').delete().eq('parent_task_id', task.id)
      await supabase.from('tasks').delete().eq('id', task.id)
    }
  }
  
  // Clean up
  if (study?.id) {
    await supabase.from('studies').delete().eq('id', study.id)
  }
  await supabase.from('project_buckets').delete().eq('id', bucket.id)
  
  console.log('\n✅ Cleanup completed')
  
  console.log('\n=== Hierarchy Summary ===')
  console.log('Current structure:')
  console.log('- project_buckets (top level)')
  console.log('- studies (can link to buckets via bucket_id or study_buckets join table)')
  console.log('- tasks (links to studies via study_id)')
  console.log('- subtasks (tasks with parent_task_id)')
}

verifyHierarchy()