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

interface TaskAssignmentEmailProps {
  recipientName: string
  labName: string
  taskTitle: string
  taskDescription?: string
  dueDate?: string
  assignedBy: string
  meetingTitle?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  labflowUrl?: string
}

export default function TaskAssignmentEmail({
  recipientName,
  labName,
  taskTitle,
  taskDescription,
  dueDate,
  assignedBy,
  meetingTitle,
  priority = 'MEDIUM',
  labflowUrl = 'https://labflow.dev'
}: TaskAssignmentEmailProps) {
  const priorityColors = {
    LOW: '#10b981',
    MEDIUM: '#f59e0b', 
    HIGH: '#f97316',
    URGENT: '#ef4444'
  }

  const priorityColor = priorityColors[priority]

  return (
    <Html>
      <Head />
      <Preview>New task assigned: {taskTitle}</Preview>
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
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px'
            }}>
              <span style={{ color: 'white', fontSize: '18px' }}>🧪</span>
            </div>
            <Heading style={{
              color: '#1f2937',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '0'
            }}>
              LabFlow
            </Heading>
            <Text style={{
              color: '#6b7280',
              fontSize: '14px',
              margin: '5px 0 0 0'
            }}>
              Medical Research Lab Management
            </Text>
          </Section>

          <Hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />

          {/* Main Content */}
          <Section>
            <Heading style={{
              color: '#1f2937',
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '10px'
            }}>
              New Task Assignment
            </Heading>

            <Text style={{
              color: '#374151',
              fontSize: '16px',
              lineHeight: '1.5',
              margin: '0 0 20px 0'
            }}>
              Hello {recipientName},
            </Text>

            <Text style={{
              color: '#374151',
              fontSize: '16px',
              lineHeight: '1.5',
              margin: '0 0 20px 0'
            }}>
              You have been assigned a new task in <strong>{labName}</strong>
              {meetingTitle && ` during the ${meetingTitle} meeting`}.
            </Text>

            {/* Task Details Card */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
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
                <span style={{ color: '#1e293b' }}>
                  {dueDate ? new Date(dueDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'No deadline specified'}
                </span>

                <span style={{ color: '#64748b', fontWeight: '500' }}>👤 Assigned by:</span>
                <span style={{ color: '#1e293b' }}>{assignedBy}</span>

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
              Please review the task details and update your progress in LabFlow. 
              If you have any questions or need clarification, feel free to reach out 
              to {assignedBy} or your lab coordinator.
            </Text>

            {/* Action Button */}
            <div style={{ textAlign: 'center', margin: '30px 0' }}>
              <Button
                href={`${labflowUrl}/tasks`}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'inline-block'
                }}
              >
                View Task in LabFlow
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
              This email was sent from LabFlow, your medical research lab management platform.
            </Text>
            <Text style={{
              color: '#6b7280',
              fontSize: '12px',
              lineHeight: '1.5',
              margin: '0'
            }}>
              If you no longer wish to receive these notifications, you can update your 
              <a href={`${labflowUrl}/settings/notifications`} style={{ color: '#3b82f6' }}>
                notification preferences
              </a> in LabFlow.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}