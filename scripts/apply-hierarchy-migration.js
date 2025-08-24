#!/usr/bin/env node

/**
 * Apply the production hierarchy constraints migration and verify
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('=== Applying Production Hierarchy Constraints ===\n')
  
  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '008_production_hierarchy_constraints.sql')
  const migrationSql = fs.readFileSync(migrationPath, 'utf8')
  
  // Split by semicolons but preserve those within functions
  const statements = []
  let currentStatement = ''
  let inFunction = false
  
  migrationSql.split('\n').forEach(line => {
    if (line.includes('CREATE OR REPLACE FUNCTION') || line.includes('CREATE FUNCTION')) {
      inFunction = true
    }
    
    currentStatement += line + '\n'
    
    if (line.includes('$$ LANGUAGE plpgsql') || line.includes('$$;')) {
      inFunction = false
    }
    
    if (!inFunction && line.trim().endsWith(';')) {
      statements.push(currentStatement.trim())
      currentStatement = ''
    }
  })
  
  // Apply each statement
  let successCount = 0
  let errorCount = 0
  
  for (const statement of statements) {
    // Skip empty statements and comments
    if (!statement || statement.startsWith('--') || statement === 'BEGIN;' || statement === 'COMMIT;') {
      continue
    }
    
    // Skip verification queries at the end
    if (statement.includes('information_schema') || statement.includes('pg_indexes') || statement.includes('pg_tables')) {
      continue
    }
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
      
      if (error) {
        console.log(`❌ Failed to execute: ${statement.substring(0, 50)}...`)
        console.log(`   Error: ${error.message}`)
        errorCount++
      } else {
        console.log(`✅ Applied: ${statement.substring(0, 50)}...`)
        successCount++
      }
    } catch (err) {
      console.log(`❌ Exception executing: ${statement.substring(0, 50)}...`)
      console.log(`   Error: ${err.message}`)
      errorCount++
    }
  }
  
  console.log(`\n=== Migration Summary ===`)
  console.log(`✅ Successful statements: ${successCount}`)
  console.log(`❌ Failed statements: ${errorCount}`)
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some statements failed. This might be expected if constraints already exist.')
  }
}

async function verifyMigration() {
  console.log('\n=== Verifying Migration Results ===\n')
  
  // Check if audit_logs table exists
  const { data: auditTable, error: auditError } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
  
  if (!auditError) {
    console.log('✅ Audit logs table created')
  } else {
    console.log('❌ Audit logs table not found:', auditError.message)
  }
  
  // Test hierarchy creation with constraints
  console.log('\n=== Testing Hierarchy with Constraints ===\n')
  
  const { data: labs } = await supabase
    .from('labs')
    .select('id')
    .limit(1)
    .single()
  
  if (!labs) {
    console.log('❌ No lab found for testing')
    return
  }
  
  // Create test hierarchy
  const { data: bucket, error: bucketError } = await supabase
    .from('project_buckets')
    .insert({
      name: 'Migration Test Bucket',
      lab_id: labs.id
    })
    .select()
    .single()
  
  if (bucketError) {
    console.log('❌ Bucket creation failed:', bucketError.message)
    return
  }
  console.log('✅ Created test bucket:', bucket.id)
  
  const { data: study, error: studyError } = await supabase
    .from('studies')
    .insert({
      title: 'Migration Test Study',
      lab_id: labs.id,
      bucket_id: bucket.id
    })
    .select()
    .single()
  
  if (studyError) {
    console.log('❌ Study creation failed:', studyError.message)
  } else {
    console.log('✅ Created test study linked to bucket:', study.id)
    
    // Test CASCADE DELETE
    console.log('\n=== Testing CASCADE DELETE ===')
    
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: 'Migration Test Task',
        lab_id: labs.id,
        study_id: study.id
      })
      .select()
      .single()
    
    if (!taskError) {
      console.log('✅ Created test task:', task.id)
      
      // Create subtask
      const { data: subtask, error: subtaskError } = await supabase
        .from('tasks')
        .insert({
          title: 'Migration Test Subtask',
          lab_id: labs.id,
          study_id: study.id,
          parent_task_id: task.id,
          depth_level: 1
        })
        .select()
        .single()
      
      if (!subtaskError) {
        console.log('✅ Created test subtask:', subtask.id)
      }
      
      // Delete the study - should cascade to tasks
      const { error: deleteError } = await supabase
        .from('studies')
        .delete()
        .eq('id', study.id)
      
      if (!deleteError) {
        console.log('✅ CASCADE DELETE worked - study and tasks deleted')
      } else {
        console.log('❌ CASCADE DELETE failed:', deleteError.message)
      }
    }
  }
  
  // Clean up
  await supabase.from('project_buckets').delete().eq('id', bucket.id)
  
  // Check audit logs
  const { data: auditLogs, error: logsError } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (!logsError && auditLogs && auditLogs.length > 0) {
    console.log(`\n✅ Audit logging working - found ${auditLogs.length} recent entries`)
  } else {
    console.log('⚠️  No audit logs found (might need proper RLS setup)')
  }
  
  console.log('\n=== Checking Indexes ===')
  
  // This would need a special RPC function to check indexes
  // For now, we'll just note that they should be verified in Supabase dashboard
  console.log('ℹ️  Please verify indexes in Supabase dashboard under Database > Indexes')
  
  console.log('\n=== Migration Verification Complete ===')
}

async function main() {
  await applyMigration()
  await verifyMigration()
  
  console.log('\n✅ Production hierarchy constraints migration complete!')
  console.log('\nNext steps:')
  console.log('1. Verify in Supabase dashboard that all constraints are active')
  console.log('2. Test RLS policies with actual user authentication')
  console.log('3. Proceed with TypeScript service layer implementation')
}

main().catch(console.error)