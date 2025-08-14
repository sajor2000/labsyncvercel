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
   * Sync LabSync event to Google Calendar
   */
  async syncEventToGoogle(labSyncEvent: CalendarEvent): Promise<string | null> {
    if (!this.calendar) {
      console.warn('Google Calendar not initialized');
      return null;
    }

    try {
      const googleEvent = {
        summary: `[LabSync] ${labSyncEvent.title}`,
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
        location: labSyncEvent.location,
        colorId: this.getGoogleColorId(labSyncEvent.eventType),
      };

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
   * Build rich description for Google Calendar event
   */
  private buildGoogleEventDescription(event: CalendarEvent): string {
    let description = event.description || '';
    
    description += '\n\n--- LabSync Details ---';
    description += `\nEvent Type: ${event.eventType}`;
    
    if (event.exportDescription) {
      description += `\nExport Details: ${event.exportDescription}`;
    }
    
    if (event.metadata && typeof event.metadata === 'object') {
      const metadata = event.metadata as any;
      if (metadata.assignees && Array.isArray(metadata.assignees)) {
        description += `\nAssigned to: ${metadata.assignees.join(', ')}`;
      }
    }

    description += `\n\nManaged by LabSync - https://rush-lab-sync.replit.app`;
    
    return description;
  }

  /**
   * Get Google Calendar color ID for event type
   */
  private getGoogleColorId(eventType: string): string {
    return GOOGLE_CALENDAR_COLORS[eventType as keyof typeof GOOGLE_CALENDAR_COLORS] || GOOGLE_CALENDAR_COLORS.OTHER;
  }
}

export const googleCalendarService = new GoogleCalendarService();