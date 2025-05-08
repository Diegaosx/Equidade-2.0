import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { promisify } from "util";
import { storage } from "./storage";
import { insertUserSchema, loginUserSchema, users } from "@shared/schema";
import { z } from "zod";
import { db } from "@db/railway";
import { auditLogs } from "@shared/schema";
import * as crypto from "crypto";

const scryptAsync = promisify(crypto.scrypt);

export async function hashPassword(password: string) {
  try {
    const salt = crypto.randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Error processing password");
  }
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Invalid stored password format");
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return crypto.timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

// Authentication middleware for route protection
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

// Middleware to log login attempts (successful or failed)
async function logLoginAttempt(userId: number | null, username: string, success: boolean, ip: string) {
  try {
    await db.insert(auditLogs).values({
      action: success ? 'login_success' : 'login_failed',
      resource: 'auth',
      resource_id: userId ? userId.toString() : null,
      user_id: userId,
      details: {
        username,
        ip,
        timestamp: new Date().toISOString(),
      },
      ip_address: ip,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error logging login attempt:", error);
  }
}

export function setupStandardAuth(app: Express) {
  // Generate session key if not provided
  if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = crypto.randomBytes(32).toString('hex');
    console.warn("SESSION_SECRET not defined, using generated key. This will invalidate sessions on restart.");
  }

  // Session configuration
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport to use local strategy
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        await logLoginAttempt(null, username, false, 'unknown');
        return done(null, false, { message: 'Invalid username or password' });
      }
      
      const isValid = await comparePasswords(password, user.password);
      
      if (!isValid) {
        await logLoginAttempt(user.id, username, false, 'unknown');
        return done(null, false, { message: 'Invalid username or password' });
      }
      
      await logLoginAttempt(user.id, username, true, 'unknown');
      return done(null, user);
    } catch (error) {
      console.error('Authentication error:', error);
      return done(error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || undefined);
    } catch (error) {
      done(error);
    }
  });

  // Login route
  app.post('/api/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validatedData = loginUserSchema.parse(req.body);
      
      passport.authenticate('local', (err: Error, user: any, info: any) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ error: 'Authentication error' });
        }
        
        if (!user) {
          return res.status(401).json({ error: info?.message || 'Invalid credentials' });
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error('Login session error:', loginErr);
            return res.status(500).json({ error: 'Session error' });
          }
          
          return res.json({ 
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            email: user.email,
            profileImageUrl: user.profileImageUrl
          });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Login validation error:', error);
      return res.status(400).json({ error: 'Invalid request format' });
    }
  });

  // Logout route
  app.get('/api/logout', (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.redirect('/');
    });
  });

  // User info route
  app.get('/api/auth/user', requireAuth, (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const user = req.user as any;
    res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
      profileImageUrl: user.profileImageUrl
    });
  });
}