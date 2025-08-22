/**
 * Enhanced Resend email service with React Email templates
 * Implements best practices for email delivery and tracking
 */

import { Resend } from 'resend'
import { render } from '@react-email/render'
import { resendConfig } from '../config/api-keys'
import { retryResend } from '../utils/retry'
import { mapResendError, ExternalApiError } from '../errors/api-errors'

// Import email templates
import TaskAssignmentEmail from './templates/TaskAssignmentEmail'
import TaskReminderEmail from './templates/TaskReminderEmail'
import MeetingSummaryEmail from './templates/MeetingSummaryEmail'

// Initialize Resend client
const resend = new Resend(resendConfig.apiKey)

export interface EmailAddress {
  email: string
  name?: string
}

export interface EmailOptions {
  to: EmailAddress | EmailAddress[]
  from?: EmailAddress
  replyTo?: EmailAddress
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  subject: string
  tags?: Array<{ name: string; value: string }>
  scheduledAt?: Date
}

export interface TaskAssignmentEmailData {
  recipientName: string
  labName: string
  taskTitle: string
  taskDescription?: string
  dueDate?: string
  assignedBy: string
  meetingTitle?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}

export interface TaskReminderEmailData {
  recipientName: string
  labName: string
  taskTitle: string
  taskDescription?: string
  dueDate: string
  daysUntilDue: number
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  currentStatus?: string
}

export interface MeetingSummaryEmailData {
  recipientName: string
  labName: string
  meetingTitle: string
  meetingDate: string
  summary: string
  actionItems: Array<{
    description: string
    assignee?: string
    priority: string
    dueDate?: string
  }>
  attendees: string[]
  nextMeetingDate?: string
}

export interface EmailResult {
  id: string
  success: boolean
  error?: string
}

class ResendEmailService {
  /**
   * Send task assignment email using React Email template
   */
  async sendTaskAssignmentEmail(
    data: TaskAssignmentEmailData,
    options: EmailOptions,
    correlationId?: string
  ): Promise<EmailResult> {
    try {
      console.log(`[${correlationId}] Sending task assignment email to ${Array.isArray(options.to) ? options.to.length + ' recipients' : options.to.email}`)

      const emailHtml = await render(TaskAssignmentEmail(data))
      const emailText = await render(TaskAssignmentEmail(data), { plainText: true })

      const result = await this.sendEmail(
        {
          ...options,
          subject: options.subject || `New Task Assignment: ${data.taskTitle}`,
          tags: [
            { name: 'email_type', value: 'task_assignment' },
            { name: 'lab', value: data.labName },
            { name: 'priority', value: data.priority || 'MEDIUM' },
            ...(options.tags || [])
          ]
        },
        emailHtml,
        emailText,
        correlationId
      )

      return result

    } catch (error) {
      console.error(`[${correlationId}] Error sending task assignment email:`, error)
      throw mapResendError(error, correlationId)
    }
  }

  /**
   * Send task reminder email using React Email template
   */
  async sendTaskReminderEmail(
    data: TaskReminderEmailData,
    options: EmailOptions,
    correlationId?: string
  ): Promise<EmailResult> {
    try {
      console.log(`[${correlationId}] Sending task reminder email to ${Array.isArray(options.to) ? options.to.length + ' recipients' : options.to.email}`)

      const emailHtml = await render(TaskReminderEmail(data))
      const emailText = await render(TaskReminderEmail(data), { plainText: true })

      const urgencyLevel = data.daysUntilDue < 0 ? 'overdue' : data.daysUntilDue <= 2 ? 'urgent' : 'normal'

      const result = await this.sendEmail(
        {
          ...options,
          subject: options.subject || `Task Reminder: ${data.taskTitle} ${data.daysUntilDue < 0 ? '(Overdue)' : data.daysUntilDue === 0 ? '(Due Today)' : ''}`,
          tags: [
            { name: 'email_type', value: 'task_reminder' },
            { name: 'lab', value: data.labName },
            { name: 'urgency', value: urgencyLevel },
            { name: 'priority', value: data.priority || 'MEDIUM' },
            ...(options.tags || [])
          ]
        },
        emailHtml,
        emailText,
        correlationId
      )

      return result

    } catch (error) {
      console.error(`[${correlationId}] Error sending task reminder email:`, error)
      throw mapResendError(error, correlationId)
    }
  }

  /**
   * Send meeting summary email using React Email template
   */
  async sendMeetingSummaryEmail(
    data: MeetingSummaryEmailData,
    options: EmailOptions,
    correlationId?: string
  ): Promise<EmailResult> {
    try {
      console.log(`[${correlationId}] Sending meeting summary email to ${Array.isArray(options.to) ? options.to.length + ' recipients' : options.to.email}`)

      const emailHtml = await render(MeetingSummaryEmail(data))
      const emailText = await render(MeetingSummaryEmail(data), { plainText: true })

      const result = await this.sendEmail(
        {
          ...options,
          subject: options.subject || `Meeting Summary: ${data.meetingTitle}`,
          tags: [
            { name: 'email_type', value: 'meeting_summary' },
            { name: 'lab', value: data.labName },
            { name: 'action_items_count', value: data.actionItems.length.toString() },
            ...(options.tags || [])
          ]
        },
        emailHtml,
        emailText,
        correlationId
      )

      return result

    } catch (error) {
      console.error(`[${correlationId}] Error sending meeting summary email:`, error)
      throw mapResendError(error, correlationId)
    }
  }

  /**
   * Send custom email with HTML and text content
   */
  async sendCustomEmail(
    options: EmailOptions,
    htmlContent: string,
    textContent?: string,
    correlationId?: string
  ): Promise<EmailResult> {
    try {
      console.log(`[${correlationId}] Sending custom email to ${Array.isArray(options.to) ? options.to.length + ' recipients' : options.to.email}`)

      return await this.sendEmail(
        {
          ...options,
          tags: [
            { name: 'email_type', value: 'custom' },
            ...(options.tags || [])
          ]
        },
        htmlContent,
        textContent,
        correlationId
      )

    } catch (error) {
      console.error(`[${correlationId}] Error sending custom email:`, error)
      throw mapResendError(error, correlationId)
    }
  }

  /**
   * Core email sending method with retry logic
   */
  private async sendEmail(
    options: EmailOptions,
    htmlContent: string,
    textContent?: string,
    correlationId?: string
  ): Promise<EmailResult> {
    try {
      const fromAddress = options.from || {
        email: resendConfig.fromEmail,
        name: 'LabFlow'
      }

      const replyToAddress = options.replyTo || (resendConfig.replyToEmail ? {
        email: resendConfig.replyToEmail,
        name: 'LabFlow Support'
      } : undefined)

      // Prepare recipients
      const toAddresses = Array.isArray(options.to) 
        ? options.to.map(addr => typeof addr === 'string' ? addr : `${addr.name ? `${addr.name} <${addr.email}>` : addr.email}`)
        : [typeof options.to === 'string' ? options.to : `${options.to.name ? `${options.to.name} <${options.to.email}>` : options.to.email}`]

      const emailData = {
        from: `${fromAddress.name} <${fromAddress.email}>`,
        to: toAddresses,
        subject: options.subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML for fallback text
        reply_to: replyToAddress ? `${replyToAddress.name} <${replyToAddress.email}>` : undefined,
        cc: options.cc?.map(addr => `${addr.name ? `${addr.name} <${addr.email}>` : addr.email}`),
        bcc: options.bcc?.map(addr => `${addr.name ? `${addr.name} <${addr.email}>` : addr.email}`),
        tags: options.tags ? Object.fromEntries(options.tags.map(tag => [tag.name, tag.value])) : undefined,
        scheduled_at: options.scheduledAt?.toISOString()
      }

      const response = await retryResend(async () => {
        return await resend.emails.send(emailData as any)
      })

      if (response.error) {
        throw new ExternalApiError('Resend', new Error(response.error.message), correlationId)
      }

      console.log(`[${correlationId}] Email sent successfully with ID: ${response.data?.id}`)

      return {
        id: response.data?.id || 'unknown',
        success: true
      }

    } catch (error) {
      console.error(`[${correlationId}] Failed to send email:`, error)
      throw mapResendError(error, correlationId)
    }
  }

  /**
   * Get email delivery status
   */
  async getEmailStatus(emailId: string, correlationId?: string): Promise<any> {
    try {
      // Note: Resend doesn't have a built-in status check API yet
      // This would be implemented when they add webhook support
      console.log(`[${correlationId}] Email status check requested for ID: ${emailId}`)
      
      return {
        id: emailId,
        status: 'sent', // Placeholder
        delivered_at: new Date().toISOString()
      }

    } catch (error) {
      console.error(`[${correlationId}] Error checking email status:`, error)
      throw mapResendError(error, correlationId)
    }
  }

  /**
   * Send bulk emails (batch processing)
   */
  async sendBulkEmails(
    emails: Array<{
      options: EmailOptions
      htmlContent: string
      textContent?: string
    }>,
    correlationId?: string
  ): Promise<EmailResult[]> {
    try {
      console.log(`[${correlationId}] Sending ${emails.length} bulk emails`)

      const results: EmailResult[] = []

      // Process in batches to avoid rate limits
      const batchSize = 10
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize)
        
        const batchPromises = batch.map(async (email, index) => {
          try {
            const result = await this.sendEmail(
              email.options,
              email.htmlContent,
              email.textContent,
              `${correlationId}-batch-${Math.floor(i / batchSize)}-${index}`
            )
            return result
          } catch (error) {
            console.error(`[${correlationId}] Batch email ${i + index} failed:`, error)
            return {
              id: `failed-${i + index}`,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        })

        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)

        // Small delay between batches to respect rate limits
        if (i + batchSize < emails.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      const successCount = results.filter(r => r.success).length
      console.log(`[${correlationId}] Bulk email completed: ${successCount}/${emails.length} successful`)

      return results

    } catch (error) {
      console.error(`[${correlationId}] Bulk email sending failed:`, error)
      throw mapResendError(error, correlationId)
    }
  }
}

// Export singleton instance
export const resendEmailService = new ResendEmailService()

// Convenience functions
export const sendTaskAssignmentEmail = resendEmailService.sendTaskAssignmentEmail.bind(resendEmailService)
export const sendTaskReminderEmail = resendEmailService.sendTaskReminderEmail.bind(resendEmailService)
export const sendMeetingSummaryEmail = resendEmailService.sendMeetingSummaryEmail.bind(resendEmailService)
export const sendCustomEmail = resendEmailService.sendCustomEmail.bind(resendEmailService)