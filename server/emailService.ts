import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface TaskAssignmentEmailData {
  assigneeName: string;
  assigneeEmail: string;
  assignerName: string;
  taskTitle: string;
  taskDescription?: string;
  dueDate?: Date;
  labName: string;
  taskUrl?: string;
}

export class EmailService {
  static async sendTaskAssignmentEmail(data: TaskAssignmentEmailData): Promise<void> {
    const { 
      assigneeName, 
      assigneeEmail, 
      assignerName, 
      taskTitle, 
      taskDescription,
      dueDate, 
      labName,
      taskUrl 
    } = data;

    // Format the due date if provided
    const formattedDueDate = dueDate ? 
      new Date(dueDate).toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: 'numeric' 
      }) : null;

    // Microsoft Planner-style HTML email template (dark theme to match screenshot)
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #1a1a1a;
          }
          .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #2d2d2d;
            border: 1px solid #3d3d3d;
            border-radius: 8px;
            overflow: hidden;
          }
          .header {
            background: #1a1a1a;
            padding: 20px 24px;
            border-bottom: 1px solid #3d3d3d;
          }
          .header-title {
            margin: 0;
            font-size: 18px;
            font-weight: 400;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .planner-icon {
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #7B68EE 0%, #9370DB 100%);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .planner-icon::after {
            content: '';
            width: 14px;
            height: 2px;
            background: white;
            display: block;
            box-shadow: 0 4px 0 white, 0 8px 0 white;
          }
          .content {
            padding: 24px;
          }
          .assignment-notification {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            color: #d4d4d4;
            font-size: 15px;
          }
          .checkmark-circle {
            width: 20px;
            height: 20px;
            background-color: #5B5FC7;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .checkmark-circle::after {
            content: '✓';
            color: white;
            font-size: 12px;
            font-weight: bold;
          }
          .assignment-text {
            color: #d4d4d4;
          }
          .assignment-text a {
            color: #7B68EE;
            text-decoration: underline;
          }
          .task-card {
            background-color: #1a1a1a;
            border: 1px solid #3d3d3d;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
          }
          .task-title {
            font-size: 16px;
            font-weight: 400;
            color: #ffffff;
            margin: 0 0 12px 0;
            text-decoration: underline;
          }
          .task-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #a0a0a0;
            font-size: 14px;
          }
          .calendar-icon {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
          }
          .button-container {
            display: flex;
            gap: 12px;
            margin-top: 24px;
          }
          .action-button {
            display: inline-block;
            padding: 10px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-size: 15px;
            font-weight: 500;
            text-align: center;
            transition: all 0.2s;
            border: 2px solid transparent;
          }
          .btn-primary {
            background-color: #5B5FC7;
            color: white;
            border-color: #5B5FC7;
          }
          .btn-primary:hover {
            background-color: #4A4EB6;
            border-color: #4A4EB6;
          }
          .btn-secondary {
            background-color: transparent;
            color: #ffffff;
            border: 2px solid #4a4a4a;
          }
          .btn-secondary:hover {
            background-color: #3a3a3a;
            border-color: #5a5a5a;
          }
          .footer {
            padding: 16px 24px;
            background-color: #1a1a1a;
            border-top: 1px solid #3d3d3d;
            text-align: center;
            font-size: 12px;
            color: #808080;
          }
          .footer a {
            color: #7B68EE;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1 class="header-title">
              <div class="planner-icon"></div>
              <span>Plan: ${labName} Tasks</span>
            </h1>
          </div>
          
          <div class="content">
            <div class="assignment-notification">
              <div class="checkmark-circle"></div>
              <span class="assignment-text">
                ${assignerName} assigned a task to you in <a href="${taskUrl}">${labName} Tasks</a>
              </span>
            </div>
            
            <div class="task-card">
              <h2 class="task-title">${taskTitle}</h2>
              ${taskDescription ? `
                <p style="color: #a0a0a0; font-size: 14px; margin: 8px 0;">${taskDescription}</p>
              ` : ''}
              ${formattedDueDate ? `
                <div class="task-meta">
                  <svg class="calendar-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 1V3M5 1V3M2 6H14M3 2H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2Z" stroke="#a0a0a0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>${formattedDueDate}</span>
                </div>
              ` : ''}
            </div>
            
            <div class="button-container">
              <a href="${taskUrl || '#'}" class="action-button btn-primary">Open in Browser</a>
              <a href="${taskUrl || '#'}" class="action-button btn-secondary">Open in LabSync</a>
            </div>
          </div>
          
          <div class="footer">
            <p>This notification was sent from LabSync - ${labName}</p>
            <p>© 2025 LabSync. All rights reserved. | <a href="#">Manage preferences</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text version for email clients that don't support HTML
    const textContent = `
LabSync Tasks - ${labName}

${assignerName} assigned a task to you:

${taskTitle}
${taskDescription ? '\n' + taskDescription + '\n' : ''}
${formattedDueDate ? '\nDue Date: ' + formattedDueDate : ''}

${taskUrl ? 'View task: ' + taskUrl : ''}

---
This notification was sent from LabSync - ${labName}
    `.trim();

    try {
      await resend.emails.send({
        from: 'LabSync Tasks <notifications@labsync.clif-icu.org>',
        to: assigneeEmail,
        subject: `Task assigned: ${taskTitle}`,
        html: htmlContent,
        text: textContent,
      });
      
      console.log(`Task assignment email sent to ${assigneeEmail} for task: ${taskTitle}`);
    } catch (error) {
      console.error('Failed to send task assignment email:', error);
      // Don't throw - we don't want email failures to break task assignment
    }
  }

  static async sendBulkTaskAssignmentEmails(assignments: TaskAssignmentEmailData[]): Promise<void> {
    // Send emails in parallel but with a small delay to avoid rate limiting
    const emailPromises = assignments.map((assignment, index) => 
      new Promise(resolve => {
        setTimeout(async () => {
          await this.sendTaskAssignmentEmail(assignment);
          resolve(true);
        }, index * 100); // 100ms delay between emails
      })
    );

    await Promise.all(emailPromises);
  }
}