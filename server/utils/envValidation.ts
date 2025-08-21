import { logger } from './logger';
import { validateReplitEnvironment, getReplitConfig } from './replitConfig';

/**
 * Environment variable validation and configuration
 */
interface EnvConfig {
  // Database
  DATABASE_URL: string;
  
  // Authentication
  SESSION_SECRET: string;
  REPLIT_CLIENT_ID?: string;
  REPLIT_CLIENT_SECRET?: string;
  
  // Email Services
  RESEND_API_KEY?: string;
  RESEND_API_KEY2?: string;
  FROM_EMAIL?: string;
  
  // AI Services
  OPENAI_API_KEY?: string;
  
  // File Storage
  GOOGLE_CLOUD_STORAGE_BUCKET?: string;
  GOOGLE_APPLICATION_CREDENTIALS?: string;
  
  // External APIs
  GOOGLE_CALENDAR_CLIENT_ID?: string;
  GOOGLE_CALENDAR_CLIENT_SECRET?: string;
  
  // Security
  FRONTEND_URL?: string;
  REPLIT_URL?: string;
  
  // Environment
  NODE_ENV: string;
  PORT?: string;
}

/**
 * Validate and get environment configuration
 */
export function validateEnvironment(): EnvConfig {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config = getReplitConfig();
  
  // Run Replit-specific validation first
  try {
    validateReplitEnvironment();
  } catch (error) {
    if (error instanceof Error) {
      errors.push(error.message);
    }
  }
  
  // Required variables
  const requiredVars = [
    'DATABASE_URL',
    'SESSION_SECRET'
  ];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }
  
  // Optional but recommended variables
  const recommendedVars = [
    'RESEND_API_KEY',
    'OPENAI_API_KEY',
    'FRONTEND_URL'
  ];
  
  for (const varName of recommendedVars) {
    if (!process.env[varName]) {
      warnings.push(`Missing recommended environment variable: ${varName}`);
    }
  }
  
  // Validation rules
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    errors.push('SESSION_SECRET must be at least 32 characters long');
  }
  
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgres')) {
    errors.push('DATABASE_URL must be a PostgreSQL connection string');
  }
  
  if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    warnings.push('NODE_ENV should be one of: development, production, test');
  }
  
  // Replit-specific validations (additional to replitConfig validation)
  if (config.isReplit) {
    // Validate Replit-specific optimizations
    if (config.isAutoscaled && !process.env.REPLIT_DB_URL && config.isProduction) {
      warnings.push('Consider using Replit Database for better autoscale performance');
    }
    
    // Check for proper proxy configuration
    if (config.isProduction && !config.replitDomains.length) {
      warnings.push('No REPLIT_DOMAINS configured - application may not be accessible');
    }
  } else {
    // Non-Replit environment checks
    if (config.isProduction) {
      warnings.push('Running in production mode outside Replit - ensure proper proxy configuration');
    }
  }
  
  // Log results
  if (errors.length > 0) {
    logger.error('Environment validation failed', { errors });
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
  
  if (warnings.length > 0) {
    logger.warn('Environment validation warnings', { warnings });
  }
  
  logger.info('Environment validation successful', {
    nodeEnv: process.env.NODE_ENV,
    isReplit: config.isReplit,
    isAutoscaled: config.isAutoscaled,
    replitDomains: config.replitDomains.length,
    hasDatabase: !!process.env.DATABASE_URL,
    hasEmail: !!process.env.RESEND_API_KEY,
    hasOpenAI: !!process.env.OPENAI_API_KEY
  });
  
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    SESSION_SECRET: process.env.SESSION_SECRET!,
    REPLIT_CLIENT_ID: process.env.REPLIT_CLIENT_ID,
    REPLIT_CLIENT_SECRET: process.env.REPLIT_CLIENT_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_API_KEY2: process.env.RESEND_API_KEY2,
    FROM_EMAIL: process.env.FROM_EMAIL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_CLOUD_STORAGE_BUCKET: process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    GOOGLE_CALENDAR_CLIENT_ID: process.env.GOOGLE_CALENDAR_CLIENT_ID,
    GOOGLE_CALENDAR_CLIENT_SECRET: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    FRONTEND_URL: process.env.FRONTEND_URL,
    REPLIT_URL: process.env.REPLIT_URL,
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT
  };
}

/**
 * Get validated environment config (singleton)
 */
let envConfig: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (!envConfig) {
    envConfig = validateEnvironment();
  }
  return envConfig;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvConfig().NODE_ENV === 'production';
}

/**
 * Check if running in development  
 */
export function isDevelopment(): boolean {
  return getEnvConfig().NODE_ENV === 'development';
}

/**
 * Check if feature is enabled based on environment
 */
export function isFeatureEnabled(feature: keyof EnvConfig): boolean {
  const config = getEnvConfig();
  return !!config[feature];
}