import { Router, Request, Response } from 'express';
import { db } from '../db';
import { storage } from '../storage';
import { isAuthenticated } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const addMemberSchema = z.object({
  userId: z.string().min(1),
  labId: z.string().min(1),
  labRole: z.enum(['PI', 'Co-PI', 'Data Scientist', 'Student', 'CRC', 'Research Assistant', 'Lab Manager', 'Faculty', 'Postdoc', 'Technician', 'Other']),
  permissions: z.object({
    canCreateStudies: z.boolean().optional(),
    canAssignTasks: z.boolean().optional(),
    canManageTeam: z.boolean().optional(),
    canAccessFinancials: z.boolean().optional(),
  }).optional()
});

const updateMemberSchema = z.object({
  labRole: z.enum(['PI', 'Co-PI', 'Data Scientist', 'Student', 'CRC', 'Research Assistant', 'Lab Manager', 'Faculty', 'Postdoc', 'Technician', 'Other']).optional(),
  permissions: z.object({
    canCreateStudies: z.boolean().optional(),
    canAssignTasks: z.boolean().optional(),
    canManageTeam: z.boolean().optional(),
    canAccessFinancials: z.boolean().optional(),
  }).optional()
});

/**
 * GET /api/lab-members/user/:userId
 * Get all lab memberships for a specific user
 */
router.get('/user/:userId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Security check: users can only view their own memberships unless they're an admin
    if (req.user?.id !== userId && req.user?.labRole !== 'PI' && req.user?.labRole !== 'Co-PI') {
      return res.status(403).json({ error: 'Unauthorized to view other user memberships' });
    }

    const memberships = await storage.getLabMembershipsByUser(userId);
    
    res.json({
      success: true,
      data: memberships
    });
  } catch (error) {
    console.error('Error fetching user lab memberships:', error);
    res.status(500).json({ error: 'Failed to fetch user lab memberships' });
  }
});

/**
 * GET /api/lab-members/lab/:labId
 * Get all members for a specific lab
 */
router.get('/lab/:labId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { labId } = req.params;
    
    // Check if user has access to this lab
    const userMemberships = await storage.getLabMembershipsByUser(req.user?.id || '');
    const hasLabAccess = userMemberships.some(membership => membership.labId === labId);
    
    if (!hasLabAccess) {
      return res.status(403).json({ error: 'Unauthorized to view lab members' });
    }

    const members = await storage.getLabMembershipsByLab(labId);
    
    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Error fetching lab members:', error);
    res.status(500).json({ error: 'Failed to fetch lab members' });
  }
});

/**
 * POST /api/lab-members
 * Add a user to a lab
 */
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const validation = addMemberSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.issues 
      });
    }

    const { userId, labId, labRole, permissions } = validation.data;
    
    // Check if requester has permission to add members to this lab
    const userMemberships = await storage.getLabMembershipsByUser(req.user?.id || '');
    const labMembership = userMemberships.find(membership => membership.labId === labId);
    
    if (!labMembership || (labMembership.labRole !== 'PI' && labMembership.labRole !== 'Co-PI')) {
      return res.status(403).json({ error: 'Only PIs and Co-PIs can add members to labs' });
    }

    // Check if user is already a member of this lab
    const existingMemberships = await storage.getLabMembershipsByUser(userId);
    const alreadyMember = existingMemberships.some(membership => membership.labId === labId);
    
    if (alreadyMember) {
      return res.status(409).json({ error: 'User is already a member of this lab' });
    }

    const newMembership = await storage.addUserToLab(userId, labId, labRole, permissions);
    
    res.status(201).json({
      success: true,
      data: newMembership
    });
  } catch (error) {
    console.error('Error adding user to lab:', error);
    res.status(500).json({ error: 'Failed to add user to lab' });
  }
});

/**
 * PUT /api/lab-members/:userId/:labId
 * Update a user's lab membership
 */
router.put('/:userId/:labId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { userId, labId } = req.params;
    const validation = updateMemberSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.issues 
      });
    }

    // Check if requester has permission to update members in this lab
    const userMemberships = await storage.getLabMembershipsByUser(req.user?.id || '');
    const labMembership = userMemberships.find(membership => membership.labId === labId);
    
    // Users can update their own membership or PIs/Co-PIs can update any membership
    const canUpdate = req.user?.id === userId || 
                     (labMembership && (labMembership.labRole === 'PI' || labMembership.labRole === 'Co-PI'));
    
    if (!canUpdate) {
      return res.status(403).json({ error: 'Unauthorized to update this lab membership' });
    }

    const updatedMembership = await storage.updateLabMembership(userId, labId, validation.data);
    
    res.json({
      success: true,
      data: updatedMembership
    });
  } catch (error) {
    console.error('Error updating lab membership:', error);
    res.status(500).json({ error: 'Failed to update lab membership' });
  }
});

/**
 * DELETE /api/lab-members/:userId/:labId
 * Remove a user from a lab
 */
router.delete('/:userId/:labId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { userId, labId } = req.params;
    
    // Check if requester has permission to remove members from this lab
    const userMemberships = await storage.getLabMembershipsByUser(req.user?.id || '');
    const labMembership = userMemberships.find(membership => membership.labId === labId);
    
    // Users can remove themselves or PIs/Co-PIs can remove any member
    const canRemove = req.user?.id === userId || 
                     (labMembership && (labMembership.labRole === 'PI' || labMembership.labRole === 'Co-PI'));
    
    if (!canRemove) {
      return res.status(403).json({ error: 'Unauthorized to remove this lab membership' });
    }

    // Prevent removing the last PI from a lab
    if (labMembership?.labRole === 'PI') {
      const labMembers = await storage.getLabMembershipsByLab(labId);
      const piCount = labMembers.filter(member => member.labRole === 'PI').length;
      
      if (piCount <= 1) {
        return res.status(400).json({ 
          error: 'Cannot remove the last PI from a lab. Transfer ownership first.' 
        });
      }
    }

    await storage.removeUserFromLab(userId, labId);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error removing user from lab:', error);
    res.status(500).json({ error: 'Failed to remove user from lab' });
  }
});

/**
 * GET /api/lab-members/current-user/labs
 * Get current user's lab memberships (convenience endpoint)
 */
router.get('/current-user/labs', isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const memberships = await storage.getLabMembershipsByUser(req.user.id);
    
    res.json({
      success: true,
      data: memberships
    });
  } catch (error) {
    console.error('Error fetching current user lab memberships:', error);
    res.status(500).json({ error: 'Failed to fetch lab memberships' });
  }
});

export { router as labMemberRoutes };