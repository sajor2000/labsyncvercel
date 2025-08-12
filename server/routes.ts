import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import { studyMilestones, users, labs, buckets, studies, tasks, teamMembers, standupMeetings, sessions, deadlines, labMembers, ideas } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";


export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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

  app.put('/api/auth/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.updateUserProfile(userId, req.body);
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.put('/api/auth/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.updateUserSettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.post('/api/auth/export-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userData = await storage.exportUserData(userId);
      res.json(userData);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  app.delete('/api/auth/delete-account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
        createdBy: req.user.claims.sub // Set ownership
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
      const userId = req.user.claims.sub;
      const bucketId = req.params.id;
      
      // Check authorization 
      const authResult = await storage.canDeleteEntity(userId, 'bucket', bucketId);
      if (!authResult.canDelete) {
        return res.status(403).json({ 
          error: "Forbidden", 
          message: authResult.reason 
        });
      }
      
      await storage.deleteBucket(bucketId);
      res.json({ 
        message: "Bucket deleted successfully",
        deletedBy: authResult.method 
      });
    } catch (error) {
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
      const userId = req.user.claims.sub;
      const studyId = req.params.id;
      const cascade = req.query.cascade === 'true';
      
      // Check authorization
      const authResult = await storage.canDeleteEntity(userId, 'study', studyId);
      if (!authResult.canDelete) {
        return res.status(403).json({ 
          error: "Forbidden", 
          message: authResult.reason 
        });
      }
      
      await storage.deleteStudy(studyId, cascade);
      res.json({ 
        message: "Study deleted successfully",
        deletedBy: authResult.method 
      });
    } catch (error) {
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const taskId = req.params.id;
      
      // Check authorization
      const authResult = await storage.canDeleteEntity(userId, 'task', taskId);
      if (!authResult.canDelete) {
        return res.status(403).json({ 
          error: "Forbidden", 
          message: authResult.reason 
        });
      }
      
      await storage.deleteTask(taskId);
      res.json({ 
        message: "Task deleted successfully",
        deletedBy: authResult.method 
      });
    } catch (error) {
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
      
      // Validate assigneeId if provided (should be a valid UUID or null/undefined for unassigning)
      if (assigneeId && typeof assigneeId !== 'string') {
        return res.status(400).json({ 
          message: "Invalid assigneeId. Must be a valid user ID string." 
        });
      }
      
      const task = await storage.updateTask(req.params.id, { assigneeId });
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
      const userId = req.user.claims.sub;
      const ideaId = req.params.id;
      
      // Check authorization
      const authResult = await storage.canDeleteEntity(userId, 'idea', ideaId);
      if (!authResult.canDelete) {
        return res.status(403).json({ 
          error: "Forbidden", 
          message: authResult.reason 
        });
      }
      
      await storage.deleteIdea(ideaId);
      res.json({ 
        message: "Idea deleted successfully",
        deletedBy: authResult.method 
      });
    } catch (error) {
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
      const userId = req.user.claims.sub;
      const deadlineId = req.params.id;
      
      // Check authorization
      const authResult = await storage.canDeleteEntity(userId, 'deadline', deadlineId);
      if (!authResult.canDelete) {
        return res.status(403).json({ 
          error: "Forbidden", 
          message: authResult.reason 
        });
      }
      
      await storage.deleteDeadline(deadlineId);
      res.json({ 
        message: "Deadline deleted successfully",
        deletedBy: authResult.method 
      });
    } catch (error) {
      console.error("Error deleting deadline:", error);
      res.status(500).json({ message: "Failed to delete deadline" });
    }
  });

  // Standups routes
  app.get("/api/standups", isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string;
      const standups = await storage.getStandups(labId);
      res.json(standups);
    } catch (error) {
      console.error("Error fetching standups:", error);
      res.status(500).json({ message: "Failed to fetch standups" });
    }
  });

  app.post("/api/standups", isAuthenticated, async (req, res) => {
    try {
      const standup = await storage.createStandup(req.body);
      res.json(standup);
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
      await storage.deleteStandup(req.params.id);
      res.json({ message: "Standup deleted successfully" });
    } catch (error) {
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
      const assignment = await storage.assignUserToTask(req.body);
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
  app.get('/api/workflow-triggers', isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string | undefined;
      const triggers = await storage.getWorkflowTriggers(labId);
      res.json(triggers);
    } catch (error) {
      console.error('Error fetching workflow triggers:', error);
      res.status(500).json({ message: 'Failed to fetch workflow triggers' });
    }
  });

  app.get('/api/workflow-triggers/:id', isAuthenticated, async (req, res) => {
    try {
      const trigger = await storage.getWorkflowTrigger(req.params.id);
      if (!trigger) {
        return res.status(404).json({ message: 'Workflow trigger not found' });
      }
      res.json(trigger);
    } catch (error) {
      console.error('Error fetching workflow trigger:', error);
      res.status(500).json({ message: 'Failed to fetch workflow trigger' });
    }
  });

  app.post('/api/workflow-triggers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const trigger = await storage.createWorkflowTrigger({
        ...req.body,
        createdById: userId,
      });
      res.json(trigger);
    } catch (error) {
      console.error('Error creating workflow trigger:', error);
      res.status(500).json({ message: 'Failed to create workflow trigger' });
    }
  });

  app.put('/api/workflow-triggers/:id', isAuthenticated, async (req, res) => {
    try {
      const trigger = await storage.updateWorkflowTrigger(req.params.id, req.body);
      res.json(trigger);
    } catch (error) {
      console.error('Error updating workflow trigger:', error);
      res.status(500).json({ message: 'Failed to update workflow trigger' });
    }
  });

  app.delete('/api/workflow-triggers/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteWorkflowTrigger(req.params.id);
      res.json({ message: 'Workflow trigger deleted successfully' });
    } catch (error) {
      console.error('Error deleting workflow trigger:', error);
      res.status(500).json({ message: 'Failed to delete workflow trigger' });
    }
  });

  // Automation Rules
  app.get('/api/automation-rules', isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string | undefined;
      const triggerId = req.query.triggerId as string | undefined;
      const rules = await storage.getAutomationRules(labId, triggerId);
      res.json(rules);
    } catch (error) {
      console.error('Error fetching automation rules:', error);
      res.status(500).json({ message: 'Failed to fetch automation rules' });
    }
  });

  app.get('/api/automation-rules/:id', isAuthenticated, async (req, res) => {
    try {
      const rule = await storage.getAutomationRule(req.params.id);
      if (!rule) {
        return res.status(404).json({ message: 'Automation rule not found' });
      }
      res.json(rule);
    } catch (error) {
      console.error('Error fetching automation rule:', error);
      res.status(500).json({ message: 'Failed to fetch automation rule' });
    }
  });

  app.post('/api/automation-rules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const rule = await storage.createAutomationRule({
        ...req.body,
        createdById: userId,
      });
      res.json(rule);
    } catch (error) {
      console.error('Error creating automation rule:', error);
      res.status(500).json({ message: 'Failed to create automation rule' });
    }
  });

  app.put('/api/automation-rules/:id', isAuthenticated, async (req, res) => {
    try {
      const rule = await storage.updateAutomationRule(req.params.id, req.body);
      res.json(rule);
    } catch (error) {
      console.error('Error updating automation rule:', error);
      res.status(500).json({ message: 'Failed to update automation rule' });
    }
  });

  app.delete('/api/automation-rules/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteAutomationRule(req.params.id);
      res.json({ message: 'Automation rule deleted successfully' });
    } catch (error) {
      console.error('Error deleting automation rule:', error);
      res.status(500).json({ message: 'Failed to delete automation rule' });
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
  app.get('/api/automated-schedules', isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string | undefined;
      const schedules = await storage.getAutomatedSchedules(labId);
      res.json(schedules);
    } catch (error) {
      console.error('Error fetching automated schedules:', error);
      res.status(500).json({ message: 'Failed to fetch automated schedules' });
    }
  });

  app.get('/api/automated-schedules/:id', isAuthenticated, async (req, res) => {
    try {
      const schedule = await storage.getAutomatedSchedule(req.params.id);
      if (!schedule) {
        return res.status(404).json({ message: 'Automated schedule not found' });
      }
      res.json(schedule);
    } catch (error) {
      console.error('Error fetching automated schedule:', error);
      res.status(500).json({ message: 'Failed to fetch automated schedule' });
    }
  });

  app.post('/api/automated-schedules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const schedule = await storage.createAutomatedSchedule({
        ...req.body,
        createdById: userId,
      });
      res.json(schedule);
    } catch (error) {
      console.error('Error creating automated schedule:', error);
      res.status(500).json({ message: 'Failed to create automated schedule' });
    }
  });

  app.put('/api/automated-schedules/:id', isAuthenticated, async (req, res) => {
    try {
      const schedule = await storage.updateAutomatedSchedule(req.params.id, req.body);
      res.json(schedule);
    } catch (error) {
      console.error('Error updating automated schedule:', error);
      res.status(500).json({ message: 'Failed to update automated schedule' });
    }
  });

  app.delete('/api/automated-schedules/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteAutomatedSchedule(req.params.id);
      res.json({ message: 'Automated schedule deleted successfully' });
    } catch (error) {
      console.error('Error deleting automated schedule:', error);
      res.status(500).json({ message: 'Failed to delete automated schedule' });
    }
  });

  // Workflow Templates
  app.get('/api/workflow-templates', isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string | undefined;
      const isPublic = req.query.isPublic === 'true';
      const templates = await storage.getWorkflowTemplates(labId, isPublic);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching workflow templates:', error);
      res.status(500).json({ message: 'Failed to fetch workflow templates' });
    }
  });

  app.get('/api/workflow-templates/:id', isAuthenticated, async (req, res) => {
    try {
      const template = await storage.getWorkflowTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: 'Workflow template not found' });
      }
      res.json(template);
    } catch (error) {
      console.error('Error fetching workflow template:', error);
      res.status(500).json({ message: 'Failed to fetch workflow template' });
    }
  });

  app.post('/api/workflow-templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const template = await storage.createWorkflowTemplate({
        ...req.body,
        createdById: userId,
      });
      res.json(template);
    } catch (error) {
      console.error('Error creating workflow template:', error);
      res.status(500).json({ message: 'Failed to create workflow template' });
    }
  });

  app.put('/api/workflow-templates/:id', isAuthenticated, async (req, res) => {
    try {
      const template = await storage.updateWorkflowTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error) {
      console.error('Error updating workflow template:', error);
      res.status(500).json({ message: 'Failed to update workflow template' });
    }
  });

  app.delete('/api/workflow-templates/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteWorkflowTemplate(req.params.id);
      res.json({ message: 'Workflow template deleted successfully' });
    } catch (error) {
      console.error('Error deleting workflow template:', error);
      res.status(500).json({ message: 'Failed to delete workflow template' });
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

  const httpServer = createServer(app);
  return httpServer;
}