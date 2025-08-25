// Simple configuration validation script
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'GOOGLE_CALENDAR_API_KEY',
  'GOOGLE_CLIENT_ID', 
  'GOOGLE_CLIENT_SECRET',
  'RESEND_API_KEY2',
  'FROM_EMAIL'
]

const optionalEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_CALENDAR_ID',
  'GOOGLE_CALENDAR_TIMEZONE',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN'
]

console.log('🔍 Validating Lab Sync configuration...\n')

// Skip validation on Vercel during build
if (process.env.VERCEL) {
  console.log('🏗️  Running on Vercel - skipping environment validation during build')
  console.log('✅ Configuration will be validated at runtime')
  process.exit(0)
}

// Load environment variables
require('dotenv').config()

let hasErrors = false

// Check required variables
console.log('📋 Required Environment Variables:')
requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`)
  } else {
    console.log(`❌ ${varName}: MISSING`)
    hasErrors = true
  }
})

console.log('\n📋 Optional Environment Variables:')
optionalEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`⚠️  ${varName}: NOT SET`)
  }
})

// Validate specific formats
console.log('\n🔐 API Key Format Validation:')

if (process.env.OPENAI_API_KEY) {
  if (process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.log('✅ OpenAI API key format is valid')
  } else {
    console.log('❌ OpenAI API key should start with "sk-"')
    hasErrors = true
  }
}

if (process.env.RESEND_API_KEY2) {
  if (process.env.RESEND_API_KEY2.startsWith('re_')) {
    console.log('✅ Resend API key format is valid')
  } else {
    console.log('❌ Resend API key should start with "re_"')
    hasErrors = true
  }
}

if (process.env.GOOGLE_CLIENT_ID) {
  if (process.env.GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')) {
    console.log('✅ Google Client ID format is valid')
  } else {
    console.log('❌ Google Client ID should end with ".apps.googleusercontent.com"')
    hasErrors = true
  }
}

console.log('\n' + '='.repeat(50))

if (hasErrors) {
  console.log('❌ Configuration validation FAILED')
  console.log('Please check your .env file and add missing variables')
  process.exit(1)
} else {
  console.log('✅ Configuration validation PASSED')
  console.log('All required environment variables are properly configured!')
}