import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { db } from "../db/index.ts";
import { users } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import firebaseConfig from "../../firebase-applet-config.json" with { type: "json" };

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const adminAuth = getAuth();
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET missing");
}
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    uid?: string;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Invalid token format" });
  }

  try {
    // 1. First try to verify as custom JWT
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
      // Look up user in db
      const [dbUser] = await db.select().from(users).where(eq(users.id, decoded.userId));
      if (dbUser) {
        req.user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          uid: dbUser.uid || undefined,
        };
        return next();
      }
    } catch (jwtErr) {
      // If it's not a valid custom JWT, we fall back to Firebase Auth verification
    }

    // 2. Try to verify as Firebase ID Token
    try {
      const decodedFirebase = await adminAuth.verifyIdToken(token);
      const email = decodedFirebase.email || "";
      const uid = decodedFirebase.uid;
      const name = (decodedFirebase.name || decodedFirebase.email || "Firebase User").split("@")[0];

      // Upsert user in Postgres
      const [existingUser] = await db.select().from(users).where(eq(users.uid, uid));
      if (existingUser) {
        req.user = {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          uid,
        };
      } else {
        // Also check if email matches (e.g. we registered with email/password first)
        const [existingEmail] = await db.select().from(users).where(eq(users.email, email));
        if (existingEmail) {
          // Link Firebase UID to existing account
          const [updatedUser] = await db
            .update(users)
            .set({ uid, updatedAt: new Date() })
            .where(eq(users.id, existingEmail.id))
            .returning();
          req.user = {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            uid,
          };
        } else {
          // Create new user
          const [newUser] = await db
            .insert(users)
            .values({
              uid,
              email,
              name,
              profileImage: decodedFirebase.picture || null,
            })
            .returning();
          req.user = {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            uid,
          };
        }
      }
      return next();
    } catch (firebaseErr) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Internal server error during authentication" });
  }
};
