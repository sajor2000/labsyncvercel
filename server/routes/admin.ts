import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../auth/localAuth';
import { 
  generateTempPassword, 
  hashPassword, 
  validatePasswordStrength,
  generateResetToken 
} from '../auth/passwordUtils';
import { EmailTemplateService } from '../email-templates';

const router = Router();

// Extend Express Request type
interface AuthRequest extends Request {
  user?: any;
}

/**
 * Middleware to check if user is admin
 */
function requireAdmin(req: AuthRequest, res: Response, next: Function) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if user has admin privileges (PI, Co-PI, or admin role)
  const adminRoles = ['PI', 'Co-PI', 'ADMIN'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  
  next();
}

/**
 * GET /api/admin/users
 * Get all users for administration
 */
router.get('/users', isAuthenticated, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { includeInactive } = req.query;
    const users = await storage.getTeamMembers();
    
    // Filter out inactive users unless specifically requested
    const filteredUsers = includeInactive === 'true' 
      ? users 
      : users.filter(user => user.isActive);
    
    // Remove sensitive information
    const safeUsers = filteredUsers.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      title: user.title,
      department: user.department,
      institution: user.institution,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      tempPassword: user.tempPassword,
      lastLogin: user.lastLogin,
      lastActive: user.lastActive,
      createdAt: user.createdAt,
    }));
    
    res.json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * POST /api/admin/users
 * Create a new user with temporary password
 */
router.post('/users', isAuthenticated, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      email,
      firstName,
      lastName,
      role,
      title,
      department,
      institution,
      labId,
      sendWelcomeEmail = true
    } = req.body;
    
    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Email, first name, last name, and role are required' });
    }
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Generate temporary password
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    
    // Create user
    const userData = {
      email: email.toLowerCase().trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      title: title?.trim() || null,
      department: department?.trim() || null,
      institution: institution?.trim() || 'Rush University Medical Center',
      passwordHash,
      tempPassword: true,
      emailVerified: false,
      isActive: true,
      createdAt: new Date(),
    };
    
    const newUser = await storage.createUser(userData);
    
    // Add user to lab if specified
    if (labId) {
      await storage.addUserToLab(newUser.id, labId, role);
    }
    
    // Send welcome email with temporary password
    if (sendWelcomeEmail) {
      try {
        // Generate reset token for the welcome email
        const { token, expires } = generateResetToken();
        
        // Save token to database
        await storage.updateUser(newUser.id, {
          passwordResetToken: token,
          passwordResetExpires: expires
        });
        
        const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        const labName = labId ? (await storage.getLabs()).find(lab => lab.id === labId)?.name : undefined;
        
        await EmailTemplateService.sendWelcomeEmail({
          to: newUser.email,
          firstName: newUser.firstName,
          email: newUser.email,
          resetUrl,
          labName,
        });
        
        console.log(`Welcome email sent to new user: ${newUser.email}`);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail user creation if email fails
      }
    }
    
    // Log admin action
    console.log(`Admin ${req.user.email} created new user: ${newUser.email}`);
    
    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        tempPassword: true,
      },
      message: sendWelcomeEmail 
        ? 'User created and welcome email sent' 
        : 'User created successfully'
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user details
 */
router.put('/users/:id', isAuthenticated, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.passwordHash;
    delete updates.tempPassword;
    delete updates.passwordResetToken;
    delete updates.passwordResetExpires;
    
    const updatedUser = await storage.updateUser(id, updates);
    
    // Log admin action
    console.log(`Admin ${req.user.email} updated user: ${id}`);
    
    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      }
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Reset user's password (admin action)
 */
router.post('/users/:id/reset-password', isAuthenticated, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { sendEmail = true } = req.body;
    
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate reset token
    const { token, expires } = generateResetToken();
    
    // Update user with reset token and mark as temp password
    await storage.updateUser(id, {
      passwordResetToken: token,
      passwordResetExpires: expires,
      tempPassword: true,
    });
    
    // Send reset email
    if (sendEmail) {
      try {
        const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        
        await EmailTemplateService.sendPasswordResetEmail({
          to: user.email,
          firstName: user.firstName,
          resetUrl,
        });
        
        console.log(`Password reset email sent to: ${user.email} by admin ${req.user.email}`);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        return res.status(500).json({ error: 'Failed to send reset email' });
      }
    }
    
    // Log admin action
    console.log(`Admin ${req.user.email} reset password for user: ${user.email}`);
    
    res.json({
      success: true,
      message: sendEmail 
        ? 'Password reset email sent to user' 
        : 'Password reset token generated'
    });
    
  } catch (error) {
    console.error('Error resetting user password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * POST /api/admin/users/:id/activate
 * Activate user account
 */
router.post('/users/:id/activate', isAuthenticated, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    await storage.updateUser(id, { isActive: true });
    
    // Log admin action
    console.log(`Admin ${req.user.email} activated user: ${id}`);
    
    res.json({
      success: true,
      message: 'User account activated'
    });
    
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({ error: 'Failed to activate user' });
  }
});

/**
 * POST /api/admin/users/:id/deactivate
 * Deactivate user account
 */
router.post('/users/:id/deactivate', isAuthenticated, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Don't allow deactivating self
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    
    await storage.updateUser(id, { isActive: false });
    
    // Log admin action
    console.log(`Admin ${req.user.email} deactivated user: ${id}`);
    
    res.json({
      success: true,
      message: 'User account deactivated'
    });
    
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

/**
 * GET /api/admin/users/:id/activity
 * Get user activity logs
 */
router.get('/users/:id/activity', isAuthenticated, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return basic activity information
    res.json({
      userId: user.id,
      email: user.email,
      lastLogin: user.lastLogin,
      lastActive: user.lastActive,
      emailVerified: user.emailVerified,
      tempPassword: user.tempPassword,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
    
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
router.get('/stats', isAuthenticated, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await storage.getTeamMembers();
    const labs = await storage.getLabs();
    
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      inactiveUsers: users.filter(u => !u.isActive).length,
      unverifiedEmails: users.filter(u => !u.emailVerified).length,
      tempPasswords: users.filter(u => u.tempPassword).length,
      totalLabs: labs.length,
      recentLogins: users.filter(u => {
        if (!u.lastLogin) return false;
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(u.lastLogin) > dayAgo;
      }).length,
    };
    
    res.json(stats);
    
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export const adminRoutes = router;