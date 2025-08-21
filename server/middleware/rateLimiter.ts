import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// In-memory rate limiter implementation
interface RateRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateRecord>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const createRateLimit = (options: {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting for localhost in development
    if (process.env.NODE_ENV === 'development' && 
        (req.ip === '127.0.0.1' || req.ip === '::1')) {
      return next();
    }

    const key = `${req.ip}:${req.path}:${options.max}:${options.windowMs}`;
    const now = Date.now();
    
    const record = rateLimitStore.get(key);
    
    if (!record || record.resetTime < now) {
      // No record or expired - create new
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      });
      return next();
    }
    
    if (record.count >= options.max) {
      // Rate limit exceeded
      logger.security('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        userId: req.user?.id
      });
      
      return res.status(429).json({
        error: options.message,
        statusCode: 429
      });
    }
    
    // Increment counter
    record.count++;
    
    // Add rate limit headers
    res.set({
      'RateLimit-Limit': options.max.toString(),
      'RateLimit-Remaining': (options.max - record.count).toString(),
      'RateLimit-Reset': new Date(record.resetTime).toISOString()
    });
    
    return next();
  };
};

// General API rate limit - 1000 requests per 15 minutes per IP
export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Strict rate limit for authentication endpoints
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

// Create/Write operations rate limit
export const writeRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // Limit each IP to 50 write operations per minute
  message: 'Too many write operations, please slow down.'
});

// Search/Query operations rate limit  
export const queryRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // Limit each IP to 200 queries per minute
  message: 'Too many search requests, please slow down.'
});

// File upload rate limit
export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 uploads per minute
  message: 'Too many file uploads, please wait before uploading more files.'
});

// Password reset rate limit - 3 attempts per hour per IP
export const passwordResetRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: 'Too many password reset attempts. Please try again in an hour.'
});