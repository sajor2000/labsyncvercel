import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, Request, Response, NextFunction } from "express";
import type { User } from "../../shared/schema";
import connectPg from "connect-pg-simple";
import { storage } from "../storage";
import { verifyPassword } from "./passwordUtils";

// Rate limiting for login attempts with memory cleanup
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Cleanup expired attempts every hour to prevent memory leaks
setInterval(() => {
  const now = new Date();
  for (const [email, attempts] of loginAttempts.entries()) {
    const timeSinceLastAttempt = now.getTime() - attempts.lastAttempt.getTime();
    if (timeSinceLastAttempt > LOCKOUT_DURATION * 2) { // Clean up after 30 minutes
      loginAttempts.delete(email);
    }
  }
}, 60 * 60 * 1000); // Every hour

/**
 * Check if an IP/email is rate limited
 */
function isRateLimited(identifier: string): boolean {
  const attempts = loginAttempts.get(identifier);
  if (!attempts) return false;
  
  const now = new Date();
  const timeSinceLastAttempt = now.getTime() - attempts.lastAttempt.getTime();
  
  // Reset attempts after lockout period
  if (timeSinceLastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(identifier);
    return false;
  }
  
  return attempts.count >= MAX_LOGIN_ATTEMPTS;
}

/**
 * Record a failed login attempt
 */
function recordFailedAttempt(identifier: string): void {
  const attempts = loginAttempts.get(identifier);
  if (attempts) {
    attempts.count += 1;
    attempts.lastAttempt = new Date();
  } else {
    loginAttempts.set(identifier, { count: 1, lastAttempt: new Date() });
  }
}

/**
 * Clear failed login attempts for successful login
 */
function clearFailedAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}

/**
 * Get session configuration
 */
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }
  
  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: sessionTtl,
    },
  });
}

/**
 * Setup local authentication strategy
 */
export async function setupLocalAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email: string, password: string, done) => {
      try {
        // Check rate limiting
        if (isRateLimited(email)) {
          return done(null, false, { message: 'Too many failed attempts. Please try again in 15 minutes.' });
        }
        
        // Find user by email
        const user = await storage.getUserByEmail(email);
        if (!user) {
          recordFailedAttempt(email);
          return done(null, false, { message: 'Invalid email or password' });
        }
        
        // Check if user is active
        if (!user.isActive) {
          recordFailedAttempt(email);
          return done(null, false, { message: 'Account is disabled. Please contact your administrator.' });
        }
        
        // Check if password is set
        if (!user.passwordHash) {
          recordFailedAttempt(email);
          return done(null, false, { message: 'Account setup not complete. Please contact your administrator.' });
        }
        
        // Verify password
        const isValidPassword = await verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
          recordFailedAttempt(email);
          return done(null, false, { message: 'Invalid email or password' });
        }
        
        // Success! Clear failed attempts and update last login
        clearFailedAttempts(email);
        await storage.updateUser(user.id, { 
          lastLogin: new Date(),
          lastActive: new Date()
        });
        
        // Successful authentication
        return done(null, user);
        
      } catch (error) {
        console.error('Authentication error:', error);
        return done(error);
      }
    }
  ));

  // Serialize user for session
  passport.serializeUser((user: User, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (user && user.isActive) {
        // Update last active timestamp
        await storage.updateUser(id, { lastActive: new Date() });
        done(null, user);
      } else {
        done(null, false);
      }
    } catch (error) {
      done(error);
    }
  });
}

/**
 * Middleware to check if user is authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Return 401 for API requests
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Redirect to login for page requests
  res.redirect('/login');
}

/**
 * Middleware to check if user requires password change
 */
export function requiresPasswordChange(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && (req.user as User)?.tempPassword) {
    if (req.path === '/api/auth/change-password' || req.path === '/change-password') {
      return next();
    }
    
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ 
        error: 'Password change required',
        requiresPasswordChange: true 
      });
    }
    
    return res.redirect('/change-password');
  }
  
  return next();
}