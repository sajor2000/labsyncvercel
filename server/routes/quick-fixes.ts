import { Router } from 'express';
import { isAuthenticated } from '../auth/localAuth';
import { storage } from '../storage';

const router = Router();

// Quick fix to add missing user to team_members table
router.post('/add-user-to-team', isAuthenticated, async (req, res) => {
  try {
    const currentUserId = (req as any).user.claims.sub;
    const { email, name, labId } = req.body;
    
    if (!email || !name || !labId) {
      return res.status(400).json({ 
        error: 'Email, name, and lab ID are required' 
      });
    }
    
    // Check if user already exists in team_members
    const existingTeamMembers = await storage.getTeamMembers();
    const userExists = existingTeamMembers.some(member => member.id === currentUserId);
    
    if (userExists) {
      // Update existing user
      await storage.updateTeamMember(currentUserId, { email, name, labId } as any);
      console.log(`✅ Updated existing team member: ${name} (${email})`);
    } else {
      // Add new team member
      const newTeamMember = {
        id: currentUserId,
        name,
        email,
        labId,
        role: 'PRINCIPAL_INVESTIGATOR' as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await storage.createTeamMember(newTeamMember);
      console.log(`✅ Added new team member: ${name} (${email})`);
    }
    
    // Update user record as well
    await storage.updateUser(currentUserId, { 
      email,
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' ')
    });
    
    res.json({
      success: true,
      message: 'User profile updated successfully',
      user: {
        id: currentUserId,
        name,
        email,
        labId
      }
    });
    
  } catch (error) {
    console.error('Error adding user to team:', error);
    res.status(500).json({ 
      error: 'Failed to update user profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as quickFixRoutes };