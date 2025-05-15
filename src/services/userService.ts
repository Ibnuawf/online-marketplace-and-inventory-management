import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/index.ts";
import { users } from "../db/schema.ts";
import { eq } from "drizzle-orm";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET missing");
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "30d"; // 30 days is standard for mobile/web

export class UserService {
  static async registerUser(name: string, email: string, password: string) {
    try {
      // Check if email already exists
      const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
      if (existing) {
        throw new Error("Email is already registered.");
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          name,
          email: email.toLowerCase(),
          passwordHash,
        })
        .returning();

      // Generate JWT Token
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const { passwordHash: _, ...userWithoutPassword } = newUser;
      return { user: userWithoutPassword, token };
    } catch (error: any) {
      console.error("Error registering user:", error);
      throw new Error(error.message || "Registration failed. Please try again.");
    }
  }

  static async loginUser(email: string, password: string) {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
      if (!user || !user.passwordHash) {
        throw new Error("Invalid email or password.");
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        throw new Error("Invalid email or password.");
      }

      // Generate JWT Token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const { passwordHash: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, token };
    } catch (error: any) {
      console.error("Error logging in:", error);
      throw new Error(error.message || "Login failed. Please try again.");
    }
  }

  static async getProfile(userId: number) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        throw new Error("User profile not found.");
      }
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      throw new Error(error.message || "Could not retrieve profile.");
    }
  }

  static async updateProfile(userId: number, name: string, profileImage?: string) {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          name,
          ...(profileImage !== undefined ? { profileImage } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new Error("User profile not found.");
      }

      const { passwordHash: _, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error: any) {
      console.error("Error updating profile:", error);
      throw new Error(error.message || "Could not update profile.");
    }
  }
}
