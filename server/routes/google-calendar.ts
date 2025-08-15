import { Router } from "express";
import { GoogleCalendarService } from "../googleCalendarService";
import { isAuthenticated } from "../replitAuth";
import { db } from "../db";
import { calendarEvents, labs, tasks, studies, insertCalendarEventSchema } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";
import { z } from "zod";

const router = Router();
const googleCalendarService = new GoogleCalendarService();

// Fetch Google Calendar events and merge with LabSync events
router.get("/events", isAuthenticated, async (req, res) => {
  try {
    const labId = req.query.labId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    if (!labId) {
      return res.status(400).json({ error: "Lab ID is required" });
    }

    // Fetch from Google Calendar
    const googleEvents = await googleCalendarService.fetchGoogleCalendarEvents(startDate, endDate);
    const convertedGoogleEvents = googleEvents
      .map(event => googleCalendarService.convertGoogleEventToLabSync(event))
      .filter(event => event !== null);

    // Fetch from LabSync database
    const labSyncEvents = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.labId, labId));

    // Combine both sources
    const allEvents = [
      ...convertedGoogleEvents.map(event => ({ ...event, source: 'google' })),
      ...labSyncEvents.map(event => ({ ...event, source: 'labsync' }))
    ];

    res.json(allEvents);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

// Sync a LabSync event to Google Calendar
router.post("/sync-to-google", isAuthenticated, async (req, res) => {
  try {
    const { eventId } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    // Get event from database
    const [event] = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, eventId));

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Sync to Google Calendar
    const googleEventId = await googleCalendarService.syncEventToGoogle(event);
    
    if (googleEventId) {
      // Update database with Google Calendar ID
      await db
        .update(calendarEvents)
        .set({ 
          googleCalendarEventId: googleEventId,
          updatedAt: new Date()
        })
        .where(eq(calendarEvents.id, eventId));

      res.json({ success: true, googleEventId });
    } else {
      res.status(500).json({ error: "Failed to sync to Google Calendar" });
    }
  } catch (error) {
    console.error("Error syncing to Google Calendar:", error);
    res.status(500).json({ error: "Failed to sync to Google Calendar" });
  }
});

// Get Google Calendar embed URL
router.get("/embed-url", isAuthenticated, async (req, res) => {
  try {
    // Return the Google Calendar embed URL for riccclabs@gmail.com
    const embedUrl = "https://calendar.google.com/calendar/embed?src=riccclabs@gmail.com&ctz=America/Chicago&bgcolor=%23ffffff&color=%231B887A&showTitle=1&showPrint=1&showTabs=1&showCalendars=1&mode=MONTH";
    
    res.json({ embedUrl });
  } catch (error) {
    console.error("Error generating embed URL:", error);
    res.status(500).json({ error: "Failed to generate embed URL" });
  }
});

// Create a new calendar event directly in LabSync
router.post("/events", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    const validatedData = insertCalendarEventSchema.parse({
      ...req.body,
      createdBy: userId,
      userId: userId,
    });

    // Create the event in LabSync database
    const [newEvent] = await db
      .insert(calendarEvents)
      .values(validatedData)
      .returning();

    // Automatically sync to Google Calendar if enabled
    const shouldAutoSync = req.body.autoSyncToGoogle !== false; // Default to true
    if (shouldAutoSync) {
      try {
        const googleEventId = await googleCalendarService.syncEventToGoogle(newEvent);
        if (googleEventId) {
          // Update with Google Calendar ID
          await db
            .update(calendarEvents)
            .set({ 
              googleCalendarEventId: googleEventId,
              googleCalendarSyncStatus: 'synced',
              googleCalendarLastSync: new Date()
            })
            .where(eq(calendarEvents.id, newEvent.id));
        }
      } catch (syncError) {
        console.error("Auto-sync to Google Calendar failed:", syncError);
        // Event is still created in LabSync even if Google sync fails
      }
    }

    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Error creating calendar event:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create calendar event" });
  }
});

// Sync task due dates to calendar events (for meetings and project planning)
router.post("/sync-tasks-to-calendar", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    const { projectId, studyId, labId, syncToGoogle = true } = req.body;

    if (!projectId && !studyId && !labId) {
      return res.status(400).json({ error: "Must provide projectId, studyId, or labId" });
    }

    // Build query based on what was provided
    let taskList;
    if (studyId) {
      taskList = await db.select({
        id: tasks.id,
        name: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        assigneeId: tasks.assigneeId,
        studyId: tasks.studyId
      }).from(tasks).where(eq(tasks.studyId, studyId));
    } else if (labId) {
      // For lab-based queries, join with studies to find tasks in that lab
      taskList = await db.select({
        id: tasks.id,
        name: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        assigneeId: tasks.assigneeId,
        studyId: tasks.studyId
      }).from(tasks)
        .innerJoin(studies, eq(tasks.studyId, studies.id))
        .where(eq(studies.labId, labId));
    } else {
      taskList = await db.select({
        id: tasks.id,
        name: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        assigneeId: tasks.assigneeId,
        studyId: tasks.studyId
      }).from(tasks);
    }

    // Get tasks with due dates
    const tasksWithDueDates = taskList.filter(task => task.dueDate);

    const createdEvents = [];
    
    for (const task of tasksWithDueDates) {
      try {
        // Check if calendar event already exists for this task
        const existingEvent = await db
          .select()
          .from(calendarEvents)
          .where(and(
            eq(calendarEvents.eventType, 'MEETING'),
            eq(calendarEvents.title, `Task Deadline: ${task.name}`)
          ));

        if (existingEvent.length === 0) {
          // Get study information for context
          const studyInfo = await db
            .select()
            .from(studies)
            .where(eq(studies.id, task.studyId!))
            .then(results => results[0]);

          // Create calendar event for task due date with rich metadata
          const eventData = {
            title: `Task Deadline: ${task.name}`,
            description: `${task.description || `Deadline reminder for task: ${task.name}`}

📋 Task Overview:
${task.description ? task.description : 'No additional description provided'}

🎯 Assignment Details:
${task.assigneeId ? `Assigned to: ${task.assigneeId}` : 'Unassigned'}
Priority: ${task.priority || 'MEDIUM'}

${studyInfo ? `🔬 Study Context:
Study: ${studyInfo.name}${studyInfo.oraNumber ? ` (${studyInfo.oraNumber})` : ''}
Study Status: ${studyInfo.status}` : ''}`,
            eventType: 'MEETING' as const,
            startDate: task.dueDate!,
            endDate: new Date(task.dueDate!.getTime() + (2 * 60 * 60 * 1000)), // 2 hour duration
            allDay: false,
            duration: 2,
            userId: userId,
            labId: studyInfo?.labId,
            location: `${studyInfo?.name || 'Lab'} Task Review`,
            color: task.priority === 'HIGH' ? '#ef4444' : task.priority === 'MEDIUM' ? '#f97316' : '#10b981',
            categoryPrefix: '[Task Deadline]',
            exportTitle: `[Task Deadline] ${task.name}`,
            exportDescription: `Professional task deadline event created via LabSync`,
            metadata: {
              sourceType: 'task',
              sourceId: task.id,
              taskName: task.name,
              taskPriority: task.priority,
              taskAssignees: task.assigneeId ? [task.assigneeId] : [],
              studyId: task.studyId,
              studyName: studyInfo?.name,
              studyOraNumber: studyInfo?.oraNumber,
              labContext: studyInfo?.labId === 'riccc' ? 'RICCC Lab' : 'RHEDAS Lab',
              additionalInfo: {
                'Task ID': task.id,
                'Created in LabSync': new Date().toLocaleDateString(),
                'Sync Type': 'Task Deadline Sync',
                'Study Status': studyInfo?.status || 'Unknown'
              }
            },
            createdBy: userId
          };

          const [newEvent] = await db
            .insert(calendarEvents)
            .values(eventData)
            .returning();

          // Sync to Google Calendar if requested
          if (syncToGoogle) {
            try {
              const googleEventId = await googleCalendarService.syncEventToGoogle(newEvent);
              if (googleEventId) {
                await db
                  .update(calendarEvents)
                  .set({ 
                    googleCalendarEventId: googleEventId,
                    googleCalendarSyncStatus: 'synced',
                    googleCalendarLastSync: new Date()
                  })
                  .where(eq(calendarEvents.id, newEvent.id));
              }
            } catch (syncError) {
              console.error(`Google sync failed for task ${task.id}:`, syncError);
            }
          }

          createdEvents.push(newEvent);
        }
      } catch (taskError) {
        console.error(`Error processing task ${task.id}:`, taskError);
      }
    }

    res.json({
      message: `Successfully synced ${createdEvents.length} task deadlines to calendar`,
      createdEvents: createdEvents.length,
      syncedToGoogle: syncToGoogle,
      processedTasks: tasksWithDueDates.length
    });

  } catch (error) {
    console.error("Error syncing tasks to calendar:", error);
    res.status(500).json({ error: "Failed to sync tasks to calendar" });
  }
});

// Bulk sync project tasks during meetings
router.post("/meeting-task-sync", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    const { 
      meetingTitle, 
      meetingDate, 
      projectIds = [], 
      studyIds = [], 
      labId, 
      syncToGoogle = true,
      createMeetingEvent = true 
    } = req.body;

    if (!labId) {
      return res.status(400).json({ error: "Lab ID is required" });
    }

    const results = {
      meetingEvent: null as any,
      taskDeadlineEvents: [] as any[],
      totalProcessed: 0,
      errors: [] as string[]
    };

    // Create the meeting event if requested
    if (createMeetingEvent && meetingTitle && meetingDate) {
      try {
        const meetingEventData = {
          title: meetingTitle,
          description: `Meeting to review project tasks and deadlines\n\nProjects: ${projectIds.join(', ')}\nStudies: ${studyIds.join(', ')}`,
          eventType: 'MEETING' as const,
          startDate: new Date(meetingDate),
          endDate: new Date(new Date(meetingDate).getTime() + (60 * 60 * 1000)), // 1 hour duration
          allDay: false,
          duration: 1,
          userId: userId,
          labId: labId,
          color: '#3b82f6',
          categoryPrefix: '[Meeting]',
          exportTitle: `[Meeting] ${meetingTitle}`,
          exportDescription: `Project review meeting\n\nAgenda: Review task progress and deadlines`,
          metadata: {
            sourceType: 'meeting',
            projectIds,
            studyIds,
            meetingType: 'project_review'
          },
          createdBy: userId
        };

        const [meetingEvent] = await db
          .insert(calendarEvents)
          .values(meetingEventData)
          .returning();

        results.meetingEvent = meetingEvent;

        // Sync meeting to Google Calendar
        if (syncToGoogle) {
          try {
            const googleEventId = await googleCalendarService.syncEventToGoogle(meetingEvent);
            if (googleEventId) {
              await db
                .update(calendarEvents)
                .set({ 
                  googleCalendarEventId: googleEventId,
                  googleCalendarSyncStatus: 'synced',
                  googleCalendarLastSync: new Date()
                })
                .where(eq(calendarEvents.id, meetingEvent.id));
            }
          } catch (syncError) {
            results.errors.push(`Meeting Google sync failed: ${syncError}`);
          }
        }
      } catch (meetingError) {
        results.errors.push(`Meeting creation failed: ${meetingError}`);
      }
    }

    // Get all tasks for the specified projects and studies
    let taskList;
    if (studyIds.length > 0) {
      const conditions = studyIds.map((id: string) => eq(tasks.studyId, id));
      taskList = await db.select({
        id: tasks.id,
        name: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        assigneeId: tasks.assigneeId,
        studyId: tasks.studyId
      }).from(tasks).where(or(...conditions));
    } else {
      taskList = await db.select({
        id: tasks.id,
        name: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        assigneeId: tasks.assigneeId,
        studyId: tasks.studyId
      }).from(tasks);
    }
    const tasksWithDueDates = taskList.filter(task => task.dueDate);
    results.totalProcessed = tasksWithDueDates.length;

    // Create calendar events for task deadlines
    for (const task of tasksWithDueDates) {
      try {
        // Check if calendar event already exists for this task
        const existingEvent = await db
          .select()
          .from(calendarEvents)
          .where(and(
            eq(calendarEvents.eventType, 'MEETING'),
            eq(calendarEvents.title, `Task Deadline: ${task.name}`)
          ));

        if (existingEvent.length === 0) {
          // Get study information for enhanced context
          const studyInfo = await db
            .select()
            .from(studies)
            .where(eq(studies.id, task.studyId!))
            .then(results => results[0]);

          const eventData = {
            title: `Task Deadline: ${task.name}`,
            description: `📅 Meeting-Generated Task Deadline

🤝 Meeting Context:
Generated from: ${meetingTitle || 'Project Review Meeting'}
Meeting Date: ${meetingDate ? new Date(meetingDate).toLocaleDateString() : 'N/A'}

📋 Task Details:
Task: ${task.name}
${task.description ? `Description: ${task.description}` : 'No additional description provided'}
${task.assigneeId ? `Responsible: ${task.assigneeId}` : 'Unassigned'}
Priority: ${task.priority || 'MEDIUM'}

${studyInfo ? `🔬 Study Information:
Study: ${studyInfo.name}${studyInfo.oraNumber ? ` (${studyInfo.oraNumber})` : ''}
Status: ${studyInfo.status}
${studyInfo.firstAuthor ? `First Author: ${studyInfo.firstAuthor}` : ''}` : ''}

💡 Next Steps:
→ Review task requirements
→ Coordinate with assigned team members
→ Update progress in LabSync`,
            eventType: 'MEETING' as const,
            startDate: task.dueDate!,
            endDate: new Date(task.dueDate!.getTime() + (60 * 60 * 1000)), // 1 hour duration
            allDay: false,
            duration: 1,
            userId: userId,
            labId: studyInfo?.labId,
            location: `${studyInfo?.name || 'Lab'} Task Review`,
            color: task.priority === 'HIGH' ? '#ef4444' : task.priority === 'MEDIUM' ? '#f97316' : '#10b981',
            categoryPrefix: '[Task Deadline]',
            exportTitle: `[Task Deadline] ${task.name}`,
            exportDescription: `Meeting-generated task deadline with full context and team coordination details`,
            metadata: {
              sourceType: 'meeting_task',
              sourceId: task.id,
              meetingTitle: meetingTitle,
              meetingDate: meetingDate,
              taskName: task.name,
              taskPriority: task.priority,
              taskAssignees: task.assigneeId ? [task.assigneeId] : [],
              studyId: task.studyId,
              studyName: studyInfo?.name,
              studyOraNumber: studyInfo?.oraNumber,
              studyStatus: studyInfo?.status,
              labContext: studyInfo?.labId === 'riccc' ? 'RICCC Lab' : 'RHEDAS Lab',
              additionalInfo: {
                'Task ID': task.id,
                'Study ID': task.studyId,
                'Meeting Generated': new Date().toLocaleDateString(),
                'Sync Source': 'Meeting Task Sync',
                'Lab': studyInfo?.labId === 'riccc' ? 'RICCC' : 'RHEDAS',
                'Priority Level': task.priority || 'MEDIUM'
              }
            },
            createdBy: userId
          };

          const [newEvent] = await db
            .insert(calendarEvents)
            .values(eventData)
            .returning();

          results.taskDeadlineEvents.push(newEvent);

          // Sync to Google Calendar
          if (syncToGoogle) {
            try {
              const googleEventId = await googleCalendarService.syncEventToGoogle(newEvent);
              if (googleEventId) {
                await db
                  .update(calendarEvents)
                  .set({ 
                    googleCalendarEventId: googleEventId,
                    googleCalendarSyncStatus: 'synced',
                    googleCalendarLastSync: new Date()
                  })
                  .where(eq(calendarEvents.id, newEvent.id));
              }
            } catch (syncError) {
              results.errors.push(`Task ${task.name} Google sync failed: ${syncError}`);
            }
          }
        }
      } catch (taskError) {
        results.errors.push(`Task processing failed for ${task.name}: ${taskError}`);
      }
    }

    res.json({
      message: `Meeting and task sync completed successfully`,
      meetingCreated: !!results.meetingEvent,
      taskDeadlineEvents: results.taskDeadlineEvents.length,
      totalTasksProcessed: results.totalProcessed,
      syncedToGoogle: syncToGoogle,
      errors: results.errors,
      results
    });

  } catch (error) {
    console.error("Error in meeting task sync:", error);
    res.status(500).json({ error: "Failed to sync meeting tasks to calendar" });
  }
});

// OAuth callback for Google Calendar authentication
router.get("/auth/callback", async (req, res) => {
  try {
    // This would handle the OAuth callback
    // For now, redirect back to calendar page
    res.redirect("/calendar?google_auth=success");
  } catch (error) {
    console.error("Error in OAuth callback:", error);
    res.redirect("/calendar?google_auth=error");
  }
});

export default router;