import { db } from "./db";
import { standupMeetings, actionItems } from "@shared/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

// Meeting Recorder Service - TypeScript adaptation of the Python standup recorder
export class MeetingRecorderService {
  private openai: OpenAI;

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Process meeting transcript using GPT-4o-mini with task extraction
   */
  async processTranscript(transcript: string, meetingDate: string): Promise<{
    processedNotes: string;
    extractedTasks: any[];
  }> {
    const systemPrompt = `
SYSTEM PROMPT: Task & Timeline Tracker for Lab Members

PURPOSE: Document what each lab member is working on with clear timelines. 
Blockers are rare but must be flagged when mentioned.

CAPTURE PER MEMBER:
[Name]:
- TASK: [What they're doing]
- TIMELINE: [When started/expected completion]
- STATUS: [% complete or milestone reached]
- BLOCKER: [Only if explicitly mentioned]

PROCESSING RULES:
1. Task Extraction:
   - Focus on WHAT is being done (analysis type, dataset, experiment)
   - Extract any mentioned deliverables
   - Link to project/paper if referenced

2. Timeline Parsing:
   - Convert all time references to dates (today is ${meetingDate})
   - Flag vague timelines ("soon", "later") for clarification
   - Calculate days until deadline
   - Mark overdue items

3. Auto-Standardization:
   - "Working on..." → Task name
   - "Should be done by..." → Deadline
   - "Started last..." → Start date
   - "X% done" or "halfway" → Progress

4. Output Format:
   Create an HTML summary with structured task information
   
5. Also return a JSON structure with extracted tasks:
   {
     "tasks": [
       {
         "member": "name",
         "task": "description",
         "start_date": "YYYY-MM-DD",
         "due_date": "YYYY-MM-DD",
         "status": "percentage or phase",
         "blocker": "if any"
       }
     ],
     "summary": {
       "tasks_due_this_week": [],
       "overdue_tasks": [],
       "blockers": []
     }
   }

Return both HTML summary and JSON structure.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Process this standup meeting transcript:\n\n${transcript}` }
        ],
        temperature: 0.1,
      });

      const content = response.choices[0].message.content || "";
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*"tasks"[\s\S]*\}/);
      let extractedTasks = [];
      
      if (jsonMatch) {
        try {
          const taskData = JSON.parse(jsonMatch[0]);
          extractedTasks = taskData.tasks || [];
        } catch (e) {
          console.error("Error parsing extracted tasks:", e);
        }
      }

      return {
        processedNotes: content,
        extractedTasks
      };
    } catch (error) {
      console.error("Error processing transcript with OpenAI:", error);
      throw error;
    }
  }

  /**
   * Save meeting data to database with extracted tasks
   */
  async saveMeetingToDatabase(
    labId: string,
    transcript: string,
    processedNotes: string,
    attendees: string[],
    extractedTasks: any[]
  ): Promise<string> {
    try {
      // Create meeting record
      const [meeting] = await db
        .insert(standupMeetings)
        .values({
          createdBy: "system", // This should come from authenticated user
          meetingDate: new Date(),
          title: `Standup Meeting - ${new Date().toLocaleDateString()}`,
          transcript,
          summary: processedNotes,
          participants: attendees,
          status: "COMPLETED",
        })
        .returning();

      // Create action items from extracted tasks
      if (extractedTasks.length > 0) {
        const actionItemPromises = extractedTasks.map((task) =>
          db.insert(actionItems).values({
            meetingId: meeting.id,
            description: task.task || "No description",
            assignee: task.member || "Unassigned",
            dueDate: task.due_date ? new Date(task.due_date) : null,
            status: task.status === "completed" ? "COMPLETED" : "IN_PROGRESS",
            notes: task.blocker ? `Blocker: ${task.blocker}` : undefined,
          })
        );

        await Promise.all(actionItemPromises);
      }

      console.log(`Meeting saved to database with ID: ${meeting.id}`);
      return meeting.id;
    } catch (error) {
      console.error("Error saving meeting to database:", error);
      throw error;
    }
  }

  /**
   * Get recent meetings for a lab
   */
  async getRecentMeetings(labId: string, days: number = 14): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      const meetings = await db
        .select()
        .from(standupMeetings);

      return meetings.filter(meeting => 
        new Date(meeting.createdAt) >= cutoffDate
      );
    } catch (error) {
      console.error("Error fetching recent meetings:", error);
      throw error;
    }
  }

  /**
   * Get meeting details with action items
   */
  async getMeetingDetails(meetingId: string): Promise<{
    meeting: any;
    actionItems: any[];
  }> {
    try {
      const [meeting] = await db
        .select()
        .from(standupMeetings)
        .where(eq(standupMeetings.id, meetingId));

      const items = await db
        .select()
        .from(actionItems)
        .where(eq(actionItems.meetingId, meetingId));

      return {
        meeting,
        actionItems: items,
      };
    } catch (error) {
      console.error("Error fetching meeting details:", error);
      throw error;
    }
  }

  /**
   * Cleanup old meetings (older than specified days)
   */
  async cleanupOldMeetings(days: number = 14): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      // Get meetings to delete
      const meetingsToDelete = await db
        .select({ id: standupMeetings.id })
        .from(standupMeetings);

      const oldMeetings = meetingsToDelete.filter(meeting => 
        new Date(meeting.id) < cutoffDate // This would need proper date comparison
      );

      // Delete action items first (foreign key constraint)
      for (const meeting of oldMeetings) {
        await db
          .delete(actionItems)
          .where(eq(actionItems.meetingId, meeting.id));
      }

      // Delete meetings
      let deletedCount = 0;
      for (const meeting of oldMeetings) {
        await db
          .delete(standupMeetings)
          .where(eq(standupMeetings.id, meeting.id));
        deletedCount++;
      }

      console.log(`Cleaned up ${deletedCount} meetings older than ${days} days`);
      return deletedCount;
    } catch (error) {
      console.error("Error during cleanup:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const meetingRecorderService = new MeetingRecorderService();