/**
 * Centralized API key and configuration management
 * Implements best practices for environment variable handling
 */

interface ApiConfig {
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey: string
  }
  openai: {
    apiKey: string
    organization?: string
    maxRetries: number
    timeoutMs: number
  }
  google: {
    apiKey?: string
    serviceAccountPath?: string
    calendarId: string
    timezone: string
  }
  resend: {
    apiKey: string
    fromEmail: string
    replyToEmail?: string
  }
  redis?: {
    url: string
    token?: string
  }
  sentry?: {
    dsn: string
    environment: string
  }
}

class ConfigError extends Error {
  constructor(key: string, message?: string) {
    super(`Missing or invalid configuration for ${key}: ${message || 'Required environment variable not found'}`)
    this.name = 'ConfigError'
  }
}

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback
  if (!value) {
    throw new ConfigError(key)
  }
  return value
}

function optionalEnv(key: string, fallback?: string): string | undefined {
  return process.env[key] || fallback
}

// Validate environment and throw early if required configs are missing
export const apiConfig: ApiConfig = {
  supabase: {
    url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  },
  openai: {
    apiKey: requireEnv('OPENAI_API_KEY'),
    organization: optionalEnv('OPENAI_ORG_ID'),
    maxRetries: parseInt(optionalEnv('OPENAI_MAX_RETRIES', '3')),
    timeoutMs: parseInt(optionalEnv('OPENAI_TIMEOUT_MS', '120000')) // 2 minutes
  },
  google: {
    apiKey: optionalEnv('GOOGLE_CALENDAR_API_KEY'),
    clientId: optionalEnv('GOOGLE_CLIENT_ID'),
    clientSecret: optionalEnv('GOOGLE_CLIENT_SECRET'),
    serviceAccountPath: optionalEnv('GOOGLE_SERVICE_ACCOUNT_PATH'),
    calendarId: requireEnv('GOOGLE_CALENDAR_ID', 'riccclabs@gmail.com'),
    timezone: requireEnv('GOOGLE_CALENDAR_TIMEZONE', 'America/Chicago')
  },
  resend: {
    apiKey: requireEnv('RESEND_API_KEY2'),
    fromEmail: requireEnv('FROM_EMAIL', 'noreply@labflow.dev'),
    replyToEmail: optionalEnv('RESEND_REPLY_TO_EMAIL')
  },
  redis: optionalEnv('UPSTASH_REDIS_REST_URL') ? {
    url: requireEnv('UPSTASH_REDIS_REST_URL'),
    token: optionalEnv('UPSTASH_REDIS_REST_TOKEN')
  } : undefined,
  sentry: optionalEnv('NEXT_PUBLIC_SENTRY_DSN') ? {
    dsn: requireEnv('NEXT_PUBLIC_SENTRY_DSN'),
    environment: requireEnv('NEXT_PUBLIC_SENTRY_ENVIRONMENT', 'production')
  } : undefined
}

// Validate critical configurations on startup
export function validateConfig(): void {
  try {
    // Validate Supabase URLs
    new URL(apiConfig.supabase.url)
    
    // Validate OpenAI configuration
    if (!apiConfig.openai.apiKey.startsWith('sk-')) {
      throw new ConfigError('OPENAI_API_KEY', 'Must start with sk-')
    }
    
    // Validate Google Calendar setup (either API key or OAuth credentials)
    if (!apiConfig.google.apiKey && (!apiConfig.google.clientId || !apiConfig.google.clientSecret)) {
      throw new ConfigError('GOOGLE_CALENDAR', 'Either GOOGLE_CALENDAR_API_KEY or both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be provided')
    }
    
    // Validate Resend API key
    if (!apiConfig.resend.apiKey.startsWith('re_')) {
      throw new ConfigError('RESEND_API_KEY', 'Must start with re_')
    }
    
    console.log('✅ API configuration validated successfully')
    
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error('❌ Configuration Error:', error.message)
      throw error
    }
    console.error('❌ Unknown configuration error:', error)
    throw new ConfigError('UNKNOWN', error instanceof Error ? error.message : 'Unknown error')
  }
}

// Export individual configs for easier imports
export const supabaseConfig = apiConfig.supabase
export const openaiConfig = apiConfig.openai
export const googleConfig = apiConfig.google
export const resendConfig = apiConfig.resend
export const redisConfig = apiConfig.redis
export const sentryConfig = apiConfig.sentry

// Utility to get config safely
export function getConfig(): ApiConfig {
  return apiConfig
}

// Environment helpers
export const isDev = process.env.NODE_ENV === 'development'
export const isProd = process.env.NODE_ENV === 'production'
export const isVercel = Boolean(process.env.VERCEL)