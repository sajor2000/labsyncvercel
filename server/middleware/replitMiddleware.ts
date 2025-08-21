import { Request, Response, NextFunction, Express } from 'express';
import { logger } from '../utils/logger';
import { getReplitConfig, logReplitStatus } from '../utils/replitConfig';
import { pool } from '../db';

/**
 * Replit-specific middleware for health checks, graceful shutdown, and deployment optimizations
 */

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    uptime: number;
  };
  replit?: {
    replId: string;
    domains: string[];
    isAutoscaled: boolean;
    deployment: 'development' | 'production';
  };
}

/**
 * Health check endpoint for Replit deployments
 */
export function healthCheck(req: Request, res: Response): void {
  const config = getReplitConfig();
  const startTime = Date.now();
  
  // Test database connection
  let databaseStatus: 'up' | 'down' = 'down';
  
  pool.query('SELECT 1', (error) => {
    if (!error) {
      databaseStatus = 'up';
    }
    
    // Memory usage
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.rss + memUsage.heapUsed + memUsage.external;
    
    const healthResponse: HealthCheckResponse = {
      status: databaseStatus === 'up' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: databaseStatus,
        memory: {
          used: Math.round(totalMem / 1024 / 1024), // MB
          total: Math.round(memUsage.rss / 1024 / 1024), // MB
          percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
        },
        uptime: Math.round(process.uptime())
      }
    };
    
    // Add Replit-specific information
    if (config.isReplit) {
      healthResponse.replit = {
        replId: config.replId || 'unknown',
        domains: config.replitDomains,
        isAutoscaled: config.isAutoscaled,
        deployment: config.isProduction ? 'production' : 'development'
      };
    }
    
    const responseTime = Date.now() - startTime;
    
    // Set appropriate status code
    const statusCode = healthResponse.status === 'healthy' ? 200 : 503;
    
    // Log health check for monitoring
    logger.performance('Health check completed', {
      status: healthResponse.status,
      responseTime,
      databaseStatus,
      memoryUsage: healthResponse.services.memory.percentage
    });
    
    res.status(statusCode).json(healthResponse);
  });
}

/**
 * Readiness probe for Replit autoscale deployments
 */
export function readinessCheck(req: Request, res: Response): void {
  const config = getReplitConfig();
  
  // For autoscaled deployments, check if all critical services are ready
  if (config.isAutoscaled) {
    // Check database connection
    pool.query('SELECT 1', (error) => {
      if (error) {
        logger.warn('Readiness check failed - database not ready', { error: error.message });
        return res.status(503).json({
          ready: false,
          reason: 'Database connection failed',
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString(),
        deployment: 'autoscaled'
      });
    });
  } else {
    // For non-autoscaled deployments, simple ready response
    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString(),
      deployment: 'standard'
    });
  }
}

/**
 * Graceful shutdown handler for Replit deployments
 */
export class GracefulShutdownHandler {
  private isShuttingDown = false;
  private server: any;
  private shutdownTimeout: NodeJS.Timeout | null = null;
  
  constructor(server?: any) {
    this.server = server;
    this.setupSignalHandlers();
  }
  
  updateServer(server: any): void {
    this.server = server;
  }
  
  private setupSignalHandlers(): void {
    // Handle SIGTERM (Replit sends this for graceful shutdown)
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, starting graceful shutdown...');
      this.gracefulShutdown('SIGTERM');
    });
    
    // Handle SIGINT (Ctrl+C in development)
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, starting graceful shutdown...');
      this.gracefulShutdown('SIGINT');
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception, shutting down...', { error: error.message, stack: error.stack });
      this.gracefulShutdown('uncaughtException', 1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection, shutting down...', { reason, promise });
      this.gracefulShutdown('unhandledRejection', 1);
    });
  }
  
  private async gracefulShutdown(signal: string, exitCode: number = 0): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress, forcing exit...');
      process.exit(1);
    }
    
    this.isShuttingDown = true;
    const config = getReplitConfig();
    
    logger.info('Starting graceful shutdown', { signal, isReplit: config.isReplit });
    
    // Set a timeout for forceful shutdown (important for Replit autoscale)
    this.shutdownTimeout = setTimeout(() => {
      logger.error('Graceful shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, config.isAutoscaled ? 10000 : 30000); // Shorter timeout for autoscale
    
    try {
      // Stop accepting new connections
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server.close(() => {
            logger.info('HTTP server closed');
            resolve();
          });
        });
      }
      
      // Close database connections
      await pool.end();
      logger.info('Database connections closed');
      
      // Clear the timeout since we're shutting down cleanly
      if (this.shutdownTimeout) {
        clearTimeout(this.shutdownTimeout);
      }
      
      logger.info('Graceful shutdown completed');
      process.exit(exitCode);
      
    } catch (error) {
      logger.error('Error during graceful shutdown', { error: error instanceof Error ? error.message : error });
      process.exit(1);
    }
  }
  
  /**
   * Middleware to reject new requests during shutdown
   */
  public shutdownMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if (this.isShuttingDown) {
      res.status(503).json({
        error: 'Server is shutting down',
        message: 'Please try again in a moment'
      });
      return;
    }
    next();
  };
}

/**
 * Request timeout middleware optimized for Replit
 */
export function replitTimeout(req: Request, res: Response, next: NextFunction): void {
  const config = getReplitConfig();
  
  // Set timeout based on deployment type
  const timeout = config.isAutoscaled ? 25000 : 30000; // Shorter for autoscale
  
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      logger.warn('Request timeout', {
        method: req.method,
        path: req.path,
        timeout,
        isAutoscaled: config.isAutoscaled
      });
      
      res.status(408).json({
        error: 'Request Timeout',
        message: 'The request took too long to process'
      });
    }
  }, timeout);
  
  // Clear timeout when response finishes
  res.on('finish', () => clearTimeout(timer));
  res.on('close', () => clearTimeout(timer));
  
  next();
}

/**
 * Setup all Replit-specific middleware
 */
export function setupReplitMiddleware(app: Express): GracefulShutdownHandler {
  const config = getReplitConfig();
  
  // Log Replit status on startup
  logReplitStatus();
  
  // Add health check endpoints
  app.get('/health', healthCheck);
  app.get('/health/ready', readinessCheck);
  
  // Add request timeout middleware (only for Replit deployments)
  if (config.isReplit) {
    app.use(replitTimeout);
  }
  
  // Create graceful shutdown handler (server will be set later)
  const shutdownHandler = new GracefulShutdownHandler();
  
  // Add shutdown middleware
  app.use(shutdownHandler.shutdownMiddleware);
  
  logger.info('Replit middleware configured', {
    hasHealthCheck: true,
    hasGracefulShutdown: true,
    hasTimeout: config.isReplit,
    isAutoscaled: config.isAutoscaled
  });
  
  return shutdownHandler;
}

/**
 * Metrics endpoint for Replit monitoring
 */
export function metricsEndpoint(req: Request, res: Response): void {
  const config = getReplitConfig();
  const memUsage = process.memoryUsage();
  
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      heapUtilization: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    },
    process: {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    ...(config.isReplit && {
      replit: {
        replId: config.replId,
        isAutoscaled: config.isAutoscaled,
        domains: config.replitDomains.length,
        deployment: config.isProduction ? 'production' : 'development'
      }
    })
  };
  
  res.json(metrics);
}