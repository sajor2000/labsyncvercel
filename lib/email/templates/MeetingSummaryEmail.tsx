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

interface MeetingSummaryEmailProps {
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
  labflowUrl?: string
}

export default function MeetingSummaryEmail({
  recipientName,
  labName,
  meetingTitle,
  meetingDate,
  summary,
  actionItems,
  attendees,
  nextMeetingDate,
  labflowUrl = 'https://labflow.dev'
}: MeetingSummaryEmailProps) {
  const priorityColors = {
    LOW: '#10b981',
    MEDIUM: '#f59e0b', 
    HIGH: '#f97316',
    URGENT: '#ef4444'
  }

  return (
    <Html>
      <Head />
      <Preview>Meeting Summary: {meetingTitle}</Preview>
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
              <span style={{ color: 'white', fontSize: '18px' }}>🤝</span>
            </div>
            <Heading style={{
              color: '#1f2937',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '0'
            }}>
              Meeting Summary
            </Heading>
            <Text style={{
              color: '#6b7280',
              fontSize: '14px',
              margin: '5px 0 0 0'
            }}>
              {labName}
            </Text>
          </Section>

          <Hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />

          {/* Meeting Info */}
          <Section>
            <Heading style={{
              color: '#1f2937',
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '15px'
            }}>
              📅 {meetingTitle}
            </Heading>

            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '25px'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'auto 1fr',
                gap: '12px',
                fontSize: '14px'
              }}>
                <span style={{ color: '#64748b', fontWeight: '500' }}>📅 Date:</span>
                <span style={{ color: '#1e293b' }}>
                  {new Date(meetingDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>

                <span style={{ color: '#64748b', fontWeight: '500' }}>👥 Attendees:</span>
                <span style={{ color: '#1e293b' }}>{attendees.join(', ')}</span>

                {nextMeetingDate && (
                  <>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>🔄 Next Meeting:</span>
                    <span style={{ color: '#1e293b' }}>
                      {new Date(nextMeetingDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>

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
              margin: '0 0 25px 0'
            }}>
              Here's a summary of our recent meeting. Please review the action items 
              and let us know if there are any corrections or additions needed.
            </Text>
          </Section>

          {/* Meeting Summary */}
          <Section>
            <Heading style={{
              color: '#1f2937',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '15px'
            }}>
              📝 Meeting Summary
            </Heading>

            <div style={{
              backgroundColor: '#fefefe',
              border: '1px solid #e5e7eb',
              borderLeft: '4px solid #3b82f6',
              borderRadius: '0 8px 8px 0',
              padding: '20px',
              marginBottom: '25px'
            }}>
              <div 
                style={{
                  color: '#374151',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}
                dangerouslySetInnerHTML={{ __html: summary }}
              />
            </div>
          </Section>

          {/* Action Items */}
          {actionItems.length > 0 && (
            <Section>
              <Heading style={{
                color: '#1f2937',
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '15px'
              }}>
                📋 Action Items ({actionItems.length})
              </Heading>

              {actionItems.map((item, index) => (
                <div key={index} style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <Text style={{
                      color: '#1e293b',
                      fontSize: '14px',
                      fontWeight: '500',
                      margin: '0',
                      flex: 1,
                      paddingRight: '10px'
                    }}>
                      {item.description}
                    </Text>
                    <span style={{
                      backgroundColor: priorityColors[item.priority as keyof typeof priorityColors] || '#6b7280',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.priority}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '15px',
                    fontSize: '12px',
                    color: '#64748b'
                  }}>
                    {item.assignee && (
                      <span>👤 {item.assignee}</span>
                    )}
                    {item.dueDate && (
                      <span>📅 Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* Call to Action */}
          <Section style={{ textAlign: 'center', margin: '30px 0' }}>
            <Text style={{
              color: '#374151',
              fontSize: '16px',
              lineHeight: '1.5',
              margin: '0 0 20px 0'
            }}>
              Review your assigned tasks and update your progress in LabFlow.
            </Text>

            <Button
              href={`${labflowUrl}/meetings`}
              style={{
                backgroundColor: '#3b82f6',
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
              View Full Meeting
            </Button>
            
            <Button
              href={`${labflowUrl}/tasks`}
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
              My Tasks
            </Button>
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
              This meeting summary was automatically generated using AI and may require verification.
            </Text>
            <Text style={{
              color: '#6b7280',
              fontSize: '12px',
              lineHeight: '1.5',
              margin: '0'
            }}>
              To manage your email preferences, visit your 
              <a href={`${labflowUrl}/settings/notifications`} style={{ color: '#3b82f6' }}>
                notification settings
              </a> in LabFlow.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}