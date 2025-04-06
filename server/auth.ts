import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import admin from "firebase-admin";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
    interface Request {
      firebaseUser?: admin.auth.DecodedIdToken;
      user?: User;
    }
  }
}

// Define session interface to include userId property
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// Initialize Firebase Admin
try {
  admin.app();
} catch (error) {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
  console.log("Firebase Admin initialized with project ID:", process.env.VITE_FIREBASE_PROJECT_ID);
}

// Define the authentication middleware
const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    // Verify token
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decodedToken;
    
    // Get user from database
    const user = await storage.getUserByFirebaseUid(decodedToken.uid);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Store user ID in request
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Error authenticating user:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

// Firebase token verification middleware
const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "restaurant-notebook-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));

  // Create or get user from Firebase credentials
  app.post("/api/auth/google", async (req, res, next) => {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ message: "No ID token provided" });
      }
      
      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const { uid, email, name, picture } = decodedToken;
      
      // Check if user exists
      let user = await storage.getUserByFirebaseUid(uid);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          firebaseUid: uid,
          email: email || `${uid}@example.com`,
          name: name || "Restaurant Enthusiast",
          username: email?.split('@')[0] || uid,
          avatar: picture,
          password: null, // Empty password since we're using Firebase auth
        });
      }
      
      // Store user in session
      req.session.userId = user.id;
      
      res.status(200).json(user);
    } catch (error) {
      console.error("Error in Google auth:", error);
      next(error);
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", verifyFirebaseToken, async (req, res) => {
    try {
      // Get user by Firebase UID from decoded token
      const firebaseUid = req.firebaseUser?.uid;
      
      if (!firebaseUid) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Also store in session for compatibility with existing code
      req.session.userId = user.id;
      
      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Error fetching user" });
    }
  });
}

// Export the middleware
export { isAuthenticated };
