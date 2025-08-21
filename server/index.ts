import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { automationScheduler } from "./automationScheduler";
import { emailReminderService } from "./emailReminders";
import { validateEnvironment } from "./utils/envValidation";
import { securityHeaders, corsProtection, generateCSRFToken } from "./middleware/security";
import { compressionMiddleware } from "./middleware/compression";
import { auditMiddleware } from "./middleware/auditLogger";
import { initializeDbOptimizations } from "./utils/dbOptimization";
import { logger } from "./utils/logger";
import { setupReplitMiddleware } from "./middleware/replitMiddleware";
import { getReplitServerConfig } from "./utils/replitConfig";

// Validate environment before starting
validateEnvironment();

// Initialize database optimizations
initializeDbOptimizations().catch(error => {
  logger.error('Failed to initialize database optimizations', { error: error.message });
});

const app = express();

// Setup Replit middleware (health checks, graceful shutdown)
const shutdownHandler = setupReplitMiddleware(app);

// Security middleware (must be first)
app.use(securityHeaders);
app.use(corsProtection);
app.use(generateCSRFToken);

// Audit logging for compliance
app.use(auditMiddleware);

// Compression for better performance
app.use(compressionMiddleware);

// Body parsing with limits for security
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Use structured logging instead of simple log
      logger.performance('API Request', {
        method: req.method,
        path,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      });
      
      // Keep original log for development
      if (process.env.NODE_ENV === 'development') {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }
        log(logLine);
      }
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Get Replit-optimized server configuration
  const serverConfig = getReplitServerConfig();
  
  // Update the shutdown handler with the server instance
  if (shutdownHandler && typeof shutdownHandler.updateServer === 'function') {
    shutdownHandler.updateServer(server);
  }
  
  // Configure server with Replit optimizations
  if (serverConfig.keepAliveTimeout) {
    server.keepAliveTimeout = serverConfig.keepAliveTimeout;
  }
  if (serverConfig.headersTimeout) {
    server.headersTimeout = serverConfig.headersTimeout;
  }
  if (serverConfig.requestTimeout) {
    server.requestTimeout = serverConfig.requestTimeout;
  }
  
  server.listen({
    port: serverConfig.port,
    host: serverConfig.host,
    reusePort: false, // Disable reusePort for macOS compatibility
  }, () => {
    log(`serving on port ${serverConfig.port}`);
    
    // Start the automation scheduler for Phase 5 automation features
    automationScheduler.start();
    log('🤖 Automation scheduler started - Phase 5 automation features are now active');
    
    // Schedule daily email reminder checks (run every 2 hours)
    setInterval(async () => {
      try {
        await emailReminderService.sendTaskReminders();
      } catch (error) {
        console.error('❌ Error in scheduled email reminders:', error);
      }
    }, 2 * 60 * 60 * 1000); // Every 2 hours
    
    log('📧 Email reminder service initialized - checking every 2 hours');
  });
})();
