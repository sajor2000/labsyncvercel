import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { workflowService } from "./workflowService";
import multer from 'multer';

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Configure multer for audio uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB limit
    },
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Production Workflow Routes
  
  // Process complete workflow: audio -> transcript -> AI analysis -> email generation -> delivery
  app.post('/api/workflow/complete', isAuthenticated, upload.single('audio'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { recipients, labName, labId, meetingType = 'standup', attendees = [] } = req.body;
      
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
      const { workflowId, transcript, labId, meetingType = 'standup', attendees = [] } = req.body;
      
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

  // Existing routes would go here...
  // (Other existing API routes for labs, studies, tasks, etc.)

  const httpServer = createServer(app);
  return httpServer;
}