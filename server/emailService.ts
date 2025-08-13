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

    // Microsoft Planner-style HTML email template
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
            background-color: #f3f2f1;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #6264A7 0%, #8B8CC7 100%);
            padding: 24px 32px;
            color: white;
          }
          .header-title {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .plan-name {
            font-size: 14px;
            margin-top: 8px;
            opacity: 0.95;
          }
          .content {
            padding: 32px;
          }
          .assignment-box {
            background-color: #f8f8f8;
            border-left: 4px solid #6264A7;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .assignment-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
            color: #323130;
            font-size: 16px;
          }
          .checkmark {
            width: 24px;
            height: 24px;
            background-color: #40E0D0;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .checkmark::after {
            content: '✓';
            color: white;
            font-weight: bold;
            font-size: 14px;
          }
          .task-title {
            font-size: 20px;
            font-weight: 600;
            color: #323130;
            margin: 12px 0;
          }
          .task-description {
            color: #605e5c;
            font-size: 14px;
            margin: 12px 0;
            line-height: 1.5;
          }
          .due-date-container {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #e1e1e1;
          }
          .calendar-icon {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
          }
          .due-date {
            color: #323130;
            font-size: 14px;
            font-weight: 500;
          }
          .action-button {
            display: inline-block;
            background-color: #6264A7;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            margin-top: 24px;
            transition: background-color 0.2s;
          }
          .action-button:hover {
            background-color: #5254A3;
          }
          .footer {
            padding: 24px 32px;
            background-color: #f3f2f1;
            text-align: center;
            font-size: 12px;
            color: #605e5c;
          }
          .footer a {
            color: #6264A7;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1 class="header-title">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="4" fill="white" fill-opacity="0.2"/>
                <path d="M8 11h16v2H8v-2zm0 4h16v2H8v-2zm0 4h10v2H8v-2z" fill="white"/>
              </svg>
              LabSync Tasks
            </h1>
            <div class="plan-name">Plan: ${labName} Tasks</div>
          </div>
          
          <div class="content">
            <div class="assignment-box">
              <div class="assignment-header">
                <div class="checkmark"></div>
                <span>${assignerName} assigned a task to you in ${labName} Tasks</span>
              </div>
              
              <div class="task-title">${taskTitle}</div>
              
              ${taskDescription ? `
                <div class="task-description">${taskDescription}</div>
              ` : ''}
              
              ${formattedDueDate ? `
                <div class="due-date-container">
                  <svg class="calendar-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2V4M6 2V4M3 8H17M5 3H15C16.1046 3 17 3.89543 17 5V16C17 17.1046 16.1046 18 15 18H5C3.89543 18 3 17.1046 3 16V5C3 3.89543 3.89543 3 5 3Z" stroke="#6264A7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span class="due-date">${formattedDueDate}</span>
                </div>
              ` : ''}
            </div>
            
            ${taskUrl ? `
              <a href="${taskUrl}" class="action-button">View Task in LabSync</a>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>This notification was sent from LabSync - ${labName}</p>
            <p>© 2025 LabSync. All rights reserved.</p>
            <p><a href="#">Manage email preferences</a></p>
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
        from: 'LabSync Tasks <notifications@labsync.com>',
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