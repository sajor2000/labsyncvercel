#!/usr/bin/env node

/**
 * Script to generate TypeScript types from Supabase database
 * This ensures our types match the actual database schema
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function generateTypes() {
  try {
    console.log('Fetching database schema...')
    
    // Use Supabase's REST API directly to get schema information
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    })
    
    if (!response.ok) {
      console.error('Failed to fetch schema')
      return
    }

    const apiSpec = await response.json()
    
    // Extract table names from the OpenAPI spec
    const paths = apiSpec.paths || {}
    const tableNames = Object.keys(paths)
      .filter(path => path.startsWith('/') && !path.includes('{'))
      .map(path => path.substring(1))
      .filter((v, i, a) => a.indexOf(v) === i)
    
    console.log(`Found ${tableNames.length} tables`)
    
    // For each table, get its schema from definitions
    const tableSchemas = {}
    const definitions = apiSpec.definitions || {}
    
    for (const tableName of tableNames) {
      const tableDefinition = definitions[tableName]
      if (tableDefinition && tableDefinition.properties) {
        const columns = Object.entries(tableDefinition.properties).map(([name, def]) => ({
          column_name: name,
          data_type: def.format || def.type || 'text',
          is_nullable: !tableDefinition.required?.includes(name) ? 'YES' : 'NO',
          column_default: null
        }))
        tableSchemas[tableName] = columns
        console.log(`- ${tableName}: ${columns.length} columns`)
      }
    }

    // Generate TypeScript types
    let output = `// Auto-generated TypeScript types for Supabase database
// Generated on: ${new Date().toISOString()}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
`

    for (const [tableName, columns] of Object.entries(tableSchemas)) {
      output += `      ${tableName}: {
        Row: {
`
      for (const col of columns) {
        const tsType = mapPostgresToTypeScript(col.data_type)
        const nullable = col.is_nullable === 'YES' ? ' | null' : ''
        output += `          ${col.column_name}: ${tsType}${nullable}
`
      }
      output += `        }
        Insert: {
`
      for (const col of columns) {
        const tsType = mapPostgresToTypeScript(col.data_type)
        const nullable = col.is_nullable === 'YES' || col.column_default ? ' | null' : ''
        // Make id, created_at, updated_at optional for inserts (they have defaults)
        const optional = col.column_default || col.column_name === 'id' || col.column_name === 'created_at' || col.column_name === 'updated_at' ? '?' : ''
        output += `          ${col.column_name}${optional}: ${tsType}${nullable}
`
      }
      output += `        }
        Update: {
`
      for (const col of columns) {
        const tsType = mapPostgresToTypeScript(col.data_type)
        const nullable = col.is_nullable === 'YES' ? ' | null' : ''
        output += `          ${col.column_name}?: ${tsType}${nullable}
`
      }
      output += `        }
        Relationships: []
      }
`
    }

    output += `    }
    Views: {}
    Functions: {}
    Enums: {
      user_role: 'ADMIN' | 'COLLABORATOR' | 'VIEWER' | 'LAB_ADMIN' | 'LAB_MEMBER' | 'GUEST'
      study_status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED'
      task_status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED' | 'CANCELLED'
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
      event_type: 'MEETING' | 'DEADLINE' | 'TRAINING' | 'CONFERENCE' | 'HOLIDAY' | 'PTO' | 'CLINICAL_SERVICE' | 'OTHER'
    }
    CompositeTypes: {}
  }
}`

    // Write to file
    const outputPath = path.join(__dirname, '..', 'lib', 'supabase', 'database.generated.types.ts')
    fs.writeFileSync(outputPath, output)
    
    console.log(`\n✅ Types generated successfully: ${outputPath}`)
    console.log(`   Total tables: ${Object.keys(tableSchemas).length}`)
    
  } catch (error) {
    console.error('Error generating types:', error)
  }
}

function mapPostgresToTypeScript(pgType) {
  const typeMap = {
    'uuid': 'string',
    'text': 'string',
    'character varying': 'string',
    'varchar': 'string',
    'char': 'string',
    'integer': 'number',
    'bigint': 'number',
    'smallint': 'number',
    'decimal': 'number',
    'numeric': 'number',
    'real': 'number',
    'double precision': 'number',
    'boolean': 'boolean',
    'date': 'string',
    'timestamp': 'string',
    'timestamp with time zone': 'string',
    'timestamp without time zone': 'string',
    'timestamptz': 'string',
    'time': 'string',
    'time with time zone': 'string',
    'time without time zone': 'string',
    'interval': 'string',
    'json': 'Json',
    'jsonb': 'Json',
    'array': 'any[]',
    'ARRAY': 'string[]',
    'USER-DEFINED': 'string'
  }
  
  return typeMap[pgType] || 'any'
}

// Run the script
generateTypes()