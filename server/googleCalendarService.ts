import { google } from 'googleapis';
import { CalendarEvent } from "@shared/schema";

// Google Calendar configuration
const GOOGLE_CALENDAR_ID = 'riccclabs@gmail.com';
const CALENDAR_TIMEZONE = 'America/Chicago';

// Google Calendar color IDs mapping to our event types
const GOOGLE_CALENDAR_COLORS = {
  'PTO': '7', // Peacock blue for PTO
  'CLINICAL_SERVICE': '2', // Sage green for clinical service
  'HOLIDAY': '11', // Red for holidays
  'CONFERENCE': '9', // Blue for conferences
  'TRAINING': '5', // Yellow for training
  'MEETING': '1', // Lavender for meetings
  'OTHER': '4' // Flamingo pink for misc events
} as const;

/**
 * Google Calendar Integration Service
 * 
 * Handles integration with riccclabs@gmail.com Google Calendar
 * - Fetches events from Google Calendar
 * - Converts formats between Google and LabSync
 * - Syncs LabSync events to Google Calendar
 */
export class GoogleCalendarService {
  private calendar: any;
  
  constructor() {
    this.initializeGoogleAuth();
  }

  /**
   * Initialize Google Calendar API authentication
   */
  private initializeGoogleAuth() {
    if (!process.env.GOOGLE_CALENDAR_API_KEY) {
      console.warn('Google Calendar API key not configured');
      return;
    }

    try {
      // Use API key for read-only access to public calendar
      this.calendar = google.calendar({ 
        version: 'v3', 
        auth: process.env.GOOGLE_CALENDAR_API_KEY 
      });
      console.log('✅ Google Calendar API initialized with API key');
    } catch (error) {
      console.error('❌ Google Calendar API initialization failed:', error);
    }
  }

  /**
   * Fetch events from riccclabs@gmail.com Google Calendar
   */
  async fetchGoogleCalendarEvents(startDate?: Date, endDate?: Date): Promise<any[]> {
    if (!this.calendar) {
      console.warn('Google Calendar not initialized');
      return [];
    }

    try {
      const timeMin = startDate ? startDate.toISOString() : new Date().toISOString();
      const timeMax = endDate ? endDate.toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const response = await this.calendar.events.list({
        calendarId: GOOGLE_CALENDAR_ID,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      return [];
    }
  }

  /**
   * Convert Google Calendar event to LabSync calendar event format
   */
  convertGoogleEventToLabSync(googleEvent: any): any | null {
    if (!googleEvent.summary) return null;

    const startDate = googleEvent.start?.dateTime || googleEvent.start?.date;
    const endDate = googleEvent.end?.dateTime || googleEvent.end?.date;
    
    if (!startDate || !endDate) return null;

    const eventType = this.parseEventType(googleEvent.summary, googleEvent.description || '');
    
    return {
      id: `google-${googleEvent.id}`,
      title: googleEvent.summary,
      description: googleEvent.description || '',
      eventType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      allDay: !googleEvent.start?.dateTime,
      location: googleEvent.location || '',
      participants: googleEvent.attendees?.length || 0,
      status: googleEvent.status === 'confirmed' ? 'confirmed' : 'tentative',
      googleCalendarId: googleEvent.id,
      googleCalendarUrl: googleEvent.htmlLink,
      createdAt: new Date(googleEvent.created),
      updatedAt: new Date(googleEvent.updated),
    };
  }

  /**
   * Parse event type from Google Calendar event title/description
   */
  private parseEventType(title: string, description: string): string {
    const content = `${title} ${description}`.toLowerCase();
    
    if (content.includes('pto') || content.includes('vacation') || content.includes('time off')) return 'PTO';
    if (content.includes('clinical') || content.includes('clinic')) return 'CLINICAL_SERVICE';
    if (content.includes('meeting') || content.includes('standup')) return 'MEETING';
    if (content.includes('conference') || content.includes('presentation')) return 'CONFERENCE';
    if (content.includes('training') || content.includes('education')) return 'TRAINING';
    if (content.includes('holiday')) return 'HOLIDAY';
    
    return 'OTHER';
  }

  /**
   * Sync LabSync event to Google Calendar with enhanced formatting
   */
  async syncEventToGoogle(labSyncEvent: CalendarEvent): Promise<string | null> {
    if (!this.calendar) {
      console.warn('Google Calendar not initialized');
      return null;
    }

    try {
      const metadata = labSyncEvent.metadata as any;
      
      // Create professional title based on event type and metadata
      let professionalTitle = this.createProfessionalTitle(labSyncEvent);
      
      // Build attendees list if we have assignee information
      const attendees = this.buildAttendeesFromMetadata(metadata);

      const googleEvent: any = {
        summary: professionalTitle,
        description: this.buildGoogleEventDescription(labSyncEvent),
        start: labSyncEvent.allDay ? {
          date: labSyncEvent.startDate.toISOString().split('T')[0],
          timeZone: CALENDAR_TIMEZONE
        } : {
          dateTime: labSyncEvent.startDate.toISOString(),
          timeZone: CALENDAR_TIMEZONE
        },
        end: labSyncEvent.allDay ? {
          date: labSyncEvent.endDate.toISOString().split('T')[0],
          timeZone: CALENDAR_TIMEZONE
        } : {
          dateTime: labSyncEvent.endDate.toISOString(),
          timeZone: CALENDAR_TIMEZONE
        },
        location: labSyncEvent.location || this.getDefaultLocation(labSyncEvent.eventType),
        colorId: this.getGoogleColorId(labSyncEvent.eventType),
        transparency: 'opaque', // Show as busy
        visibility: 'default',
      };

      // Add attendees if we have any
      if (attendees.length > 0) {
        googleEvent.attendees = attendees;
      }

      // Add reminders for important events
      if (metadata?.taskPriority === 'HIGH' || labSyncEvent.eventType === 'MEETING') {
        googleEvent.reminders = {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 }, // 1 hour before
            { method: 'popup', minutes: 15 }, // 15 minutes before
          ],
        };
      }

      const response = await this.calendar.events.insert({
        calendarId: GOOGLE_CALENDAR_ID,
        resource: googleEvent,
      });

      return response.data.id;
    } catch (error) {
      console.error('Error syncing event to Google Calendar:', error);
      return null;
    }
  }

  /**
   * Create professional, context-aware event titles
   */
  private createProfessionalTitle(event: CalendarEvent): string {
    const metadata = event.metadata as any;
    
    // Task deadline events
    if (metadata?.sourceType === 'task' || metadata?.sourceType === 'meeting_task') {
      const priorityIcon = metadata.taskPriority === 'HIGH' ? '🔴' : 
                          metadata.taskPriority === 'MEDIUM' ? '🟡' : '🟢';
      
      let title = `${priorityIcon} DEADLINE: ${metadata.taskName || event.title.replace('Task Deadline: ', '')}`;
      
      if (metadata.taskAssignees && metadata.taskAssignees.length > 0) {
        const assignee = metadata.taskAssignees[0];
        title += ` (${assignee})`;
      }
      
      return title;
    }
    
    // Meeting events
    if (metadata?.sourceType === 'meeting') {
      return `🤝 ${event.title}`;
    }
    
    // Default formatting with category prefix
    const categoryIcon = this.getCategoryIcon(event.eventType);
    return `${categoryIcon} ${event.exportTitle || event.title}`;
  }

  /**
   * Get category icon for event types
   */
  private getCategoryIcon(eventType: string): string {
    const iconMap: Record<string, string> = {
      'MEETING': '🤝',
      'CLINICAL_SERVICE': '🏥',
      'PTO': '🏖️',
      'TRAINING': '📚',
      'CONFERENCE': '🎤',
      'HOLIDAY': '🎉',
      'OTHER': '📌'
    };
    
    return iconMap[eventType] || '📌';
  }

  /**
   * Build attendees list from metadata
   */
  private buildAttendeesFromMetadata(metadata: any): any[] {
    const attendees: any[] = [];
    
    if (metadata?.taskAssignees && Array.isArray(metadata.taskAssignees)) {
      // Try to convert names to emails if possible
      metadata.taskAssignees.forEach((assignee: string) => {
        const email = this.getEmailFromName(assignee);
        if (email) {
          attendees.push({
            email: email,
            displayName: assignee,
            responseStatus: 'needsAction'
          });
        }
      });
    }
    
    return attendees;
  }

  /**
   * Get email from team member name (basic implementation)
   */
  private getEmailFromName(name: string): string | null {
    // This is a basic implementation - in a real system you'd query your database
    // For now, return null since we don't have email mapping
    return null;
  }

  /**
   * Get default location for event types
   */
  private getDefaultLocation(eventType: string): string {
    const locationMap: Record<string, string> = {
      'MEETING': 'Rush University Medical Center - Conference Room TBD',
      'CLINICAL_SERVICE': 'Rush University Medical Center',
      'TRAINING': 'Rush Education Center',
      'CONFERENCE': 'Location TBD',
    };
    
    return locationMap[eventType] || '';
  }

  /**
   * Build rich, professional description for Google Calendar event
   */
  private buildGoogleEventDescription(event: CalendarEvent): string {
    const lines: string[] = [];
    const metadata = event.metadata as any;

    // Main description if provided
    if (event.description) {
      lines.push(event.description);
      lines.push(''); // Empty line separator
    }

    // Task-specific formatting
    if (metadata?.sourceType === 'task' || metadata?.sourceType === 'meeting_task') {
      lines.push('📋 TASK DEADLINE DETAILS');
      lines.push('═══════════════════════════════');
      
      if (metadata.taskName) {
        lines.push(`📌 Task: ${metadata.taskName}`);
      }
      
      if (metadata.taskPriority) {
        const priorityEmoji = metadata.taskPriority === 'HIGH' ? '🔴' : 
                             metadata.taskPriority === 'MEDIUM' ? '🟡' : '🟢';
        lines.push(`${priorityEmoji} Priority: ${metadata.taskPriority}`);
      }
      
      if (metadata.taskAssignees && metadata.taskAssignees.length > 0) {
        lines.push(`👥 Responsible: ${metadata.taskAssignees.join(', ')}`);
      }
      
      if (metadata.studyName) {
        lines.push(`🔬 Study: ${metadata.studyName}`);
      }
      
      if (metadata.meetingTitle) {
        lines.push(`🤝 From Meeting: ${metadata.meetingTitle}`);
      }
      
      lines.push(''); // Empty line separator
    }

    // Meeting-specific formatting
    if (metadata?.sourceType === 'meeting') {
      lines.push('🤝 MEETING DETAILS');
      lines.push('═══════════════════════════════');
      
      if (metadata.meetingType) {
        lines.push(`📊 Type: ${metadata.meetingType.replace('_', ' ').toUpperCase()}`);
      }
      
      if (metadata.projectIds && metadata.projectIds.length > 0) {
        lines.push(`📁 Projects: ${metadata.projectIds.length} project(s)`);
      }
      
      if (metadata.studyIds && metadata.studyIds.length > 0) {
        lines.push(`🔬 Studies: ${metadata.studyIds.length} study(ies)`);
      }
      
      lines.push(''); // Empty line separator
    }

    // General event information
    lines.push('📅 EVENT INFORMATION');
    lines.push('═══════════════════════════════');
    lines.push(`🏷️ Type: ${this.formatEventType(event.eventType)}`);
    
    if (event.location) {
      lines.push(`📍 Location: ${event.location}`);
    }
    
    if (event.duration) {
      const hours = Math.floor(event.duration);
      const minutes = Math.round((event.duration - hours) * 60);
      if (hours > 0 && minutes > 0) {
        lines.push(`⏱️ Duration: ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        lines.push(`⏱️ Duration: ${hours}h`);
      } else if (minutes > 0) {
        lines.push(`⏱️ Duration: ${minutes}m`);
      }
    }

    // Lab context
    if (metadata?.labContext) {
      lines.push(`🧪 Lab: ${metadata.labContext}`);
    }

    // Additional metadata
    if (metadata?.additionalInfo) {
      lines.push('');
      lines.push('ℹ️ ADDITIONAL INFORMATION');
      lines.push('═══════════════════════════════');
      if (typeof metadata.additionalInfo === 'string') {
        lines.push(metadata.additionalInfo);
      } else {
        Object.entries(metadata.additionalInfo).forEach(([key, value]) => {
          lines.push(`${key}: ${value}`);
        });
      }
    }

    // Footer
    lines.push('');
    lines.push('──────────────────────────────────');
    lines.push('🚀 Powered by LabSync');
    lines.push('🌐 RICCC & RHEDAS Labs @ Rush');
    lines.push('📧 Contact: riccclabs@gmail.com');
    
    return lines.join('\n');
  }

  /**
   * Format event type for display
   */
  private formatEventType(eventType: string): string {
    const typeMap: Record<string, string> = {
      'MEETING': '🤝 Meeting',
      'CLINICAL_SERVICE': '🏥 Clinical Service',
      'PTO': '🏖️ Time Off',
      'TRAINING': '📚 Training',
      'CONFERENCE': '🎤 Conference',
      'HOLIDAY': '🎉 Holiday',
      'OTHER': '📌 Other'
    };
    
    return typeMap[eventType] || `📌 ${eventType}`;
  }

  /**
   * Get Google Calendar color ID for event type
   */
  private getGoogleColorId(eventType: string): string {
    return GOOGLE_CALENDAR_COLORS[eventType as keyof typeof GOOGLE_CALENDAR_COLORS] || GOOGLE_CALENDAR_COLORS.OTHER;
  }
}

export const googleCalendarService = new GoogleCalendarService();