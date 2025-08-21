import { Router } from 'express';
import { isAuthenticated } from '../auth/localAuth';
import { storage } from '../storage';

const router = Router();

// Get current user profile
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).user.claims.sub;
    const user = await storage.getUser(userId);
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ 
      error: 'Failed to get user profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update user email
router.put('/email', isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).user.claims.sub;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }
    
    // Update user email in database
    await storage.updateUser(userId, { email });
    
    // Get updated user data
    const updatedUser = await storage.getUser(userId);
    
    res.json({
      success: true,
      message: 'Email updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user email:', error);
    res.status(500).json({ 
      error: 'Failed to update email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update user profile information
router.put('/profile', isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).user.claims.sub;
    const updates = req.body;
    
    // Remove any fields that shouldn't be updated directly
    delete updates.id;
    delete updates.createdAt;
    delete updates.updatedAt;
    
    await storage.updateUser(userId, updates);
    
    const updatedUser = await storage.getUser(userId);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as userProfileRoutes };