import { Response } from "express";
import { UserService } from "../services/userService.ts";
import { AuthenticatedRequest } from "../middleware/auth.ts";

export class AuthController {
  static async register(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required." });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
      }

      const result = await UserService.registerUser(name, email, password);
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Registration failed." });
    }
  }

  static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const result = await UserService.loginUser(email, password);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Login failed." });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      const profile = await UserService.getProfile(req.user.id);
      return res.status(200).json(profile);
    } catch (error: any) {
      return res.status(404).json({ error: error.message || "Profile not found." });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      const { name, profile_image } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required." });
      }

      const updated = await UserService.updateProfile(req.user.id, name, profile_image);
      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to update profile." });
    }
  }
}
