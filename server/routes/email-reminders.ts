import { Router } from 'express';
import { emailReminderService } from '../emailReminders';
import { isAuthenticated } from '../replitAuth';

const router = Router();

// Manual trigger for email reminders (admin only)
router.post('/send-reminders', isAuthenticated, async (req, res) => {
  try {
    // Check if user has admin privileges
    const userRole = (req as any).user?.role;
    if (!userRole || !['ADMIN', 'PRINCIPAL_INVESTIGATOR', 'CO_PRINCIPAL_INVESTIGATOR'].includes(userRole)) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

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
router.post('/send-weekly-digest', isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).user?.claims?.sub;
    const userEmail = (req as any).user?.email;
    
    if (!userId || !userEmail) {
      return res.status(400).json({ error: 'User information not available' });
    }

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

// Test task creation notification
router.post('/test-creation-notification', isAuthenticated, async (req, res) => {
  try {
    const { taskId } = req.body;
    
    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }
    
    await emailReminderService.sendTaskCreationNotification(taskId);
    res.json({ 
      success: true, 
      message: 'Task creation notification sent successfully' 
    });
  } catch (error) {
    console.error('Error sending test creation notification:', error);
    res.status(500).json({ 
      error: 'Failed to send creation notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get reminder preferences for a user
router.get('/preferences', isAuthenticated, async (req, res) => {
  try {
    // For now, return default preferences
    // In the future, these could be stored per user
    res.json({
      dailyReminders: true,
      weeklyDigest: true,
      overdueAlerts: true,
      reminderTime: '09:00', // 9 AM
      digestDay: 'monday',
      taskCreationNotifications: true,
      dueDateReminders: true,
      taskCreationNotifications: true,
      dueDateReminders: true
    });
  } catch (error) {
    console.error('Error getting reminder preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update reminder preferences for a user
router.put('/preferences', isAuthenticated, async (req, res) => {
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