import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { createSampleData } from "./sampleData";
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
      res.status(500).json({ message: (error as Error).message || "Failed to delete study" });
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

  // Sample data creation route
  app.post("/api/create-sample-data", isAuthenticated, async (req: any, res) => {
    try {
      await createSampleData();
      res.json({ message: "Sample data created successfully" });
    } catch (error) {
      console.error("Error creating sample data:", error);
      res.status(500).json({ message: "Failed to create sample data" });
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

  // Team member routes (backward compatibility)
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

  const httpServer = createServer(app);
  return httpServer;
}