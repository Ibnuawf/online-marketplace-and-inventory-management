import { Router } from "express";
import { ProductController } from "../controllers/productController.ts";
import { requireAuth } from "../middleware/auth.ts";

const router = Router();

router.post("/", requireAuth, ProductController.create);
router.get("/", requireAuth, ProductController.getAll);
router.post("/sync", requireAuth, ProductController.sync);
router.get("/sync", requireAuth, ProductController.syncGet);
router.get("/:id", requireAuth, ProductController.getSingle);
router.put("/:id", requireAuth, ProductController.update);
router.delete("/:id", requireAuth, ProductController.delete);

export default router;
