import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { workflowService } from "./workflowService";
import multer from 'multer';
import googleCalendarRoutes from './routes/google-calendar';

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware (disabled for development)
  // await setupAuth(app);

  // Configure multer for audio uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB limit
    },
  });

  // Auth routes - simplified for development
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Return mock user data directly for development
      const mockUser = {
        id: 'dev-user-1',
        email: 'dev@labsync.local',
        name: 'Development User',
        firstName: 'Development',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date().toISOString(),
        claims: { sub: 'dev-user-1' }
      };
      res.json(mockUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Lab routes
  app.get('/api/labs', async (req: any, res) => {
    try {
      const labs = await storage.getLabs();
      res.json(labs);
    } catch (error) {
      console.error("Error fetching labs:", error);
      res.status(500).json({ message: "Failed to fetch labs" });
    }
  });

  // Production Workflow Routes
  
  // Process complete workflow: audio -> transcript -> AI analysis -> email generation -> delivery
  app.post('/api/workflow/complete', isAuthenticated, upload.single('audio'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { recipients, labName, labId, meetingType = 'DAILY_STANDUP', attendees = [] } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: 'Recipients array is required' });
      }

      if (!labName) {
        return res.status(400).json({ error: 'Lab name is required' });
      }

      console.log(`🚀 Starting complete workflow for user ${userId}, lab: ${labName}`);

      const result = await workflowService.processCompleteWorkflow(
        req.file,
        recipients,
        userId,
        labName,
        labId,
        meetingType,
        Array.isArray(attendees) ? attendees : JSON.parse(attendees || '[]')
      );

      res.json({
        success: true,
        workflowId: result.workflowId,
        meetingId: result.aiAnalysisResult.outputData?.meetingId,
        steps: {
          transcription: {
            success: result.transcriptionResult.success,
            processingTime: result.transcriptionResult.processingTimeMs,
            error: result.transcriptionResult.errorMessage,
          },
          aiAnalysis: {
            success: result.aiAnalysisResult.success,
            processingTime: result.aiAnalysisResult.processingTimeMs,
            error: result.aiAnalysisResult.errorMessage,
          },
          emailGeneration: {
            success: result.emailGenerationResult.success,
            processingTime: result.emailGenerationResult.processingTimeMs,
            error: result.emailGenerationResult.errorMessage,
          },
          emailDelivery: {
            success: result.emailDeliveryResult.success,
            processingTime: result.emailDeliveryResult.processingTimeMs,
            error: result.emailDeliveryResult.errorMessage,
          },
        },
      });

    } catch (error) {
      console.error('Complete workflow error:', error);
      res.status(500).json({ 
        error: 'Workflow processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get workflow steps for a specific workflow
  app.get('/api/workflow/:workflowId/steps', isAuthenticated, async (req: any, res) => {
    try {
      const { workflowId } = req.params;
      const steps = await workflowService.getWorkflowSteps(workflowId);
      res.json(steps);
    } catch (error) {
      console.error('Error fetching workflow steps:', error);
      res.status(500).json({ error: 'Failed to fetch workflow steps' });
    }
  });

  // Get specific workflow step
  app.get('/api/workflow/step/:stepId', isAuthenticated, async (req: any, res) => {
    try {
      const { stepId } = req.params;
      const step = await workflowService.getWorkflowStep(stepId);
      if (!step) {
        return res.status(404).json({ error: 'Workflow step not found' });
      }
      res.json(step);
    } catch (error) {
      console.error('Error fetching workflow step:', error);
      res.status(500).json({ error: 'Failed to fetch workflow step' });
    }
  });

  // Cleanup expired workflow steps (can be called manually or via cron)
  app.post('/api/workflow/cleanup', isAuthenticated, async (req: any, res) => {
    try {
      const deletedCount = await workflowService.cleanupExpiredSteps();
      res.json({ 
        success: true, 
        deletedCount,
        message: `Cleaned up ${deletedCount} expired workflow steps`
      });
    } catch (error) {
      console.error('Error cleaning up workflow steps:', error);
      res.status(500).json({ error: 'Failed to cleanup workflow steps' });
    }
  });

  // Process individual steps (for step-by-step processing)
  
  // Step 1: Transcription only
  app.post('/api/workflow/transcribe', isAuthenticated, upload.single('audio'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { labId } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      const workflowId = await workflowService.startWorkflow(userId, labId);
      const result = await workflowService.processTranscriptionStep(
        workflowId, 
        req.file, 
        userId, 
        labId
      );

      res.json({
        workflowId,
        stepResult: result,
        transcript: result.outputData?.transcript,
      });

    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).json({ 
        error: 'Transcription failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Step 2: AI Analysis only
  app.post('/api/workflow/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { workflowId, transcript, labId, meetingType = 'DAILY_STANDUP', attendees = [] } = req.body;
      
      if (!workflowId || !transcript) {
        return res.status(400).json({ error: 'Workflow ID and transcript are required' });
      }

      const result = await workflowService.processAIAnalysisStep(
        workflowId,
        transcript,
        userId,
        labId,
        meetingType,
        attendees
      );

      res.json({
        stepResult: result,
        meetingId: result.outputData?.meetingId,
      });

    } catch (error) {
      console.error('AI analysis error:', error);
      res.status(500).json({ 
        error: 'AI analysis failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Step 3: Email Generation only
  app.post('/api/workflow/generate-email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { workflowId, meetingId, labName, labId } = req.body;
      
      if (!workflowId || !meetingId || !labName) {
        return res.status(400).json({ error: 'Workflow ID, meeting ID, and lab name are required' });
      }

      const result = await workflowService.processEmailGenerationStep(
        workflowId,
        meetingId,
        userId,
        labName,
        labId
      );

      res.json({
        stepResult: result,
        html: result.outputData?.html,
      });

    } catch (error) {
      console.error('Email generation error:', error);
      res.status(500).json({ 
        error: 'Email generation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Step 4: Email Delivery only
  app.post('/api/workflow/send-email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { workflowId, meetingId, recipients, labName, labId } = req.body;
      
      if (!workflowId || !meetingId || !recipients || !Array.isArray(recipients) || recipients.length === 0 || !labName) {
        return res.status(400).json({ error: 'Workflow ID, meeting ID, recipients array, and lab name are required' });
      }

      const result = await workflowService.processEmailDeliveryStep(
        workflowId,
        meetingId,
        recipients,
        userId,
        labName,
        labId
      );

      res.json({
        stepResult: result,
        messageId: result.outputData?.messageId,
      });

    } catch (error) {
      console.error('Email delivery error:', error);
      res.status(500).json({ 
        error: 'Email delivery failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Standup Meeting Routes
  app.get('/api/standups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { labId } = req.query;
      const meetings = await storage.getStandupMeetings(labId);
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching standups:", error);
      res.status(500).json({ error: "Failed to fetch standups" });
    }
  });

  app.post('/api/standups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const meetingData = { 
        ...req.body, 
        createdBy: userId,
        meetingType: req.body.meetingType || 'DAILY_STANDUP',
        meetingDate: req.body.meetingDate || new Date(),
        scheduledDate: req.body.scheduledDate || new Date(),
        startTime: req.body.startTime || new Date()
      };
      const meeting = await storage.createStandupMeeting(meetingData);
      res.json(meeting);
    } catch (error) {
      console.error("Error creating standup:", error);
      res.status(500).json({ error: "Failed to create standup" });
    }
  });

  // Legacy endpoint compatibility
  app.post('/api/standups/meetings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const meetingData = { 
        ...req.body, 
        createdBy: userId,
        meetingType: req.body.meetingType || 'DAILY_STANDUP',
        meetingDate: req.body.meetingDate || new Date(),
        scheduledDate: req.body.scheduledDate || new Date(), 
        startTime: req.body.startTime || new Date()
      };
      const meeting = await storage.createStandupMeeting(meetingData);
      res.json(meeting);
    } catch (error) {
      console.error("Error creating standup meeting:", error);
      res.status(500).json({ error: "Failed to create standup meeting" });
    }
  });

  // Get meeting email preview
  app.get('/api/standups/meeting-email/:meetingId', isAuthenticated, async (req: any, res) => {
    try {
      const { meetingId } = req.params;
      const { MeetingRecorderService } = await import('./meetingRecorder');
      const meetingService = new MeetingRecorderService();
      
      const { meeting, actionItems } = await meetingService.getMeetingDetails(meetingId);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      const htmlContent = await meetingService.generateEmailHtml({
        meeting,
        actionItems,
        title: "Your Lab"
      });
      
      res.json({
        html: htmlContent,
        meeting: meeting,
        actionItems: actionItems
      });
    } catch (error) {
      console.error("Error generating email preview:", error);
      res.status(500).json({ error: "Failed to generate email preview" });
    }
  });

  // Legacy endpoint compatibility  
  app.get('/api/standups/meeting-email/', isAuthenticated, async (req: any, res) => {
    try {
      const { meetingId } = req.query;
      if (!meetingId) {
        return res.status(400).json({ error: "Meeting ID is required" });
      }

      const { MeetingRecorderService } = await import('./meetingRecorder');
      const meetingService = new MeetingRecorderService();
      
      const { meeting, actionItems } = await meetingService.getMeetingDetails(meetingId);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      const htmlContent = await meetingService.generateEmailHtml({
        meeting,
        actionItems,
        title: "Your Lab"
      });
      
      res.json({
        html: htmlContent,
        meeting: meeting,
        actionItems: actionItems
      });
    } catch (error) {
      console.error("Error generating email preview:", error);
      res.status(500).json({ error: "Failed to generate email preview" });
    }
  });

  // Send meeting summary email
  app.post('/api/standups/:meetingId/send-email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { meetingId } = req.params;
      const { recipients, labName = "Your Lab" } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: "Recipients array is required" });
      }

      const { MeetingRecorderService } = await import('./meetingRecorder');
      const meetingService = new MeetingRecorderService();
      
      const result = await meetingService.sendMeetingSummary(meetingId, recipients, labName);
      
      if (result.success) {
        res.json({
          success: true,
          messageId: result.messageId,
          message: "Email sent successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || "Failed to send email"
        });
      }
    } catch (error) {
      console.error("Error sending meeting email:", error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Legacy endpoint compatibility for send email
  app.get('/api/standups/send-email', isAuthenticated, async (req: any, res) => {
    try {
      const { meetingId, recipients, labName = "Your Lab" } = req.query;

      if (!meetingId) {
        return res.status(400).json({ error: "Meeting ID is required" });
      }

      if (!recipients) {
        return res.status(400).json({ error: "Recipients are required" });
      }

      // Parse recipients if it's a string
      let recipientList;
      try {
        recipientList = typeof recipients === 'string' ? JSON.parse(recipients) : recipients;
      } catch (e) {
        recipientList = [recipients]; // Single recipient
      }

      const { MeetingRecorderService } = await import('./meetingRecorder');
      const meetingService = new MeetingRecorderService();
      
      const result = await meetingService.sendMeetingSummary(meetingId, recipientList, labName);
      
      if (result.success) {
        res.json({
          success: true,
          messageId: result.messageId,
          message: "Email sent successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || "Failed to send email"
        });
      }
    } catch (error) {
      console.error("Error sending meeting email:", error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Workflow validation endpoint (for testing)
  app.get('/api/validate-workflow', async (req, res) => {
    try {
      const { validateCompleteWorkflow } = await import('./validateWorkflow');
      const results = await validateCompleteWorkflow();
      
      res.json({
        timestamp: new Date().toISOString(),
        ...results
      });
    } catch (error) {
      console.error('Workflow validation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Test email delivery endpoint
  app.post('/api/test-email', isAuthenticated, async (req: any, res) => {
    try {
      const { recipients, testMessage = "This is a test email from LabSync" } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: "Recipients array is required" });
      }

      // Import Resend directly to test
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      console.log('Testing email with:', {
        hasApiKey: !!process.env.RESEND_API_KEY,
        apiKeyLength: process.env.RESEND_API_KEY?.length,
        recipients: recipients
      });

      const response = await resend.emails.send({
        from: "onboarding@resend.dev", // Use Resend's default domain for testing
        to: recipients,
        subject: "LabSync Email Test",
        html: `<h2>Email Test</h2><p>${testMessage}</p><p>Sent from LabSync at ${new Date().toISOString()}</p>`,
        text: `Email Test: ${testMessage}\n\nSent from LabSync at ${new Date().toISOString()}`
      });

      console.log('Resend response:', response);

      res.json({
        success: true,
        messageId: response.data?.id,
        message: "Test email sent successfully",
        resendResponse: response
      });

    } catch (error) {
      console.error("Test email error:", error);
      
      // Enhanced error logging
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }

      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        errorDetails: error
      });
    }
  });

  // Google Calendar integration routes
  app.use('/api/google-calendar', googleCalendarRoutes);
  
  // Email reminder routes  
  app.use('/api/email-reminders', (await import('./routes/email-reminders')).emailReminderRoutes);
  
  // Existing routes would go here...
  // (Other existing API routes for labs, studies, tasks, etc.)

  const httpServer = createServer(app);
  return httpServer;
}