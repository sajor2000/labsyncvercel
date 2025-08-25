/**
 * Simple Resend email notifications
 * Clean, direct, no over-engineering
 */

import { Resend } from 'resend'
import { generateEmailContent } from '@/lib/ai/simple-ai'
import type { Task, CalendarEvent, UserProfile } from '@/lib/db/types'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@labsync.io'

/**
 * Send task assignment notification
 */
export async function sendTaskAssignment(
  task: Task & { project?: { title: string } },
  assignee: UserProfile,
  assignedBy: UserProfile
) {
  try {
    const { subject, body } = await generateEmailContent('task_assignment', {
      taskTitle: task.title,
      assigneeName: assignee.full_name || assignee.email,
      dueDate: task.due_date,
      projectTitle: task.project?.title || 'Unknown Project',
    })

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New Task Assignment</h2>
        <p style="color: #666; line-height: 1.6;">${body}</p>
        <div style="margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #1a1a1a;">${task.title}</h3>
          ${task.description ? `<p style="color: #666;">${task.description}</p>` : ''}
          ${task.due_date ? `<p style="color: #666;"><strong>Due:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>` : ''}
          <p style="color: #666;"><strong>Priority:</strong> ${task.priority}</p>
        </div>
        <p style="color: #999; font-size: 12px;">
          Assigned by ${assignedBy.full_name || assignedBy.email}
        </p>
      </div>
    `

    await resend.emails.send({
      from: FROM_EMAIL,
      to: assignee.email,
      subject,
      html,
      tags: [
        { name: 'type', value: 'task_assignment' },
        { name: 'task_id', value: task.id },
      ],
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send task assignment email:', error)
    return { success: false, error }
  }
}

/**
 * Send deadline reminder
 */
export async function sendDeadlineReminder(
  task: Task & { project?: { title: string } },
  assignee: UserProfile
) {
  try {
    if (!task.due_date) return { success: false, error: 'No due date' }

    const dueDate = new Date(task.due_date)
    const now = new Date()
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    const { subject, body } = await generateEmailContent('deadline_reminder', {
      taskTitle: task.title,
      dueDate: dueDate.toLocaleDateString(),
      daysUntilDue,
    })

    const urgencyColor = daysUntilDue <= 1 ? '#dc2626' : daysUntilDue <= 3 ? '#f59e0b' : '#3b82f6'

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${urgencyColor};">⏰ Task Deadline Reminder</h2>
        <p style="color: #666; line-height: 1.6;">${body}</p>
        <div style="margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 8px; border-left: 4px solid ${urgencyColor};">
          <h3 style="margin-top: 0; color: #1a1a1a;">${task.title}</h3>
          <p style="color: #666; font-size: 18px;"><strong>Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}</strong></p>
          ${task.project ? `<p style="color: #666;">Project: ${task.project.title}</p>` : ''}
        </div>
      </div>
    `

    await resend.emails.send({
      from: FROM_EMAIL,
      to: assignee.email,
      subject,
      html,
      tags: [
        { name: 'type', value: 'deadline_reminder' },
        { name: 'task_id', value: task.id },
        { name: 'days_until_due', value: daysUntilDue.toString() },
      ],
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send deadline reminder:', error)
    return { success: false, error }
  }
}

/**
 * Send meeting invite
 */
export async function sendMeetingInvite(
  event: CalendarEvent,
  attendees: UserProfile[]
) {
  try {
    const startTime = new Date(event.start_time)
    const endTime = new Date(event.end_time)
    
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">📅 Meeting Invitation</h2>
        <div style="margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #1a1a1a;">${event.summary}</h3>
          ${event.description ? `<p style="color: #666;">${event.description}</p>` : ''}
          <div style="margin-top: 20px;">
            <p style="color: #666;"><strong>When:</strong> ${startTime.toLocaleString()} - ${endTime.toLocaleTimeString()}</p>
            ${event.location ? `<p style="color: #666;"><strong>Where:</strong> ${event.location}</p>` : ''}
            ${event.google_meet_link ? `
              <p style="color: #666;">
                <strong>Join:</strong> 
                <a href="${event.google_meet_link}" style="color: #3b82f6;">Google Meet</a>
              </p>
            ` : ''}
          </div>
        </div>
        <p style="color: #666;">
          <strong>Attendees:</strong> ${attendees.map(a => a.full_name || a.email).join(', ')}
        </p>
      </div>
    `

    // Send to all attendees
    const emailPromises = attendees.map(attendee =>
      resend.emails.send({
        from: FROM_EMAIL,
        to: attendee.email,
        subject: `Meeting: ${event.summary}`,
        html,
        tags: [
          { name: 'type', value: 'meeting_invite' },
          { name: 'event_id', value: event.id },
        ],
      })
    )

    await Promise.all(emailPromises)
    return { success: true }
  } catch (error) {
    console.error('Failed to send meeting invites:', error)
    return { success: false, error }
  }
}

/**
 * Send project update notification
 */
export async function sendProjectUpdate(
  projectTitle: string,
  progress: number,
  milestone: string,
  recipients: UserProfile[]
) {
  try {
    const { subject, body } = await generateEmailContent('project_update', {
      projectTitle,
      progress,
      milestone,
    })

    const progressColor = progress >= 75 ? '#10b981' : progress >= 50 ? '#3b82f6' : progress >= 25 ? '#f59e0b' : '#ef4444'

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">📊 Project Update</h2>
        <p style="color: #666; line-height: 1.6;">${body}</p>
        <div style="margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #1a1a1a;">${projectTitle}</h3>
          <div style="margin: 20px 0;">
            <div style="background: #e5e5e5; border-radius: 4px; height: 20px; overflow: hidden;">
              <div style="background: ${progressColor}; height: 100%; width: ${progress}%; transition: width 0.3s;"></div>
            </div>
            <p style="color: #666; margin-top: 10px; font-size: 24px; font-weight: bold;">${progress}% Complete</p>
          </div>
          <p style="color: #666;"><strong>Recent Milestone:</strong> ${milestone}</p>
        </div>
      </div>
    `

    const emailPromises = recipients.map(recipient =>
      resend.emails.send({
        from: FROM_EMAIL,
        to: recipient.email,
        subject,
        html,
        tags: [
          { name: 'type', value: 'project_update' },
          { name: 'project', value: projectTitle },
        ],
      })
    )

    await Promise.all(emailPromises)
    return { success: true }
  } catch (error) {
    console.error('Failed to send project update:', error)
    return { success: false, error }
  }
}

/**
 * Send batch notifications (for efficiency)
 */
export async function sendBatchNotifications(
  notifications: Array<{
    type: 'task' | 'deadline' | 'meeting' | 'update'
    data: any
    recipients: UserProfile[]
  }>
) {
  const results: any[] = []
  
  for (const notification of notifications) {
    switch (notification.type) {
      case 'task':
        // Handle task notifications
        break
      case 'deadline':
        // Handle deadline reminders
        break
      case 'meeting':
        // Handle meeting invites
        break
      case 'update':
        // Handle project updates
        break
    }
  }
  
  return results
}