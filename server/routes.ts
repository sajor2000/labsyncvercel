import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { createSampleData } from "./sampleData";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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
      const lab = await storage.createLab(req.body);
      res.json(lab);
    } catch (error) {
      console.error("Error creating lab:", error);
      res.status(500).json({ message: "Failed to create lab" });
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

  app.post("/api/buckets", isAuthenticated, async (req, res) => {
    try {
      const bucket = await storage.createBucket(req.body);
      res.json(bucket);
    } catch (error) {
      console.error("Error creating bucket:", error);
      res.status(500).json({ message: "Failed to create bucket" });
    }
  });

  app.delete("/api/buckets/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteBucket(req.params.id);
      res.json({ message: "Bucket deleted successfully" });
    } catch (error) {
      console.error("Error deleting bucket:", error);
      res.status(500).json({ message: "Failed to delete bucket" });
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

  app.post("/api/studies", isAuthenticated, async (req, res) => {
    try {
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
      await storage.deleteStudy(req.params.id);
      res.json({ message: "Study deleted successfully" });
    } catch (error) {
      console.error("Error deleting study:", error);
      res.status(500).json({ message: "Failed to delete study" });
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

  // Task routes
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const task = await storage.createTask(req.body);
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

  // Team member routes
  app.get("/api/team-members", isAuthenticated, async (req, res) => {
    try {
      const members = await storage.getTeamMembers();
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.post("/api/team-members", isAuthenticated, async (req, res) => {
    try {
      const member = await storage.createTeamMember(req.body);
      res.json(member);
    } catch (error) {
      console.error("Error creating team member:", error);
      res.status(500).json({ message: "Failed to create team member" });
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

  // Team member assignment routes
  app.get("/api/team-member-assignments", isAuthenticated, async (req, res) => {
    try {
      const assignments = await storage.getTeamMemberAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching team member assignments:", error);
      res.status(500).json({ message: "Failed to fetch team member assignments" });
    }
  });

  app.post("/api/team-member-assignments", isAuthenticated, async (req, res) => {
    try {
      const assignment = await storage.createTeamMemberAssignment(req.body);
      res.json(assignment);
    } catch (error) {
      console.error("Error creating team member assignment:", error);
      res.status(500).json({ message: "Failed to create team member assignment" });
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
      await storage.deleteIdea(req.params.id);
      res.json({ message: "Idea deleted successfully" });
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
      await storage.deleteDeadline(req.params.id);
      res.json({ message: "Deadline deleted successfully" });
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

  // User profile and settings routes
  app.put("/api/auth/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updatedUser = await storage.updateUserProfile(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/auth/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/auth/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.updateUserSettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.post("/api/auth/export-data", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Mock implementation - in real app would generate and email data export
      res.json({ message: "Data export initiated" });
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  app.delete("/api/auth/delete-account", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteUser(userId);
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Sample data route
  app.post("/api/create-sample-data", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await createSampleData();
      res.json({ message: "Sample data created successfully" });
    } catch (error) {
      console.error("Error creating sample data:", error);
      res.status(500).json({ message: "Failed to create sample data" });
    }
  });

  // Enhanced CRUD operations - Soft delete endpoints
  app.patch("/api/studies/:id/soft-delete", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deletedStudy = await storage.softDeleteStudy(id);
      res.json(deletedStudy);
    } catch (error) {
      console.error("Error soft deleting study:", error);
      res.status(500).json({ message: "Failed to soft delete study" });
    }
  });

  app.patch("/api/tasks/:id/soft-delete", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deletedTask = await storage.softDeleteTask(id);
      res.json(deletedTask);
    } catch (error) {
      console.error("Error soft deleting task:", error);
      res.status(500).json({ message: "Failed to soft delete task" });
    }
  });

  app.patch("/api/buckets/:id/soft-delete", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deletedBucket = await storage.softDeleteBucket(id);
      res.json(deletedBucket);
    } catch (error) {
      console.error("Error soft deleting bucket:", error);
      res.status(500).json({ message: "Failed to soft delete bucket" });
    }
  });

  // Position update endpoint
  app.patch("/api/items/:type/:id/position", isAuthenticated, async (req: any, res) => {
    try {
      const { type, id } = req.params;
      const { position } = req.body;
      
      if (!['bucket', 'study', 'task'].includes(type)) {
        return res.status(400).json({ message: "Invalid item type" });
      }
      
      await storage.updateItemPosition(type as 'bucket' | 'study' | 'task', id, position);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating item position:", error);
      res.status(500).json({ message: "Failed to update item position" });
    }
  });

  // Project member management
  app.get("/api/projects/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const members = await storage.getProjectMembers(id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching project members:", error);
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });

  app.post("/api/projects/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { userId, role } = req.body;
      
      // CRITICAL: Get project's lab for cross-lab validation
      const project = await storage.getStudy(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const member = await storage.addProjectMember({
        projectId: id,
        userId,
        labId: project.labId, // REQUIRED for cross-lab security
        role: role || 'contributor'
      });
      
      res.status(201).json(member);
    } catch (error: any) {
      console.error("Error adding project member:", error);
      res.status(400).json({ message: error.message || "Failed to add project member" });
    }
  });

  app.delete("/api/projects/:projectId/members/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId, userId } = req.params;
      await storage.removeProjectMember(projectId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing project member:", error);
      res.status(500).json({ message: "Failed to remove project member" });
    }
  });

  // Task assignment management
  app.get("/api/tasks/:id/assignments", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const assignments = await storage.getTaskAssignments(id);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching task assignments:", error);
      res.status(500).json({ message: "Failed to fetch task assignments" });
    }
  });

  app.post("/api/tasks/:id/assignments", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      // CRITICAL: Get task's project for validation
      const allTasks = await storage.getTasks();
      const task = allTasks.find(t => t.id === id);
      if (!task?.studyId) {
        return res.status(404).json({ message: "Task or associated project not found" });
      }
      
      // Use the validated assignment method
      const assignment = await storage.assignTaskWithValidation({
        taskId: id,
        userId,
        projectId: task.studyId, // REQUIRED for validation
        isActive: true
      });
      
      res.status(201).json(assignment);
    } catch (error: any) {
      console.error("Error assigning user to task:", error);
      res.status(400).json({ message: error.message || "Failed to assign user to task" });
    }
  });

  app.delete("/api/tasks/:taskId/assignments/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const { taskId, userId } = req.params;
      await storage.removeTaskAssignment(taskId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing task assignment:", error);
      res.status(500).json({ message: "Failed to remove task assignment" });
    }
  });

  // Restore functionality endpoints
  app.patch("/api/studies/:id/restore", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const restoredStudy = await storage.restoreStudy(id);
      res.json(restoredStudy);
    } catch (error) {
      console.error("Error restoring study:", error);
      res.status(500).json({ message: "Failed to restore study" });
    }
  });

  app.patch("/api/tasks/:id/restore", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const restoredTask = await storage.restoreTask(id);
      res.json(restoredTask);
    } catch (error) {
      console.error("Error restoring task:", error);
      res.status(500).json({ message: "Failed to restore task" });
    }
  });

  app.patch("/api/buckets/:id/restore", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const restoredBucket = await storage.restoreBucket(id);
      res.json(restoredBucket);
    } catch (error) {
      console.error("Error restoring bucket:", error);
      res.status(500).json({ message: "Failed to restore bucket" });
    }
  });

  // PHASE 3: PROJECT MANAGEMENT ENDPOINTS
  
  // Status History routes
  app.get("/api/status-history/:entityType/:entityId", isAuthenticated, async (req: any, res) => {
    try {
      const { entityType, entityId } = req.params;
      const history = await storage.getStatusHistory(entityType, entityId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching status history:", error);
      res.status(500).json({ message: "Failed to fetch status history" });
    }
  });

  app.post("/api/status-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const historyData = {
        ...req.body,
        changedById: userId,
        changedAt: new Date()
      };
      const history = await storage.createStatusHistory(historyData);
      res.json(history);
    } catch (error) {
      console.error("Error creating status history:", error);
      res.status(500).json({ message: "Failed to create status history" });
    }
  });

  // Time Entry routes
  app.get("/api/time-entries", isAuthenticated, async (req: any, res) => {
    try {
      const { taskId, userId, projectId } = req.query;
      const timeEntries = await storage.getTimeEntries(taskId, userId, projectId);
      res.json(timeEntries);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  app.post("/api/time-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entryData = {
        ...req.body,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const timeEntry = await storage.createTimeEntry(entryData);
      res.json(timeEntry);
    } catch (error) {
      console.error("Error creating time entry:", error);
      res.status(500).json({ message: "Failed to create time entry" });
    }
  });

  app.put("/api/time-entries/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const timeEntry = await storage.updateTimeEntry(id, req.body);
      res.json(timeEntry);
    } catch (error) {
      console.error("Error updating time entry:", error);
      res.status(500).json({ message: "Failed to update time entry" });
    }
  });

  app.delete("/api/time-entries/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTimeEntry(id);
      res.json({ message: "Time entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting time entry:", error);
      res.status(500).json({ message: "Failed to delete time entry" });
    }
  });

  // Project time tracking endpoints
  app.get("/api/projects/:id/time-entries", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const timeEntries = await storage.getProjectTimeEntries(
        id,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      res.json(timeEntries);
    } catch (error) {
      console.error("Error fetching project time entries:", error);
      res.status(500).json({ message: "Failed to fetch project time entries" });
    }
  });

  // User time tracking endpoints
  app.get("/api/users/:id/time-entries", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const timeEntries = await storage.getUserTimeEntries(
        id,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      res.json(timeEntries);
    } catch (error) {
      console.error("Error fetching user time entries:", error);
      res.status(500).json({ message: "Failed to fetch user time entries" });
    }
  });

  // Notification management routes
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const notification = await storage.createNotification(req.body);
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Comment system routes
  app.get("/api/comments/:entityType/:entityId", isAuthenticated, async (req: any, res) => {
    try {
      const { entityType, entityId } = req.params;
      const comments = await storage.getComments(entityType, entityId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentData = {
        ...req.body,
        authorId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Attachment system routes
  app.get("/api/attachments/:entityType/:entityId", isAuthenticated, async (req: any, res) => {
    try {
      const { entityType, entityId } = req.params;
      const attachments = await storage.getAttachments(entityType, entityId);
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });

  app.post("/api/attachments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const attachmentData = {
        ...req.body,
        uploadedById: userId,
        uploadedAt: new Date()
      };
      const attachment = await storage.createAttachment(attachmentData);
      res.json(attachment);
    } catch (error) {
      console.error("Error creating attachment:", error);
      res.status(500).json({ message: "Failed to create attachment" });
    }
  });

  app.delete("/api/attachments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAttachment(id);
      res.json({ message: "Attachment deleted successfully" });
    } catch (error) {
      console.error("Error deleting attachment:", error);
      res.status(500).json({ message: "Failed to delete attachment" });
    }
  });

  // Bucket membership routes
  app.get("/api/buckets/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const members = await storage.getBucketMembers(id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching bucket members:", error);
      res.status(500).json({ message: "Failed to fetch bucket members" });
    }
  });

  app.post("/api/buckets/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const memberData = {
        ...req.body,
        bucketId: id,
        joinedAt: new Date()
      };
      const member = await storage.addBucketMember(memberData);
      res.json(member);
    } catch (error) {
      console.error("Error adding bucket member:", error);
      res.status(500).json({ message: "Failed to add bucket member" });
    }
  });

  app.delete("/api/buckets/:bucketId/members/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const { bucketId, userId } = req.params;
      await storage.removeBucketMember(bucketId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing bucket member:", error);
      res.status(500).json({ message: "Failed to remove bucket member" });
    }
  });

  // Endpoints to fetch deleted items
  app.get("/api/studies/deleted", isAuthenticated, async (req: any, res) => {
    try {
      const labId = req.query.labId as string;
      const deletedStudies = await storage.getDeletedStudies(labId);
      res.json(deletedStudies);
    } catch (error) {
      console.error("Error fetching deleted studies:", error);
      res.status(500).json({ message: "Failed to fetch deleted studies" });
    }
  });

  app.get("/api/tasks/deleted", isAuthenticated, async (req: any, res) => {
    try {
      const labId = req.query.labId as string;
      const deletedTasks = await storage.getDeletedTasks(labId);
      res.json(deletedTasks);
    } catch (error) {
      console.error("Error fetching deleted tasks:", error);
      res.status(500).json({ message: "Failed to fetch deleted tasks" });
    }
  });

  app.get("/api/buckets/deleted", isAuthenticated, async (req: any, res) => {
    try {
      const labId = req.query.labId as string;
      const deletedBuckets = await storage.getDeletedBuckets(labId);
      res.json(deletedBuckets);
    } catch (error) {
      console.error("Error fetching deleted buckets:", error);
      res.status(500).json({ message: "Failed to fetch deleted buckets" });
    }
  });

  // PHASE 4: ENHANCED ORGANIZATION ENDPOINTS
  
  // Tags management
  app.get("/api/tags", isAuthenticated, async (req: any, res) => {
    try {
      const labId = req.query.labId as string;
      const tags = await storage.getTags(labId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.post("/api/tags", isAuthenticated, async (req: any, res) => {
    try {
      const tag = await storage.createTag(req.body);
      res.json(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Failed to create tag" });
    }
  });

  app.put("/api/tags/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const tag = await storage.updateTag(id, req.body);
      res.json(tag);
    } catch (error) {
      console.error("Error updating tag:", error);
      res.status(500).json({ message: "Failed to update tag" });
    }
  });

  app.delete("/api/tags/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTag(id);
      res.json({ message: "Tag deleted successfully" });
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // Task tagging
  app.get("/api/tasks/:id/tags", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const tags = await storage.getTaskTags(id);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching task tags:", error);
      res.status(500).json({ message: "Failed to fetch task tags" });
    }
  });

  app.post("/api/tasks/:id/tags", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { tagId } = req.body;
      const userId = req.user.claims.sub;
      const taskTag = await storage.addTaskTag({
        taskId: id,
        tagId,
        taggedById: userId,
        taggedAt: new Date()
      });
      res.json(taskTag);
    } catch (error) {
      console.error("Error adding task tag:", error);
      res.status(500).json({ message: "Failed to add task tag" });
    }
  });

  app.delete("/api/tasks/:taskId/tags/:tagId", isAuthenticated, async (req: any, res) => {
    try {
      const { taskId, tagId } = req.params;
      await storage.removeTaskTag(taskId, tagId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing task tag:", error);
      res.status(500).json({ message: "Failed to remove task tag" });
    }
  });

  // Project tagging
  app.get("/api/projects/:id/tags", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const tags = await storage.getProjectTags(id);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching project tags:", error);
      res.status(500).json({ message: "Failed to fetch project tags" });
    }
  });

  app.post("/api/projects/:id/tags", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { tagId } = req.body;
      const userId = req.user.claims.sub;
      const projectTag = await storage.addProjectTag({
        projectId: id,
        tagId,
        taggedById: userId,
        taggedAt: new Date()
      });
      res.json(projectTag);
    } catch (error) {
      console.error("Error adding project tag:", error);
      res.status(500).json({ message: "Failed to add project tag" });
    }
  });

  app.delete("/api/projects/:projectId/tags/:tagId", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId, tagId } = req.params;
      await storage.removeProjectTag(projectId, tagId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing project tag:", error);
      res.status(500).json({ message: "Failed to remove project tag" });
    }
  });

  // Custom Fields management
  app.get("/api/custom-fields", isAuthenticated, async (req: any, res) => {
    try {
      const { labId, entityType } = req.query;
      const fields = await storage.getCustomFields(labId, entityType);
      res.json(fields);
    } catch (error) {
      console.error("Error fetching custom fields:", error);
      res.status(500).json({ message: "Failed to fetch custom fields" });
    }
  });

  app.post("/api/custom-fields", isAuthenticated, async (req: any, res) => {
    try {
      const field = await storage.createCustomField(req.body);
      res.json(field);
    } catch (error) {
      console.error("Error creating custom field:", error);
      res.status(500).json({ message: "Failed to create custom field" });
    }
  });

  app.put("/api/custom-fields/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const field = await storage.updateCustomField(id, req.body);
      res.json(field);
    } catch (error) {
      console.error("Error updating custom field:", error);
      res.status(500).json({ message: "Failed to update custom field" });
    }
  });

  app.delete("/api/custom-fields/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCustomField(id);
      res.json({ message: "Custom field deleted successfully" });
    } catch (error) {
      console.error("Error deleting custom field:", error);
      res.status(500).json({ message: "Failed to delete custom field" });
    }
  });

  // Custom Field Values
  app.get("/api/custom-field-values/:entityId", isAuthenticated, async (req: any, res) => {
    try {
      const { entityId } = req.params;
      const values = await storage.getCustomFieldValues(entityId);
      res.json(values);
    } catch (error) {
      console.error("Error fetching custom field values:", error);
      res.status(500).json({ message: "Failed to fetch custom field values" });
    }
  });

  app.put("/api/custom-field-values", isAuthenticated, async (req: any, res) => {
    try {
      const value = await storage.setCustomFieldValue(req.body);
      res.json(value);
    } catch (error) {
      console.error("Error setting custom field value:", error);
      res.status(500).json({ message: "Failed to set custom field value" });
    }
  });

  // Task Templates
  app.get("/api/task-templates", isAuthenticated, async (req: any, res) => {
    try {
      const labId = req.query.labId as string;
      const templates = await storage.getTaskTemplates(labId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching task templates:", error);
      res.status(500).json({ message: "Failed to fetch task templates" });
    }
  });

  app.post("/api/task-templates", isAuthenticated, async (req: any, res) => {
    try {
      const template = await storage.createTaskTemplate(req.body);
      res.json(template);
    } catch (error) {
      console.error("Error creating task template:", error);
      res.status(500).json({ message: "Failed to create task template" });
    }
  });

  app.put("/api/task-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const template = await storage.updateTaskTemplate(id, req.body);
      res.json(template);
    } catch (error) {
      console.error("Error updating task template:", error);
      res.status(500).json({ message: "Failed to update task template" });
    }
  });

  app.delete("/api/task-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTaskTemplate(id);
      res.json({ message: "Task template deleted successfully" });
    } catch (error) {
      console.error("Error deleting task template:", error);
      res.status(500).json({ message: "Failed to delete task template" });
    }
  });

  // Recurring Tasks
  app.get("/api/recurring-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const labId = req.query.labId as string;
      const recurringTasks = await storage.getRecurringTasks(labId);
      res.json(recurringTasks);
    } catch (error) {
      console.error("Error fetching recurring tasks:", error);
      res.status(500).json({ message: "Failed to fetch recurring tasks" });
    }
  });

  app.post("/api/recurring-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const recurringTask = await storage.createRecurringTask(req.body);
      res.json(recurringTask);
    } catch (error) {
      console.error("Error creating recurring task:", error);
      res.status(500).json({ message: "Failed to create recurring task" });
    }
  });

  app.put("/api/recurring-tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const recurringTask = await storage.updateRecurringTask(id, req.body);
      res.json(recurringTask);
    } catch (error) {
      console.error("Error updating recurring task:", error);
      res.status(500).json({ message: "Failed to update recurring task" });
    }
  });

  app.delete("/api/recurring-tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRecurringTask(id);
      res.json({ message: "Recurring task deleted successfully" });
    } catch (error) {
      console.error("Error deleting recurring task:", error);
      res.status(500).json({ message: "Failed to delete recurring task" });
    }
  });

  // User Preferences
  app.get("/api/auth/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences || null);
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Failed to fetch user preferences" });
    }
  });

  app.put("/api/auth/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferencesData = {
        ...req.body,
        userId,
      };
      const preferences = await storage.upsertUserPreferences(preferencesData);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  // Enhanced study and task update routes with status history tracking
  app.put("/api/studies/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const userId = req.user.claims.sub;
      
      // Get current study to track old status
      const currentStudy = await storage.getStudy(id);
      if (!currentStudy) {
        return res.status(404).json({ message: "Study not found" });
      }
      
      // Update the study status
      const updatedStudy = await storage.updateStudy(id, { status });
      
      // Create status history record
      await storage.createStatusHistory({
        entityType: 'study',
        entityId: id,
        fromStatus: currentStudy.status || null,
        toStatus: status,
        reason,
        changedById: userId,
        changedAt: new Date()
      });
      
      res.json(updatedStudy);
    } catch (error) {
      console.error("Error updating study status:", error);
      res.status(500).json({ message: "Failed to update study status" });
    }
  });

  app.put("/api/tasks/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const userId = req.user.claims.sub;
      
      // Get current task to track old status
      const allTasks = await storage.getTasks();
      const currentTask = allTasks.find(t => t.id === id);
      if (!currentTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Update the task status
      const updatedTask = await storage.updateTask(id, { status });
      
      // Create status history record
      await storage.createStatusHistory({
        entityType: 'task',
        entityId: id,
        fromStatus: currentTask.status || null,
        toStatus: status,
        reason,
        changedById: userId,
        changedAt: new Date()
      });
      
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task status:", error);
      res.status(500).json({ message: "Failed to update task status" });
    }
  });

  // Team member endpoints
  app.get("/api/team-members/:labId", isAuthenticated, async (req: any, res) => {
    try {
      const { labId } = req.params;
      const teamMembers = await storage.getTeamMembersByLab(labId);
      res.json(teamMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.post("/api/team-members", isAuthenticated, async (req: any, res) => {
    try {
      const teamMember = await storage.createTeamMember(req.body);
      res.status(201).json(teamMember);
    } catch (error) {
      console.error("Error creating team member:", error);
      res.status(500).json({ message: "Failed to create team member" });
    }
  });

  // Project member endpoints  
  app.get("/api/project-members/:projectId", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const projectMembers = await storage.getProjectMembers(projectId);
      res.json(projectMembers);
    } catch (error) {
      console.error("Error fetching project members:", error);
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });

  app.post("/api/project-members", isAuthenticated, async (req: any, res) => {
    try {
      const projectMember = await storage.addProjectMember(req.body);
      res.status(201).json(projectMember);
    } catch (error) {
      console.error("Error adding project member:", error);
      res.status(500).json({ message: "Failed to add project member" });
    }
  });

  app.delete("/api/project-members/:projectId/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId, userId } = req.params;
      await storage.removeProjectMember(projectId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing project member:", error);
      res.status(500).json({ message: "Failed to remove project member" });
    }
  });

  // Load sample team data endpoint (for development)
  app.post("/api/load-sample-team-data", isAuthenticated, async (req: any, res) => {
    try {
      const { RICCC_TEAM_MEMBERS, RHEDAS_TEAM_MEMBERS } = await import("./sampleTeamData");
      
      // Get existing labs
      const labs = await storage.getLabs();
      const riccLab = labs.find(lab => lab.name === "RICCC");
      const rhedasLab = labs.find(lab => lab.name === "RHEDAS");
      
      if (!riccLab || !rhedasLab) {
        return res.status(400).json({ message: "RICCC and RHEDAS labs must exist first" });
      }

      // Load RICCC team members
      for (const memberData of RICCC_TEAM_MEMBERS) {
        try {
          await storage.createTeamMember({
            ...memberData,
            labId: riccLab.id,
          });
        } catch (error) {
          // Ignore duplicate email errors
          if (!error.message?.includes('duplicate')) {
            console.error("Error creating RICCC team member:", error);
          }
        }
      }

      // Load RHEDAS team members (avoiding Juan Rojas duplicate)
      for (const memberData of RHEDAS_TEAM_MEMBERS) {
        try {
          // Skip Juan Rojas for RHEDAS since he's already in RICCC
          if (memberData.email === "juan_rojas@rush.edu") continue;
          
          await storage.createTeamMember({
            ...memberData,
            labId: rhedasLab.id,
          });
        } catch (error) {
          // Ignore duplicate email errors
          if (!error.message?.includes('duplicate')) {
            console.error("Error creating RHEDAS team member:", error);
          }
        }
      }

      res.json({ message: "Sample team data loaded successfully" });
    } catch (error) {
      console.error("Error loading sample team data:", error);
      res.status(500).json({ message: "Failed to load sample team data" });
    }
  });

  // PHASE 1: NEW SECURITY ROUTES
  
  // Bucket membership routes
  app.get("/api/buckets/:id/members", isAuthenticated, async (req, res) => {
    try {
      const members = await storage.getBucketMembers(req.params.id);
      res.json(members);
    } catch (error: any) {
      console.error("Error fetching bucket members:", error);
      res.status(500).json({ message: "Failed to fetch bucket members" });
    }
  });
  
  app.post("/api/buckets/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const { userId, role } = req.body;
      const member = await storage.addBucketMember({
        bucketId: req.params.id,
        userId,
        role: role || 'INFORMED'
      });
      res.status(201).json(member);
    } catch (error: any) {
      console.error("Error adding bucket member:", error);
      res.status(400).json({ message: error.message || "Failed to add bucket member" });
    }
  });
  
  app.delete("/api/buckets/:bucketId/members/:userId", isAuthenticated, async (req, res) => {
    try {
      await storage.removeBucketMember(req.params.bucketId, req.params.userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error removing bucket member:", error);
      res.status(500).json({ message: "Failed to remove bucket member" });
    }
  });
  
  // Comment system routes
  app.get("/api/comments", isAuthenticated, async (req, res) => {
    try {
      const { entityType, entityId } = req.query;
      if (!entityType || !entityId) {
        return res.status(400).json({ message: "entityType and entityId are required" });
      }
      const comments = await storage.getComments(entityType as string, entityId as string);
      res.json(comments);
    } catch (error: any) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  
  app.post("/api/comments", isAuthenticated, async (req: any, res) => {
    try {
      const { content, entityType, entityId, parentId } = req.body;
      const userId = req.user.claims.sub;
      
      const comment = await storage.createComment({
        content,
        entityType,
        entityId,
        parentId: parentId || null,
        authorId: userId
      });
      
      res.status(201).json(comment);
    } catch (error: any) {
      console.error("Error creating comment:", error);
      res.status(400).json({ message: error.message || "Failed to create comment" });
    }
  });
  
  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  
  // PHASE 2: FILE ATTACHMENT SYSTEM
  
  // Get upload URL for attachments
  app.post("/api/attachments/upload", isAuthenticated, async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting attachment upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });
  
  // Create attachment record after upload
  app.post("/api/attachments", isAuthenticated, async (req: any, res) => {
    try {
      const { filename, url, fileSize, mimeType, entityType, entityId } = req.body;
      const userId = req.user.claims.sub;
      
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(url);
      
      const attachment = await storage.createAttachment({
        filename,
        url: normalizedPath,
        fileSize: fileSize.toString(),
        mimeType,
        entityType,
        entityId,
        uploadedById: userId
      });
      
      res.status(201).json(attachment);
    } catch (error: any) {
      console.error("Error creating attachment:", error);
      res.status(400).json({ message: error.message || "Failed to create attachment" });
    }
  });
  
  // Get attachments for an entity
  app.get("/api/attachments", isAuthenticated, async (req, res) => {
    try {
      const { entityType, entityId } = req.query;
      if (!entityType || !entityId) {
        return res.status(400).json({ message: "entityType and entityId are required" });
      }
      const attachments = await storage.getAttachments(entityType as string, entityId as string);
      res.json(attachments);
    } catch (error: any) {
      console.error("Error fetching attachments:", error);
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });
  
  // Delete attachment
  app.delete("/api/attachments/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteAttachment(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting attachment:", error);
      res.status(500).json({ message: "Failed to delete attachment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}