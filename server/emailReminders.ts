import { Resend } from 'resend';
import { neon } from '@neondatabase/serverless';

const resend = new Resend(process.env.RESEND_API_KEY);
const sql = neon(process.env.DATABASE_URL!);

interface TaskReminderData {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: string;
  studyTitle?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  labName?: string;
}

export class EmailReminderService {
  /**
   * Send task due date reminder emails
   */
  async sendTaskReminders(): Promise<void> {
    try {
      console.log('🔍 Checking for tasks requiring reminders...');
      
      // Get tasks due in the next 24-48 hours or overdue
      const upcomingTasks = await this.getTasksNeedingReminders();
      
      for (const task of upcomingTasks) {
        if (task.assigneeEmail) {
          await this.sendTaskReminderEmail(task);
        }
      }
      
      console.log(`📧 Sent ${upcomingTasks.length} task reminder emails`);
    } catch (error) {
      console.error('❌ Error sending task reminders:', error);
    }
  }

  /**
   * Get tasks that need reminder emails
   */
  private async getTasksNeedingReminders(): Promise<TaskReminderData[]> {
    const query = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.due_date,
        t.priority,
        s.title as study_title,
        u.name as assignee_name,
        u.email as assignee_email,
        l.name as lab_name
      FROM tasks t
      LEFT JOIN studies s ON t.study_id = s.id
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN labs l ON s.lab_id = l.id
      WHERE 
        t.due_date IS NOT NULL
        AND t.status != 'COMPLETED'
        AND u.email IS NOT NULL
        AND (
          -- Due tomorrow (24-48 hours)
          (t.due_date BETWEEN NOW() + INTERVAL '24 hours' AND NOW() + INTERVAL '48 hours')
          OR
          -- Overdue
          (t.due_date < NOW())
        )
        AND (
          t.last_reminder_sent IS NULL 
          OR t.last_reminder_sent < NOW() - INTERVAL '24 hours'
        )
    `;

    const results = await sql(query);
    return results.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      dueDate: new Date(row.due_date),
      priority: row.priority || 'MEDIUM',
      studyTitle: row.study_title,
      assigneeName: row.assignee_name,
      assigneeEmail: row.assignee_email,
      labName: row.lab_name,
    }));
  }

  /**
   * Send individual task reminder email
   */
  private async sendTaskReminderEmail(task: TaskReminderData): Promise<void> {
    const isOverdue = task.dueDate < new Date();
    const daysUntilDue = Math.ceil((task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    const subject = isOverdue 
      ? `🚨 Overdue Task: ${task.title}`
      : `⏰ Task Due Tomorrow: ${task.title}`;

    const htmlContent = this.generateTaskReminderHTML(task, isOverdue, daysUntilDue);

    try {
      await resend.emails.send({
        from: 'LabSync <noreply@labsync.app>',
        to: [task.assigneeEmail!],
        subject,
        html: htmlContent,
      });

      // Update last_reminder_sent timestamp
      await sql`
        UPDATE tasks 
        SET last_reminder_sent = NOW()
        WHERE id = ${task.id}
      `;

      console.log(`✅ Sent reminder email for task "${task.title}" to ${task.assigneeEmail}`);
    } catch (error) {
      console.error(`❌ Failed to send reminder email for task "${task.title}":`, error);
    }
  }

  /**
   * Generate beautiful HTML email template for task reminders
   */
  private generateTaskReminderHTML(task: TaskReminderData, isOverdue: boolean, daysUntilDue: number): string {
    const priorityColors = {
      HIGH: '#EF4444',
      MEDIUM: '#F59E0B', 
      LOW: '#10B981'
    };

    const priorityColor = priorityColors[task.priority as keyof typeof priorityColors] || '#6B7280';
    const statusColor = isOverdue ? '#DC2626' : '#4C9A92';
    const statusText = isOverdue ? 'OVERDUE' : `DUE ${daysUntilDue === 0 ? 'TODAY' : 'TOMORROW'}`;
    
    const formattedDueDate = task.dueDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Reminder - ${task.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #F9FAFB;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #FFFFFF;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #4C9A92 0%, #5DD5E6 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 16px;
        }
        
        .status-badge {
            display: inline-block;
            background-color: ${statusColor};
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 15px;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .task-card {
            background-color: #F8FAFC;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 30px;
            border-left: 4px solid ${priorityColor};
        }
        
        .task-title {
            font-size: 20px;
            font-weight: 700;
            color: #1F2937;
            margin-bottom: 12px;
        }
        
        .task-description {
            color: #6B7280;
            margin-bottom: 20px;
            line-height: 1.7;
        }
        
        .task-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        
        .meta-item {
            display: flex;
            align-items: center;
        }
        
        .meta-icon {
            width: 20px;
            height: 20px;
            margin-right: 8px;
            opacity: 0.7;
        }
        
        .meta-label {
            font-weight: 600;
            color: #374151;
            margin-right: 6px;
        }
        
        .priority-high { color: #EF4444; }
        .priority-medium { color: #F59E0B; }
        .priority-low { color: #10B981; }
        
        .cta-section {
            text-align: center;
            margin: 30px 0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #4C9A92 0%, #5DD5E6 100%);
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
        }
        
        .cta-button:hover {
            transform: translateY(-1px);
        }
        
        .footer {
            background-color: #F3F4F6;
            padding: 20px 30px;
            text-align: center;
            color: #6B7280;
            font-size: 14px;
        }
        
        .footer a {
            color: #4C9A92;
            text-decoration: none;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 8px;
            }
            
            .header, .content {
                padding: 20px;
            }
            
            .task-meta {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Task Reminder</h1>
            <p>LabSync - Making Science Easier</p>
            <div class="status-badge">${statusText}</div>
        </div>
        
        <div class="content">
            <div class="task-card">
                <h2 class="task-title">${task.title}</h2>
                ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                
                <div class="task-meta">
                    <div class="meta-item">
                        <span class="meta-icon">📅</span>
                        <span class="meta-label">Due Date:</span>
                        <span>${formattedDueDate}</span>
                    </div>
                    
                    <div class="meta-item">
                        <span class="meta-icon">⚡</span>
                        <span class="meta-label">Priority:</span>
                        <span class="priority-${task.priority.toLowerCase()}">${task.priority}</span>
                    </div>
                    
                    ${task.studyTitle ? `
                    <div class="meta-item">
                        <span class="meta-icon">🔬</span>
                        <span class="meta-label">Study:</span>
                        <span>${task.studyTitle}</span>
                    </div>
                    ` : ''}
                    
                    ${task.labName ? `
                    <div class="meta-item">
                        <span class="meta-icon">🏢</span>
                        <span class="meta-label">Lab:</span>
                        <span>${task.labName}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            ${isOverdue ? `
            <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <p style="color: #DC2626; font-weight: 600; margin: 0;">
                    ⚠️ This task is overdue. Please update your progress or adjust the due date.
                </p>
            </div>
            ` : `
            <div style="background-color: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <p style="color: #0369A1; font-weight: 600; margin: 0;">
                    💡 Don't forget to mark this task as complete when finished!
                </p>
            </div>
            `}
            
            <div class="cta-section">
                <a href="https://labsync.app/tasks" class="cta-button">
                    View Task in LabSync
                </a>
            </div>
        </div>
        
        <div class="footer">
            <p>
                This is an automated reminder from LabSync.<br>
                <a href="https://labsync.app">Visit LabSync</a> • 
                <a href="mailto:support@labsync.app">Contact Support</a>
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Send digest email with multiple upcoming tasks
   */
  async sendWeeklyTaskDigest(userEmail: string, userId: string): Promise<void> {
    try {
      const upcomingTasks = await this.getUserUpcomingTasks(userId);
      
      if (upcomingTasks.length === 0) {
        return; // No tasks to remind about
      }

      const htmlContent = this.generateWeeklyDigestHTML(upcomingTasks);
      
      await resend.emails.send({
        from: 'LabSync <noreply@labsync.app>',
        to: [userEmail],
        subject: `📋 Weekly Task Digest - ${upcomingTasks.length} upcoming tasks`,
        html: htmlContent,
      });

      console.log(`✅ Sent weekly digest to ${userEmail} with ${upcomingTasks.length} tasks`);
    } catch (error) {
      console.error(`❌ Failed to send weekly digest to ${userEmail}:`, error);
    }
  }

  private async getUserUpcomingTasks(userId: string): Promise<TaskReminderData[]> {
    const query = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.due_date,
        t.priority,
        s.title as study_title,
        u.name as assignee_name,
        u.email as assignee_email,
        l.name as lab_name
      FROM tasks t
      LEFT JOIN studies s ON t.study_id = s.id
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN labs l ON s.lab_id = l.id
      WHERE 
        t.assignee_id = $1
        AND t.due_date IS NOT NULL
        AND t.status != 'COMPLETED'
        AND t.due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
      ORDER BY t.due_date ASC
    `;

    const results = await sql(query, [userId]);
    return results.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      dueDate: new Date(row.due_date),
      priority: row.priority || 'MEDIUM',
      studyTitle: row.study_title,
      assigneeName: row.assignee_name,
      assigneeEmail: row.assignee_email,
      labName: row.lab_name,
    }));
  }

  private generateWeeklyDigestHTML(tasks: TaskReminderData[]): string {
    const taskItems = tasks.map(task => {
      const daysUntilDue = Math.ceil((task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const dueDateText = daysUntilDue === 0 ? 'Today' : daysUntilDue === 1 ? 'Tomorrow' : `${daysUntilDue} days`;
      
      return `
        <div style="border-left: 4px solid #4C9A92; padding: 16px; margin-bottom: 16px; background-color: #F8FAFC; border-radius: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #1F2937;">${task.title}</h3>
          <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">Due: ${dueDateText} • Priority: ${task.priority}</p>
          ${task.studyTitle ? `<p style="margin: 0; color: #6B7280; font-size: 12px;">Study: ${task.studyTitle}</p>` : ''}
        </div>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Weekly Task Digest</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #4C9A92 0%, #5DD5E6 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0;">📋 Weekly Task Digest</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">You have ${tasks.length} upcoming tasks this week</p>
    </div>
    
    <div>
        ${taskItems}
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
        <a href="https://labsync.app/tasks" style="background: linear-gradient(135deg, #4C9A92 0%, #5DD5E6 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
            View All Tasks
        </a>
    </div>
    
    <div style="text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px;">
        <p>LabSync - Making Science Easier</p>
    </div>
</body>
</html>`;
  }
}

export const emailReminderService = new EmailReminderService();