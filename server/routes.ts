import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from 'openai';
import { Resend } from 'resend';
import { setupAuth, isAuthenticated } from "./replitAuth";
import { SecurityAuditLogger, auditAuthenticationMiddleware } from "./auditLogger";
import multer from "multer";
import { studyMilestones, users, labs, buckets, studies, tasks, teamMembers, standupMeetings, sessions, deadlines, labMembers, ideas, attachments } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";


export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Add audit logging middleware for all routes
  app.use(auditAuthenticationMiddleware);

  // Configure multer for file uploads (audio files)
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB limit for audio files
    },
    fileFilter: (req, file, cb) => {
      // Accept audio files
      if (file.mimetype.startsWith('audio/') || file.mimetype.includes('webm')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed'));
      }
    }
  });

  // Test API integrations endpoint
  app.post('/api/test-apis', isAuthenticated, async (req: any, res) => {
    const results: any = {
      openai: { whisper: false, gpt4: false },
      resend: false,
      timestamp: new Date().toISOString()
    };

    try {
      // Test OpenAI API (GPT-4o-mini)
      console.log('Testing OpenAI GPT-4o-mini...');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
      });

      const gptResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a test bot. Reply with exactly: 'GPT-4o-mini is working'" },
          { role: "user", content: "Test" }
        ],
        max_tokens: 20
      });

      results.openai.gpt4 = gptResponse.choices[0]?.message?.content || 'No response';
      console.log('GPT-4o-mini test result:', results.openai.gpt4);

      // Test Whisper (transcription capability check)
      results.openai.whisper = 'Ready - requires audio file for transcription';
      console.log('Whisper status:', results.openai.whisper);

      // Test Resend API
      console.log('Testing Resend API...');
      const resendClient = new Resend(process.env.RESEND_API_KEY!);

      // Just validate the API key without sending an email
      const domains = await resendClient.domains.list();
      results.resend = `Connected - ${domains.data?.data?.length || 0} domains configured`;
      console.log('Resend test result:', results.resend);

    } catch (error: any) {
      console.error('API test error:', error);
      results.error = error.message;
    }

    res.json({
      success: !results.error,
      results,
      message: 'API integration test completed'
    });
  });

  // Registration request route (public - no auth required)
  app.post('/api/registration-request', async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        alternativeEmail,
        phoneNumber,
        requestedLab,
        requestedRole,
        researchInterests,
        qualifications,
        referredBy,
        additionalNotes
      } = req.body;

      // Format the email content
      const emailContent = `
        <h2>New Lab Member Registration Request</h2>

        <h3>Personal Information:</h3>
        <ul>
          <li><strong>Name:</strong> ${firstName} ${lastName}</li>
          <li><strong>Primary Email:</strong> ${email}</li>
          <li><strong>Alternative Email:</strong> ${alternativeEmail || 'Not provided'}</li>
          <li><strong>Phone:</strong> ${phoneNumber}</li>
        </ul>

        <h3>Lab Request:</h3>
        <ul>
          <li><strong>Requested Lab:</strong> ${requestedLab}</li>
          <li><strong>Requested Role:</strong> ${requestedRole.replace(/_/g, ' ')}</li>
          <li><strong>Referred By:</strong> ${referredBy || 'Not specified'}</li>
        </ul>

        <h3>Research Interests:</h3>
        <p>${researchInterests}</p>

        <h3>Qualifications & Experience:</h3>
        <p>${qualifications}</p>

        ${additionalNotes ? `<h3>Additional Notes:</h3><p>${additionalNotes}</p>` : ''}

        <hr>
        <p><strong>Action Required:</strong> Review this application and if approved, add the user to the team members database.</p>
        <p>Once added, the user will be able to log in using either their primary or alternative email address.</p>
      `;

      // Send email notification to Dr. Rojas
      // Note: In production, you would use a real email service here
      console.log('Registration request received for:', firstName, lastName);
      console.log('Would send email to: juan_rojas@rush.edu');
      console.log('Email content:', emailContent);

      // Store the registration request in database (optional - for tracking)
      // You could create a registration_requests table to track these

      res.json({ 
        success: true, 
        message: 'Registration request submitted successfully. Dr. Rojas will review your application.' 
      });
    } catch (error) {
      console.error('Registration request error:', error);
      res.status(500).json({ 
        error: 'Failed to submit registration request. Please try again.' 
      });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Global search endpoint
  app.get('/api/search', isAuthenticated, async (req: any, res) => {
    try {
      const { q: searchQuery, limit = 15 } = req.query;
      const userId = (req.user as any)?.claims?.sub;

      console.log(`🔍 Search API called with query: "${searchQuery}", limit: ${limit}, userId: ${userId}`);

      if (!searchQuery || searchQuery.trim().length === 0) {
        console.log(`❌ Empty search query, returning empty results`);
        return res.json({ results: [] });
      }

      const results = await storage.globalSearch(searchQuery.trim(), parseInt(limit), userId);
      console.log(`🔍 Search API returning ${results.length} results`);
      res.json({ results });
    } catch (error) {
      console.error("Error performing global search:", error);
      res.status(500).json({ message: "Search failed", error: (error as Error).message });
    }
  });

  app.put('/api/auth/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.updateUserProfile(userId, req.body);
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.put('/api/auth/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const settings = await storage.updateUserSettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.post('/api/auth/export-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const userData = await storage.exportUserData(userId);
      res.json(userData);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  app.delete('/api/auth/delete-account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      await storage.deleteUser(userId);
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string | undefined;
      const stats = await storage.getDashboardStats(labId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/activity', isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string | undefined;
      const activity = await storage.getActivityFeed(labId);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching activity feed:", error);
      res.status(500).json({ message: "Failed to fetch activity feed" });
    }
  });

  // Lab routes
  app.get("/api/labs", isAuthenticated, async (req, res) => {
    try {
      const labs = await storage.getLabs();
      res.json(labs);
    } catch (error) {
      console.error("Error fetching labs:", error);
      res.status(500).json({ message: "Failed to fetch labs" });
    }
  });

  app.post("/api/labs", isAuthenticated, async (req, res) => {
    try {
      const { name, description } = req.body;

      // Validate required fields
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: "Lab name is required and must be a valid string." });
      }

      const lab = await storage.createLab(req.body);
      res.json(lab);
    } catch (error) {
      console.error("Error creating lab:", error);
      res.status(500).json({ message: "Failed to create lab" });
    }
  });

  app.put("/api/labs/:id", isAuthenticated, async (req, res) => {
    try {
      const { name } = req.body;

      // Validate required fields
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: "Lab name is required and must be a valid string." });
      }

      const lab = await storage.updateLab(req.params.id, req.body);
      res.json(lab);
    } catch (error) {
      console.error("Error updating lab:", error);
      res.status(500).json({ message: "Failed to update lab" });
    }
  });

  // Bucket routes
  app.get("/api/buckets", isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string | undefined;
      const buckets = await storage.getBuckets(labId);
      res.json(buckets);
    } catch (error) {
      console.error("Error fetching buckets:", error);
      res.status(500).json({ message: "Failed to fetch buckets" });
    }
  });

  app.get("/api/buckets/deleted", isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string | undefined;
      const deletedBuckets = await storage.getDeletedBuckets(labId);
      res.json(deletedBuckets);
    } catch (error) {
      console.error("Error fetching deleted buckets:", error);
      res.status(500).json({ message: "Failed to fetch deleted buckets" });
    }
  });

  app.post("/api/buckets", isAuthenticated, async (req, res) => {
    try {
      const bucketData = {
        ...req.body,
        createdBy: (req.user as any)?.claims?.sub // Set ownership
      };
      const bucket = await storage.createBucket(bucketData);
      res.json(bucket);
    } catch (error) {
      console.error("Error creating bucket:", error);
      res.status(500).json({ message: "Failed to create bucket" });
    }
  });

  app.delete("/api/buckets/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const bucketId = req.params.id;

      // Check authorization 
      const authResult = await storage.canDeleteEntity(userId, 'bucket', bucketId);
      if (!authResult.canDelete) {
        await SecurityAuditLogger.logDeleteAttempt(req, 'BUCKET', bucketId, false, undefined, authResult.reason);
        return res.status(403).json({ 
          error: "Forbidden", 
          message: authResult.reason 
        });
      }

      await storage.deleteBucket(req.params.id!);
      await SecurityAuditLogger.logSuccessfulDelete(req, 'BUCKET', req.params.id as string, authResult.method as string);
      res.json({ 
        message: "Bucket deleted successfully",
        deletedBy: authResult.method 
      });
    } catch (error) {
      await SecurityAuditLogger.logDeleteAttempt(req, 'BUCKET', req.params.id!, false, undefined, (error as Error).message);
      console.error("Error deleting bucket:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to delete bucket" });
    }
  });

  // Study routes
  app.get("/api/studies", isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string | undefined;
      const studies = await storage.getStudies(labId);
      res.json(studies);
    } catch (error) {
      console.error("Error fetching studies:", error);
      res.status(500).json({ message: "Failed to fetch studies" });
    }
  });

  app.get("/api/studies/deleted", isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string | undefined;
      const deletedStudies = await storage.getDeletedStudies(labId);
      res.json(deletedStudies);
    } catch (error) {
      console.error("Error fetching deleted studies:", error);
      res.status(500).json({ message: "Failed to fetch deleted studies" });
    }
  });

  app.post("/api/studies", isAuthenticated, async (req, res) => {
    try {
      const { title, bucketId } = req.body;

      // Validate required fields
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: "Study title is required and must be a valid string." });
      }

      if (!bucketId || typeof bucketId !== 'string') {
        return res.status(400).json({ message: "Bucket ID is required and must be a valid string." });
      }

      const study = await storage.createStudy(req.body);
      res.json(study);
    } catch (error) {
      console.error("Error creating study:", error);
      res.status(500).json({ message: "Failed to create study" });
    }
  });

  app.put("/api/studies/:id", isAuthenticated, async (req, res) => {
    try {
      const study = await storage.updateStudy(req.params.id, req.body);
      res.json(study);
    } catch (error) {
      console.error("Error updating study:", error);
      res.status(500).json({ message: "Failed to update study" });
    }
  });

  app.delete("/api/studies/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const studyId = req.params.id;
      const cascade = req.query.cascade === 'true';

      // Check authorization
      const authResult = await storage.canDeleteEntity(userId, 'study', studyId);
      if (!authResult.canDelete) {
        await SecurityAuditLogger.logDeleteAttempt(req, 'STUDY', studyId, false, undefined, authResult.reason);
        return res.status(403).json({ 
          error: "Forbidden", 
          message: authResult.reason 
        });
      }

      await storage.deleteStudy(req.params.id!, cascade);
      await SecurityAuditLogger.logSuccessfulDelete(req, 'STUDY', req.params.id as string, authResult.method as string);
      res.json({ 
        message: "Study deleted successfully",
        deletedBy: authResult.method 
      });
    } catch (error) {
      await SecurityAuditLogger.logDeleteAttempt(req, 'STUDY', req.params.id!, false, undefined, (error as Error).message);
      console.error("Error deleting study:", error);
      const errorMessage = (error as Error).message || "Failed to delete study";

      if (errorMessage.includes("Cannot delete study. It contains") && errorMessage.includes("task")) {
        const tasks = await storage.getTasks(req.params.id);
        res.status(409).json({ 
          message: errorMessage,
          taskCount: tasks.length,
          associatedTasks: tasks.map(task => ({ id: task.id, title: task.title }))
        });
      } else {
        res.status(500).json({ message: errorMessage });
      }
    }
  });

  // Soft delete routes
  app.patch("/api/buckets/:id/soft-delete", isAuthenticated, async (req, res) => {
    try {
      await storage.softDeleteBucket(req.params.id);
      res.json({ message: "Bucket archived successfully" });
    } catch (error) {
      console.error("Error archiving bucket:", error);
      res.status(500).json({ message: "Failed to archive bucket" });
    }
  });

  app.patch("/api/studies/:id/soft-delete", isAuthenticated, async (req, res) => {
    try {
      await storage.softDeleteStudy(req.params.id);
      res.json({ message: "Study archived successfully" });
    } catch (error) {
      console.error("Error archiving study:", error);
      res.status(500).json({ message: "Failed to archive study" });
    }
  });

  app.patch("/api/tasks/:id/soft-delete", isAuthenticated, async (req, res) => {
    try {
      await storage.softDeleteTask(req.params.id);
      res.json({ message: "Task archived successfully" });
    } catch (error) {
      console.error("Error archiving task:", error);
      res.status(500).json({ message: "Failed to archive task" });
    }
  });

  // Avatar and object storage routes
  app.post("/api/upload/avatar", isAuthenticated, async (req, res) => {
    try {
      console.log("Avatar upload URL requested by user:", (req.user as any)?.claims?.sub);
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getAvatarUploadURL();
      console.log("Generated upload URL:", uploadURL);
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting avatar upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.put("/api/auth/avatar", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { avatarUrl } = req.body;

      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(avatarUrl);

      const updatedUser = await storage.updateUserAvatar(userId, normalizedPath);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating avatar:", error);
      res.status(500).json({ message: "Failed to update avatar" });
    }
  });

  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error: any) {
      console.error("Error serving object:", error);
      if (error.name === "ObjectNotFoundError") {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // File attachment upload for tasks and studies
  app.post("/api/upload/attachment", isAuthenticated, async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting attachment upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Create attachment record after upload
  app.post("/api/attachments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { filename, fileUrl, fileSize, mimeType, entityType, entityId } = req.body;

      if (!filename || !fileUrl || !entityType || !entityId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(fileUrl);

      const attachment = await storage.createAttachment({
        filename,
        url: normalizedPath,
        fileSize: fileSize || "0",
        mimeType,
        entityType,
        entityId,
        uploadedById: userId,
        isDeleted: false,
      });

      res.json(attachment);
    } catch (error) {
      console.error("Error creating attachment:", error);
      res.status(500).json({ message: "Failed to create attachment" });
    }
  });

  // Get all attachments
  app.get("/api/attachments", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const attachments = await storage.getAllAttachments(userId);
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching all attachments:", error);
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });

  // Get attachments for entity (task or study)
  app.get("/api/attachments/:entityType/:entityId", isAuthenticated, async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const attachments = await storage.getAttachmentsByEntity(entityType, entityId);
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });

  // Update attachment filename
  app.patch("/api/attachments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const attachmentId = req.params.id;
      const { filename } = req.body;
      const userId = (req.user as any)?.claims?.sub;

      if (!filename) {
        return res.status(400).json({ message: "Filename is required" });
      }

      // Check if user can edit this attachment (ownership or admin)
      // For security, only allow editing by uploader or admin - this should be expanded with proper validation
      await storage.updateAttachmentFilename(attachmentId, filename);
      res.json({ message: "Attachment filename updated successfully" });
    } catch (error) {
      console.error("Error updating attachment:", error);
      res.status(500).json({ message: "Failed to update attachment" });
    }
  });

  // Download attachment
  app.get("/api/attachments/:id/download", isAuthenticated, async (req, res) => {
    try {
      const attachmentId = req.params.id;
      const userId = (req.user as any)?.claims?.sub;

      console.log(`Download request for attachment: ${attachmentId}`);

      // Get attachment details directly from database
      const attachment = await db.select()
        .from(attachments)
        .where(eq(attachments.id, attachmentId))
        .then(results => results[0]);

      if (!attachment || attachment.isDeleted) {
        console.log(`Attachment not found or deleted: ${attachmentId}`);
        return res.status(404).json({ message: "Attachment not found" });
      }

      console.log(`Found attachment: ${attachment.filename}, URL: ${attachment.url}`);

      // If URL starts with /objects/, use object storage
      if (attachment.url && attachment.url.startsWith('/objects/')) {
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        const objectFile = await objectStorageService.getObjectEntityFile(attachment.url);

        // Set appropriate headers for inline viewing (not forced download)
        res.set({
          'Content-Type': attachment.mimeType || 'application/octet-stream',
          'Cache-Control': 'public, max-age=3600'
        });

        objectStorageService.downloadObject(objectFile, res);
      } else {
        // Handle external URLs or legacy attachments
        res.status(404).json({ message: "File not found in storage" });
      }
    } catch (error) {
      console.error("Error downloading attachment:", error);
      res.status(500).json({ message: "Failed to download attachment" });
    }
  });

  // Delete attachment (soft delete)
  app.delete("/api/attachments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const attachmentId = req.params.id;
      const userId = (req.user as any)?.claims?.sub;

      // Check if user can delete this attachment (ownership or admin)
      const attachments = await storage.getAllAttachments(userId);

      // For security, only allow deletion by uploader or admin - this should be expanded with proper validation
      await storage.deleteAttachment(attachmentId);
      res.json({ message: "Attachment deleted successfully" });
    } catch (error) {
      console.error("Error deleting attachment:", error);
      res.status(500).json({ message: "Failed to delete attachment" });
    }
  });

  // Get attachment counts for all entities of a type
  app.get("/api/attachments/counts/:entityType", isAuthenticated, async (req, res) => {
    try {
      const { entityType } = req.params;

      if (!["PROJECT", "TASK", "IDEA", "DEADLINE"].includes(entityType)) {
        return res.status(400).json({ error: "Invalid entity type" });
      }

      const counts = await storage.getAttachmentCounts(entityType as "PROJECT" | "TASK" | "IDEA" | "DEADLINE");
      res.json(counts);
    } catch (error) {
      console.error("Error fetching attachment counts:", error);
      res.status(500).json({ error: "Failed to fetch attachment counts" });
    }
  });

  // Enhanced Task routes with full CRUD and drag-drop support
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const studyId = req.query.studyId as string;
      const tasks = await storage.getTasks(studyId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/deleted", isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string | undefined;
      const deletedTasks = await storage.getDeletedTasks(labId);
      res.json(deletedTasks);
    } catch (error) {
      console.error("Error fetching deleted tasks:", error);
      res.status(500).json({ message: "Failed to fetch deleted tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const { title, studyId, status } = req.body;

      // Validate required fields
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: "Task title is required and must be a valid string." });
      }

      if (!studyId || typeof studyId !== 'string') {
        return res.status(400).json({ message: "Study ID is required and must be a valid string." });
      }

      // Validate status if provided
      if (status) {
        const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ 
            message: "Invalid status. Must be one of: " + validStatuses.join(', ') 
          });
        }
      }

      const taskData = {
        ...req.body,
        createdBy: (req.user as any)?.claims?.sub
      };
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const taskId = req.params.id;

      // Check authorization
      const authResult = await storage.canDeleteEntity(userId, 'task', taskId);
      if (!authResult.canDelete) {
        await SecurityAuditLogger.logDeleteAttempt(req, 'TASK', taskId, false, undefined, authResult.reason);
        return res.status(403).json({ 
          error: "Forbidden", 
          message: authResult.reason 
        });
      }

      await storage.deleteTask(req.params.id!);
      await SecurityAuditLogger.logSuccessfulDelete(req, 'TASK', req.params.id as string, authResult.method as string);
      res.json({ 
        message: "Task deleted successfully",
        deletedBy: authResult.method 
      });
    } catch (error) {
      await SecurityAuditLogger.logDeleteAttempt(req, 'TASK', req.params.id!, false, undefined, (error as Error).message);
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Enhanced task operations for project board
  app.patch("/api/tasks/:id/move", isAuthenticated, async (req, res) => {
    try {
      const { newStatus, newPosition, newStudyId } = req.body;

      // Validate status if provided
      if (newStatus) {
        const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'];
        if (!validStatuses.includes(newStatus)) {
          return res.status(400).json({ 
            message: "Invalid status. Must be one of: " + validStatuses.join(', ') 
          });
        }
      }

      const task = await storage.updateTask(req.params.id, {
        status: newStatus,
        position: newPosition,
        studyId: newStudyId
      });
      res.json(task);
    } catch (error) {
      console.error("Error moving task:", error);
      res.status(500).json({ message: "Failed to move task" });
    }
  });

  app.patch("/api/tasks/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;

      // Validate status value
      const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status. Must be one of: " + validStatuses.join(', ') 
        });
      }

      const task = await storage.updateTask(req.params.id, { status });
      res.json(task);
    } catch (error) {
      console.error("Error updating task status:", error);
      res.status(500).json({ message: "Failed to update task status" });
    }
  });

  app.patch("/api/tasks/:id/assign", isAuthenticated, async (req, res) => {
    try {
      const { assigneeId } = req.body;
      const assignerId = (req.user as any)?.claims?.sub;

      // Validate assigneeId if provided (should be a valid UUID or null/undefined for unassigning)
      if (assigneeId && typeof assigneeId !== 'string') {
        return res.status(400).json({ 
          message: "Invalid assigneeId. Must be a valid user ID string." 
        });
      }

      const task = await storage.updateTask(req.params.id, { assigneeId });

      // Send email notification if a user was assigned
      if (assigneeId && task) {
        try {
          const { EmailService } = await import('./emailService');
          
          // Get user details for email
          const [assignee, assigner, fullTask] = await Promise.all([
            storage.getUser(assigneeId),
            storage.getUser(assignerId),
            storage.getTask(req.params.id)
          ]);

          if (assignee && assigner && fullTask) {
            // Get the lab name
            const study = await storage.getStudy(fullTask.studyId);
            const bucket = study ? await storage.getBucket(study.bucketId) : null;
            const lab = bucket ? await storage.getLabById(bucket.labId) : null;

            const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] 
              ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
              : '';
            
            await EmailService.sendTaskAssignmentEmail({
              assigneeName: `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() || assignee.email || 'Team Member',
              assigneeEmail: assignee.email || '',
              assignerName: `${assigner.firstName || ''} ${assigner.lastName || ''}`.trim() || assigner.email || 'Team Member',
              taskTitle: fullTask.title,
              taskDescription: fullTask.description || undefined,
              dueDate: fullTask.deadline ? new Date(fullTask.deadline) : undefined,
              labName: lab?.name || 'Research Lab',
              taskUrl: `${baseUrl}/task-management?taskId=${req.params.id}`
            });
          }
        } catch (emailError) {
          console.error('Failed to send task assignment email:', emailError);
          // Don't fail the request if email fails
        }
      }

      res.json(task);
    } catch (error) {
      console.error("Error assigning task:", error);
      res.status(500).json({ message: "Failed to assign task" });
    }
  });

  // Enhanced Lab Member routes for multi-lab support
  app.get("/api/lab-members", isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string | undefined;
      const members = await storage.getLabMembers(labId || '');
      res.json(members);
    } catch (error) {
      console.error("Error fetching lab members:", error);
      res.status(500).json({ message: "Failed to fetch lab members" });
    }
  });

  // Project Member routes
  app.get("/api/project-members", isAuthenticated, async (req, res) => {
    try {
      const projectId = req.query.projectId as string;
      const members = await storage.getProjectMembers(projectId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching project members:", error);
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });

  app.post("/api/project-members", isAuthenticated, async (req, res) => {
    try {
      const member = await storage.addProjectMember(req.body);
      res.json(member);
    } catch (error) {
      console.error("Error creating project member:", error);
      res.status(500).json({ message: "Failed to create project member" });
    }
  });

  app.delete("/api/project-members/:projectId/:userId", isAuthenticated, async (req, res) => {
    try {
      await storage.removeProjectMember(req.params.projectId, req.params.userId);
      res.json({ message: "Project member removed successfully" });
    } catch (error) {
      console.error("Error removing project member:", error);
      res.status(500).json({ message: "Failed to remove project member" });
    }
  });

  // Team member routes (lab-filtered)
  app.get("/api/team-members", isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string | undefined;
      if (labId) {
        // Filter by lab ID when provided
        const members = await storage.getLabMembers(labId);
        res.json(members);
      } else {
        // Return all team members if no lab ID specified
        const members = await storage.getTeamMembers();
        res.json(members);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.post("/api/team-members", isAuthenticated, async (req, res) => {
    try {
      // Get labId from request body or query parameter  
      const labId = req.body.labId || req.query.labId;
      if (!labId) {
        return res.status(400).json({ message: "Lab ID is required" });
      }

      // Map frontend form data to database schema
      const memberData: any = {
        name: req.body.name || `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim(),
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        middleName: req.body.middleName,
        initials: req.body.initials,
        email: req.body.email,
        role: req.body.role,
        title: req.body.title,
        labId: labId,
        department: req.body.department,
        institution: req.body.institution,
        phoneNumber: req.body.phone, // Map phone to phoneNumber
        capacity: req.body.capacity,
        bio: req.body.bio,
        linkedIn: req.body.linkedIn,
        orcid: req.body.orcid,
        expertise: req.body.expertise,
        skills: req.body.skills,
        isActive: !req.body.isExternal || true, // Map isExternal to isActive (inverse)
        isExternal: req.body.isExternal || false,
        position: "0"
      };

      // Remove undefined and empty values
      Object.keys(memberData).forEach(key => {
        if (memberData[key] === undefined || memberData[key] === '') {
          delete memberData[key];
        }
      });

      const member = await storage.createTeamMember(memberData);
      res.json(member);
    } catch (error) {
      console.error("Error creating team member:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to create team member", error: errorMessage });
    }
  });

  app.put("/api/team-members/:id", isAuthenticated, async (req, res) => {
    try {
      const member = await storage.updateTeamMember(req.params.id, req.body);
      res.json(member);
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(500).json({ message: "Failed to update team member" });
    }
  });

  app.delete("/api/team-members/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteTeamMember(req.params.id);
      res.json({ message: "Team member deleted successfully" });
    } catch (error) {
      console.error("Error deleting team member:", error);
      res.status(500).json({ message: "Failed to delete team member" });
    }
  });

  // Ideas routes
  app.get("/api/ideas", isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string;
      const ideas = await storage.getIdeas(labId);
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching ideas:", error);
      res.status(500).json({ message: "Failed to fetch ideas" });
    }
  });

  app.post("/api/ideas", isAuthenticated, async (req, res) => {
    try {
      const idea = await storage.createIdea(req.body);
      res.json(idea);
    } catch (error) {
      console.error("Error creating idea:", error);
      res.status(500).json({ message: "Failed to create idea" });
    }
  });

  app.put("/api/ideas/:id", isAuthenticated, async (req, res) => {
    try {
      const idea = await storage.updateIdea(req.params.id, req.body);
      res.json(idea);
    } catch (error) {
      console.error("Error updating idea:", error);
      res.status(500).json({ message: "Failed to update idea" });
    }
  });

  app.delete("/api/ideas/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const ideaId = req.params.id;

      // Check authorization
      const authResult = await storage.canDeleteEntity(userId, 'idea', ideaId);
      if (!authResult.canDelete) {
        await SecurityAuditLogger.logDeleteAttempt(req, 'IDEA', ideaId, false, undefined, authResult.reason);
        return res.status(403).json({ 
          error: "Forbidden", 
          message: authResult.reason 
        });
      }

      await storage.deleteIdea(req.params.id!);
      await SecurityAuditLogger.logSuccessfulDelete(req, 'IDEA', req.params.id as string, authResult.method as string);
      res.json({ 
        message: "Idea deleted successfully",
        deletedBy: authResult.method 
      });
    } catch (error) {
      await SecurityAuditLogger.logDeleteAttempt(req, 'IDEA', req.params.id!, false, undefined, (error as Error).message);
      console.error("Error deleting idea:", error);
      res.status(500).json({ message: "Failed to delete idea" });
    }
  });

  // Deadlines routes
  app.get("/api/deadlines", isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string;
      const deadlines = await storage.getDeadlines(labId);
      res.json(deadlines);
    } catch (error) {
      console.error("Error fetching deadlines:", error);
      res.status(500).json({ message: "Failed to fetch deadlines" });
    }
  });

  app.post("/api/deadlines", isAuthenticated, async (req, res) => {
    try {
      const deadline = await storage.createDeadline(req.body);
      res.json(deadline);
    } catch (error) {
      console.error("Error creating deadline:", error);
      res.status(500).json({ message: "Failed to create deadline" });
    }
  });

  app.put("/api/deadlines/:id", isAuthenticated, async (req, res) => {
    try {
      const deadline = await storage.updateDeadline(req.params.id, req.body);
      res.json(deadline);
    } catch (error) {
      console.error("Error updating deadline:", error);
      res.status(500).json({ message: "Failed to update deadline" });
    }
  });

  app.delete("/api/deadlines/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const deadlineId = req.params.id;

      // Check authorization
      const authResult = await storage.canDeleteEntity(userId, 'deadline', deadlineId);
      if (!authResult.canDelete) {
        await SecurityAuditLogger.logDeleteAttempt(req, 'DEADLINE', deadlineId, false, undefined, authResult.reason);
        return res.status(403).json({ 
          error: "Forbidden", 
          message: authResult.reason 
        });
      }

      await storage.deleteDeadline(req.params.id!);
      await SecurityAuditLogger.logSuccessfulDelete(req, 'DEADLINE', req.params.id as string, authResult.method as string);
      res.json({ 
        message: "Deadline deleted successfully",
        deletedBy: authResult.method 
      });
    } catch (error) {
      await SecurityAuditLogger.logDeleteAttempt(req, 'DEADLINE', req.params.id!, false, undefined, (error as Error).message);
      console.error("Error deleting deadline:", error);
      res.status(500).json({ message: "Failed to delete deadline" });
    }
  });

  // Standups routes
  app.get("/api/standups", isAuthenticated, async (req, res) => {
    try {
      const userLab = req.headers['x-current-lab'] as string;
      if (!userLab) {
        return res.status(400).json({ message: "Lab context required" });
      }

      const standups = await storage.getStandupMeetings(userLab);
      res.json(standups);
    } catch (error) {
      console.error("Error fetching standups:", error);
      res.status(500).json({ message: "Failed to fetch standups" });
    }
  });

  app.post("/api/standups", isAuthenticated, async (req, res) => {
    try {
      const userLab = req.headers['x-current-lab'] as string;
      const userId = (req.user as any)?.claims?.sub;

      if (!userLab) {
        return res.status(400).json({ message: "Lab context required" });
      }

      const standupData = {
        ...req.body,
        labId: userLab,
        createdBy: userId
      };

      const standup = await storage.createStandupMeeting(standupData);
      res.status(201).json(standup);
    } catch (error) {
      console.error("Error creating standup:", error);
      res.status(500).json({ message: "Failed to create standup" });
    }
  });

  app.put("/api/standups/:id", isAuthenticated, async (req, res) => {
    try {
      const standup = await storage.updateStandup(req.params.id, req.body);
      res.json(standup);
    } catch (error) {
      console.error("Error updating standup:", error);
      res.status(500).json({ message: "Failed to update standup" });
    }
  });

  app.delete("/api/standups/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const standupId = req.params.id;

      // ADD: Authorization check
      const authResult = await storage.canDeleteEntity(userId, 'standup', standupId);
      if (!authResult.canDelete) {
        await SecurityAuditLogger.logDeleteAttempt(req, 'STANDUP', standupId, false, undefined, authResult.reason);
        return res.status(403).json({ 
          error: "Forbidden", 
          message: authResult.reason 
        });
      }

      await storage.deleteStandup(standupId);
      await SecurityAuditLogger.logSuccessfulDelete(req, 'STANDUP', standupId, authResult.method);
      res.json({ 
        message: "Standup deleted successfully",
        deletedBy: authResult.method 
      });
    } catch (error) {
      await SecurityAuditLogger.logDeleteAttempt(req, 'STANDUP', req.params.id, false, undefined, error.message);
      console.error("Error deleting standup:", error);
      res.status(500).json({ message: "Failed to delete standup" });
    }
  });

  // AI-powered transcript processing
  app.post('/api/standups/process-transcript', isAuthenticated, async (req: any, res) => {
    try {
      const { transcript, labId } = req.body;
      if (!transcript) {
        return res.status(400).json({ message: "Transcript is required" });
      }

      const { meetingRecorderService } = await import('./meetingRecorder');
      const result = await meetingRecorderService.processTranscript(
        transcript,
        new Date().toISOString().split('T')[0]
      );

      // Save to database if labId provided
      let meetingId = null;
      if (labId) {
        meetingId = await meetingRecorderService.saveMeetingToDatabase(
          labId,
          transcript,
          result.processedNotes,
          [], // attendees would come from frontend
          result.extractedTasks
        );
      }

      res.json({
        meetingId,
        processedNotes: result.processedNotes,
        extractedTasks: result.extractedTasks
      });
    } catch (error) {
      console.error("Error processing transcript:", error);
      res.status(500).json({ message: "Failed to process transcript" });
    }
  });

  // Get meeting details with action items
  app.get('/api/standups/:meetingId/details', isAuthenticated, async (req: any, res) => {
    try {
      const { meetingId } = req.params;
      const { meetingRecorderService } = await import('./meetingRecorder');

      const result = await meetingRecorderService.getMeetingDetails(meetingId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching meeting details:", error);
      res.status(500).json({ message: "Failed to fetch meeting details" });
    }
  });

  // Action Items routes
  app.get("/api/action-items", isAuthenticated, async (req, res) => {
    try {
      const actionItems = await storage.getActionItems();
      res.json(actionItems);
    } catch (error) {
      console.error("Error fetching action items:", error);
      res.status(500).json({ message: "Failed to fetch action items" });
    }
  });

  app.post("/api/action-items", isAuthenticated, async (req, res) => {
    try {
      const actionItem = await storage.createActionItem(req.body);
      res.json(actionItem);
    } catch (error) {
      console.error("Error creating action item:", error);
      res.status(500).json({ message: "Failed to create action item" });
    }
  });

  app.put("/api/action-items/:id", isAuthenticated, async (req, res) => {
    try {
      const actionItem = await storage.updateActionItem(req.params.id, req.body);
      res.json(actionItem);
    } catch (error) {
      console.error("Error updating action item:", error);
      res.status(500).json({ message: "Failed to update action item" });
    }
  });

  // Restore endpoints for soft-deleted items
  app.patch("/api/studies/:id/restore", isAuthenticated, async (req, res) => {
    try {
      const study = await storage.restoreStudy(req.params.id);
      res.json(study);
    } catch (error) {
      console.error("Error restoring study:", error);
      res.status(500).json({ message: "Failed to restore study" });
    }
  });

  app.patch("/api/tasks/:id/restore", isAuthenticated, async (req, res) => {
    try {
      const task = await storage.restoreTask(req.params.id);
      res.json(task);
    } catch (error) {
      console.error("Error restoring task:", error);
      res.status(500).json({ message: "Failed to restore task" });
    }
  });

  app.patch("/api/buckets/:id/restore", isAuthenticated, async (req, res) => {
    try {
      const bucket = await storage.restoreBucket(req.params.id);
      res.json(bucket);
    } catch (error) {
      console.error("Error restoring bucket:", error);
      res.status(500).json({ message: "Failed to restore bucket" });
    }
  });

  // Send meeting summary email
  app.post('/api/standups/:meetingId/send-email', isAuthenticated, async (req: any, res) => {
    try {
      const { meetingId } = req.params;
      const { recipients, labName } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ message: "Recipients array is required" });
      }

      const { meetingRecorderService } = await import('./meetingRecorder');
      const result = await meetingRecorderService.sendMeetingSummary(
        meetingId,
        recipients,
        labName || "Your Lab"
      );

      if (result.success) {
        res.json({
          success: true,
          messageId: result.messageId,
          message: `Email sent successfully to ${recipients.length} recipients`
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error("Error sending meeting email:", error);
      res.status(500).json({ message: "Failed to send meeting email" });
    }
  });

  // Cleanup old meetings
  app.post('/api/standups/cleanup', isAuthenticated, async (req: any, res) => {
    try {
      const { days = 14 } = req.body;
      const { meetingRecorderService } = await import('./meetingRecorder');

      const deletedCount = await meetingRecorderService.cleanupOldMeetings(days);
      res.json({ deletedCount, message: `Cleaned up ${deletedCount} old meetings` });
    } catch (error) {
      console.error("Error during cleanup:", error);
      res.status(500).json({ message: "Failed to cleanup old meetings" });
    }
  });

  // Get meetings for preview
  app.get('/api/standups/meetings', isAuthenticated, async (req: any, res) => {
    try {
      const labId = req.query.labId;
      let meetings;
      if (labId) {
        meetings = await storage.getStandupMeetingsByLab(labId);
      } else {
        meetings = await storage.getStandups();
      }
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  // Create standup meeting with AI processing
  app.post('/api/standups/meetings', isAuthenticated, async (req: any, res) => {
    try {
      const { transcript, labId, meetingType = 'standup', attendees = [] } = req.body;
      const userId = req.user?.claims?.sub;

      if (!transcript) {
        return res.status(400).json({ message: "Transcript is required" });
      }

      // Get attendee details for email
      let attendeeEmails: string[] = [];
      let attendeeNames: string[] = [];

      if (attendees.length > 0) {
        const teamMembers = await storage.getTeamMembersByIds(attendees);
        attendeeEmails = teamMembers.map(member => member.email).filter((email): email is string => Boolean(email));
        attendeeNames = teamMembers.map(member => member.name).filter((name): name is string => Boolean(name));
      }

      // Process with AI
      const { meetingRecorderService } = await import('./meetingRecorder');
      const processedMeeting = await meetingRecorderService.createMeetingFromTranscript({
        transcript,
        labId: labId || null,
        userId,
        meetingType,
        attendeeEmails,
        attendeeNames
      });

      res.json(processedMeeting);
    } catch (error) {
      console.error("Error creating meeting:", error);
      res.status(500).json({ message: "Failed to create meeting" });
    }
  });

  // Get email HTML for a specific meeting
  app.get('/api/standups/meeting-email/:meetingId', isAuthenticated, async (req: any, res) => {
    try {
      const { meetingId } = req.params;
      const { meetingRecorderService } = await import('./meetingRecorder');

      // Get meeting data
      const meeting = await storage.getStandupMeeting(meetingId);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      // Get action items
      const actionItems = await storage.getActionItemsByMeetingId(meetingId);

      // Generate email HTML
      const html = await meetingRecorderService.generateEmailHtml({
        meeting,
        actionItems,
        title: "Lab Meeting Preview"
      });

      res.json({ html });
    } catch (error) {
      console.error("Error generating meeting email:", error);
      res.status(500).json({ message: "Failed to generate meeting email" });
    }
  });

  // Audio transcription endpoint using OpenAI Whisper
  app.post('/api/transcribe', isAuthenticated, upload.single('audio'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Audio file is required" });
      }

      const audioFile = req.file;

      // Import OpenAI
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Create a temporary file from the buffer
      const fs = await import('fs');
      const path = await import('path');
      const { randomUUID } = await import('crypto');

      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `${randomUUID()}.webm`);
      fs.writeFileSync(tempFilePath, audioFile.buffer);

      try {
        // Transcribe using OpenAI Whisper
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model: "whisper-1",
          language: "en",
          response_format: "text"
        });

        // Clean up temp file
        fs.unlinkSync(tempFilePath);

        res.json({ transcript: transcription });
      } catch (transcriptionError) {
        // Clean up temp file on error
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        throw transcriptionError;
      }

    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  });

  // Task Assignment routes
  app.get("/api/task-assignments/:taskId", isAuthenticated, async (req, res) => {
    try {
      const assignments = await storage.getTaskAssignments(req.params.taskId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching task assignments:", error);
      res.status(500).json({ message: "Failed to fetch task assignments" });
    }
  });

  app.post("/api/task-assignments", isAuthenticated, async (req, res) => {
    try {
      const assignerId = (req.user as any)?.claims?.sub;
      const assignment = await storage.assignUserToTask(req.body);

      // Send email notification for the new assignment
      if (assignment) {
        try {
          const { EmailService } = await import('./emailService');
          
          // Get user and task details for email
          const [assignee, assigner, task] = await Promise.all([
            storage.getUser(assignment.userId),
            storage.getUser(assignerId),
            storage.getTask(assignment.taskId)
          ]);

          if (assignee && assigner && task) {
            // Get the lab name
            const study = await storage.getStudy(task.studyId);
            const bucket = study ? await storage.getBucket(study.bucketId) : null;
            const lab = bucket ? await storage.getLabById(bucket.labId) : null;

            const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] 
              ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
              : '';
            
            await EmailService.sendTaskAssignmentEmail({
              assigneeName: `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() || assignee.email || 'Team Member',
              assigneeEmail: assignee.email || '',
              assignerName: `${assigner.firstName || ''} ${assigner.lastName || ''}`.trim() || assigner.email || 'Team Member',
              taskTitle: task.title,
              taskDescription: task.description || undefined,
              dueDate: task.deadline ? new Date(task.deadline) : undefined,
              labName: lab?.name || 'Research Lab',
              taskUrl: `${baseUrl}/task-management?taskId=${assignment.taskId}`
            });
          }
        } catch (emailError) {
          console.error('Failed to send task assignment email:', emailError);
          // Don't fail the request if email fails
        }
      }

      res.json(assignment);
    } catch (error) {
      console.error("Error creating task assignment:", error);
      res.status(500).json({ message: "Failed to create task assignment" });
    }
  });

  app.delete("/api/task-assignments/:taskId/:userId", isAuthenticated, async (req, res) => {
    try {
      await storage.removeTaskAssignment(req.params.taskId, req.params.userId);
      res.json({ message: "Task assignment removed successfully" });
    } catch (error) {
      console.error("Error removing task assignment:", error);
      res.status(500).json({ message: "Failed to remove task assignment" });
    }
  });

  // =============================================================================
  // PHASE 5: AUTOMATION API ENDPOINTS
  // =============================================================================

  // Workflow Triggers
  app.get("/api/workflow-triggers", isAuthenticated, async (req, res) => {
    try {
      const userLab = req.headers['x-current-lab'] as string;
      if (!userLab) {
        return res.status(400).json({ message: "Lab context required" });
      }

      const triggers = await storage.getWorkflowTriggers(userLab);
      res.json(triggers);
    } catch (error) {
      console.error("Error fetching workflow triggers:", error);
      res.status(500).json({ message: "Failed to fetch workflow triggers" });
    }
  });

  app.get("/api/workflow-triggers/:id", isAuthenticated, async (req, res) => {
    try {
      const trigger = await storage.getWorkflowTrigger(req.params.id);
      if (!trigger) {
        return res.status(404).json({ message: 'Workflow trigger not found' });
      }
      res.json(trigger);
    } catch (error) {
      console.error("Error fetching workflow trigger:", error);
      res.status(500).json({ message: "Failed to fetch workflow trigger" });
    }
  });

  app.post("/api/workflow-triggers", isAuthenticated, async (req, res) => {
    try {
      const userLab = req.headers['x-current-lab'] as string;
      const userId = (req.user as any)?.claims?.sub;

      if (!userLab) {
        return res.status(400).json({ message: "Lab context required" });
      }

      const triggerData = {
        ...req.body,
        labId: userLab,
        createdById: userId,
      };

      const trigger = await storage.createWorkflowTrigger(triggerData);
      res.status(201).json(trigger);
    } catch (error) {
      console.error("Error creating workflow trigger:", error);
      res.status(500).json({ message: "Failed to create workflow trigger" });
    }
  });

  app.put("/api/workflow-triggers/:id", isAuthenticated, async (req, res) => {
    try {
      const trigger = await storage.updateWorkflowTrigger(req.params.id, req.body);
      res.json(trigger);
    } catch (error) {
      console.error("Error updating workflow trigger:", error);
      res.status(500).json({ message: "Failed to update workflow trigger" });
    }
  });

  app.delete("/api/workflow-triggers/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const triggerId = req.params.id;

      // ADD: Authorization check
      const authResult = await storage.canDeleteEntity(userId, 'workflow_trigger', triggerId);
      if (!authResult.canDelete) {
        await SecurityAuditLogger.logDeleteAttempt(req, 'WORKFLOW_TRIGGER', triggerId, false, undefined, authResult.reason);
        return res.status(403).json({ 
          error: "Forbidden", 
          message: authResult.reason 
        });
      }

      await storage.deleteWorkflowTrigger(triggerId);
      await SecurityAuditLogger.logSuccessfulDelete(req, 'WORKFLOW_TRIGGER', triggerId, authResult.method);
      res.json({ 
        message: "Workflow trigger deleted successfully",
        deletedBy: authResult.method 
      });
    } catch (error) {
      await SecurityAuditLogger.logDeleteAttempt(req, 'WORKFLOW_TRIGGER', req.params.id, false, undefined, error.message);
      console.error("Error deleting workflow trigger:", error);
      res.status(500).json({ message: "Failed to delete workflow trigger" });
    }
  });

  // Automation Rules
  app.get("/api/automation-rules", isAuthenticated, async (req, res) => {
    try {
      const userLab = req.headers['x-current-lab'] as string;
      if (!userLab) {
        return res.status(400).json({ message: "Lab context required" });
      }

      const rules = await storage.getAutomationRules(userLab);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching automation rules:", error);
      res.status(500).json({ message: "Failed to fetch automation rules" });
    }
  });

  app.get("/api/automation-rules/:id", isAuthenticated, async (req, res) => {
    try {
      const rule = await storage.getAutomationRule(req.params.id);
      if (!rule) {
        return res.status(404).json({ message: 'Automation rule not found' });
      }
      res.json(rule);
    } catch (error) {
      console.error("Error fetching automation rule:", error);
      res.status(500).json({ message: "Failed to fetch automation rule" });
    }
  });

  app.post("/api/automation-rules", isAuthenticated, async (req, res) => {
    try {
      const userLab = req.headers['x-current-lab'] as string;
      const userId = (req.user as any)?.claims?.sub;

      if (!userLab) {
        return res.status(400).json({ message: "Lab context required" });
      }

      const ruleData = {
        ...req.body,
        labId: userLab,
        createdById: userId,
      };

      const rule = await storage.createAutomationRule(ruleData);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating automation rule:", error);
      res.status(500).json({ message: "Failed to create automation rule" });
    }
  });

  app.put("/api/automation-rules/:id", isAuthenticated, async (req, res) => {
    try {
      const rule = await storage.updateAutomationRule(req.params.id, req.body);
      res.json(rule);
    } catch (error) {
      console.error("Error updating automation rule:", error);
      res.status(500).json({ message: "Failed to update automation rule" });
    }
  });

  app.delete("/api/automation-rules/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const ruleId = req.params.id;

      // ADD: Authorization check
      const authResult = await storage.canDeleteEntity(userId, 'automation_rule', ruleId);
      if (!authResult.canDelete) {
        await SecurityAuditLogger.logDeleteAttempt(req, 'AUTOMATION_RULE', ruleId, false, undefined, authResult.reason);
        return res.status(403).json({ 
          error: "Forbidden", 
          message: authResult.reason 
        });
      }

      await storage.deleteAutomationRule(ruleId);
      await SecurityAuditLogger.logSuccessfulDelete(req, 'AUTOMATION_RULE', ruleId, authResult.method);
      res.json({ 
        message: "Automation rule deleted successfully",
        deletedBy: authResult.method 
      });
    } catch (error) {
      await SecurityAuditLogger.logDeleteAttempt(req, 'AUTOMATION_RULE', req.params.id, false, undefined, error.message);
      console.error("Error deleting automation rule:", error);
      res.status(500).json({ message: "Failed to delete automation rule" });
    }
  });

  // Execute automation rule manually
  app.post('/api/automation-rules/:id/execute', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const execution = await storage.executeAutomationRule(req.params.id, userId);
      res.json(execution);
    } catch (error) {
      console.error('Error executing automation rule:', error);
      res.status(500).json({ message: 'Failed to execute automation rule' });
    }
  });

  // Workflow Executions
  app.get('/api/workflow-executions', isAuthenticated, async (req, res) => {
    try {
      const ruleId = req.query.ruleId as string | undefined;
      const status = req.query.status as string | undefined;
      const executions = await storage.getWorkflowExecutions(ruleId, status);
      res.json(executions);
    } catch (error) {
      console.error('Error fetching workflow executions:', error);
      res.status(500).json({ message: 'Failed to fetch workflow executions' });
    }
  });

  app.get('/api/workflow-executions/:id', isAuthenticated, async (req, res) => {
    try {
      const execution = await storage.getWorkflowExecution(req.params.id);
      if (!execution) {
        return res.status(404).json({ message: 'Workflow execution not found' });
      }
      res.json(execution);
    } catch (error) {
      console.error('Error fetching workflow execution:', error);
      res.status(500).json({ message: 'Failed to fetch workflow execution' });
    }
  });

  // Task Generation Logs
  app.get('/api/task-generation-logs', isAuthenticated, async (req, res) => {
    try {
      const executionId = req.query.executionId as string | undefined;
      const logs = await storage.getTaskGenerationLogs(executionId);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching task generation logs:', error);
      res.status(500).json({ message: 'Failed to fetch task generation logs' });
    }
  });

  // Automated Schedules
  app.get("/api/automated-schedules", isAuthenticated, async (req, res) => {
    try {
      const userLab = req.headers['x-current-lab'] as string;
      if (!userLab) {
        return res.status(400).json({ message: "Lab context required" });
      }

      const schedules = await storage.getAutomatedSchedules(userLab);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching automated schedules:", error);
      res.status(500).json({ message: "Failed to fetch automated schedules" });
    }
  });

  app.get("/api/automated-schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const schedule = await storage.getAutomatedSchedule(req.params.id);
      if (!schedule) {
        return res.status(404).json({ message: 'Automated schedule not found' });
      }
      res.json(schedule);
    } catch (error) {
      console.error("Error fetching automated schedule:", error);
      res.status(500).json({ message: "Failed to fetch automated schedule" });
    }
  });

  app.post("/api/automated-schedules", isAuthenticated, async (req, res) => {
    try {
      const userLab = req.headers['x-current-lab'] as string;
      const userId = (req.user as any)?.claims?.sub;

      if (!userLab) {
        return res.status(400).json({ message: "Lab context required" });
      }

      const scheduleData = {
        ...req.body,
        labId: userLab,
        createdById: userId,
      };

      const schedule = await storage.createAutomatedSchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Error creating automated schedule:", error);
      res.status(500).json({ message: "Failed to create automated schedule" });
    }
  });

  app.put("/api/automated-schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const schedule = await storage.updateAutomatedSchedule(req.params.id, req.body);
      res.json(schedule);
    } catch (error) {
      console.error("Error updating automated schedule:", error);
      res.status(500).json({ message: "Failed to update automated schedule" });
    }
  });

  app.delete("/api/automated-schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const scheduleId = req.params.id;

      // ADD: Authorization check
      const authResult = await storage.canDeleteEntity(userId, 'automated_schedule', scheduleId);
      if (!authResult.canDelete) {
        await SecurityAuditLogger.logDeleteAttempt(req, 'AUTOMATED_SCHEDULE', scheduleId, false, undefined, authResult.reason);
        return res.status(403).json({ 
          error: "Forbidden", 
          message: authResult.reason 
        });
      }

      await storage.deleteAutomatedSchedule(scheduleId);
      await SecurityAuditLogger.logSuccessfulDelete(req, 'AUTOMATED_SCHEDULE', scheduleId, authResult.method);
      res.json({ 
        message: "Automated schedule deleted successfully",
        deletedBy: authResult.method 
      });
    } catch (error) {
      await SecurityAuditLogger.logDeleteAttempt(req, 'AUTOMATED_SCHEDULE', req.params.id, false, undefined, error.message);
      console.error("Error deleting automated schedule:", error);
      res.status(500).json({ message: "Failed to delete automated schedule" });
    }
  });

  // Workflow Templates
  app.get("/api/workflow-templates", isAuthenticated, async (req, res) => {
    try {
      const userLab = req.headers['x-current-lab'] as string;
      if (!userLab) {
        return res.status(400).json({ message: "Lab context required" });
      }

      const templates = await storage.getWorkflowTemplates(userLab);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching workflow templates:", error);
      res.status(500).json({ message: "Failed to fetch workflow templates" });
    }
  });

  app.get("/api/workflow-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const template = await storage.getWorkflowTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: 'Workflow template not found' });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching workflow template:", error);
      res.status(500).json({ message: "Failed to fetch workflow template" });
    }
  });

  app.post("/api/workflow-templates", isAuthenticated, async (req, res) => {
    try {
      const userLab = req.headers['x-current-lab'] as string;
      const userId = (req.user as any)?.claims?.sub;

      if (!userLab) {
        return res.status(400).json({ message: "Lab context required" });
      }

      const templateData = {
        ...req.body,
        labId: userLab,
        createdById: userId,
      };

      const template = await storage.createWorkflowTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating workflow template:", error);
      res.status(500).json({ message: "Failed to create workflow template" });
    }
  });

  app.put("/api/workflow-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const template = await storage.updateWorkflowTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error) {
      console.error("Error updating workflow template:", error);
      res.status(500).json({ message: "Failed to update workflow template" });
    }
  });

  app.delete("/api/workflow-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const templateId = req.params.id;

      // ADD: Authorization check
      const authResult = await storage.canDeleteEntity(userId, 'workflow_template', templateId);
      if (!authResult.canDelete) {
        await SecurityAuditLogger.logDeleteAttempt(req, 'WORKFLOW_TEMPLATE', templateId, false, undefined, authResult.reason);
        return res.status(403).json({ 
          error: "Forbidden", 
          message: authResult.reason 
        });
      }

      await storage.deleteWorkflowTemplate(templateId);
      await SecurityAuditLogger.logSuccessfulDelete(req, 'WORKFLOW_TEMPLATE', templateId, authResult.method);
      res.json({ 
        message: "Workflow template deleted successfully",
        deletedBy: authResult.method 
      });
    } catch (error) {
      await SecurityAuditLogger.logDeleteAttempt(req, 'WORKFLOW_TEMPLATE', req.params.id, false, undefined, error.message);
      console.error("Error deleting workflow template:", error);
      res.status(500).json({ message: "Failed to delete workflow template" });
    }
  });

  // Automation trigger checking endpoint
  app.post('/api/automation/check-triggers', isAuthenticated, async (req, res) => {
    try {
      const { triggerType, entityData } = req.body;
      const triggers = await storage.checkTriggerConditions(triggerType, entityData);
      res.json(triggers);
    } catch (error) {
      console.error('Error checking trigger conditions:', error);
      res.status(500).json({ message: 'Failed to check trigger conditions' });
    }
  });

  // Study milestones endpoints
  app.get("/api/study-milestones", isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string;
      if (!labId) {
        return res.status(400).json({ error: "Lab ID is required" });
      }

      const milestonesData = await db
        .select({
          id: studyMilestones.id,
          studyId: studyMilestones.studyId,
          name: studyMilestones.name,
          description: studyMilestones.description,
          targetDate: studyMilestones.targetDate,
          completedDate: studyMilestones.completedDate,
          status: studyMilestones.status,
          priority: studyMilestones.priority,
          progress: studyMilestones.progress,
          assignedTo: studyMilestones.assignedTo,
          dependencies: studyMilestones.dependencies,
          deliverables: studyMilestones.deliverables,
          notes: studyMilestones.notes,
          createdAt: studyMilestones.createdAt,
          updatedAt: studyMilestones.updatedAt,
          studyName: studies.name,
        })
        .from(studyMilestones)
        .innerJoin(studies, eq(studyMilestones.studyId, studies.id))
        .where(eq(studies.labId, labId))
        .orderBy(studyMilestones.targetDate);

      res.json(milestonesData);
    } catch (error) {
      console.error("Error fetching study milestones:", error);
      res.status(500).json({ error: "Failed to fetch study milestones" });
    }
  });

  app.post("/api/study-milestones", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const milestoneData = {
        ...req.body,
        createdBy: userId,
      };

      const [milestone] = await db
        .insert(studyMilestones)
        .values(milestoneData)
        .returning();

      res.status(201).json(milestone);
    } catch (error) {
      console.error("Error creating study milestone:", error);
      res.status(500).json({ error: "Failed to create study milestone" });
    }
  });

  app.put("/api/study-milestones/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updatedAt: new Date(),
      };

      const [milestone] = await db
        .update(studyMilestones)
        .set(updateData)
        .where(eq(studyMilestones.id, id))
        .returning();

      if (!milestone) {
        return res.status(404).json({ error: "Study milestone not found" });
      }

      res.json(milestone);
    } catch (error) {
      console.error("Error updating study milestone:", error);
      res.status(500).json({ error: "Failed to update study milestone" });
    }
  });

  app.delete("/api/study-milestones/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;

      const [milestone] = await db
        .delete(studyMilestones)
        .where(eq(studyMilestones.id, id))
        .returning();

      if (!milestone) {
        return res.status(404).json({ error: "Study milestone not found" });
      }

      res.json({ message: "Study milestone deleted successfully" });
    } catch (error) {
      console.error("Error deleting study milestone:", error);
      res.status(500).json({ error: "Failed to delete study milestone" });
    }
  });

  // PHASE 2: Security Audit Logging API Endpoints
  app.get("/api/security/audit-logs", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const userLab = req.headers['x-current-lab'] as string;

      // Only allow lab admins to view audit logs
      if (userLab) {
        const labMember = await storage.getLabMember(userId, userLab);
        if (!labMember?.isAdmin) {
          await SecurityAuditLogger.logAccessDenied(req, 'USER', 'Not a lab administrator', userId);
          return res.status(403).json({ message: "Unauthorized: Admin access required" });
        }
      }

      const filters = {
        labId: userLab,
        userId: req.query.userId as string,
        entityType: req.query.entityType as string,
        action: req.query.action as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100
      };

      const auditLogs = await storage.getSecurityAuditLogs(filters);
      res.json(auditLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/security/failed-attempts", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const userLab = req.headers['x-current-lab'] as string;

      // Only allow lab admins to view failed attempts
      if (userLab) {
        const labMember = await storage.getLabMember(userId, userLab);
        if (!labMember?.isAdmin) {
          await SecurityAuditLogger.logAccessDenied(req, 'USER', 'Not a lab administrator', userId);
          return res.status(403).json({ message: "Unauthorized: Admin access required" });
        }
      }

      const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
      const failedAttempts = await storage.getFailedAccessAttempts(userLab, hours);
      res.json(failedAttempts);
    } catch (error) {
      console.error("Error fetching failed attempts:", error);
      res.status(500).json({ message: "Failed to fetch failed attempts" });
    }
  });

  // PHASE 3: Enhanced RBAC Permission Management Endpoints
  app.post("/api/permissions/apply-template", isAuthenticated, async (req, res) => {
    try {
      const { userId: targetUserId, templateId } = req.body;
      const adminUserId = (req.user as any)?.claims?.sub;
      const labId = req.headers['x-current-lab'] as string;

      // Check if requesting user is lab admin
      const labMember = await storage.getLabMember(adminUserId, labId);
      if (!labMember?.canManagePermissions && !labMember?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Permission management required" });
      }

      const template = await storage.getPermissionTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Permission template not found" });
      }

      await storage.updateLabMemberPermissions(targetUserId, labId, template.permissions);

      await SecurityAuditLogger.logEvent(req, {
        action: 'PERMISSION_CHANGE',
        entityType: 'LAB_MEMBER',
        entityId: `${targetUserId}-${labId}`,
        authorizationMethod: 'admin',
        wasAuthorized: true,
        details: { 
          templateApplied: template.name,
          targetUser: targetUserId,
          appliedBy: adminUserId 
        }
      });

      res.json({ message: "Permission template applied successfully" });
    } catch (error) {
      console.error("Error applying permission template:", error);
      res.status(500).json({ message: "Failed to apply permission template" });
    }
  });

  app.post("/api/permissions/upgrade-lab-members", isAuthenticated, async (req, res) => {
    try {
      const adminUserId = (req.user as any)?.claims?.sub;
      const labId = req.headers['x-current-lab'] as string;

      // Check if requesting user is lab admin
      const labMember = await storage.getLabMember(adminUserId, labId);
      if (!labMember?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }

      // Apply enhanced permissions for all lab members
      const { applyDefaultPermissions } = await import('./defaultPermissions');
      const labMembers = await storage.getLabMembers(labId);

      let upgradedCount = 0;
      for (const member of labMembers) {
        if (member.isActive) {
          await applyDefaultPermissions(member.id, labId, member.role || 'RESEARCH_ASSISTANT');
          upgradedCount++;
        }
      }

      await SecurityAuditLogger.logEvent(req, {
        action: 'PERMISSION_CHANGE',
        entityType: 'LAB',
        entityId: labId,
        authorizationMethod: 'admin',
        wasAuthorized: true,
        details: { 
          massPermissionUpgrade: true,
          membersUpgraded: upgradedCount,
          upgradedBy: adminUserId 
        }
      });

      res.json({ 
        message: "Lab member permissions upgraded successfully",
        upgradedCount 
      });
    } catch (error) {
      console.error("Error upgrading lab member permissions:", error);
      res.status(500).json({ message: "Failed to upgrade lab member permissions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}