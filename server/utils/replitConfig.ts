import { logger } from './logger';

/**
 * Replit deployment configuration and utilities
 */

export interface ReplitConfig {
  isReplit: boolean;
  replId?: string;
  replitDomains: string[];
  isAutoscaled: boolean;
  deploymentUrl?: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Detect if running on Replit
 */
export function isReplit(): boolean {
  return !!(process.env.REPL_ID || process.env.REPLIT_DOMAINS);
}

/**
 * Get Replit-specific configuration
 */
export function getReplitConfig(): ReplitConfig {
  const isReplitEnv = isReplit();
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  return {
    isReplit: isReplitEnv,
    replId: process.env.REPL_ID,
    replitDomains: process.env.REPLIT_DOMAINS?.split(',').map(d => d.trim()) || [],
    isAutoscaled: process.env.REPLIT_DEPLOYMENT === 'autoscale',
    deploymentUrl: process.env.REPLIT_URL,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production'
  };
}

/**
 * Validate Replit-specific environment variables
 */
export function validateReplitEnvironment(): void {
  const config = getReplitConfig();
  
  if (config.isReplit) {
    logger.info('Detected Replit environment', {
      replId: config.replId,
      domains: config.replitDomains.length,
      isAutoscaled: config.isAutoscaled,
      nodeEnv: process.env.NODE_ENV
    });
    
    // Validate required Replit environment variables
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!config.replId) {
      errors.push('REPL_ID is required in Replit environment');
    }
    
    if (!process.env.REPLIT_DOMAINS) {
      warnings.push('REPLIT_DOMAINS not set - CORS may not work properly');
    }
    
    if (config.isProduction && !process.env.DATABASE_URL) {
      errors.push('DATABASE_URL is required in production Replit deployment');
    }
    
    if (config.isAutoscaled && !process.env.SESSION_SECRET) {
      errors.push('SESSION_SECRET is required for autoscaled Replit deployment');
    }
    
    // Check for Replit-specific optimizations
    if (!process.env.REPLIT_DB_URL && config.isProduction) {
      warnings.push('Consider using Replit Database for better performance');
    }
    
    if (errors.length > 0) {
      logger.error('Replit environment validation failed', { errors });
      throw new Error(`Replit validation failed:\n${errors.join('\n')}`);
    }
    
    if (warnings.length > 0) {
      logger.warn('Replit environment warnings', { warnings });
    }
    
    logger.info('Replit environment validation successful');
  } else {
    logger.info('Running outside Replit environment');
  }
}

/**
 * Get optimal database configuration for Replit
 */
export function getReplitDatabaseConfig() {
  const config = getReplitConfig();
  
  if (config.isReplit) {
    return {
      // Optimized for Replit's infrastructure
      max: config.isAutoscaled ? 5 : 10, // Fewer connections for autoscale
      min: config.isAutoscaled ? 1 : 2,
      idleTimeoutMillis: 15000, // Shorter timeout for serverless
      connectionTimeoutMillis: 5000, // Quick failover
      acquireTimeoutMillis: 10000,
      createTimeoutMillis: 5000,
      destroyTimeoutMillis: 2000,
      reapIntervalMillis: 10000, // More frequent cleanup
      createRetryIntervalMillis: 200,
      propagateCreateError: false, // Don't crash on connection errors
      
      // Replit-specific optimizations
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      
      // SSL configuration for Neon
      ssl: config.isProduction ? { rejectUnauthorized: false } : false
    };
  }
  
  // Default configuration for non-Replit environments
  return {
    max: 20,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  };
}

/**
 * Get CORS origins for Replit
 */
export function getReplitCorsOrigins(): string[] {
  const config = getReplitConfig();
  
  const origins: string[] = [
    'http://localhost:3000',
    'http://localhost:5000', 
    'http://localhost:5173', // Vite dev server
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:5173'
  ];
  
  if (config.isReplit) {
    // Add Replit-specific origins
    config.replitDomains.forEach(domain => {
      origins.push(`https://${domain}`);
      origins.push(`http://${domain}`);
    });
    
    // Add deployment URL if available
    if (config.deploymentUrl) {
      origins.push(config.deploymentUrl);
    }
    
    // Add replit.com subdomains
    origins.push('https://*.replit.com');
    origins.push('https://*.replit.dev');
    origins.push('https://*.replit.co');
  }
  
  return origins.filter(Boolean);
}

/**
 * Get trusted proxy configuration for Replit
 */
export function getReplitTrustedProxies(): string[] | boolean {
  const config = getReplitConfig();
  
  if (config.isReplit) {
    // Trust Replit's proxy infrastructure
    return [
      'loopback', // 127.0.0.1/8, ::1/128
      'linklocal', // 169.254.0.0/16, fe80::/10
      '10.0.0.0/8', // Private networks
      '172.16.0.0/12',
      '192.168.0.0/16',
      // Replit-specific proxy ranges (these may change)
      '34.74.0.0/16',
      '35.232.0.0/16'
    ];
  }
  
  return false;
}

/**
 * Get session configuration for Replit
 */
export function getReplitSessionConfig() {
  const config = getReplitConfig();
  
  return {
    name: 'labsync.sid',
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    
    cookie: {
      httpOnly: true,
      secure: config.isProduction, // HTTPS in production
      sameSite: config.isProduction ? 'none' as const : 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      
      // Replit-specific cookie settings
      ...(config.isReplit && {
        domain: config.isProduction ? undefined : 'localhost', // Let Replit handle domain
        path: '/',
      })
    },
    
    // Session store configuration
    rolling: false, // Don't reset expiry on each request
    unset: 'destroy' // Destroy session when unset
  };
}

/**
 * Get server listening configuration for Replit
 */
export function getReplitServerConfig() {
  const config = getReplitConfig();
  const port = parseInt(process.env.PORT || '5000', 10);
  
  return {
    port,
    host: config.isDevelopment ? '127.0.0.1' : '0.0.0.0', // Bind to all interfaces in production
    
    // Replit-specific server options
    ...(config.isReplit && {
      keepAliveTimeout: 65000, // Higher than load balancer timeout
      headersTimeout: 70000, // Higher than keepAliveTimeout
      requestTimeout: 30000, // 30 second request timeout
      
      // Enable keep-alive for better performance
      keepAlive: true,
      keepAliveInitialDelay: 1000
    })
  };
}

/**
 * Log Replit configuration on startup
 */
export function logReplitStatus(): void {
  const config = getReplitConfig();
  
  if (config.isReplit) {
    logger.info('🚀 Replit deployment configuration', {
      environment: config.isProduction ? 'production' : 'development',
      autoscaled: config.isAutoscaled,
      domains: config.replitDomains.length,
      replId: config.replId,
      hasDatabase: !!process.env.DATABASE_URL,
      hasSecrets: {
        sessionSecret: !!process.env.SESSION_SECRET,
        resendApi: !!process.env.RESEND_API_KEY,
        openaiApi: !!process.env.OPENAI_API_KEY
      }
    });
  } else {
    logger.info('🏠 Local development configuration');
  }
}