import { Router } from "express";
import { AuthController } from "../controllers/authController.ts";
import { requireAuth } from "../middleware/auth.ts";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/profile", requireAuth, AuthController.getProfile);
router.put("/profile", requireAuth, AuthController.updateProfile);

export default router;
