import { createClient } from '@/utils/supabase/server'
import { googleCalendarService } from '@/lib/google-calendar/calendar-service'

export class CalendarSyncManager {
  private syncInterval: NodeJS.Timeout | null = null
  private isRunning = false

  /**
   * Start periodic bidirectional sync between LabFlow and Google Calendar
   */
  async startPeriodicSync(intervalMinutes: number = 5) {
    if (this.isRunning) {
      console.log('Calendar sync is already running')
      return
    }

    this.isRunning = true
    console.log(`Starting calendar sync every ${intervalMinutes} minutes`)

    // Run initial sync
    await this.performBidirectionalSync()

    // Set up periodic sync
    this.syncInterval = setInterval(async () => {
      await this.performBidirectionalSync()
    }, intervalMinutes * 60 * 1000)
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      this.isRunning = false
      console.log('Calendar sync stopped')
    }
  }

  /**
   * Perform bidirectional sync between LabFlow and Google Calendar
   */
  async performBidirectionalSync() {
    console.log('Starting bidirectional calendar sync...')
    const startTime = Date.now()
    const supabase = await createClient()

    try {
      // Step 1: Pull changes from Google Calendar to LabFlow
      await this.syncFromGoogleToLabFlow(supabase)

      // Step 2: Push changes from LabFlow to Google Calendar
      await this.syncFromLabFlowToGoogle(supabase)

      const duration = Date.now() - startTime
      console.log(`Calendar sync completed in ${duration}ms`)

      // Log sync event
      await supabase
        .from('sync_logs')
        .insert({
          sync_type: 'calendar_bidirectional',
          status: 'success',
          duration_ms: duration,
          metadata: {
            timestamp: new Date().toISOString()
          }
        })

    } catch (error) {
      console.error('Calendar sync error:', error)
      
      // Log error
      await supabase
        .from('sync_logs')
        .insert({
          sync_type: 'calendar_bidirectional',
          status: 'error',
          error_message: String(error),
          metadata: {
            timestamp: new Date().toISOString()
          }
        })
    }
  }

  /**
   * Sync events from Google Calendar to LabFlow
   */
  private async syncFromGoogleToLabFlow(supabase: any) {
    console.log('Syncing from Google Calendar to LabFlow...')
    
    // Fetch events from last 7 days to future 30 days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)
    
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 30)

    const googleEvents = await googleCalendarService.fetchGoogleCalendarEvents(
      startDate,
      endDate,
      'sync-pull'
    )

    let created = 0
    let updated = 0
    let skipped = 0

    for (const googleEvent of googleEvents) {
      try {
        // Convert Google event to LabFlow format
        const labFlowEvent = googleCalendarService.convertGoogleEventToLabFlow(googleEvent)
        if (!labFlowEvent) {
          skipped++
          continue
        }

        // Check if event already exists
        const { data: existingEvent } = await supabase
          .from('calendar_events')
          .select('id, updated_at, lab_id')
          .eq('google_calendar_id', googleEvent.id)
          .single()

        if (existingEvent) {
          // Update if Google version is newer
          const googleUpdated = new Date(googleEvent.updated)
          const localUpdated = new Date(existingEvent.updated_at)

          if (googleUpdated > localUpdated) {
            const { error } = await supabase
              .from('calendar_events')
              .update({
                title: labFlowEvent.title,
                description: labFlowEvent.description,
                start_date: labFlowEvent.start_date,
                end_date: labFlowEvent.end_date,
                location: labFlowEvent.location,
                all_day: labFlowEvent.all_day,
                metadata: {
                  ...(typeof labFlowEvent.metadata === 'object' && labFlowEvent.metadata !== null ? labFlowEvent.metadata : {}),
                  lastSyncedFromGoogle: new Date().toISOString()
                },
                updated_at: new Date().toISOString()
              })
              .eq('id', existingEvent.id)

            if (!error) {
              updated++
            }
          } else {
            skipped++
          }
        } else {
          // Create new event
          // Try to extract lab_id from description or use default
          const labIdMatch = googleEvent.description?.match(/lab_id:([a-f0-9-]+)/i)
          let labId = labIdMatch?.[1]

          // If no lab_id in description, try to get default lab
          if (!labId) {
            const { data: defaultLab } = await supabase
              .from('labs')
              .select('id')
              .limit(1)
              .single()
            
            labId = defaultLab?.id
          }

          if (labId) {
            const { error } = await supabase
              .from('calendar_events')
              .insert({
                ...labFlowEvent,
                lab_id: labId,
                created_by: null, // System created
                metadata: {
                  ...(typeof labFlowEvent.metadata === 'object' && labFlowEvent.metadata !== null ? labFlowEvent.metadata : {}),
                  createdFromGoogle: true,
                  syncedAt: new Date().toISOString()
                }
              })

            if (!error) {
              created++
            }
          } else {
            skipped++
          }
        }
      } catch (error) {
        console.error('Error syncing event from Google:', error)
        skipped++
      }
    }

    console.log(`Google → LabFlow: ${created} created, ${updated} updated, ${skipped} skipped`)
  }

  /**
   * Sync events from LabFlow to Google Calendar
   */
  private async syncFromLabFlowToGoogle(supabase: any) {
    console.log('Syncing from LabFlow to Google Calendar...')

    // Fetch LabFlow events that need syncing
    const { data: eventsToSync, error } = await supabase
      .from('calendar_events')
      .select('*')
      .or('google_calendar_id.is.null,metadata->needsSync.eq.true')
      .gte('start_date', new Date().toISOString())
      .limit(50)

    if (error) {
      console.error('Error fetching events to sync:', error)
      return
    }

    let synced = 0
    let failed = 0

    for (const event of eventsToSync || []) {
      try {
        // Sync to Google Calendar
        const googleEventId = await googleCalendarService.syncEventToGoogle(event, 'sync-push')

        if (googleEventId) {
          // Update LabFlow event with Google Calendar ID
          await supabase
            .from('calendar_events')
            .update({
              google_calendar_id: googleEventId,
              google_calendar_url: `https://calendar.google.com/calendar/u/0/r/eventedit/${googleEventId}`,
              metadata: {
                ...event.metadata,
                lastSyncedToGoogle: new Date().toISOString(),
                needsSync: false
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', event.id)

          synced++
        } else {
          failed++
        }
      } catch (error) {
        console.error('Error syncing event to Google:', error)
        failed++
      }
    }

    console.log(`LabFlow → Google: ${synced} synced, ${failed} failed`)
  }

  /**
   * Handle event creation in LabFlow - automatically sync to Google
   */
  async onEventCreated(eventId: string) {
    const supabase = await createClient()
    
    try {
      // Fetch the event
      const { data: event, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error || !event) {
        console.error('Event not found:', eventId)
        return
      }

      // Sync to Google Calendar
      const googleEventId = await googleCalendarService.syncEventToGoogle(event, 'create')

      if (googleEventId) {
        // Update event with Google Calendar ID
        await supabase
          .from('calendar_events')
          .update({
            google_calendar_id: googleEventId,
            google_calendar_url: `https://calendar.google.com/calendar/u/0/r/eventedit/${googleEventId}`,
            metadata: {
              ...event.metadata,
              syncedToGoogle: true,
              syncedAt: new Date().toISOString()
            }
          })
          .eq('id', eventId)

        console.log('Event synced to Google Calendar:', googleEventId)
      }
    } catch (error) {
      console.error('Error syncing new event to Google:', error)
    }
  }

  /**
   * Handle event update in LabFlow - sync changes to Google
   */
  async onEventUpdated(eventId: string) {
    const supabase = await createClient()
    
    try {
      // Mark event as needing sync
      await supabase
        .from('calendar_events')
        .update({
          metadata: {
            needsSync: true,
            lastModified: new Date().toISOString()
          }
        })
        .eq('id', eventId)

      console.log('Event marked for sync:', eventId)
    } catch (error) {
      console.error('Error marking event for sync:', error)
    }
  }

  /**
   * Handle event deletion in LabFlow - remove from Google
   */
  async onEventDeleted(googleCalendarId: string) {
    if (!googleCalendarId) return

    try {
      // Delete from Google Calendar
      // Note: This would require implementing a delete method in googleCalendarService
      console.log('Event deletion sync not yet implemented:', googleCalendarId)
    } catch (error) {
      console.error('Error deleting event from Google:', error)
    }
  }
}

// Export singleton instance
export const calendarSyncManager = new CalendarSyncManager()