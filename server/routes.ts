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
      
      const member = await storage.addProjectMember({
        projectId: id,
        userId,
        role: role || 'contributor'
      });
      
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding project member:", error);
      res.status(500).json({ message: "Failed to add project member" });
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
      
      const assignment = await storage.assignUserToTask({
        taskId: id,
        userId
      });
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning user to task:", error);
      res.status(500).json({ message: "Failed to assign user to task" });
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

  const httpServer = createServer(app);
  return httpServer;
}