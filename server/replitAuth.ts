import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
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

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  // Try to match existing user by multiple criteria
  const email = claims["email"] || "";
  const firstName = claims["first_name"] || "";
  const lastName = claims["last_name"] || "";
  
  console.log(`Authentication attempt - Email: ${email}, Name: ${firstName} ${lastName}`);
  
  // First, check if user exists in our team members database
  const existingUser = await storage.findTeamMemberByEmailOrName(
    email,
    firstName,
    lastName
  );
  
  if (!existingUser) {
    // User not in our team members list - deny access
    console.error(`Access denied for: ${email} (${firstName} ${lastName}) - Not in registered team members list`);
    throw new Error("Access denied: You must be a registered team member to access this system. Please contact your lab administrator (J.C. Rojas).");
  }
  
  console.log(`Access granted for team member: ${existingUser.firstName} ${existingUser.lastName} (ID: ${existingUser.id})`);
  
  // User exists in our system - update their auth info but preserve their existing ID
  await storage.upsertUser({
    id: existingUser.id, // Use existing user ID from our database
    email: existingUser.email, // Keep their registered email
    firstName: existingUser.firstName, // Keep their registered name
    lastName: existingUser.lastName,
    profileImageUrl: claims["profile_image_url"] || existingUser.profileImageUrl,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    } catch (error) {
      // User not authorized - show friendly error
      console.error("Authentication failed:", error);
      verified(new Error("Access denied: You must be a registered team member. Please contact your lab administrator."), false);
    }
  };

  // Get domains and add localhost for development
  const domains = process.env.REPLIT_DOMAINS!.split(",");
  
  // Add localhost support for development - ensure proper formatting
  if (process.env.NODE_ENV === "development" || !process.env.REPLIT_DOMAINS.includes('replit')) {
    domains.push("127.0.0.1:5000", "localhost:5000");
  }
  
  console.log("Configured auth domains:", domains);

  for (const domain of domains) {
    const protocol = domain.includes('127.0.0.1') || domain.includes('localhost') ? 'http' : 'https';
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `${protocol}://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const authDomain = req.get('host') || req.hostname;
    console.log(`Login attempt from domain: ${authDomain}`);
    
    passport.authenticate(`replitauth:${authDomain}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const authDomain = req.get('host') || req.hostname;
    console.log(`Callback from domain: ${authDomain}`);
    
    passport.authenticate(`replitauth:${authDomain}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/login-error",
      failureMessage: true,
    }, (err, user, info) => {
      if (err || !user) {
        console.error('Authentication callback error:', err || info);
        // Redirect to error page instead of looping back to login
        return res.redirect('/login-error');
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('Login error:', loginErr);
          return res.redirect('/login-error');
        }
        // Successful login - redirect to home
        return res.redirect('/');
      });
    })(req, res, next);
  });

  // Add error page to break login loop
  app.get("/login-error", (req, res) => {
    // Clear any existing session to prevent loops
    req.session.destroy((err) => {
      if (err) console.error('Session destroy error:', err);
    });
    
    res.status(403).send(`
      <html>
        <head>
          <title>Access Denied</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              text-align: center;
              margin: 50px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: rgba(255, 255, 255, 0.95);
              color: #333;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 500px;
            }
            h1 { color: #764ba2; }
            p { margin: 20px 0; line-height: 1.6; }
            .admin { font-weight: bold; color: #667eea; }
            a {
              display: inline-block;
              margin-top: 20px;
              padding: 12px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              transition: background 0.3s;
            }
            a:hover { background: #764ba2; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔒 Access Denied</h1>
            <p>You must be a registered team member to access LabSync.</p>
            <p>If you believe you should have access, please contact your lab administrator:</p>
            <p class="admin">Dr. J.C. Rojas (juan_rojas@rush.edu)</p>
            <a href="/">Try Again</a>
          </div>
        </body>
      </html>
    `);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  // Check if user is authenticated
  if (!req.isAuthenticated() || !user) {
    console.log('User not authenticated, returning 401');
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if token is expired
  if (user.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (now <= user.expires_at) {
      return next(); // Token still valid
    }

    // Try to refresh token
    const refreshToken = user.refresh_token;
    if (refreshToken) {
      try {
        const config = await getOidcConfig();
        const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
        updateUserSession(user, tokenResponse);
        return next();
      } catch (error) {
        console.error('Token refresh failed:', error);
        req.session.destroy((err) => {
          if (err) console.error('Session destroy error:', err);
        });
        return res.status(401).json({ message: "Unauthorized - Please login again" });
      }
    }
  }
  
  // No expiration info, proceed (session-based auth)
  return next();
};
