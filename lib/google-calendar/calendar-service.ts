import { google } from 'googleapis'
import { googleConfig } from '../config/api-keys'
import { retry } from '../utils/retry'
import { createClient } from '@/utils/supabase/server'

// Default Google Calendar configuration (fallback for RICCC labs)
const RICCC_CALENDAR_ID = googleConfig.calendarId
const CALENDAR_TIMEZONE = googleConfig.timezone

interface CalendarIntegration {
  id: string
  lab_id: string
  provider: string
  external_calendar_id: string
  access_token_encrypted: string | null
  refresh_token_encrypted: string | null
  expires_at: string | null
  sync_enabled: boolean
  status: string
}

// Google Calendar color IDs mapping to our event types
const GOOGLE_CALENDAR_COLORS = {
  'pto': '7', // Peacock blue for PTO
  'clinic': '2', // Sage green for clinical service
  'holiday': '11', // Red for holidays
  'conference': '9', // Blue for conferences
  'training': '5', // Yellow for training
  'meeting': '1', // Lavender for meetings
  'deadline': '10', // Basil green for deadlines
  'other': '4' // Flamingo pink for misc events
} as const

type CalendarEvent = any
type GoogleEvent = any
type EventType = 'pto' | 'clinic' | 'holiday' | 'conference' | 'training' | 'meeting' | 'deadline' | 'other'

/**
 * Google Calendar Integration Service for Next.js
 * 
 * Handles integration with Google Calendar using OAuth2 authentication
 * - Fetches events from Google Calendar
 * - Converts formats between Google and LabFlow
 * - Syncs LabFlow events to Google Calendar
 */
export class GoogleCalendarService {
  private calendar: any
  private auth: any
  
  constructor() {
    this.initializeGoogleAuth()
  }

  /**
   * Resolve calendar configuration for a specific lab
   */
  private async getLabCalendarConfig(labId?: string): Promise<{
    calendarId: string
    auth: any
    integration: CalendarIntegration | null
  }> {
    if (!labId) {
      // No lab specified, use default RICCC calendar
      return {
        calendarId: RICCC_CALENDAR_ID,
        auth: this.calendar.auth,
        integration: null
      }
    }

    try {
      const supabase = await createClient()
      
      // Get lab's calendar integration
      const { data: integration, error } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('lab_id', labId)
        .eq('is_primary', true)
        .eq('sync_enabled', true)
        .single()

      if (error || !integration) {
        // No integration found, check if this is a RICCC/RHEDAS lab
        const { data: lab } = await supabase
          .from('labs')
          .select('name')
          .eq('id', labId)
          .single()

        const yourLabNames = ['RICCC', 'RHEDAS', 'Rush Health Equity', 'Rush Interdisciplinary']
        const isYourLab = lab && (lab as any).name && yourLabNames.some(name => (lab as any).name.includes(name))

        if (isYourLab) {
          // Your lab without explicit integration, use RICCC calendar
          return {
            calendarId: RICCC_CALENDAR_ID,
            auth: this.calendar.auth,
            integration: null
          }
        } else {
          // Other lab without integration, no calendar access
          throw new Error('No calendar integration configured for this lab')
        }
      }

      if ((integration as any).provider === 'ricc') {
        // RICCC calendar integration
        return {
          calendarId: RICCC_CALENDAR_ID,
          auth: this.calendar.auth,
          integration
        }
      } else if ((integration as any).provider === 'google') {
        // Personal Google Calendar integration
        const oauth2Client = new google.auth.OAuth2(
          googleConfig.clientId,
          googleConfig.clientSecret
        )

        oauth2Client.setCredentials({
          access_token: (integration as any).access_token_encrypted, // TODO: Decrypt in production
          refresh_token: (integration as any).refresh_token_encrypted // TODO: Decrypt in production
        })

        return {
          calendarId: (integration as any).external_calendar_id,
          auth: oauth2Client,
          integration
        }
      } else {
        throw new Error(`Unsupported calendar provider: ${(integration as any).provider}`)
      }

    } catch (error) {
      console.error('Error resolving calendar config for lab:', labId, error)
      throw error
    }
  }

  /**
   * Initialize Google Calendar API authentication
   */
  private initializeGoogleAuth() {
    try {
      if (googleConfig.apiKey) {
        // Use API key for read-only access
        this.calendar = google.calendar({ 
          version: 'v3', 
          auth: googleConfig.apiKey 
        })
        console.log('✅ Google Calendar API initialized with API key')
      } else if (googleConfig.clientId && googleConfig.clientSecret) {
        // Use OAuth2 for full access
        this.auth = new google.auth.OAuth2(
          googleConfig.clientId,
          googleConfig.clientSecret,
          'http://localhost:3000/auth/google/callback' // Will be updated for production
        )
        
        this.calendar = google.calendar({ 
          version: 'v3', 
          auth: this.auth 
        })
        console.log('✅ Google Calendar API initialized with OAuth2')
      } else {
        console.warn('⚠️ No Google Calendar authentication configured')
      }
    } catch (error) {
      console.error('❌ Google Calendar API initialization failed:', error)
    }
  }

  /**
   * Set access token for OAuth2 authentication
   */
  setAccessToken(accessToken: string, refreshToken?: string) {
    if (this.auth) {
      this.auth.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
      })
    }
  }

  /**
   * Get OAuth2 authorization URL
   */
  getAuthUrl(scopes: string[] = ['https://www.googleapis.com/auth/calendar']): string {
    if (!this.auth) {
      throw new Error('OAuth2 not configured')
    }

    return this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    })
  }

  /**
   * Fetch events from Google Calendar with retry logic
   */
  async fetchGoogleCalendarEvents(startDate?: Date, endDate?: Date, correlationId?: string, labId?: string): Promise<GoogleEvent[]> {
    try {
      const timeMin = startDate ? startDate.toISOString() : new Date().toISOString()
      const timeMax = endDate ? endDate.toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      console.log(`[${correlationId}] Fetching Google Calendar events from ${timeMin} to ${timeMax} for lab: ${labId || 'default'}`)

      // Get lab-specific calendar configuration
      const { calendarId, auth } = await this.getLabCalendarConfig(labId)
      
      // Create calendar client with the appropriate auth
      const calendar = google.calendar({ version: 'v3', auth })

      const response = await retry(async () => {
        return await calendar.events.list({
          calendarId,
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 250,
        })
      })

      const events = response.data.items || []
      console.log(`[${correlationId}] Fetched ${events.length} events from Google Calendar`)
      
      return events
    } catch (error) {
      console.error(`[${correlationId}] Error fetching Google Calendar events:`, error)
      throw error
    }
  }

  /**
   * Convert Google Calendar event to LabFlow calendar event format
   */
  convertGoogleEventToLabFlow(googleEvent: GoogleEvent): Partial<CalendarEvent> | null {
    if (!googleEvent.summary) return null

    const startDate = googleEvent.start?.dateTime || googleEvent.start?.date
    const endDate = googleEvent.end?.dateTime || googleEvent.end?.date
    
    if (!startDate || !endDate) return null

    const eventType = this.parseEventType(googleEvent.summary, googleEvent.description || '')
    
    return {
      title: googleEvent.summary,
      description: googleEvent.description || null,
      event_type: eventType,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      all_day: !googleEvent.start?.dateTime,
      location: googleEvent.location || null,
      external_calendar_id: googleEvent.id,
      external_event_id: googleEvent.htmlLink,
      external_provider: 'google' as const,
      metadata: {
        sourceType: 'google_calendar',
        googleEvent: {
          status: googleEvent.status,
          attendees: googleEvent.attendees?.length || 0,
          created: googleEvent.created,
          updated: googleEvent.updated
        }
      }
    }
  }

  /**
   * Parse event type from Google Calendar event title/description
   */
  private parseEventType(title: string, description: string): EventType {
    const content = `${title} ${description}`.toLowerCase()
    
    if (content.includes('pto') || content.includes('vacation') || content.includes('time off')) return 'pto'
    if (content.includes('clinical') || content.includes('clinic')) return 'clinic'
    if (content.includes('meeting') || content.includes('standup')) return 'meeting'
    if (content.includes('conference') || content.includes('presentation')) return 'conference'
    if (content.includes('training') || content.includes('education')) return 'training'
    if (content.includes('holiday')) return 'holiday'
    
    return 'other'
  }

  /**
   * Sync LabFlow event to Google Calendar with enhanced formatting
   */
  async syncEventToGoogle(labFlowEvent: CalendarEvent, correlationId?: string, labId?: string): Promise<string | null> {
    try {
      console.log(`[${correlationId}] Syncing event to Google Calendar: ${labFlowEvent.title} for lab: ${labId || 'default'}`)
      
      // Get lab-specific calendar configuration
      const { calendarId, auth } = await this.getLabCalendarConfig(labId)
      
      // Create calendar client with the appropriate auth
      const calendar = google.calendar({ version: 'v3', auth })

      const metadata = labFlowEvent.metadata as any || {}
      
      // Create professional title based on event type and metadata
      const professionalTitle = this.createProfessionalTitle(labFlowEvent)
      
      // Build attendees list if we have assignee information
      const attendees = this.buildAttendeesFromMetadata(metadata)

      const googleEvent: any = {
        summary: professionalTitle,
        description: this.buildGoogleEventDescription(labFlowEvent),
        start: labFlowEvent.all_day ? {
          date: new Date(labFlowEvent.start_date).toISOString().split('T')[0],
          timeZone: CALENDAR_TIMEZONE
        } : {
          dateTime: labFlowEvent.start_date,
          timeZone: CALENDAR_TIMEZONE
        },
        end: labFlowEvent.all_day ? {
          date: new Date(labFlowEvent.end_date).toISOString().split('T')[0],
          timeZone: CALENDAR_TIMEZONE
        } : {
          dateTime: labFlowEvent.end_date,
          timeZone: CALENDAR_TIMEZONE
        },
        location: labFlowEvent.location || this.getDefaultLocation(labFlowEvent.event_type),
        colorId: this.getGoogleColorId(labFlowEvent.event_type),
        transparency: 'opaque', // Show as busy
        visibility: 'default',
      }

      // Add attendees if we have any
      if (attendees.length > 0) {
        googleEvent.attendees = attendees
      }

      // Add reminders for important events
      if (metadata?.taskPriority === 'HIGH' || labFlowEvent.event_type === 'meeting') {
        googleEvent.reminders = {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 }, // 1 hour before
            { method: 'popup', minutes: 15 }, // 15 minutes before
          ],
        }
      }

      const response = await retry(async () => {
        return await calendar.events.insert({
          calendarId,
          requestBody: googleEvent,
        })
      })

      console.log(`[${correlationId}] Successfully synced event to Google Calendar with ID: ${response.data.id}`)
      return response.data.id || null
    } catch (error) {
      console.error(`[${correlationId}] Error syncing event to Google Calendar:`, error)
      throw error
    }
  }

  /**
   * Create professional, context-aware event titles
   */
  private createProfessionalTitle(event: CalendarEvent): string {
    const metadata = event.metadata as any || {}
    
    // Task deadline events - format: "Study Name - Assignee (Task Name)"
    if (metadata?.sourceType === 'task' || metadata?.sourceType === 'meeting_task') {
      const studyName = metadata.studyName || 'Lab Project'
      const taskName = metadata.taskName || event.title.replace('Task Deadline: ', '')
      
      // Get primary assignee
      let assignee = 'Unassigned'
      if (metadata.taskAssignees && metadata.taskAssignees.length > 0) {
        assignee = metadata.taskAssignees[0]
      }
      
      return `${studyName} - ${assignee} (${taskName})`
    }
    
    // Meeting events
    if (metadata?.sourceType === 'meeting') {
      return `🤝 ${event.title}`
    }
    
    // Default formatting with category prefix
    const categoryIcon = this.getCategoryIcon(event.event_type)
    return `${categoryIcon} ${event.title}`
  }

  /**
   * Get category icon for event types
   */
  private getCategoryIcon(eventType: EventType | null): string {
    const iconMap: Record<EventType, string> = {
      'meeting': '🤝',
      'deadline': '⏰',
      'clinic': '🏥',
      'pto': '🏖️',
      'training': '📚',
      'conference': '🎤',
      'holiday': '🎉',
      'other': '📌'
    }
    
    return eventType ? iconMap[eventType] || '📌' : '📌'
  }

  /**
   * Build attendees list from metadata
   */
  private buildAttendeesFromMetadata(metadata: any): any[] {
    const attendees: any[] = []
    
    if (metadata?.taskAssignees && Array.isArray(metadata.taskAssignees)) {
      // Try to convert names to emails if possible
      metadata.taskAssignees.forEach((assignee: string) => {
        const email = this.getEmailFromName(assignee)
        if (email) {
          attendees.push({
            email: email,
            displayName: assignee,
            responseStatus: 'needsAction'
          })
        }
      })
    }
    
    return attendees
  }

  /**
   * Get email from team member name (basic implementation)
   */
  private getEmailFromName(name: string): string | null {
    // This is a basic implementation - in a real system you'd query your database
    // For now, return null since we don't have email mapping
    return null
  }

  /**
   * Get default location for event types
   */
  private getDefaultLocation(eventType: EventType | null): string {
    const locationMap: Record<EventType, string> = {
      'meeting': 'Conference Room TBD',
      'deadline': '',
      'clinic': 'Rush University Medical Center',
      'training': 'Education Center',
      'conference': 'Location TBD',
      'pto': '',
      'holiday': '',
      'other': ''
    }
    
    return eventType ? locationMap[eventType] || '' : ''
  }

  /**
   * Build rich, professional description for Google Calendar event
   */
  private buildGoogleEventDescription(event: CalendarEvent): string {
    const lines: string[] = []
    const metadata = event.metadata as any || {}

    // Main description if provided
    if (event.description) {
      lines.push(event.description)
      lines.push('') // Empty line separator
    }

    // Task-specific formatting
    if (metadata?.sourceType === 'task' || metadata?.sourceType === 'meeting_task') {
      lines.push('📋 TASK DEADLINE DETAILS')
      lines.push('═══════════════════════════════')
      
      if (metadata.taskName) {
        lines.push(`📌 Task: ${metadata.taskName}`)
      }
      
      if (metadata.taskPriority) {
        const priorityEmoji = metadata.taskPriority === 'HIGH' ? '🔴' : 
                             metadata.taskPriority === 'MEDIUM' ? '🟡' : '🟢'
        lines.push(`${priorityEmoji} Priority: ${metadata.taskPriority}`)
      }
      
      if (metadata.taskAssignees && metadata.taskAssignees.length > 0) {
        lines.push(`👥 Responsible: ${metadata.taskAssignees.join(', ')}`)
      }
      
      if (metadata.studyName) {
        lines.push(`🔬 Study: ${metadata.studyName}`)
      }
      
      if (metadata.meetingTitle) {
        lines.push(`🤝 From Meeting: ${metadata.meetingTitle}`)
      }
      
      lines.push('') // Empty line separator
    }

    // Meeting-specific formatting
    if (metadata?.sourceType === 'meeting') {
      lines.push('🤝 MEETING DETAILS')
      lines.push('═══════════════════════════════')
      
      if (metadata.meetingType) {
        lines.push(`📊 Type: ${metadata.meetingType.replace('_', ' ').toUpperCase()}`)
      }
      
      if (metadata.projectIds && metadata.projectIds.length > 0) {
        lines.push(`📁 Projects: ${metadata.projectIds.length} project(s)`)
      }
      
      if (metadata.studyIds && metadata.studyIds.length > 0) {
        lines.push(`🔬 Studies: ${metadata.studyIds.length} study(ies)`)
      }
      
      lines.push('') // Empty line separator
    }

    // General event information
    lines.push('📅 EVENT INFORMATION')
    lines.push('═══════════════════════════════')
    lines.push(`🏷️ Type: ${this.formatEventType(event.event_type)}`)
    
    if (event.location) {
      lines.push(`📍 Location: ${event.location}`)
    }

    // Lab context
    if (metadata?.labContext) {
      lines.push(`🧪 Lab: ${metadata.labContext}`)
    }

    // Additional metadata
    if (metadata?.additionalInfo) {
      lines.push('')
      lines.push('ℹ️ ADDITIONAL INFORMATION')
      lines.push('═══════════════════════════════')
      if (typeof metadata.additionalInfo === 'string') {
        lines.push(metadata.additionalInfo)
      } else {
        Object.entries(metadata.additionalInfo).forEach(([key, value]) => {
          lines.push(`${key}: ${value}`)
        })
      }
    }

    // Footer
    lines.push('')
    lines.push('──────────────────────────────────')
    lines.push('🚀 Powered by LabFlow')
    lines.push('🌐 RICCC & RHEDAS Labs @ Rush')
    lines.push('📧 Contact: riccclabs@gmail.com')
    
    return lines.join('\n')
  }

  /**
   * Format event type for display
   */
  private formatEventType(eventType: EventType | null): string {
    const typeMap: Record<EventType, string> = {
      'meeting': '🤝 Meeting',
      'deadline': '⏰ Deadline',
      'clinic': '🏥 Clinical Service',
      'pto': '🏖️ Time Off',
      'training': '📚 Training',
      'conference': '🎤 Conference',
      'holiday': '🎉 Holiday',
      'other': '📌 Other'
    }
    
    return eventType ? typeMap[eventType] || `📌 ${eventType}` : '📌 Unknown'
  }

  /**
   * Get Google Calendar color ID for event type
   */
  private getGoogleColorId(eventType: EventType | null): string {
    return eventType ? GOOGLE_CALENDAR_COLORS[eventType] || GOOGLE_CALENDAR_COLORS.other : GOOGLE_CALENDAR_COLORS.other
  }
}

export const googleCalendarService = new GoogleCalendarService()