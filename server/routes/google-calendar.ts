import { Router } from "express";
import { GoogleCalendarService } from "../googleCalendarService";
import { isAuthenticated } from "../replitAuth";
import { db } from "../db";
import { calendarEvents, labs } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();
const googleCalendarService = new GoogleCalendarService();

// Fetch Google Calendar events and merge with LabSync events
router.get("/events", isAuthenticated, async (req, res) => {
  try {
    const labId = req.query.labId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    if (!labId) {
      return res.status(400).json({ error: "Lab ID is required" });
    }

    // Fetch from Google Calendar
    const googleEvents = await googleCalendarService.fetchGoogleCalendarEvents(startDate, endDate);
    const convertedGoogleEvents = googleEvents
      .map(event => googleCalendarService.convertGoogleEventToLabSync(event))
      .filter(event => event !== null);

    // Fetch from LabSync database
    const labSyncEvents = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.labId, labId));

    // Combine both sources
    const allEvents = [
      ...convertedGoogleEvents.map(event => ({ ...event, source: 'google' })),
      ...labSyncEvents.map(event => ({ ...event, source: 'labsync' }))
    ];

    res.json(allEvents);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

// Sync a LabSync event to Google Calendar
router.post("/sync-to-google", isAuthenticated, async (req, res) => {
  try {
    const { eventId } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    // Get event from database
    const [event] = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, eventId));

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Sync to Google Calendar
    const googleEventId = await googleCalendarService.syncEventToGoogle(event);
    
    if (googleEventId) {
      // Update database with Google Calendar ID
      await db
        .update(calendarEvents)
        .set({ 
          googleCalendarId: googleEventId,
          updatedAt: new Date()
        })
        .where(eq(calendarEvents.id, eventId));

      res.json({ success: true, googleEventId });
    } else {
      res.status(500).json({ error: "Failed to sync to Google Calendar" });
    }
  } catch (error) {
    console.error("Error syncing to Google Calendar:", error);
    res.status(500).json({ error: "Failed to sync to Google Calendar" });
  }
});

// Get Google Calendar embed URL
router.get("/embed-url", isAuthenticated, async (req, res) => {
  try {
    const embedUrl = `https://calendar.google.com/calendar/embed?src=riccclabs%40gmail.com&ctz=America%2FChicago&mode=WEEK&showTabs=1&showCalendars=0&showTz=1`;
    
    res.json({ embedUrl });
  } catch (error) {
    console.error("Error getting embed URL:", error);
    res.status(500).json({ error: "Failed to get embed URL" });
  }
});

// OAuth callback for Google Calendar authentication
router.get("/auth/callback", async (req, res) => {
  try {
    // This would handle the OAuth callback
    // For now, redirect back to calendar page
    res.redirect("/calendar?google_auth=success");
  } catch (error) {
    console.error("Error in OAuth callback:", error);
    res.redirect("/calendar?google_auth=error");
  }
});

export default router;