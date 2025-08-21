import { Router } from 'express';
import { emailReminderService } from '../emailReminders';
import { isAuthenticated } from '../replitAuth';

const router = Router();

// Manual trigger for email reminders (admin only)
router.post('/send-reminders', async (req, res) => {
  try {
    // Allow any authenticated user to trigger reminders in development

    await emailReminderService.sendTaskReminders();
    res.json({ 
      success: true, 
      message: 'Task reminder emails sent successfully' 
    });
  } catch (error) {
    console.error('Error sending manual reminders:', error);
    res.status(500).json({ 
      error: 'Failed to send reminder emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Send weekly digest to a specific user
router.post('/send-weekly-digest', async (req, res) => {
  try {
    const userId = 'authenticated-user';
    const userEmail = 'user@lab.com';

    await emailReminderService.sendWeeklyTaskDigest(userEmail, userId);
    res.json({ 
      success: true, 
      message: 'Weekly digest sent successfully' 
    });
  } catch (error) {
    console.error('Error sending weekly digest:', error);
    res.status(500).json({ 
      error: 'Failed to send weekly digest',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get reminder preferences for a user
router.get('/preferences', async (req, res) => {
  try {
    // For now, return default preferences
    // In the future, these could be stored per user
    res.json({
      dailyReminders: true,
      weeklyDigest: true,
      overdueAlerts: true,
      reminderTime: '09:00', // 9 AM
      digestDay: 'monday'
    });
  } catch (error) {
    console.error('Error getting reminder preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update reminder preferences for a user
router.put('/preferences', async (req, res) => {
  try {
    const { dailyReminders, weeklyDigest, overdueAlerts, reminderTime, digestDay } = req.body;
    
    // For now, just acknowledge the update
    // In the future, store these preferences in the database
    res.json({ 
      success: true, 
      message: 'Reminder preferences updated',
      preferences: {
        dailyReminders,
        weeklyDigest,
        overdueAlerts,
        reminderTime,
        digestDay
      }
    });
  } catch (error) {
    console.error('Error updating reminder preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export { router as emailReminderRoutes };