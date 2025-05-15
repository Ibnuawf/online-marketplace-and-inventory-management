import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Relative import paths MUST end with .ts
import authRoutes from "./src/routes/authRoutes.ts";
import productRoutes from "./src/routes/productRoutes.ts";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware for body parsing
  app.use(express.json());

  // Log requests in a clean format
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // REST API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date() });
  });

  // Serve static UI / Vite integration
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start the Express full-stack server:", err);
});
