import { db } from "./db";
import { standupMeetings, standupActionItems, type StandupMeeting, type ActionItem } from "@shared/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { Resend } from "resend";

// Meeting Recorder Service - TypeScript adaptation of the Python standup recorder
export class MeetingRecorderService {
  private openai: OpenAI;
  private resend: Resend;

  constructor(openaiKey?: string, resendKey?: string) {
    this.openai = new OpenAI({
      apiKey: openaiKey || process.env.OPENAI_API_KEY,
    });
    this.resend = new Resend(resendKey || process.env.RESEND_API_KEY2);
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
      const currentDate = new Date();
      const [meeting] = await db
        .insert(standupMeetings)
        .values({
          labId: labId,
          createdBy: "system", // This should come from authenticated user
          meetingDate: currentDate,
          scheduledDate: currentDate, // Required field
          startTime: currentDate, // Required field
          endTime: currentDate,
          transcript,
          aiSummary: { processedNotes, extractedTaskCount: extractedTasks.length },
          participants: attendees,
        })
        .returning();

      // Create action items from extracted tasks
      if (extractedTasks.length > 0) {
        const actionItemPromises = extractedTasks.map((task) =>
          db.insert(standupActionItems).values({
            meetingId: meeting.id,
            description: task.task || "No description",
            // Note: assigneeId should be a user ID, but we only have member name
            dueDate: task.due_date ? new Date(task.due_date) : null,
            status: task.status === "completed" ? "COMPLETED" : "OPEN",
            createdFromAI: true,
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
        meeting.createdAt && new Date(meeting.createdAt) >= cutoffDate
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
        .from(standupActionItems)
        .where(eq(standupActionItems.meetingId, meetingId));

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
   * Create meeting from transcript with AI processing
   */
  async createMeetingFromTranscript(params: {
    transcript: string;
    labId: string | null;
    userId: string;
    meetingType: string;
    attendeeEmails: string[];
    attendeeNames: string[];
  }): Promise<any> {
    try {
      const meetingDate = new Date().toISOString().split('T')[0];
      const processed = await this.processTranscript(params.transcript, meetingDate);
      
      const meetingId = await this.saveMeetingToDatabase(
        params.labId || "",
        params.transcript,
        processed.processedNotes,
        params.attendeeNames || [],
        processed.extractedTasks || []
      );

      // Get the created meeting
      const [meeting] = await db
        .select()
        .from(standupMeetings)
        .where(eq(standupMeetings.id, meetingId));

      return meeting;
    } catch (error) {
      console.error("Error creating meeting from transcript:", error);
      throw error;
    }
  }

  /**
   * Generate email HTML for meeting preview
   */
  async generateEmailHtml(params: {
    meeting: any;
    actionItems: any[];
    title?: string;
  }): Promise<string> {
    const meetingDate = new Date(params.meeting.meetingDate || params.meeting.createdAt).toLocaleDateString();
    const labName = params.title || "Lab Meeting";
    
    return this.generateEmailHTML(params.meeting, params.actionItems, meetingDate, labName);
  }

  /**
   * Send meeting summary via email using Resend
   */
  async sendMeetingSummary(
    meetingId: string,
    recipients: string[],
    labName: string = "Your Lab"
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { meeting, actionItems } = await this.getMeetingDetails(meetingId);
      
      if (!meeting) {
        return { success: false, error: "Meeting not found" };
      }

      const meetingDate = new Date(meeting.meetingDate).toLocaleDateString();
      
      // Create HTML email content
      const htmlContent = this.generateEmailHTML(meeting, actionItems, meetingDate, labName);

      // Generate plain text version for better deliverability
      const plainTextContent = this.generatePlainTextEmail(meeting, actionItems, meetingDate, labName);

      console.log('Attempting to send meeting summary email:', {
        hasApiKey: !!process.env.RESEND_API_KEY2,
        apiKeyLength: process.env.RESEND_API_KEY2?.length,
        recipientCount: recipients.length,
        recipients: recipients,
        meetingId: meetingId,
        labName: labName
      });

      const fromEmail = (process.env.FROM_EMAIL || 'noreply@labsync.app').trim();
      
      const response = await this.resend.emails.send({
        from: `LabSync <${fromEmail}>`,
        to: recipients,
        subject: `${labName} Standup Meeting Summary - ${meetingDate}`,
        html: htmlContent,
        text: plainTextContent,
        tags: [
          { name: 'category', value: 'meeting-summary' },
          { name: 'lab', value: labName.toLowerCase().replace(/[^a-z0-9\-_]/g, '-').replace(/-+/g, '-') }
        ]
      });

      console.log('Resend API response:', {
        success: true,
        messageId: response.data?.id,
        response: response
      });

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generate plain text email content for better deliverability
   */
  private generatePlainTextEmail(
    meeting: any,
    actionItems: any[],
    meetingDate: string,
    labName: string
  ): string {
    const taskList = actionItems
      .map((item, index) => 
        `${index + 1}. ${item.assignee || 'Unassigned'}: ${item.description}${item.dueDate ? ` (Due: ${new Date(item.dueDate).toLocaleDateString()})` : ''} [${item.status}]`
      )
      .join('\n');

    return `
${labName} Meeting Summary
Generated on ${meetingDate}

=== ACTION ITEMS & TASKS (${actionItems.length}) ===
${taskList || 'No action items extracted from this meeting.'}

=== MEETING SUMMARY ===
${meeting.transcript}

=== MEETING DETAILS ===
Meeting ID: ${meeting.id}
Date: ${meetingDate}
Type: ${meeting.meetingType}
Participants: ${Array.isArray(meeting.participants) ? meeting.participants.join(', ') : meeting.participants || 'Not specified'}

---
This summary was automatically generated by LabSync AI
Making Science Easier • Powered by OpenAI & Resend

To unsubscribe, reply with "UNSUBSCRIBE" or contact unsubscribe@labsync.clif-icu.org
    `.trim();
  }

  /**
   * Generate HTML email content
   */
  private generateEmailHTML(
    meeting: any,
    actionItems: any[],
    meetingDate: string,
    labName: string
  ): string {
    const taskRows = actionItems
      .map((item) => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px;">${item.assignee || 'Unassigned'}</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${item.description}</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No deadline'}</td>
          <td style="border: 1px solid #ddd; padding: 12px;">
            <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background-color: ${item.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7'}; color: ${item.status === 'COMPLETED' ? '#166534' : '#92400e'};">
              ${item.status}
            </span>
          </td>
        </tr>
      `)
      .join("");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${labName} Meeting Summary - ${meetingDate}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #0d9488 0%, #8b5fe6 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 { 
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p { 
            margin: 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
        }
        .section h2 {
            color: #0d9488;
            margin-top: 0;
            margin-bottom: 16px;
            font-size: 20px;
            font-weight: 600;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
            background: white;
            border-radius: 6px;
            overflow: hidden;
        }
        th {
            background-color: #0d9488;
            color: white;
            padding: 16px 12px;
            text-align: left;
            font-weight: 600;
        }
        td {
            border: 1px solid #e2e8f0;
            padding: 12px;
            vertical-align: top;
        }
        tr:nth-child(even) { 
            background-color: #f8fafc;
        }
        .summary-content {
            background: white;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #0d9488;
        }
        .footer {
            text-align: center;
            color: #64748b;
            font-size: 14px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            background-color: #0d9488;
            color: white;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${labName} Standup Meeting</h1>
        <p>AI-Generated Summary • ${meetingDate}</p>
    </div>

    ${actionItems.length > 0 ? `
    <div class="section">
        <h2>📋 Action Items & Tasks (${actionItems.length})</h2>
        <table>
            <thead>
                <tr>
                    <th>Assignee</th>
                    <th>Task Description</th>
                    <th>Due Date</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${taskRows}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="section">
        <h2>📝 Meeting Summary</h2>
        <div class="summary-content">
            ${meeting.aiSummary?.processedNotes || meeting.transcript || 'No summary available'}
        </div>
    </div>

    <div class="section">
        <h2>🎙️ Meeting Details</h2>
        <p><strong>Meeting ID:</strong> ${meeting.id}</p>
        <p><strong>Date:</strong> ${meetingDate}</p>
        <p><strong>Type:</strong> <span class="badge">${meeting.meetingType}</span></p>
        ${meeting.participants && meeting.participants.length > 0 ? `
        <p><strong>Participants:</strong> ${meeting.participants.join(', ')}</p>
        ` : ''}
    </div>

    <div class="footer">
        <p>🤖 This summary was automatically generated by LabSync AI</p>
        <p>Making Science Easier • Powered by OpenAI & Resend</p>
        <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
            To unsubscribe from meeting summaries, reply with "UNSUBSCRIBE" or contact 
            <a href="mailto:unsubscribe@labsync.clif-icu.org" style="color: #0d9488;">unsubscribe@labsync.clif-icu.org</a>
        </p>
    </div>
</body>
</html>`;
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
          .delete(standupActionItems)
          .where(eq(standupActionItems.meetingId, meeting.id));
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