import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { workflowService } from "./workflowService";
import multer from 'multer';
import googleCalendarRoutes from './routes/google-calendar';

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
      // Session validation is already handled by isAuthenticated middleware
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Add session info to response
      res.json({
        ...user,
        sessionValid: true,
        expiresAt: req.user.expires_at
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Lab routes
  app.get('/api/labs', isAuthenticated, async (req: any, res) => {
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
  // DELETE standup meeting endpoint
  app.delete('/api/standups/meetings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify meeting exists
      const meeting = await storage.getStandupMeeting(id);
      if (!meeting) {
        return res.status(404).json({ error: "Standup meeting not found" });
      }
      
      // Authorization check - only creator or admin can delete
      if (meeting.createdBy !== userId) {
        return res.status(403).json({ error: "Unauthorized to delete this meeting" });
      }
      
      // Hard delete - remove associated action items first
      const actionItems = await storage.getActionItemsByMeetingId(id);
      for (const item of actionItems) {
        await storage.deleteActionItem(item.id);
      }
      
      // Delete the meeting
      await storage.deleteStandupMeeting(id);
      
      // Audit log
      console.log(`Standup meeting ${id} deleted by user ${userId} at ${new Date().toISOString()}`);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting standup meeting:", error);
      res.status(500).json({ message: "Failed to delete standup meeting", error: error.message });
    }
  });

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

  // Team Members routes
  app.get('/api/team-members', isAuthenticated, async (req: any, res) => {
    try {
      console.log('🔍 API: Fetching team members...');
      const teamMembers = await storage.getTeamMembers();
      console.log(`✅ API: Returning ${teamMembers.length} team members`);
      res.json(teamMembers);
    } catch (error) {
      console.error("❌ API: Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members", error: error.message });
    }
  });

  // Create team member
  app.post('/api/team-members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('➕ API: Creating new team member...');
      
      // Create user with provided data
      const userData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        middleName: req.body.middleName || null,
        email: req.body.email,
        role: req.body.role,
        title: req.body.title || null,
        department: req.body.department || null,
        institution: req.body.institution || 'Rush University Medical Center',
        phone: req.body.phone || null,
        capacity: req.body.capacity || '40.00',
        bio: req.body.bio || null,
        linkedIn: req.body.linkedIn || null,
        orcid: req.body.orcid || null,
        expertise: req.body.expertise || [],
        skills: req.body.skills || [],
        isExternal: req.body.isExternal || false,
        isActive: true,
      };
      
      const newUser = await storage.createUser(userData);
      
      // If labId is provided, add user to the lab
      if (req.body.labId) {
        await storage.addUserToLab(newUser.id, req.body.labId, req.body.role);
      }
      
      console.log(`✅ API: Created team member ${newUser.firstName} ${newUser.lastName}`);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("❌ API: Error creating team member:", error);
      res.status(500).json({ message: "Failed to create team member", error: error.message });
    }
  });

  // Update team member
  app.put('/api/team-members/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      console.log(`✏️ API: Updating team member ${id}...`);
      
      const updatedUser = await storage.updateTeamMember(id, req.body);
      
      // If labId and labRole provided, update lab membership
      if (req.body.labId && req.body.labRole) {
        await storage.updateLabMemberRole(id, req.body.labId, req.body.labRole);
      }
      
      console.log(`✅ API: Updated team member ${id}`);
      res.json(updatedUser);
    } catch (error) {
      console.error("❌ API: Error updating team member:", error);
      res.status(500).json({ message: "Failed to update team member", error: error.message });
    }
  });

  // Delete team member
  app.delete('/api/team-members/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      console.log(`🗑️ API: Deleting team member ${id}...`);
      
      // Allow all authenticated users to delete team members
      // Soft delete - set isActive to false
      await storage.updateUser(id, { isActive: false });
      
      console.log(`✅ API: Deleted team member ${id}`);
      res.json({ message: "Team member deleted successfully" });
    } catch (error) {
      console.error("❌ API: Error deleting team member:", error);
      res.status(500).json({ message: "Failed to delete team member", error: error.message });
    }
  });

  // Lab Members routes (lab-specific)
  app.get('/api/lab-members', isAuthenticated, async (req: any, res) => {
    try {
      const { labId } = req.query;
      
      if (labId) {
        console.log(`🔍 API: Fetching members for lab ${labId}...`);
        const labMembers = await storage.getLabMembers(labId);
        console.log(`✅ API: Returning ${labMembers.length} members for lab`);
        res.json(labMembers);
      } else {
        console.log('🔍 API: Fetching all team members...');
        const teamMembers = await storage.getTeamMembers();
        console.log(`✅ API: Returning ${teamMembers.length} team members`);
        res.json(teamMembers);
      }
    } catch (error) {
      console.error("❌ API: Error fetching lab members:", error);
      res.status(500).json({ message: "Failed to fetch lab members", error: error.message });
    }
  });

  // ================================
  // CORE CRUD ENDPOINTS
  // ================================

  // STUDIES CRUD
  app.get('/api/studies', isAuthenticated, async (req: any, res) => {
    try {
      const { labId } = req.query;
      const studies = labId ? await storage.getStudiesByLab(labId) : await storage.getAllStudies();
      res.json(studies);
    } catch (error) {
      console.error("Error fetching studies:", error);
      res.status(500).json({ message: "Failed to fetch studies", error: error.message });
    }
  });

  app.post('/api/studies', isAuthenticated, async (req: any, res) => {
    try {
      const studyData = {
        ...req.body,
        createdBy: req.user.claims.sub,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const study = await storage.createStudy(studyData);
      res.status(201).json(study);
    } catch (error) {
      console.error("Error creating study:", error);
      res.status(500).json({ message: "Failed to create study", error: error.message });
    }
  });

  app.put('/api/studies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updatedStudy = await storage.updateStudy(id, req.body);
      res.json(updatedStudy);
    } catch (error) {
      console.error("Error updating study:", error);
      res.status(500).json({ message: "Failed to update study", error: error.message });
    }
  });

  app.delete('/api/studies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { force } = req.query;
      
      // Check for dependent tasks before deletion
      const tasks = await storage.getTasksByStudy(id);
      const activeTasks = tasks.filter(task => task.isActive);
      
      if (activeTasks.length > 0 && !force) {
        return res.status(409).json({ 
          error: 'Cannot delete study with active tasks',
          activeTasksCount: activeTasks.length,
          hint: 'Add ?force=true to cascade delete tasks'
        });
      }
      
      // Soft delete with cascade if force=true
      await storage.deleteStudy(id, Boolean(force));
      
      // Audit log
      console.log(`Study ${id} deleted by user ${req.user.claims.sub} at ${new Date().toISOString()}`);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting study:", error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: "Study not found" });
      }
      res.status(500).json({ message: "Failed to delete study", error: error.message });
    }
  });

  // BUCKETS CRUD
  app.get('/api/buckets', isAuthenticated, async (req: any, res) => {
    try {
      const { labId } = req.query;
      const buckets = labId ? await storage.getBucketsByLab(labId) : await storage.getAllBuckets();
      res.json(buckets);
    } catch (error) {
      console.error("Error fetching buckets:", error);
      res.status(500).json({ message: "Failed to fetch buckets", error: error.message });
    }
  });

  app.post('/api/buckets', isAuthenticated, async (req: any, res) => {
    try {
      const bucketData = {
        ...req.body,
        createdBy: req.user.claims.sub,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const bucket = await storage.createBucket(bucketData);
      res.status(201).json(bucket);
    } catch (error) {
      console.error("Error creating bucket:", error);
      res.status(500).json({ message: "Failed to create bucket", error: error.message });
    }
  });

  app.put('/api/buckets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updatedBucket = await storage.updateBucket(id, req.body);
      res.json(updatedBucket);
    } catch (error) {
      console.error("Error updating bucket:", error);
      res.status(500).json({ message: "Failed to update bucket", error: error.message });
    }
  });

  app.delete('/api/buckets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Check for dependent studies before deletion
      const studies = await storage.getAllStudies();
      const bucketStudies = studies.filter(s => s.bucketId === id && s.isActive);
      
      if (bucketStudies.length > 0) {
        return res.status(409).json({ 
          error: 'Cannot delete bucket with active studies',
          activeStudiesCount: bucketStudies.length,
          hint: 'Move or delete studies first'
        });
      }
      
      // Delete the bucket
      await storage.deleteBucket(id);
      
      // Audit log
      console.log(`Bucket ${id} deleted by user ${userId} at ${new Date().toISOString()}`);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting bucket:", error);
      if (error.message.includes('study(ies)')) {
        return res.status(409).json({ error: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: "Bucket not found" });
      }
      res.status(500).json({ message: "Failed to delete bucket", error: error.message });
    }
  });

  // IDEAS CRUD
  app.get('/api/ideas', isAuthenticated, async (req: any, res) => {
    try {
      const { labId } = req.query;
      const ideas = labId ? await storage.getIdeasByLab(labId) : await storage.getAllIdeas();
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching ideas:", error);
      res.status(500).json({ message: "Failed to fetch ideas", error: error.message });
    }
  });

  app.post('/api/ideas', isAuthenticated, async (req: any, res) => {
    try {
      const ideaData = {
        ...req.body,
        createdBy: req.user.claims.sub,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const idea = await storage.createIdea(ideaData);
      res.status(201).json(idea);
    } catch (error) {
      console.error("Error creating idea:", error);
      res.status(500).json({ message: "Failed to create idea", error: error.message });
    }
  });

  app.put('/api/ideas/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updatedIdea = await storage.updateIdea(id, req.body);
      res.json(updatedIdea);
    } catch (error) {
      console.error("Error updating idea:", error);
      res.status(500).json({ message: "Failed to update idea", error: error.message });
    }
  });

  app.delete('/api/ideas/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteIdea(id);
      res.json({ message: "Idea deleted successfully" });
    } catch (error) {
      console.error("Error deleting idea:", error);
      res.status(500).json({ message: "Failed to delete idea", error: error.message });
    }
  });

  // TASKS CRUD
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const { labId, studyId } = req.query;
      const tasks = labId ? await storage.getTasksByLab(labId) : 
                    studyId ? await storage.getTasksByStudy(studyId) :
                    await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const taskData = {
        ...req.body,
        createdBy: req.user.claims.sub,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const task = await storage.createTask(taskData);
      
      // Send immediate task creation notification if assignee exists
      if (task.assigneeId) {
        try {
          const { emailReminderService } = await import('./emailReminders');
          await emailReminderService.sendTaskCreationNotification(task.id);
          console.log(`📧 Task creation notification triggered for task ${task.id}`);
        } catch (emailError) {
          console.error('Failed to send task creation notification:', emailError);
          // Don't fail the task creation if email fails
        }
      }
      
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task", error: error.message });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updatedTask = await storage.updateTask(id, req.body);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task", error: error.message });
    }
  });

  app.patch('/api/tasks/:id/move', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { newStatus, newPosition, newStudyId } = req.body;
      const updatedTask = await storage.moveTask(id, { newStatus, newPosition, newStudyId });
      res.json(updatedTask);
    } catch (error) {
      console.error("Error moving task:", error);
      res.status(500).json({ message: "Failed to move task", error: error.message });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify task exists and check permissions
      const tasks = await storage.getAllTasks();
      const task = tasks.find(t => t.id === id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Delete the task (hard delete for now, can be changed to soft delete)
      await storage.deleteTask(id);
      
      // Audit log
      console.log(`Task ${id} deleted by user ${userId} at ${new Date().toISOString()}`);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task", error: error.message });
    }
  });

  // LABS CRUD (Complete the missing endpoints)
  app.post('/api/labs', isAuthenticated, async (req: any, res) => {
    try {
      const labData = {
        ...req.body,
        createdBy: req.user.claims.sub,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const lab = await storage.createLab(labData);
      res.status(201).json(lab);
    } catch (error) {
      console.error("Error creating lab:", error);
      res.status(500).json({ message: "Failed to create lab", error: error.message });
    }
  });

  app.put('/api/labs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updatedLab = await storage.updateLab(id, req.body);
      res.json(updatedLab);
    } catch (error) {
      console.error("Error updating lab:", error);
      res.status(500).json({ message: "Failed to update lab", error: error.message });
    }
  });

  app.delete('/api/labs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { force } = req.query;
      
      // Validate no active dependencies exist
      const [studies, buckets, members] = await Promise.all([
        storage.getStudiesByLab(id),
        storage.getBucketsByLab(id),
        storage.getLabMembers(id)
      ]);
      
      const activeStudies = studies.filter(s => s.isActive);
      const activeMembers = members.filter(m => m.isActive);
      
      if ((activeStudies.length > 0 || buckets.length > 0 || activeMembers.length > 0) && !force) {
        return res.status(409).json({ 
          error: 'Cannot delete lab with active dependencies',
          dependencies: {
            studies: activeStudies.length,
            buckets: buckets.length,
            members: activeMembers.length
          },
          hint: 'Add ?force=true to cascade soft delete all related entities'
        });
      }
      
      // Soft delete with cascade if force=true
      await storage.deleteLab(id, Boolean(force));
      
      // Audit log
      console.log(`Lab ${id} deleted by user ${req.user.claims.sub} at ${new Date().toISOString()}`);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lab:", error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: "Lab not found" });
      }
      res.status(500).json({ message: "Failed to delete lab", error: error.message });
    }
  });

  // ATTACHMENTS for file management
  app.post('/api/attachments', isAuthenticated, async (req: any, res) => {
    try {
      const attachmentData = {
        ...req.body,
        createdBy: req.user.claims.sub,
        createdAt: new Date(),
      };
      const attachment = await storage.createAttachment(attachmentData);
      res.status(201).json(attachment);
    } catch (error) {
      console.error("Error creating attachment:", error);
      res.status(500).json({ message: "Failed to create attachment", error: error.message });
    }
  });

  app.delete('/api/attachments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAttachment(id);
      res.json({ message: "Attachment deleted successfully" });
    } catch (error) {
      console.error("Error deleting attachment:", error);
      res.status(500).json({ message: "Failed to delete attachment", error: error.message });
    }
  });

  // Google Calendar integration routes
  app.use('/api/google-calendar', googleCalendarRoutes);
  
  // Email reminder routes  
  app.use('/api/email-reminders', (await import('./routes/email-reminders')).emailReminderRoutes);
  
  // Domain management routes
  app.use('/api/domains', (await import('./routes/domains')).domainRoutes);

  const httpServer = createServer(app);
  return httpServer;
}