/**
 * Production-grade logging utility
 * Replaces console.log with structured logging
 */

export interface LogContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
  action?: string;
  resource?: string;
  [key: string]: any;
}

export class Logger {
  private static instance: Logger;
  private isProduction = process.env.NODE_ENV === 'production';

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: string, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    
    if (this.isProduction) {
      // In production, use structured JSON logging
      const logEntry = {
        timestamp,
        level,
        message,
        ...context
      };
      
      // Write to stdout/stderr for container logging systems
      if (level === 'ERROR') {
        console.error(JSON.stringify(logEntry));
      } else {
        console.log(JSON.stringify(logEntry));
      }
    } else {
      // In development, use readable format
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';
      console.log(`[${timestamp}] ${level}: ${message}${contextStr}`);
    }
  }

  info(message: string, context?: LogContext) {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('WARN', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('ERROR', message, context);
  }

  debug(message: string, context?: LogContext) {
    if (!this.isProduction) {
      this.log('DEBUG', message, context);
    }
  }

  // Security-specific logging
  security(message: string, context?: LogContext) {
    this.log('SECURITY', message, { ...context, security: true });
  }

  // Audit logging for compliance
  audit(message: string, context?: LogContext) {
    this.log('AUDIT', message, { ...context, audit: true });
  }

  // Performance logging
  performance(message: string, context?: LogContext) {
    this.log('PERF', message, context);
  }
}

export const logger = Logger.getInstance();