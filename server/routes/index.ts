import { Express } from 'express';
import { labRoutes } from './labs';
import { studyRoutes } from './studies';
import { taskRoutes } from './tasks';
import { authRoutes } from './auth';
import { deadlineRoutes } from './deadlines';
import { labMemberRoutes } from './labMembers';
import { apiRateLimit, authRateLimit, writeRateLimit } from '../middleware/rateLimiter';

/**
 * Configure all API routes
 * This replaces the monolithic routes.ts file with modular route configuration
 */
export function configureRoutes(app: Express): void {
  // Apply general API rate limiting to all /api routes
  app.use('/api', apiRateLimit);
  
  // Authentication routes with strict rate limiting
  app.use('/api/auth', authRateLimit, authRoutes);

  // Main entity routes with write rate limiting for POST/PUT/DELETE
  app.use('/api/labs', writeRateLimit, labRoutes);
  app.use('/api/studies', writeRateLimit, studyRoutes);
  app.use('/api/tasks', writeRateLimit, taskRoutes);
  app.use('/api/deadlines', writeRateLimit, deadlineRoutes);
  app.use('/api/lab-members', writeRateLimit, labMemberRoutes);

  // Import and configure existing specialized routes
  app.use('/api/domains', require('./domains').domainRoutes);
  app.use('/api/email-reminders', require('./email-reminders').emailReminderRoutes);
  app.use('/api/calendar', require('./google-calendar').default);
  app.use('/api/milestones', require('./study-milestones').studyMilestoneRoutes);
  app.use('/api/user', require('./user-profile').userProfileRoutes);
  app.use('/api/fix', require('./quick-fixes').quickFixRoutes);
  app.use('/api/email-test', require('./email-test').emailTestRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // API documentation endpoint
  app.get('/api', (req, res) => {
    res.json({
      name: 'LabSync API',
      version: process.env.npm_package_version || '1.0.0',
      description: 'Medical research lab management system API',
      endpoints: {
        auth: '/api/auth',
        labs: '/api/labs',
        studies: '/api/studies', 
        tasks: '/api/tasks',
        domains: '/api/domains',
        emailReminders: '/api/email-reminders',
        calendar: '/api/calendar',
        deadlines: '/api/deadlines',
        labMembers: '/api/lab-members',
        milestones: '/api/milestones',
        userProfile: '/api/user',
        quickFixes: '/api/fix',
        emailTest: '/api/email-test',
        health: '/api/health'
      },
      timestamp: new Date().toISOString()
    });
  });
}