import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./services/aiService";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

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
  app.get('/api/labs', isAuthenticated, async (req, res) => {
    try {
      const labs = await storage.getLabs();
      res.json(labs);
    } catch (error) {
      console.error("Error fetching labs:", error);
      res.status(500).json({ message: "Failed to fetch labs" });
    }
  });

  app.post('/api/labs', isAuthenticated, async (req: any, res) => {
    try {
      const lab = await storage.createLab(req.body);
      res.json(lab);
    } catch (error) {
      console.error("Error creating lab:", error);
      res.status(500).json({ message: "Failed to create lab" });
    }
  });

  app.get('/api/labs/:id/members', isAuthenticated, async (req, res) => {
    try {
      const members = await storage.getLabMembers(req.params.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching lab members:", error);
      res.status(500).json({ message: "Failed to fetch lab members" });
    }
  });

  // Study routes
  app.get('/api/studies', isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string;
      const studies = await storage.getStudies(labId);
      res.json(studies);
    } catch (error) {
      console.error("Error fetching studies:", error);
      res.status(500).json({ message: "Failed to fetch studies" });
    }
  });

  app.get('/api/studies/:id', isAuthenticated, async (req, res) => {
    try {
      const study = await storage.getStudy(req.params.id);
      if (!study) {
        return res.status(404).json({ message: "Study not found" });
      }
      res.json(study);
    } catch (error) {
      console.error("Error fetching study:", error);
      res.status(500).json({ message: "Failed to fetch study" });
    }
  });

  app.post('/api/studies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const studyData = { ...req.body, createdBy: userId };
      const study = await storage.createStudy(studyData);
      res.json(study);
    } catch (error) {
      console.error("Error creating study:", error);
      res.status(500).json({ message: "Failed to create study" });
    }
  });

  app.put('/api/studies/:id', isAuthenticated, async (req, res) => {
    try {
      const study = await storage.updateStudy(req.params.id, req.body);
      res.json(study);
    } catch (error) {
      console.error("Error updating study:", error);
      res.status(500).json({ message: "Failed to update study" });
    }
  });

  // Task routes
  app.get('/api/tasks', isAuthenticated, async (req, res) => {
    try {
      const studyId = req.query.studyId as string;
      const assigneeId = req.query.assigneeId as string;
      const tasks = await storage.getTasks(studyId, assigneeId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req, res) => {
    try {
      const task = await storage.createTask(req.body);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Standup routes
  app.get('/api/standups', isAuthenticated, async (req, res) => {
    try {
      const labId = req.query.labId as string;
      if (!labId) {
        return res.status(400).json({ message: "Lab ID is required" });
      }
      const meetings = await storage.getStandupMeetings(labId);
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching standup meetings:", error);
      res.status(500).json({ message: "Failed to fetch standup meetings" });
    }
  });

  app.post('/api/standups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const meetingData = { 
        ...req.body, 
        createdBy: userId,
        startTime: new Date(),
        meetingDate: new Date()
      };
      const meeting = await storage.createStandupMeeting(meetingData);
      res.json(meeting);
    } catch (error) {
      console.error("Error creating standup meeting:", error);
      res.status(500).json({ message: "Failed to create standup meeting" });
    }
  });

  app.post('/api/standups/:id/process-recording', 
    isAuthenticated, 
    upload.single('recording'), 
    async (req: any, res) => {
      try {
        const meetingId = req.params.id;
        const audioFile = req.file;
        
        if (!audioFile) {
          return res.status(400).json({ message: "No audio file provided" });
        }

        // Process with AI service
        const result = await aiService.processStandupRecording(audioFile.buffer, {
          meetingId,
          participants: req.body.participants ? JSON.parse(req.body.participants) : [],
        });

        // Update meeting with transcript and AI summary
        await storage.updateStandupMeeting(meetingId, {
          transcript: result.transcript,
          aiSummary: result.aiSummary,
          endTime: new Date(),
        });

        // Create action items from AI analysis
        if (result.aiSummary?.actionItems) {
          for (const item of result.aiSummary.actionItems) {
            await storage.createActionItem({
              meetingId,
              description: item.description,
              priority: item.priority?.toUpperCase() as any || "MEDIUM",
              dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
              createdFromAI: true,
            });
          }
        }

        res.json({ success: true, result });
      } catch (error) {
        console.error("Error processing standup recording:", error);
        res.status(500).json({ message: "Failed to process recording" });
      }
    }
  );

  // Action item routes
  app.get('/api/action-items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assigneeId = req.query.assigneeId as string || userId;
      const meetingId = req.query.meetingId as string;
      const items = await storage.getActionItems(assigneeId, meetingId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching action items:", error);
      res.status(500).json({ message: "Failed to fetch action items" });
    }
  });

  app.post('/api/action-items', isAuthenticated, async (req, res) => {
    try {
      const item = await storage.createActionItem(req.body);
      res.json(item);
    } catch (error) {
      console.error("Error creating action item:", error);
      res.status(500).json({ message: "Failed to create action item" });
    }
  });

  app.put('/api/action-items/:id', isAuthenticated, async (req, res) => {
    try {
      const item = await storage.updateActionItem(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      console.error("Error updating action item:", error);
      res.status(500).json({ message: "Failed to update action item" });
    }
  });

  // Dashboard stats route
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.labId) {
        return res.json({
          activeStudies: 0,
          teamMembers: 0,
          pendingTasks: 0,
          completionRate: 0,
        });
      }

      const [studies, members, tasks] = await Promise.all([
        storage.getStudies(user.labId),
        storage.getLabMembers(user.labId),
        storage.getTasks(undefined, userId),
      ]);

      const activeStudies = studies.filter(s => 
        !['CANCELLED', 'PUBLISHED'].includes(s.status || '')
      ).length;

      const pendingTasks = tasks.filter(t => 
        ['TODO', 'IN_PROGRESS'].includes(t.status || '')
      ).length;

      const completedTasks = tasks.filter(t => t.status === 'DONE').length;
      const completionRate = tasks.length > 0 
        ? Math.round((completedTasks / tasks.length) * 100) 
        : 0;

      res.json({
        activeStudies,
        teamMembers: members.length,
        pendingTasks,
        completionRate,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time features
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("WebSocket client connected");

    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle different message types
        switch (data.type) {
          case "join_lab":
            // Add client to lab room (in a real implementation, you'd track this)
            ws.send(JSON.stringify({ type: "joined_lab", labId: data.labId }));
            break;
          case "join_standup":
            // Add client to standup room
            ws.send(JSON.stringify({ type: "joined_standup", standupId: data.standupId }));
            break;
          default:
            console.log("Unknown message type:", data.type);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });

  return httpServer;
}
