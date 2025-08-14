import { CalendarEvent } from "@shared/schema";

// Google Calendar color IDs mapping to our event types
const GOOGLE_CALENDAR_COLORS = {
  // Primary research colors mapped to our calendar event enum values
  'PTO': '7', // Peacock blue for PTO
  'CLINICAL_SERVICE': '2', // Sage green for clinical service
  'HOLIDAY': '11', // Red for holidays
  'CONFERENCE': '9', // Blue for conferences
  'TRAINING': '5', // Yellow for training
  'MEETING': '1', // Lavender for meetings
  'OTHER': '4' // Flamingo pink for misc events
} as const;

// Category prefixes for single master calendar organization
const CATEGORY_PREFIXES = {
  'PTO': '[PTO]',
  'CLINICAL_SERVICE': '[Clinical]',
  'HOLIDAY': '[Holiday]',
  'CONFERENCE': '[Conference]',
  'TRAINING': '[Training]',
  'MEETING': '[Meeting]',
  'OTHER': '[Lab Event]'
} as const;

/**
 * Google Calendar Integration Service
 * 
 * Handles single master calendar approach where all lab events are categorized
 * using prefixes, colors, and rich descriptions rather than separate calendars.
 * 
 * Key Features:
 * - Single calendar with categorized events
 * - Color-coded by event type
 * - Rich descriptions with lab context
 * - Two-way sync support
 * - Bulk export capabilities
 */
export class GoogleCalendarService {
  
  /**
   * Format a lab calendar event for Google Calendar export
   * Creates a single master calendar entry with proper categorization
   */
  formatEventForGoogleCalendar(event: CalendarEvent): {
    summary: string;
    description: string;
    colorId: string;
    start: { dateTime?: string; date?: string; timeZone: string };
    end: { dateTime?: string; date?: string; timeZone: string };
    location?: string;
    recurrence?: string[];
    extendedProperties?: {
      shared?: Record<string, string>;
      private?: Record<string, string>;
    };
  } {
    const categoryPrefix = this.getCategoryPrefix(event.eventType);
    const colorId = this.getColorId(event.eventType);
    
    // Create comprehensive title with category prefix
    const summary = `${categoryPrefix} ${event.title}`;
    
    // Create rich description with all lab context
    const description = this.buildRichDescription(event);
    
    // Handle all-day vs timed events
    const start = event.allDay ? {
      date: event.startDate.toISOString().split('T')[0],
      timeZone: 'America/Chicago' // Central Time for medical research
    } : {
      dateTime: event.startDate.toISOString(),
      timeZone: 'America/Chicago'
    };
    
    const end = event.allDay ? {
      date: event.endDate.toISOString().split('T')[0],
      timeZone: 'America/Chicago'
    } : {
      dateTime: event.endDate.toISOString(),
      timeZone: 'America/Chicago'
    };
    
    const googleEvent: any = {
      summary,
      description,
      colorId,
      start,
      end,
      extendedProperties: {
        shared: {
          labSyncEventId: event.id,
          eventType: event.eventType,
          labId: event.labId,
          category: categoryPrefix
        },
        private: {
          originalTitle: event.title,
          duration: event.duration?.toString() || '1',
          allDay: (event.allDay ?? false).toString()
        }
      }
    };
    
    // Add location if present
    if (event.location) {
      googleEvent.location = event.location;
    }
    
    // Add recurrence if present
    if (event.isRecurring && event.recurrenceRule) {
      googleEvent.recurrence = [event.recurrenceRule];
    }
    
    return googleEvent;
  }
  
  /**
   * Build rich description with all lab context for Google Calendar
   */
  private buildRichDescription(event: CalendarEvent): string {
    const parts: string[] = [];
    
    // Original description
    if (event.description) {
      parts.push(event.description);
      parts.push(''); // Empty line separator
    }
    
    // Event details
    parts.push('📋 Event Details:');
    parts.push(`Type: ${event.eventType}`);
    
    if (event.duration && event.duration > 1 && !(event.allDay ?? false)) {
      parts.push(`Duration: ${event.duration} hours`);
    }
    
    if (event.allDay ?? false) {
      parts.push('Duration: All Day');
    }
    
    // PTO specific details
    if (event.eventType === 'PTO' && event.pto) {
      parts.push(`PTO Type: ${event.pto}`);
    }
    
    // Clinical service details
    if (event.eventType === 'CLINICAL_SERVICE' && event.piClinicalService) {
      parts.push(`Clinical Service: ${event.piClinicalService}`);
    }
    
    // Lab context
    parts.push('');
    parts.push('🔬 Lab Information:');
    parts.push(`Lab ID: ${event.labId}`);
    parts.push(`Created: ${event.createdAt ? event.createdAt.toLocaleDateString() : 'Unknown'}`);
    
    // Metadata if present
    if (event.metadata) {
      parts.push('');
      parts.push('📊 Additional Information:');
      Object.entries(event.metadata as Record<string, any>).forEach(([key, value]) => {
        parts.push(`${key}: ${value}`);
      });
    }
    
    // Footer
    parts.push('');
    parts.push('Generated by LabSync - Medical Research Lab Management');
    
    return parts.join('\n');
  }
  
  /**
   * Get category prefix for event type
   */
  private getCategoryPrefix(eventType: string): string {
    return CATEGORY_PREFIXES[eventType as keyof typeof CATEGORY_PREFIXES] || CATEGORY_PREFIXES.OTHER;
  }
  
  /**
   * Get Google Calendar color ID for event type
   */
  private getColorId(eventType: string): string {
    return GOOGLE_CALENDAR_COLORS[eventType as keyof typeof GOOGLE_CALENDAR_COLORS] || GOOGLE_CALENDAR_COLORS.OTHER;
  }

  /**
   * Generate comprehensive subscription instructions for different platforms
   */
  generateSubscriptionInstructions(subscriptionUrl: string, labName: string) {
    return {
      instructions: [
        {
          platform: 'Google Calendar',
          steps: [
            '1. Open Google Calendar in your web browser',
            '2. Click the "+" next to "Other calendars" on the left',
            '3. Select "From URL"',
            '4. Paste the subscription URL',
            '5. Click "Add Calendar"',
            '6. Events will appear with category prefixes like [PTO], [Clinical]'
          ],
          tips: [
            'Events are automatically color-coded by type',
            'Category prefixes help organize events in a single calendar',
            'Sync updates occur automatically every hour'
          ]
        },
        {
          platform: 'Outlook',
          steps: [
            '1. Open Outlook calendar (web or desktop)',
            '2. Click "Add calendar" → "Subscribe from web"',
            '3. Paste the subscription URL',
            '4. Enter a calendar name (e.g., "Lab Calendar")',
            '5. Click "Import"'
          ],
          tips: [
            'Works with both Outlook.com and Office 365',
            'Desktop Outlook may take longer to sync initially'
          ]
        },
        {
          platform: 'Apple Calendar',
          steps: [
            '1. Open Calendar app on Mac',
            '2. Go to File → New Calendar Subscription',
            '3. Paste the subscription URL',
            '4. Set refresh frequency (recommend: Every hour)',
            '5. Click "OK"'
          ],
          tips: [
            'Also syncs to iOS devices signed into the same Apple ID',
            'Can adjust color and alert preferences after setup'
          ]
        },
        {
          platform: 'Phone/Mobile',
          steps: [
            '1. Open your default calendar app',
            '2. Look for "Add calendar" or "Subscribe to calendar"',
            '3. Paste the subscription URL when prompted',
            '4. Follow app-specific setup prompts',
            '5. Enable notifications if desired'
          ],
          tips: [
            'Works with most mobile calendar apps',
            'Android: Google Calendar, Samsung Calendar',
            'iOS: Built-in Calendar app, Google Calendar'
          ]
        }
      ],
      subscriptionUrl,
      labName
    };
  }
  
  /**
   * Generate iCal format for calendar subscription
   * This allows users to subscribe to the lab calendar in any calendar app
   */
  generateICalFeed(events: CalendarEvent[], labName: string): string {
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const icalLines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LabSync//Medical Research Lab Management//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${labName} - LabSync Calendar`,
      'X-WR-CALDESC:Comprehensive research management calendar with events, deadlines, and milestones',
      'X-WR-TIMEZONE:America/Chicago',
      'REFRESH-INTERVAL;VALUE=DURATION:PT1H', // Refresh every hour
    ];
    
    events.forEach(event => {
      const categoryPrefix = this.getCategoryPrefix(event.eventType);
      const dtstart = event.allDay 
        ? `DTSTART;VALUE=DATE:${event.startDate.toISOString().split('T')[0].replace(/-/g, '')}`
        : `DTSTART:${event.startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
      
      const dtend = event.allDay
        ? `DTEND;VALUE=DATE:${event.endDate.toISOString().split('T')[0].replace(/-/g, '')}`
        : `DTEND:${event.endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
      
      icalLines.push(
        'BEGIN:VEVENT',
        `UID:${event.id}@labsync.app`,
        `DTSTAMP:${now}`,
        dtstart,
        dtend,
        `SUMMARY:${categoryPrefix} ${event.title}`,
        `DESCRIPTION:${this.buildRichDescription(event).replace(/\n/g, '\\n')}`,
        `CATEGORIES:${event.eventType.toUpperCase()}`,
        `STATUS:${event.isVisible ? 'CONFIRMED' : 'TENTATIVE'}`,
        `TRANSP:${event.allDay ? 'TRANSPARENT' : 'OPAQUE'}`
      );
      
      if (event.location) {
        icalLines.push(`LOCATION:${event.location}`);
      }
      
      if (event.isRecurring && event.recurrenceRule) {
        icalLines.push(`RRULE:${event.recurrenceRule}`);
      }
      
      icalLines.push('END:VEVENT');
    });
    
    icalLines.push('END:VCALENDAR');
    
    return icalLines.join('\r\n');
  }
  
  /**
   * Generate calendar subscription instructions
   */
  generateSubscriptionInstructions(subscriptionUrl: string, labName: string): {
    title: string;
    instructions: {
      platform: string;
      steps: string[];
    }[];
  } {
    return {
      title: `Subscribe to ${labName} Calendar`,
      instructions: [
        {
          platform: 'Google Calendar',
          steps: [
            'Open Google Calendar in your web browser',
            'Click the "+" next to "Other calendars" on the left sidebar',
            'Select "From URL"',
            `Paste this URL: ${subscriptionUrl}`,
            'Click "Add Calendar"',
            `The ${labName} calendar will appear with all categorized events`
          ]
        },
        {
          platform: 'Outlook',
          steps: [
            'Open Outlook calendar',
            'Click "Add calendar" > "Subscribe from web"',
            `Paste this URL: ${subscriptionUrl}`,
            `Enter calendar name: ${labName} - LabSync`,
            'Click "Import"',
            'Events will sync automatically with category prefixes'
          ]
        },
        {
          platform: 'Apple Calendar',
          steps: [
            'Open Calendar app',
            'Go to File > New Calendar Subscription',
            `Paste this URL: ${subscriptionUrl}`,
            `Set name: ${labName} - LabSync`,
            'Choose refresh frequency (recommended: Every hour)',
            'Click "OK"'
          ]
        },
        {
          platform: 'Phone/Mobile',
          steps: [
            'Open your calendar app',
            'Look for "Add calendar" or "Subscribe" option',
            `Paste this URL: ${subscriptionUrl}`,
            'All lab events will appear with [Category] prefixes',
            'Color coding may vary by app'
          ]
        }
      ]
    };
  }
}

export const googleCalendarService = new GoogleCalendarService();