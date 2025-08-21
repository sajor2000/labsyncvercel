import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { storage } from '../storage';
import { passwordResetRateLimit } from '../middleware/rateLimiter';
import { 
  hashPassword, 
  verifyPassword, 
  generateTempPassword, 
  generateResetToken,
  validatePasswordStrength,
  isResetTokenValid,
  sanitizePassword
} from '../auth/passwordUtils';
import { isAuthenticated, requiresPasswordChange } from '../auth/localAuth';

const router = Router();

// Extend Express Request type
interface AuthRequest extends Request {
  user?: any;
}

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', (err: any, user: any, info: any) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Authentication failed' });
    }
    
    if (!user) {
      return res.status(401).json({ 
        error: info?.message || 'Invalid credentials' 
      });
    }
    
    req.logIn(user, (err) => {
      if (err) {
        console.error('Session error:', err);
        return res.status(500).json({ error: 'Session creation failed' });
      }
      
      // Check if password change is required
      const requiresPasswordChange = user.tempPassword === true;
      
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileImageUrl: user.profileImageUrl,
          requiresPasswordChange
        }
      });
    });
  })(req, res, next);
});

/**
 * POST /api/auth/logout
 * Logout current user
 */
router.post('/logout', (req: AuthRequest, res: Response) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });
});

/**
 * GET /api/auth/user
 * Get current authenticated user
 */
router.get('/user', isAuthenticated, (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    title: user.title,
    department: user.department,
    institution: user.institution,
    profileImageUrl: user.profileImageUrl,
    emailVerified: user.emailVerified,
    requiresPasswordChange: user.tempPassword === true,
    sessionValid: true
  });
});

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
router.post('/forgot-password', passwordResetRateLimit, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find user by email
    const user = await storage.getUserByEmail(email);
    
    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.json({ 
        success: true, 
        message: 'If that email exists, a password reset link has been sent.' 
      });
    }
    
    // Generate reset token
    const { token, expires } = generateResetToken();
    
    // Save token to database
    await storage.updateUser(user.id, {
      passwordResetToken: token,
      passwordResetExpires: expires
    });
    
    // Send reset email
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    try {
      // Use professional email template
      const { EmailTemplateService } = await import('../email-templates');
      
      const result = await EmailTemplateService.sendPasswordResetEmail({
        to: user.email,
        firstName: user.firstName,
        resetUrl,
      });

      if (result.success) {
        console.log(`Password reset email sent to: ${user.email} (Message ID: ${result.messageId})`);
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't reveal email sending failure to user
    }
    
    res.json({ 
      success: true, 
      message: 'If that email exists, a password reset link has been sent.' 
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }
    
    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Password does not meet requirements',
        errors: validation.errors 
      });
    }
    
    // Find user by reset token
    const user = await storage.getUserByResetToken(token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    // Check if token is expired
    if (!isResetTokenValid(user.passwordResetExpires)) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }
    
    // Hash new password
    const passwordHash = await hashPassword(password);
    
    // Update user password and clear reset token
    await storage.updateUser(user.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      tempPassword: false,
      emailVerified: true // Consider email verified after successful reset
    });
    
    console.log(`Password reset successful for: ${user.email}`);
    
    res.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
router.post('/change-password', isAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }
    
    // Validate new password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'New password does not meet requirements',
        errors: validation.errors 
      });
    }
    
    // Verify current password (unless it's a temp password change)
    if (!user.tempPassword) {
      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }
    
    // Check that new password is different
    if (await verifyPassword(newPassword, user.passwordHash)) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }
    
    // Hash new password
    const passwordHash = await hashPassword(newPassword);
    
    // Update password
    await storage.updateUser(user.id, {
      passwordHash,
      tempPassword: false,
      emailVerified: true
    });
    
    console.log(`Password changed for: ${user.email}`);
    
    // Send password change confirmation email
    try {
      const { EmailTemplateService } = await import('../email-templates');
      
      await EmailTemplateService.sendPasswordChangedEmail({
        to: user.email,
        firstName: user.firstName,
        timestamp: new Date().toLocaleString(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      });
      
      console.log(`Password change confirmation email sent to: ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send password change confirmation email:', emailError);
      // Don't fail the password change if email fails
    }
    
    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
    
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email address with token
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }
    
    // Find user by verification token (reusing reset token field for simplicity)
    const user = await storage.getUserByResetToken(token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }
    
    // Mark email as verified
    await storage.updateUser(user.id, {
      emailVerified: true,
      passwordResetToken: null,
      passwordResetExpires: null
    });
    
    console.log(`Email verified for: ${user.email}`);
    
    res.json({ 
      success: true, 
      message: 'Email verified successfully' 
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

export const authRoutes = router;