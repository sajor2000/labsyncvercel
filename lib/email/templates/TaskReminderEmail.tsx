import React from 'react'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
  Preview
} from '@react-email/components'

interface TaskReminderEmailProps {
  recipientName: string
  labName: string
  taskTitle: string
  taskDescription?: string
  dueDate: string
  daysUntilDue: number
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  currentStatus?: string
  labflowUrl?: string
}

export default function TaskReminderEmail({
  recipientName,
  labName,
  taskTitle,
  taskDescription,
  dueDate,
  daysUntilDue,
  priority = 'MEDIUM',
  currentStatus = 'In Progress',
  labflowUrl = 'https://labflow.dev'
}: TaskReminderEmailProps) {
  const priorityColors = {
    LOW: '#10b981',
    MEDIUM: '#f59e0b', 
    HIGH: '#f97316',
    URGENT: '#ef4444'
  }

  const priorityColor = priorityColors[priority]
  const isOverdue = daysUntilDue < 0
  const isDueSoon = daysUntilDue <= 2 && daysUntilDue >= 0

  const urgencyEmoji = isOverdue ? '🚨' : isDueSoon ? '⏰' : '📅'
  const urgencyText = isOverdue 
    ? `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue`
    : daysUntilDue === 0 
    ? 'due today'
    : `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} remaining`

  return (
    <Html>
      <Head />
      <Preview>Reminder: {taskTitle} - {urgencyText}</Preview>
      <Body style={{ 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f9fafb',
        margin: 0,
        padding: 0
      }}>
        <Container style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          padding: '20px'
        }}>
          {/* Header */}
          <Section style={{ textAlign: 'center', paddingBottom: '20px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : '#3b82f6',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px'
            }}>
              <span style={{ color: 'white', fontSize: '18px' }}>{urgencyEmoji}</span>
            </div>
            <Heading style={{
              color: '#1f2937',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '0'
            }}>
              LabFlow Reminder
            </Heading>
          </Section>

          <Hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />

          {/* Main Content */}
          <Section>
            <Heading style={{
              color: isOverdue ? '#dc2626' : isDueSoon ? '#d97706' : '#1f2937',
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '10px'
            }}>
              {isOverdue ? '🚨 Overdue Task' : isDueSoon ? '⏰ Task Due Soon' : '📅 Task Reminder'}
            </Heading>

            <Text style={{
              color: '#374151',
              fontSize: '16px',
              lineHeight: '1.5',
              margin: '0 0 20px 0'
            }}>
              Hi {recipientName},
            </Text>

            <Text style={{
              color: '#374151',
              fontSize: '16px',
              lineHeight: '1.5',
              margin: '0 0 20px 0'
            }}>
              This is a friendly reminder about your task in <strong>{labName}</strong>.
            </Text>

            {/* Task Details Card */}
            <div style={{
              backgroundColor: isOverdue ? '#fef2f2' : isDueSoon ? '#fffbeb' : '#f8fafc',
              border: `2px solid ${isOverdue ? '#fecaca' : isDueSoon ? '#fed7aa' : '#e2e8f0'}`,
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <Heading style={{
                  color: '#1e293b',
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '0',
                  flex: 1
                }}>
                  📋 {taskTitle}
                </Heading>
                <span style={{
                  backgroundColor: priorityColor,
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {priority}
                </span>
              </div>

              {taskDescription && (
                <Text style={{
                  color: '#475569',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  margin: '0 0 15px 0'
                }}>
                  {taskDescription}
                </Text>
              )}

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'auto 1fr',
                gap: '10px',
                fontSize: '14px'
              }}>
                <span style={{ color: '#64748b', fontWeight: '500' }}>📅 Due Date:</span>
                <span style={{ 
                  color: isOverdue ? '#dc2626' : isDueSoon ? '#d97706' : '#1e293b',
                  fontWeight: isOverdue || isDueSoon ? '600' : 'normal'
                }}>
                  {new Date(dueDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} ({urgencyText})
                </span>

                <span style={{ color: '#64748b', fontWeight: '500' }}>📊 Status:</span>
                <span style={{ color: '#1e293b' }}>{currentStatus}</span>

                <span style={{ color: '#64748b', fontWeight: '500' }}>🧪 Lab:</span>
                <span style={{ color: '#1e293b' }}>{labName}</span>
              </div>
            </div>

            <Text style={{
              color: '#374151',
              fontSize: '16px',
              lineHeight: '1.5',
              margin: '0 0 20px 0'
            }}>
              {isOverdue 
                ? "This task is now overdue. Please update your progress or reach out if you need assistance."
                : isDueSoon 
                ? "This task is due soon. Please make sure to complete it or update the timeline if needed."
                : "We wanted to remind you about this upcoming task. Please let us know if you have any questions or if the timeline needs to be adjusted."
              }
            </Text>

            {/* Action Buttons */}
            <div style={{ textAlign: 'center', margin: '30px 0' }}>
              <Button
                href={`${labflowUrl}/tasks`}
                style={{
                  backgroundColor: isOverdue ? '#dc2626' : isDueSoon ? '#d97706' : '#3b82f6',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'inline-block',
                  marginRight: '10px'
                }}
              >
                {isOverdue ? 'Update Task Status' : 'View Task Details'}
              </Button>
              
              <Button
                href={`${labflowUrl}/calendar`}
                style={{
                  backgroundColor: 'transparent',
                  color: '#3b82f6',
                  border: '2px solid #3b82f6',
                  padding: '10px 22px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'inline-block'
                }}
              >
                View Calendar
              </Button>
            </div>
          </Section>

          <Hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '30px 0 20px 0' }} />

          {/* Footer */}
          <Section style={{ textAlign: 'center' }}>
            <Text style={{
              color: '#6b7280',
              fontSize: '12px',
              lineHeight: '1.5',
              margin: '0 0 10px 0'
            }}>
              This reminder was automatically generated by LabFlow.
            </Text>
            <Text style={{
              color: '#6b7280',
              fontSize: '12px',
              lineHeight: '1.5',
              margin: '0'
            }}>
              You can adjust your reminder preferences in your 
              <a href={`${labflowUrl}/settings/notifications`} style={{ color: '#3b82f6' }}>
                notification settings
              </a>.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}